'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface SaleFormData {
    vehicle_id: string;
    customer_name: string;
    customer_phone: string;
    customer_cnic?: string;
    customer_address?: string;
    buyer_party_type?: 'client' | 'investor';
    buyer_investor_id?: string;
    sale_price: number;
    down_payment: number;
    remaining_amount?: number;
    payment_method: 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'financing';
    deal_date: string;
    delivery_date?: string;
    salesperson_id?: string;
    commission_amount?: number;
    commission_percentage?: number;
    notes?: string;
}

export interface Sale {
    id: string;
    vehicle_id: string;
    customer_name: string;
    customer_phone: string;
    customer_cnic?: string;
    customer_address?: string;
    sale_price: number;
    down_payment: number;
    payment_method: string;
    status: 'pending' | 'completed' | 'cancelled';
    deal_date: string;
    delivery_date?: string;
    notes?: string;
    vehicle?: {
        make: string;
        model: string;
        year: number;
        variant?: string;
        registration_number?: string;
        selling_price?: number;
    };
    created_at: string;
    updated_at: string;
}

export async function getAvailableVehicles() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            // Return mock data with images
            return {
                data: [
                    {
                        id: 'mock-1',
                        make: 'Toyota',
                        model: 'Corolla',
                        year: 2023,
                        variant: 'XLI',
                        color: 'white',
                        registration_number: 'LHR-1234',
                        mileage: 25000,
                        fuel_type: 'petrol',
                        transmission: 'automatic',
                        purchase_price: 2200000,
                        selling_price: 2500000,
                        status: 'available',
                        vehicle_images: [],
                        seller_name: 'Muhammad Ali',
                        seller_phone: '0300-1234567',
                        created_at: new Date().toISOString(),
                    },
                    {
                        id: 'mock-2',
                        make: 'Honda',
                        model: 'Civic',
                        year: 2022,
                        variant: 'Oriel',
                        color: 'black',
                        registration_number: 'ISB-5678',
                        mileage: 35000,
                        fuel_type: 'petrol',
                        transmission: 'automatic',
                        purchase_price: 4500000,
                        selling_price: 4900000,
                        status: 'available',
                        vehicle_images: [],
                        seller_name: 'Ahmed Khan',
                        seller_phone: '0321-9876543',
                        created_at: new Date().toISOString(),
                    },
                    {
                        id: 'mock-3',
                        make: 'Suzuki',
                        model: 'Alto',
                        year: 2024,
                        variant: 'VXR',
                        color: 'silver',
                        registration_number: 'LHR-9012',
                        mileage: 5000,
                        fuel_type: 'petrol',
                        transmission: 'manual',
                        purchase_price: 2600000,
                        selling_price: 2850000,
                        status: 'available',
                        vehicle_images: [],
                        seller_name: null,
                        seller_phone: null,
                        created_at: new Date().toISOString(),
                    },
                ],
                error: null,
            };
        }

        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // Return empty data instead of error to allow page to render
            return { data: [], error: null };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            // Return empty data instead of error to allow page to render
            return { data: [], error: null };
        }

        // Fetch vehicles with images and all relevant details
        const { data: vehicles, error } = await supabase
            .from('vehicles')
            .select(`
                id, 
                make, 
                model, 
                year, 
                variant, 
                color,
                registration_number, 
                mileage,
                fuel_type,
                transmission,
                purchase_price,
                selling_price, 
                status,
                seller_name,
                seller_phone,
                seller_cnic,
                seller_address,
                created_at,
                vehicle_images(id, url, is_primary, display_order)
            `)
            .eq('organization_id', profile.organization_id)
            .eq('status', 'available')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching available vehicles:', error);
            // Return empty data instead of error to allow page to render gracefully
            return { data: [], error: null };
        }

        // Sort images by display_order and is_primary
        const vehiclesWithSortedImages = (vehicles || []).map((vehicle: any) => ({
            ...vehicle,
            vehicle_images: (vehicle.vehicle_images || []).sort((a: any, b: any) => {
                if (a.is_primary && !b.is_primary) return -1;
                if (!a.is_primary && b.is_primary) return 1;
                return (a.display_order || 0) - (b.display_order || 0);
            }),
        }));

        return { data: vehiclesWithSortedImages, error: null };
    } catch (err) {
        console.error('Error in getAvailableVehicles:', err);
        // Return empty data instead of error to allow page to render gracefully
        return {
            data: [],
            error: null,
        };
    }
}

