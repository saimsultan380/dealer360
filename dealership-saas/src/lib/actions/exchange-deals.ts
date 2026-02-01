'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface TradeInInput {
  make: string;
  model: string;
  year: number;
  variant?: string;
  color?: string;
  registration_number?: string;
  engine_number?: string;
  chassis_number?: string;
  mileage?: number;
  condition?: 'new' | 'used' | 'certified';
  agreed_value: number; // PKR
  expected_selling_price?: number; // optional target resale
  notes?: string;
}

export interface ExchangeSaleFormData {
  vehicle_id: string;
  customer_name: string;
  customer_phone: string;
  customer_cnic?: string;
  customer_address?: string;
  sale_price: number; // price of showroom vehicle being sold
  down_payment: number; // cash paid now (excluding trade-in)
  payment_method: 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'financing';
  deal_date: string;
  delivery_date?: string;
  salesperson_id?: string;
  commission_amount?: number;
  notes?: string;
  trade_in: TradeInInput;
}

function toBase64Json(data: unknown) {
  return `data:application/json;base64,${Buffer.from(JSON.stringify(data)).toString('base64')}`;
}

/**
 * Creates an exchange deal:
 * - creates deal for inventory vehicle sold to client
 * - creates a new inventory vehicle for client's trade-in (purchase_price = trade-in value)
 * - writes deal metadata with net totals (for pending deals + deal details)
 * - creates client transactions (purchase + sale)
 */
export async function createExchangeSale(data: ExchangeSaleFormData) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes('your-project-id.supabase.co')
  ) {
    console.warn('⚠️ Supabase not configured. Create exchange sale is simulated.');
    revalidatePath('/dashboard/sales');
    redirect('/dashboard/sales');
    return;
  }

  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  if (!profile?.organization_id) throw new Error('No organization found');

  const tradeInValue = Number(data.trade_in.agreed_value || 0);
  const netTotal = Math.max(0, Number(data.sale_price || 0) - tradeInValue);
  const remainingAmount = Math.max(0, netTotal - Number(data.down_payment || 0));

  // 1) Create the deal record (store full sale_price; net totals are stored in metadata)
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .insert({
      organization_id: profile.organization_id,
      vehicle_id: data.vehicle_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_cnic: data.customer_cnic || null,
      customer_address: data.customer_address || null,
      sale_price: data.sale_price,
      down_payment: data.down_payment,
      payment_method: data.payment_method,
      status: remainingAmount > 0 ? 'pending' : 'completed',
      deal_date: data.deal_date || new Date().toISOString(),
      delivery_date: data.delivery_date || null,
      salesperson_id: data.salesperson_id || null,
      commission_amount: data.commission_amount || 0,
      notes: data.notes || null,
    })
    .select()
    .single();

  if (dealError) {
    console.error('Error creating exchange deal:', dealError);
    throw new Error('Failed to create exchange deal');
  }

  // 2) Update sold vehicle status
  const vehicleStatus = remainingAmount > 0 ? 'reserved' : 'sold';
  await supabase.from('vehicles').update({ status: vehicleStatus }).eq('id', data.vehicle_id);

  // 3) Create trade-in inventory vehicle
  const { data: tradeInVehicle, error: tradeInError } = await supabase
    .from('vehicles')
    .insert({
      organization_id: profile.organization_id,
      make: data.trade_in.make,
      model: data.trade_in.model,
      year: data.trade_in.year,
      variant: data.trade_in.variant || null,
      color: data.trade_in.color || null,
      registration_number: data.trade_in.registration_number || null,
      engine_number: data.trade_in.engine_number || null,
      chassis_number: data.trade_in.chassis_number || null,
      mileage: data.trade_in.mileage ?? null,
      condition: data.trade_in.condition || 'used',
      purchase_price: tradeInValue,
      selling_price: data.trade_in.expected_selling_price ?? null,
      status: 'available',
      description:
        data.trade_in.notes ||
        `Trade-in from ${data.customer_name} (${data.customer_phone}) for deal ${deal.id}`,
      added_by: user.id,
    })
    .select()
    .single();

  if (tradeInError) {
    console.error('Error creating trade-in vehicle:', tradeInError);
    // best-effort: deal exists, still proceed (metadata will omit vehicle link)
  }

  // 4) Upsert deal metadata document (single JSON per deal)
  try {
    await supabase
      .from('documents')
      .delete()
      .eq('organization_id', profile.organization_id)
      .eq('entity_type', 'deal')
      .eq('entity_id', deal.id)
      .eq('document_type', 'other')
      .eq('file_name', 'deal_metadata.json');

    await supabase.from('documents').insert({
      organization_id: profile.organization_id,
      entity_type: 'deal',
      entity_id: deal.id,
      document_type: 'other',
      file_name: 'deal_metadata.json',
      file_url: toBase64Json({
        paymentDetails: {
          isExchange: true,
          salePrice: Number(data.sale_price || 0),
          tradeInValue,
          netTotal,
          downPayment: Number(data.down_payment || 0),
          remainingAmount,
        },
        exchange: {
          tradeInVehicleId: tradeInVehicle?.id ?? null,
        },
      }),
      uploaded_by: user.id,
    });
  } catch (e) {
    console.error('Error storing exchange metadata:', e);
  }

  // 5) Create/find client and write transactions (purchase + sale)
  try {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .eq('phone', data.customer_phone)
      .single();

    let clientId = existingClient?.id;

    if (!clientId) {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({
          organization_id: profile.organization_id,
          name: data.customer_name,
          phone: data.customer_phone,
          cnic: data.customer_cnic || null,
          address: data.customer_address || null,
          status: 'active',
        })
        .select()
        .single();
      clientId = newClient?.id;
    }

    if (clientId) {
      // Purchase: client buys showroom vehicle (netTotal is what they owe after trade-in)
      await supabase.from('client_transactions').insert({
        organization_id: profile.organization_id,
        client_id: clientId,
        deal_id: deal.id,
        transaction_type: 'purchase',
        amount: netTotal,
        currency: 'PKR',
        payment_method: data.payment_method,
        vehicle_id: data.vehicle_id,
        transaction_date: data.deal_date || new Date().toISOString(),
        status: remainingAmount > 0 ? 'pending' : 'completed',
        total_amount: netTotal,
        paid_amount: Number(data.down_payment || 0),
        remaining_due: remainingAmount,
        notes: `Exchange purchase: deal=${deal.id}, vehicle=${data.vehicle_id}`,
        created_by: user.id,
      });

      // Sale: client sells trade-in vehicle to showroom
      if (tradeInValue > 0) {
        await supabase.from('client_transactions').insert({
          organization_id: profile.organization_id,
          client_id: clientId,
          deal_id: deal.id,
          transaction_type: 'sale',
          amount: tradeInValue,
          currency: 'PKR',
          payment_method: data.payment_method,
          vehicle_id: tradeInVehicle?.id ?? null,
          vehicle_make: data.trade_in.make,
          vehicle_model: data.trade_in.model,
          vehicle_year: data.trade_in.year,
          transaction_date: data.deal_date || new Date().toISOString(),
          status: 'completed',
          notes: `Trade-in vehicle received: deal=${deal.id}`,
          created_by: user.id,
        });
      }
    }
  } catch (e) {
    console.error('Error creating client transactions for exchange:', e);
  }

  revalidatePath('/dashboard/sales');
  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard/clients');
  revalidatePath('/dashboard/deals/pending');
  redirect('/dashboard/sales');
}

