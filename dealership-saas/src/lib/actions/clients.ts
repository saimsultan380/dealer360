'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Client, ClientTransaction } from '@/lib/types/database';
import type { PaymentMethod } from '@/lib/types/database';

export interface ClientWithStats extends Client {
    total_dues: number;
    total_spent: number;
    total_purchases: number;
    last_transaction_date: string | null;
}

export interface ClientFormData {
    name: string;
    swdo_name?: string;
    email?: string;
    phone: string;
    cnic?: string;
    address?: string;
    avatar_url?: string;
    status?: 'active' | 'inactive' | 'blacklisted';
    notes?: string;
}

export interface ClientTransactionFormData {
    client_id: string;
    deal_id?: string;
    transaction_type: 'purchase' | 'sale' | 'payment' | 'refund';
    amount: number;
    currency?: string;
    payment_method?: 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'cheque' | 'financing';
    transaction_reference?: string;
    vehicle_id?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    transaction_date: string;
    status?: 'pending' | 'completed' | 'cancelled' | 'refunded';
    total_amount?: number;
    paid_amount?: number;
    remaining_due?: number;
    notes?: string;
}

export async function getClients(): Promise<{ data: ClientWithStats[] | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            // Return mock data for development
            const mockClients: ClientWithStats[] = [
                {
                    id: 'mock-1',
                    organization_id: 'mock-org',
                    name: 'Ahmed Ali',
                    email: 'ahmed@example.com',
                    phone: '+92 300 1234567',
                    cnic: '35201-1234567-1',
                    address: 'Lahore, Pakistan',
                    avatar_url: null,
                    status: 'active',
                    notes: 'Regular customer',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    total_dues: 50000,
                    total_spent: 2500000,
                    total_purchases: 2,
                    last_transaction_date: new Date().toISOString(),
                },
            ];

            return {
                data: mockClients,
                error: null,
            };
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

        // Fetch clients
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false });

        if (clientsError) {
            console.error('Error fetching clients:', clientsError);
            return { data: null, error: clientsError.message };
        }

        // Calculate stats for each client
        const clientsWithStats: ClientWithStats[] = await Promise.all(
            (clients || []).map(async (client: any) => {
                // Get all transactions for this client
                const { data: transactions } = await supabase
                    .from('client_transactions')
                    .select('transaction_type, amount, remaining_due, transaction_date, status')
                    .eq('client_id', client.id)
                    .eq('status', 'completed')
                    .order('transaction_date', { ascending: false });

                let total_dues = 0;
                let total_spent = 0;
                let total_purchases = 0;
                let last_transaction_date: string | null = null;

                (transactions || []).forEach((tx: any) => {
                    if (tx.transaction_type === 'purchase' || tx.transaction_type === 'payment') {
                        total_spent += parseFloat(tx.amount || '0');
                        if (tx.transaction_type === 'purchase') {
                            total_purchases++;
                        }
                    }
                    total_dues += parseFloat(tx.remaining_due || '0');
                    if (!last_transaction_date || tx.transaction_date > last_transaction_date) {
                        last_transaction_date = tx.transaction_date;
                    }
                });

                return {
                    ...client,
                    total_dues,
                    total_spent,
                    total_purchases,
                    last_transaction_date,
                };
            })
        );

        return {
            data: clientsWithStats,
            error: null,
        };
    } catch (err) {
        console.error('Error in getClients:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch clients.',
        };
    }
}

export async function getClientById(id: string): Promise<{ data: ClientWithStats | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            // Return mock data for development
            const mockClient: ClientWithStats = {
                id: id,
                organization_id: 'mock-org',
                name: 'Ahmed Ali',
                email: 'ahmed@example.com',
                phone: '+92 300 1234567',
                cnic: '35201-1234567-1',
                address: 'Lahore, Pakistan',
                avatar_url: null,
                status: 'active',
                notes: 'Regular customer',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                total_dues: 50000,
                total_spent: 2500000,
                total_purchases: 2,
                last_transaction_date: new Date().toISOString(),
            };

            return {
                data: mockClient,
                error: null,
            };
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

        // Fetch client
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single();

        if (clientError || !client) {
            return { data: null, error: 'Client not found' };
        }

        // Calculate stats
        const { data: transactions } = await supabase
            .from('client_transactions')
            .select('transaction_type, amount, remaining_due, transaction_date, status')
            .eq('client_id', id)
            .eq('status', 'completed')
            .order('transaction_date', { ascending: false });

        let total_dues = 0;
        let total_spent = 0;
        let total_purchases = 0;
        let last_transaction_date: string | null = null;

        (transactions || []).forEach((tx: any) => {
            if (tx.transaction_type === 'purchase' || tx.transaction_type === 'payment') {
                total_spent += parseFloat(tx.amount || '0');
                if (tx.transaction_type === 'purchase') {
                    total_purchases++;
                }
            }
            total_dues += parseFloat(tx.remaining_due || '0');
            if (!last_transaction_date || tx.transaction_date > last_transaction_date) {
                last_transaction_date = tx.transaction_date;
            }
        });

        return {
            data: {
                ...client,
                total_dues,
                total_spent,
                total_purchases,
                last_transaction_date,
            },
            error: null,
        };
    } catch (err) {
        console.error('Error in getClientById:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch client.',
        };
    }
}

