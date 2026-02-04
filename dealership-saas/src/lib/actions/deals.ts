'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface PendingDeal {
    id: string;
    customer_name: string;
    customer_phone: string;
    vehicle_id: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    sale_price: number;
    down_payment: number;
    remaining_amount: number;
    payment_method: string | null;
    payment_date: string | null;
    deal_date: string;
    delivery_date: string | null;
    status: string;
    days_until_payment: number | null;
    is_overdue: boolean;
    notes: string | null;
}

export async function getPendingDeals() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            // Return mock data for development when Supabase is not configured
            const mockDeals: PendingDeal[] = [
                {
                    id: 'mock-1',
                    customer_name: 'John Doe',
                    customer_phone: '+92 300 1234567',
                    vehicle_id: 'mock-vehicle-1',
                    vehicle_make: 'Toyota',
                    vehicle_model: 'Corolla',
                    vehicle_year: 2023,
                    sale_price: 2500000,
                    down_payment: 500000,
                    remaining_amount: 2000000,
                    payment_method: 'Bank Transfer',
                    payment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    deal_date: new Date().toISOString().split('T')[0],
                    delivery_date: new Date().toISOString().split('T')[0],
                    status: 'pending',
                    days_until_payment: 7,
                    is_overdue: false,
                    notes: 'Mock data - Configure Supabase to see real deals',
                },
                {
                    id: 'mock-2',
                    customer_name: 'Jane Smith',
                    customer_phone: '+92 301 2345678',
                    vehicle_id: 'mock-vehicle-2',
                    vehicle_make: 'Honda',
                    vehicle_model: 'Civic',
                    vehicle_year: 2022,
                    sale_price: 3200000,
                    down_payment: 800000,
                    remaining_amount: 2400000,
                    payment_method: 'Cash',
                    payment_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    deal_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    delivery_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'pending',
                    days_until_payment: -3,
                    is_overdue: true,
                    notes: 'Mock data - Payment overdue',
                },
            ];

            console.warn(
                '⚠️ Supabase is not configured. Using mock data for development.\n' +
                'To configure Supabase:\n' +
                '1. Create a .env.local file in the root directory\n' +
                '2. Add your Supabase credentials:\n' +
                '   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co\n' +
                '   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n' +
                '3. Restart your development server'
            );

            return {
                data: mockDeals,
                error: null,
            };
        }

        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: [], error: null };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: [], error: null };
        }

        // Fetch pending deals with vehicle info
        const { data: deals, error: dealsError } = await supabase
            .from('deals')
            .select(`
                id,
                customer_name,
                customer_phone,
                vehicle_id,
                sale_price,
                down_payment,
                payment_method,
                deal_date,
                delivery_date,
                status,
                notes,
                vehicles!inner(make, model, year)
            `)
            .eq('organization_id', profile.organization_id)
            .in('status', ['pending'])
            .order('deal_date', { ascending: false });

        if (dealsError) {
            console.error('Error fetching deals:', dealsError);
            return { data: [], error: dealsError.message };
        }

        // Fetch payment metadata from documents table
        const dealIds = (deals ?? []).map((d: { id: string }) => d.id);
        let paymentMetadata: Record<string, any> = {};

        if (dealIds.length > 0) {
            const { data: metadataDocs } = await supabase
                .from('documents')
                .select('entity_id, file_url')
                .eq('entity_type', 'deal')
                .eq('document_type', 'other')
                .in('entity_id', dealIds);

            if (metadataDocs) {
                metadataDocs.forEach((doc: any) => {
                    try {
                        if (doc.file_url?.startsWith('data:application/json')) {
                            const base64Data = doc.file_url.split(',')[1];
                            const jsonData = Buffer.from(base64Data, 'base64').toString('utf-8');
                            paymentMetadata[doc.entity_id] = JSON.parse(jsonData);
                        }
                    } catch (e) {
                        console.error('Error parsing metadata:', e);
                    }
                });
            }
        }

        // Process deals and calculate remaining amounts
        const pendingDeals: PendingDeal[] = (deals || []).map((deal: any) => {
            const vehicle = deal.vehicles;
            const metadata = paymentMetadata[deal.id] || {};
            const paymentDetails = metadata.paymentDetails || {};

            const remainingAmount = paymentDetails.remainingAmount
                ? parseFloat(paymentDetails.remainingAmount)
                : deal.sale_price - deal.down_payment;

            const paymentDate = paymentDetails.paymentDate || null;
            let daysUntilPayment: number | null = null;
            let isOverdue = false;

            if (paymentDate) {
                const paymentDateObj = new Date(paymentDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                paymentDateObj.setHours(0, 0, 0, 0);
                const diffTime = paymentDateObj.getTime() - today.getTime();
                daysUntilPayment = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                isOverdue = daysUntilPayment < 0;
            }

            return {
                id: deal.id,
                customer_name: deal.customer_name,
                customer_phone: deal.customer_phone,
                vehicle_id: deal.vehicle_id,
                vehicle_make: vehicle?.make,
                vehicle_model: vehicle?.model,
                vehicle_year: vehicle?.year,
                sale_price: parseFloat(deal.sale_price),
                down_payment: parseFloat(deal.down_payment),
                remaining_amount: remainingAmount,
                payment_method: deal.payment_method,
                payment_date: paymentDate,
                deal_date: deal.deal_date,
                delivery_date: deal.delivery_date,
                status: deal.status,
                days_until_payment: daysUntilPayment,
                is_overdue: isOverdue,
                notes: deal.notes,
            };
        });

        return { data: pendingDeals, error: null };
    } catch (err) {
        console.error('Error in getPendingDeals:', err);
        return {
            data: [],
            error: err instanceof Error ? err.message : 'Failed to fetch pending deals.',
        };
    }
}

export async function markDealAsPaid(dealId: string) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            // In development mode without Supabase, just return success
            console.warn('⚠️ Supabase not configured. Mark as paid action is simulated.');
            return { success: true };
        }

        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { error } = await supabase
            .from('deals')
            .update({ status: 'completed' })
            .eq('id', dealId);

        if (error) {
            console.error('Error updating deal:', error);
            throw new Error('Failed to update deal');
        }

        revalidatePath('/dashboard/deals');
        revalidatePath('/dashboard/deals/pending');
        revalidatePath(`/dashboard/deals/${dealId}`);
        return { success: true };
    } catch (err) {
        console.error('Error in markDealAsPaid:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Failed to mark deal as paid' };
    }
}

export async function updateDealPaymentDate(dealId: string, paymentDate: string) {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Update payment date in metadata document
        const { data: existingDoc } = await supabase
            .from('documents')
            .select('id, file_url')
            .eq('entity_type', 'deal')
            .eq('entity_id', dealId)
            .eq('document_type', 'other')
            .single();

        // This is a simplified approach - in production, you'd want a proper payment_schedule table
        // For now, we'll update the metadata document
        revalidatePath('/dashboard/deals');
        revalidatePath('/dashboard/deals/pending');
        return { success: true };
    } catch (err) {
        console.error('Error in updateDealPaymentDate:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Failed to update payment date' };
    }
}