export async function getSales(filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            return {
                data: [],
                metadata: { total: 0, page: 1, limit: 10, totalPages: 0 },
                error: null,
            };
        }

        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                data: [],
                metadata: { total: 0, page: 1, limit: 10, totalPages: 0 },
                error: 'Unauthorized',
            };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return {
                data: [],
                metadata: { total: 0, page: 1, limit: 10, totalPages: 0 },
                error: 'No organization found',
            };
        }

        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('deals')
            .select('*, vehicles(make, model, year, variant, registration_number)', { count: 'exact' })
            .eq('organization_id', profile.organization_id)
            .order('deal_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }

        if (filters?.search) {
            const searchPattern = `%${filters.search}%`;
            query = query.or(`customer_name.ilike.${searchPattern}, customer_phone.ilike.${searchPattern}, customer_cnic.ilike.${searchPattern}`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching sales:', error);
            return {
                data: [],
                metadata: { total: 0, page, limit, totalPages: 0 },
                error: error.message,
            };
        }

        return {
            data: data || [],
            metadata: {
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit),
            },
            error: null,
        };
    } catch (err) {
        console.error('Error in getSales:', err);
        return {
            data: [],
            metadata: { total: 0, page: 1, limit: 10, totalPages: 0 },
            error: err instanceof Error ? err.message : 'Failed to fetch sales.',
        };
    }
}

export async function getSaleById(id: string) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            return { data: null, error: 'Supabase not configured' };
        }

        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: null, error: 'No organization found' };
        }

        const { data: sale, error } = await supabase
            .from('deals')
            .select('*, vehicles(*), profiles!deals_salesperson_id_fkey(full_name)')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single();

        if (error) {
            console.error('Error fetching sale:', error);
            return { data: null, error: error.message };
        }

        return { data: sale, error: null };
    } catch (err) {
        console.error('Error in getSaleById:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch sale.',
        };
    }
}

export async function createSale(data: SaleFormData) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            console.warn('⚠️ Supabase not configured. Create sale action is simulated.');
            revalidatePath('/dashboard/sales');
            redirect('/dashboard/sales');
            return;
        }

        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Unauthorized');

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) throw new Error('No organization found');

        // Calculate remaining amount if not provided
        const remainingAmount = data.remaining_amount || (data.sale_price - data.down_payment);

        // Create the deal/sale record
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
            console.error('Error creating deal:', dealError);
            throw new Error('Failed to create sale');
        }

        // If buyer is an investor, record investor/cash transactions (best-effort) and skip client creation.
        if (data.buyer_party_type === 'investor' && data.buyer_investor_id) {
            // 1) Store deal metadata (so you can see investor linkage even without schema changes)
            try {
                await (supabase as any)
                    .from('documents')
                    .insert({
                        organization_id: profile.organization_id,
                        entity_type: 'deal',
                        entity_id: deal.id,
                        document_type: 'other',
                        file_name: 'deal_metadata.json',
                        file_url: `data:application/json;base64,${Buffer.from(
                            JSON.stringify({
                                buyerParty: {
                                    type: 'investor',
                                    investor_id: data.buyer_investor_id,
                                },
                            })
                        ).toString('base64')}`,
                        uploaded_by: user.id,
                    });
            } catch (e) {
                console.error('Error storing deal metadata:', e);
            }

            // 2) Investment transaction (investment == money coming from investor)
            try {
                const invAmount = data.down_payment > 0 ? data.down_payment : data.sale_price;
                await (supabase as any)
                    .from('investment_transactions')
                    .insert({
                        organization_id: profile.organization_id,
                        investor_id: data.buyer_investor_id,
                        transaction_type: 'investment',
                        amount: invAmount,
                        currency: 'PKR',
                        payment_method: data.payment_method,
                        transaction_reference: `DEAL-${deal.id}`,
                        transaction_date: data.deal_date || new Date().toISOString(),
                        status: remainingAmount > 0 ? 'pending' : 'completed',
                        notes: `Vehicle deal (investor buyer): deal=${deal.id}, vehicle=${data.vehicle_id}`,
                        created_by: user.id,
                    });
            } catch (e) {
                console.error('Error creating investment transaction for investor buyer:', e);
            }

            // 3) Cash flow entry (cash in)
            try {
                const cashAmount = data.down_payment > 0 ? data.down_payment : data.sale_price;
                await (supabase as any)
                    .from('cash_transactions')
                    .insert({
                        organization_id: profile.organization_id,
                        transaction_type: 'cash_in',
                        amount: cashAmount,
                        currency: 'PKR',
                        payment_method: data.payment_method,
                        description: `Vehicle sale to investor (${data.customer_name})`,
                        reference_number: `DEAL-${deal.id}`,
                        transaction_date: (data.deal_date || new Date().toISOString()).slice(0, 10),
                        related_entity_type: 'investor',
                        related_entity_id: data.buyer_investor_id,
                        status: remainingAmount > 0 ? 'pending' : 'completed',
                        notes: `deal=${deal.id}, vehicle=${data.vehicle_id}`,
                        created_by: user.id,
                    });
            } catch (e) {
                console.error('Error creating cash transaction for investor buyer:', e);
            }

            revalidatePath('/dashboard/investors');
        } else {
        // Update vehicle status to 'sold' or 'reserved' based on payment
        const vehicleStatus = remainingAmount > 0 ? 'reserved' : 'sold';
        const { error: vehicleError } = await supabase
            .from('vehicles')
            .update({ status: vehicleStatus })
            .eq('id', data.vehicle_id);

        if (vehicleError) {
            console.error('Error updating vehicle status:', vehicleError);
            // Don't fail the sale if vehicle update fails, but log it
        }

        // Create or find client for the buyer
        try {
            const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('organization_id', profile.organization_id)
                .eq('phone', data.customer_phone)
                .single();

            let clientId = existingClient?.id;

            if (!clientId) {
                // Create new client
                const { data: newClient, error: clientError } = await supabase
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

                if (!clientError && newClient) {
                    clientId = newClient.id;
                }
            }

            // Create client transaction if client was created/found
            if (clientId) {
                const { error: transactionError } = await supabase
                    .from('client_transactions')
                    .insert({
                        organization_id: profile.organization_id,
                        client_id: clientId,
                        deal_id: deal.id,
                        transaction_type: 'purchase',
                        amount: data.sale_price,
                        currency: 'PKR',
                        payment_method: data.payment_method,
                        vehicle_id: data.vehicle_id,
                        transaction_date: data.deal_date || new Date().toISOString(),
                        status: remainingAmount > 0 ? 'pending' : 'completed',
                        total_amount: data.sale_price,
                        paid_amount: data.down_payment,
                        remaining_due: remainingAmount,
                        notes: `Vehicle purchase: ${data.vehicle_id}`,
                        created_by: user.id,
                    });

                if (transactionError) {
                    console.error('Error creating client transaction:', transactionError);
                    // Don't fail the sale if transaction creation fails
                }
            }
        } catch (clientError) {
            console.error('Error creating client/transaction:', clientError);
            // Don't fail the sale if client creation fails
        }
        }

        revalidatePath('/dashboard/sales');
        revalidatePath('/dashboard/inventory');
        revalidatePath('/dashboard/clients');
        revalidatePath('/dashboard/today-book');
        redirect('/dashboard/sales');
    } catch (err) {
        console.error('Error in createSale:', err);
        throw err;
    }
}