// Helper function to find or create a client by phone number
export async function findOrCreateClient(
    details: { name: string; phone: string; cnic?: string; address?: string; email?: string },
    organizationId: string,
    supabase: any
): Promise<{ data: Client | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            // Return mock client for development
            const mockClient: Client = {
                id: `mock-client-${Date.now()}`,
                organization_id: organizationId,
                name: details.name,
                email: details.email || null,
                phone: details.phone,
                cnic: details.cnic || null,
                address: details.address || null,
                avatar_url: null,
                status: 'active',
                notes: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            return { data: mockClient, error: null };
        }

        // First, try to find existing client by phone
        const { data: existingClient } = await supabase
            .from('clients')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('phone', details.phone)
            .maybeSingle();

        if (existingClient) {
            // Update client if new information is provided
            const updateData: any = {};
            if (details.name && details.name !== existingClient.name) updateData.name = details.name;
            if (details.email && details.email !== existingClient.email) updateData.email = details.email;
            if (details.cnic && details.cnic !== existingClient.cnic) updateData.cnic = details.cnic;
            if (details.address && details.address !== existingClient.address) updateData.address = details.address;

            if (Object.keys(updateData).length > 0) {
                const { data: updatedClient } = await supabase
                    .from('clients')
                    .update(updateData)
                    .eq('id', existingClient.id)
                    .select()
                    .single();
                return { data: updatedClient, error: null };
            }

            return { data: existingClient, error: null };
        }

        // Create new client if not found
        const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
                organization_id: organizationId,
                name: details.name,
                email: details.email || null,
                phone: details.phone,
                cnic: details.cnic || null,
                address: details.address || null,
                status: 'active',
            })
            .select()
            .single();

        if (clientError) {
            console.error('Error creating client:', clientError);
            return { data: null, error: clientError.message };
        }

        return { data: newClient, error: null };
    } catch (err) {
        console.error('Error in findOrCreateClient:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to find or create client.',
        };
    }
}

export async function addClient(data: ClientFormData): Promise<{ data: Client | null; error: string | null }> {
    try {
        const supabase = await createClient() as any;
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

        const { data: client, error: clientError } = await supabase
            .from('clients')
            .insert({
                organization_id: profile.organization_id,
                name: data.name,
                email: data.email || null,
                phone: data.phone,
                cnic: data.cnic || null,
                address: data.address || null,
                avatar_url: data.avatar_url || null,
                status: data.status || 'active',
                notes: data.notes || null,
            })
            .select()
            .single();

        if (clientError) {
            console.error('Error creating client:', clientError);
            return { data: null, error: clientError.message };
        }

        revalidatePath('/dashboard/clients');
        return { data: client, error: null };
    } catch (err) {
        console.error('Error in addClient:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to create client.',
        };
    }
}

export async function updateClient(
    id: string,
    data: Partial<ClientFormData>
): Promise<{ data: Client | null; error: string | null }> {
    try {
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

        const { data: client, error: clientError } = await supabase
            .from('clients')
            .update({
                ...data,
            })
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .select()
            .single();

        if (clientError) {
            console.error('Error updating client:', clientError);
            return { data: null, error: clientError.message };
        }

        revalidatePath('/dashboard/clients');
        revalidatePath(`/dashboard/clients/${id}`);
        return { data: client, error: null };
    } catch (err) {
        console.error('Error in updateClient:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to update client.',
        };
    }
}

export async function deleteClient(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { success: false, error: 'No organization found' };
        }

        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id)
            .eq('organization_id', profile.organization_id);

        if (error) {
            console.error('Error deleting client:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/clients');
        return { success: true, error: null };
    } catch (err) {
        console.error('Error in deleteClient:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to delete client.',
        };
    }
}

