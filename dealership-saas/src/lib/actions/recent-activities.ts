'use server';

import { createClient } from '@/lib/supabase/server';

export interface RecentActivity {
    id: string;
    type: 'vehicle' | 'sale' | 'investor' | 'cash_flow' | 'client' | 'deal' | 'lead';
    title: string;
    description: string;
    amount?: number;
    status?: string;
    timestamp: string;
    metadata?: Record<string, any>;
    link?: string;
}

export async function getRecentActivities(limit: number = 20): Promise<{ data: RecentActivity[] | null; error: string | null }> {
    try {
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

        const activities: RecentActivity[] = [];

        // Fetch recent vehicles
        const { data: vehicles } = await supabase
            .from('vehicles')
            .select('id, make, model, year, created_at, updated_at')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(limit);

        (vehicles || []).forEach((vehicle: any) => {
            activities.push({
                id: `vehicle-${vehicle.id}`,
                type: 'vehicle',
                title: 'New Vehicle Added',
                description: `${vehicle.make} ${vehicle.model} ${vehicle.year || ''}`.trim(),
                timestamp: vehicle.created_at,
                metadata: {
                    vehicle_id: vehicle.id,
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                },
                link: `/dashboard/inventory/${vehicle.id}`,
            });
        });

        // Fetch recent sales
        const { data: sales } = await supabase
            .from('sales')
            .select('id, customer_name, sale_price, created_at, updated_at')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(limit);

        (sales || []).forEach((sale: any) => {
            activities.push({
                id: `sale-${sale.id}`,
                type: 'sale',
                title: 'New Sale Recorded',
                description: `${sale.customer_name} - PKR ${sale.sale_price?.toLocaleString() || '0'}`,
                amount: sale.sale_price,
                timestamp: sale.created_at,
                metadata: {
                    sale_id: sale.id,
                    customer_name: sale.customer_name,
                },
                link: `/dashboard/sales/${sale.id}`,
            });
        });

        // Fetch recent investors
        const { data: investors } = await supabase
            .from('investors')
            .select('id, name, created_at, updated_at')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(limit);

        (investors || []).forEach((investor: any) => {
            activities.push({
                id: `investor-${investor.id}`,
                type: 'investor',
                title: 'New Investor Added',
                description: investor.name,
                timestamp: investor.created_at,
                metadata: {
                    investor_id: investor.id,
                    name: investor.name,
                },
                link: `/dashboard/investors/${investor.id}`,
            });
        });

        // Fetch recent cash flow transactions
        const { data: cashTransactions } = await supabase
            .from('cash_transactions')
            .select('id, transaction_type, amount, description, created_at, updated_at, status')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(limit);

        (cashTransactions || []).forEach((transaction: any) => {
            const isIncome = transaction.transaction_type === 'cash_in';
            activities.push({
                id: `cash-${transaction.id}`,
                type: 'cash_flow',
                title: isIncome ? 'Cash In Transaction' : 'Cash Out Transaction',
                description: transaction.description || `${isIncome ? 'Income' : 'Expense'} - PKR ${transaction.amount?.toLocaleString() || '0'}`,
                amount: transaction.amount,
                status: transaction.status,
                timestamp: transaction.created_at,
                metadata: {
                    transaction_id: transaction.id,
                    transaction_type: transaction.transaction_type,
                },
                link: '/dashboard/cash-flow',
            });
        });

        // Fetch recent clients
        const { data: clients } = await supabase
            .from('clients')
            .select('id, name, phone, created_at, updated_at')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(limit);

        (clients || []).forEach((client: any) => {
            activities.push({
                id: `client-${client.id}`,
                type: 'client',
                title: 'New Client Added',
                description: `${client.name}${client.phone ? ` - ${client.phone}` : ''}`,
                timestamp: client.created_at,
                metadata: {
                    client_id: client.id,
                    name: client.name,
                    phone: client.phone,
                },
                link: `/dashboard/clients/${client.id}`,
            });
        });

        // Fetch recent deals
        const { data: deals } = await supabase
            .from('deals')
            .select('id, customer_name, sale_price, status, created_at, updated_at')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(limit);

        (deals || []).forEach((deal: any) => {
            activities.push({
                id: `deal-${deal.id}`,
                type: 'deal',
                title: 'New Deal Created',
                description: `${deal.customer_name} - PKR ${deal.sale_price?.toLocaleString() || '0'}`,
                amount: deal.sale_price,
                status: deal.status,
                timestamp: deal.created_at,
                metadata: {
                    deal_id: deal.id,
                    customer_name: deal.customer_name,
                },
                link: `/dashboard/deals/${deal.id}`,
            });
        });

        // Fetch recent leads
        const { data: leads } = await supabase
            .from('leads')
            .select('id, customer_name, customer_phone, status, created_at, updated_at')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(limit);

        (leads || []).forEach((lead: any) => {
            activities.push({
                id: `lead-${lead.id}`,
                type: 'lead',
                title: 'New Lead Added',
                description: `${lead.customer_name}${lead.customer_phone ? ` - ${lead.customer_phone}` : ''} - ${lead.status || 'new'}`,
                status: lead.status,
                timestamp: lead.created_at,
                metadata: {
                    lead_id: lead.id,
                    name: lead.customer_name,
                    phone: lead.customer_phone,
                },
                link: `/dashboard/leads/${lead.id}`,
            });
        });

        // Sort all activities by timestamp (most recent first)
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Return only the most recent activities (limit)
        return { data: activities.slice(0, limit), error: null };
    } catch (err) {
        console.error('Error in getRecentActivities:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch recent activities.',
        };
    }
}