export async function updateSaleStatus(id: string, status: 'pending' | 'completed' | 'cancelled') {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Unauthorized');

        const { data: deal, error: dealError } = await supabase
            .from('deals')
            .select('vehicle_id')
            .eq('id', id)
            .single();

        if (dealError) {
            throw new Error('Deal not found');
        }

        // Update deal status
        const { error: updateError } = await supabase
            .from('deals')
            .update({ status })
            .eq('id', id);

        if (updateError) {
            throw new Error('Failed to update sale status');
        }

        // If cancelled, revert vehicle status to available
        if (status === 'cancelled' && deal.vehicle_id) {
            await supabase
                .from('vehicles')
                .update({ status: 'available' })
                .eq('id', deal.vehicle_id);
        }

        // If completed, ensure vehicle is marked as sold
        if (status === 'completed' && deal.vehicle_id) {
            await supabase
                .from('vehicles')
                .update({ status: 'sold' })
                .eq('id', deal.vehicle_id);
        }

        revalidatePath('/dashboard/sales');
        revalidatePath('/dashboard/inventory');
        return { success: true };
    } catch (err) {
        console.error('Error in updateSaleStatus:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to update sale status',
        };
    }
}

export interface UpdateSaleData {
    customer_name: string;
    customer_phone: string;
    customer_cnic?: string;
    customer_address?: string;
    sale_price: number;
    down_payment: number;
    remaining_amount?: number;
    commission_amount?: number;
    payment_method: 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'financing';
    deal_date: string;
    delivery_date?: string;
    notes?: string;
}

export async function updateSale(id: string, data: UpdateSaleData) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            console.warn('⚠️ Supabase not configured. Update sale action is simulated.');
            revalidatePath('/dashboard/sales');
            return { success: true };
        }

        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Unauthorized');

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) throw new Error('No organization found');

        // Calculate remaining amount
        const remainingAmount = data.remaining_amount || (data.sale_price - data.down_payment);

        // Update the deal
        const { error: updateError } = await supabase
            .from('deals')
            .update({
                customer_name: data.customer_name,
                customer_phone: data.customer_phone,
                customer_cnic: data.customer_cnic || null,
                customer_address: data.customer_address || null,
                sale_price: data.sale_price,
                down_payment: data.down_payment,
                commission_amount: data.commission_amount ?? 0,
                payment_method: data.payment_method,
                status: remainingAmount > 0 ? 'pending' : 'completed',
                deal_date: data.deal_date,
                delivery_date: data.delivery_date || null,
                notes: data.notes || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('organization_id', profile.organization_id);

        if (updateError) {
            console.error('Error updating deal:', updateError);
            throw new Error('Failed to update sale');
        }

        // Update client if exists
        try {
            const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('organization_id', profile.organization_id)
                .eq('phone', data.customer_phone)
                .single();

            if (existingClient) {
                await supabase
                    .from('clients')
                    .update({
                        name: data.customer_name,
                        cnic: data.customer_cnic || null,
                        address: data.customer_address || null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existingClient.id);
            }
        } catch (clientError) {
            console.error('Error updating client:', clientError);
            // Don't fail the update if client update fails
        }

        revalidatePath('/dashboard/sales');
        revalidatePath(`/dashboard/sales/${id}`);
        revalidatePath('/dashboard/clients');
        return { success: true };
    } catch (err) {
        console.error('Error in updateSale:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to update sale',
        };
    }
}