export async function getClientTransactions(
    clientId: string
): Promise<{ data: ClientTransaction[] | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            // Return mock data for development
            const mockTransactions: ClientTransaction[] = [
                {
                    id: 'mock-tx-1',
                    organization_id: 'mock-org',
                    client_id: clientId,
                    deal_id: 'mock-deal-1',
                    transaction_type: 'purchase',
                    amount: 2500000,
                    currency: 'PKR',
                    payment_method: 'bank_transfer',
                    transaction_reference: 'TXN-001',
                    vehicle_id: 'mock-vehicle-1',
                    vehicle_make: 'Toyota',
                    vehicle_model: 'Corolla',
                    vehicle_year: 2023,
                    transaction_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'completed',
                    total_amount: 2500000,
                    paid_amount: 2000000,
                    remaining_due: 500000,
                    notes: 'Vehicle purchase',
                    created_by: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ];

            return {
                data: mockTransactions,
                error: null,
            };
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

        const { data: transactions, error: transactionsError } = await supabase
            .from('client_transactions')
            .select('*')
            .eq('client_id', clientId)
            .eq('organization_id', profile.organization_id)
            .order('transaction_date', { ascending: false });

        if (transactionsError) {
            console.error('Error fetching transactions:', transactionsError);
            return { data: null, error: transactionsError.message };
        }

        return { data: transactions || [], error: null };
    } catch (err) {
        console.error('Error in getClientTransactions:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch transactions.',
        };
    }
}

export async function createClientTransaction(
    data: ClientTransactionFormData
): Promise<{ data: ClientTransaction | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            // Return mock data for development
            const mockTransaction: ClientTransaction = {
                id: `mock-tx-${Date.now()}`,
                organization_id: 'mock-org',
                client_id: data.client_id,
                deal_id: data.deal_id || null,
                transaction_type: data.transaction_type,
                amount: data.amount,
                currency: data.currency || 'PKR',
                payment_method: data.payment_method ? (data.payment_method as PaymentMethod) : null,
                transaction_reference: data.transaction_reference || null,
                vehicle_id: data.vehicle_id || null,
                vehicle_make: data.vehicle_make || null,
                vehicle_model: data.vehicle_model || null,
                vehicle_year: data.vehicle_year || null,
                transaction_date: data.transaction_date,
                status: data.status || 'completed',
                total_amount: data.total_amount || data.amount,
                paid_amount: data.paid_amount || 0,
                remaining_due: data.remaining_due || (data.total_amount ? data.total_amount - (data.paid_amount || 0) : 0),
                notes: data.notes || null,
                created_by: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            console.warn('⚠️ Supabase not configured. Transaction creation is simulated.');
            return {
                data: mockTransaction,
                error: null,
            };
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

        // Verify client belongs to organization
        const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('id', data.client_id)
            .eq('organization_id', profile.organization_id)
            .single();

        if (!client) {
            return { data: null, error: 'Client not found' };
        }

        // Calculate remaining due if not provided
        const totalAmount = data.total_amount || data.amount;
        const paidAmount = data.paid_amount || 0;
        const remainingDue = data.remaining_due !== undefined 
            ? data.remaining_due 
            : Math.max(0, totalAmount - paidAmount);

        const { data: transaction, error: transactionError } = await supabase
            .from('client_transactions')
            .insert({
                organization_id: profile.organization_id,
                client_id: data.client_id,
                deal_id: data.deal_id || null,
                transaction_type: data.transaction_type,
                amount: data.amount,
                currency: data.currency || 'PKR',
                payment_method: data.payment_method || null,
                transaction_reference: data.transaction_reference || null,
                vehicle_id: data.vehicle_id || null,
                vehicle_make: data.vehicle_make || null,
                vehicle_model: data.vehicle_model || null,
                vehicle_year: data.vehicle_year || null,
                transaction_date: data.transaction_date,
                status: data.status || 'completed',
                total_amount: totalAmount,
                paid_amount: paidAmount,
                remaining_due: remainingDue,
                notes: data.notes || null,
                created_by: user.id,
            })
            .select()
            .single();

        if (transactionError) {
            console.error('Error creating transaction:', transactionError);
            return { data: null, error: transactionError.message };
        }

        revalidatePath('/dashboard/clients');
        revalidatePath(`/dashboard/clients/${data.client_id}`);
        return { data: transaction, error: null };
    } catch (err) {
        console.error('Error in createClientTransaction:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to create transaction.',
        };
    }
}
