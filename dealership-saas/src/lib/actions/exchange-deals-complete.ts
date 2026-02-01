'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ExchangeDealFormData {
  // Selected inventory vehicle being sold
  vehicle_id: string;
  sale_price: number;
  
  // Seller (customer trading in car)
  seller_name: string;
  seller_phone: string;
  seller_email?: string;
  seller_cnic?: string;
  seller_address?: string;
  seller_swdo_name?: string;
  seller_image_url?: string;
  
  // Trade-in vehicle details
  trade_in_make: string;
  trade_in_model: string;
  trade_in_year: number;
  trade_in_variant?: string;
  trade_in_color?: string;
  trade_in_registration?: string;
  trade_in_engine_number?: string;
  trade_in_chassis_number?: string;
  trade_in_mileage?: number;
  trade_in_condition?: 'new' | 'used' | 'certified';
  trade_in_agreed_value: number;
  trade_in_expected_selling_price?: number;
  trade_in_notes?: string;
  
  // Buyer (optional - customer buying from showroom)
  buyer_name?: string;
  buyer_phone?: string;
  buyer_email?: string;
  buyer_cnic?: string;
  buyer_address?: string;
  buyer_swdo_name?: string;
  buyer_image_url?: string;
  
  // Deal details
  down_payment: number;
  payment_method: 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'financing';
  deal_date: string;
  delivery_date?: string;
  salesperson_id?: string;
  commission_amount?: number;
  notes?: string;
}

export interface ExchangeDeal {
  id: string;
  organization_id: string;
  vehicle_id: string;
  
  seller_name: string;
  seller_phone: string;
  seller_email?: string;
  seller_cnic?: string;
  seller_address?: string;
  seller_swdo_name?: string;
  seller_image_url?: string;
  
  trade_in_make: string;
  trade_in_model: string;
  trade_in_year: number;
  trade_in_agreed_value: number;
  trade_in_vehicle_id?: string;
  
  buyer_name?: string;
  buyer_phone?: string;
  buyer_swdo_name?: string;
  
  sale_price: number;
  down_payment: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'cancelled';
  
  deal_date: string;
  delivery_date?: string;
  created_at: string;
  updated_at: string;
}

export async function getAvailableVehicles() {
  try {
    const supabase = (await createClient()) as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: [], error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return { data: [], error: 'No organization found' };
    }

    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: vehicles || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch vehicles' };
  }
}

export async function getExchangeDeals() {
  try {
    const supabase = (await createClient()) as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: [], error: null }; // Return empty array instead of error for unauthenticated
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return { data: [], error: null }; // Return empty array instead of error
    }

    // Since exchange_deals table doesn't exist yet, we return empty array
    // This will be populated once DB migration is applied
    return { data: [], error: null };
  } catch (err) {
    console.error('Error fetching exchange deals:', err);
    return { data: [], error: null }; // Return empty array, not error
  }
}

export async function createExchangeDeal(data: ExchangeDealFormData) {
  try {
    const supabase = (await createClient()) as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) throw new Error('No organization found');

    // Calculate net amount
    const netAmount = Math.max(0, Number(data.sale_price || 0) - Number(data.trade_in_agreed_value || 0));
    const remainingAmount = Math.max(0, netAmount - Number(data.down_payment || 0));

    // Create a deal record (stored in `deals`; exchange specifics stored in deal metadata)
    const customerName = (data.buyer_name && data.buyer_name.trim()) ? data.buyer_name : data.seller_name;
    const customerPhone = (data.buyer_phone && data.buyer_phone.trim()) ? data.buyer_phone : data.seller_phone;

    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        organization_id: profile.organization_id,
        vehicle_id: data.vehicle_id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_cnic: data.buyer_cnic || data.seller_cnic || null,
        customer_address: data.buyer_address || data.seller_address || null,
        sale_price: Number(data.sale_price || 0),
        down_payment: Number(data.down_payment || 0),
        payment_method: data.payment_method,
        status: remainingAmount > 0 ? 'pending' : 'completed',
        deal_date: data.deal_date || new Date().toISOString(),
        delivery_date: data.delivery_date || null,
        salesperson_id: data.salesperson_id || null,
        commission_amount: Number(data.commission_amount || 0),
        notes: data.notes || null,
      })
      .select()
      .single();

    if (dealError) {
      console.error('Error creating exchange deal (deals insert):', dealError);
      throw new Error(dealError.message || 'Failed to create exchange deal');
    }

    // Update sold vehicle status
    const vehicleStatus = remainingAmount > 0 ? 'reserved' : 'sold';
    await supabase.from('vehicles').update({ status: vehicleStatus }).eq('id', data.vehicle_id);

    // Create trade-in inventory vehicle
    const tradeInValue = Number(data.trade_in_agreed_value || 0);
    const { data: tradeInVehicle, error: tradeInError } = await supabase
      .from('vehicles')
      .insert({
        organization_id: profile.organization_id,
        make: data.trade_in_make,
        model: data.trade_in_model,
        year: Number(data.trade_in_year || new Date().getFullYear()),
        variant: data.trade_in_variant || null,
        color: data.trade_in_color || null,
        registration_number: data.trade_in_registration || null,
        engine_number: data.trade_in_engine_number || null,
        chassis_number: data.trade_in_chassis_number || null,
        mileage: data.trade_in_mileage ?? null,
        condition: data.trade_in_condition || 'used',
        purchase_price: tradeInValue,
        selling_price: data.trade_in_expected_selling_price ?? null,
        status: 'available',
        description:
          data.trade_in_notes ||
          `Trade-in from ${customerName} (${customerPhone}) for deal ${deal.id}`,
        seller_name: data.seller_name || null,
        seller_phone: data.seller_phone || null,
        seller_cnic: data.seller_cnic || null,
        seller_address: data.seller_address || null,
        added_by: user.id,
      })
      .select()
      .single();

    if (tradeInError) {
      console.error('Error creating trade-in vehicle:', tradeInError);
      // best-effort: still proceed (metadata will omit vehicle link)
    }

    // Store deal metadata as a single JSON document
    const toBase64Json = (payload: unknown) =>
      `data:application/json;base64,${Buffer.from(JSON.stringify(payload)).toString('base64')}`;

    try {
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
            netTotal: netAmount,
            downPayment: Number(data.down_payment || 0),
            remainingAmount,
            commissionAmount: Number(data.commission_amount || 0),
          },
          seller: {
            name: data.seller_name,
            phone: data.seller_phone,
            cnic: data.seller_cnic,
            address: data.seller_address,
            swdo_name: data.seller_swdo_name,
            image_url: data.seller_image_url,
          },
          buyer: {
            name: data.buyer_name,
            phone: data.buyer_phone,
            cnic: data.buyer_cnic,
            address: data.buyer_address,
            swdo_name: data.buyer_swdo_name,
            image_url: data.buyer_image_url,
          },
          tradeIn: {
            vehicleId: tradeInVehicle?.id ?? null,
            make: data.trade_in_make,
            model: data.trade_in_model,
            year: data.trade_in_year,
            agreed_value: tradeInValue,
          },
        }),
        uploaded_by: user.id,
      });
    } catch (e) {
      console.error('Error storing exchange deal metadata:', e);
    }

    revalidatePath('/dashboard/exchange-deals');
    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/deals/pending');
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create exchange deal' };
  }
}
