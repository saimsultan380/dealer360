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

export type DateFilter = 'today' | 'last_week' | 'last_month' | 'all';

function getDateFilter(dateFilter: DateFilter): { startDate: Date | null; endDate: Date | null } {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
        case 'today':
            return { startDate: startOfToday, endDate: now };
        case 'last_week':
            const weekAgo = new Date(startOfToday);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return { startDate: weekAgo, endDate: now };
        case 'last_month':
            const monthAgo = new Date(startOfToday);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return { startDate: monthAgo, endDate: now };
        case 'all':
        default:
            return { startDate: null, endDate: null };
    }
}

export async function getRecentActivities(
    limit: number = 20,
    page: number = 1,
    dateFilter: DateFilter = 'all'
): Promise<{ 
    data: RecentActivity[] | null; 
    error: string | null;
    total: number;
    page: number;
    totalPages: number;
}> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: [], error: null, total: 0, page: 1, totalPages: 0 };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: [], error: null, total: 0, page: 1, totalPages: 0 };
        }

        const { startDate, endDate } = getDateFilter(dateFilter);
        const activities: RecentActivity[] = [];

        // Helper function to build date filter query
        const buildDateFilter = (query: any) => {
            if (startDate && endDate) {
                return query.gte('created_at', startDate.toISOString())
                           .lte('created_at', endDate.toISOString());
            }
            return query;
        };

        // Fetch recent vehicles
        let vehiclesQuery = supabase
            .from('vehicles')
            .select('id, make, model, year, created_at, updated_at', { count: 'exact' })
            .eq('organization_id', profile.organization_id);
        
        vehiclesQuery = buildDateFilter(vehiclesQuery);
        const { data: vehicles } = await vehiclesQuery
            .order('created_at', { ascending: false })
            .limit(limit * 10); // Fetch more to account for filtering

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
        let salesQuery = supabase
            .from('sales')
            .select('id, customer_name, sale_price, created_at, updated_at', { count: 'exact' })
            .eq('organization_id', profile.organization_id);
        
        salesQuery = buildDateFilter(salesQuery);
        const { data: sales } = await salesQuery
            .order('created_at', { ascending: false })
            .limit(limit * 10);

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
        let investorsQuery = supabase
            .from('investors')
            .select('id, name, created_at, updated_at', { count: 'exact' })
            .eq('organization_id', profile.organization_id);
        
        investorsQuery = buildDateFilter(investorsQuery);
        const { data: investors } = await investorsQuery
            .order('created_at', { ascending: false })
            .limit(limit * 10);

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
        let cashTransactionsQuery = supabase
            .from('cash_transactions')
            .select('id, transaction_type, amount, description, created_at, updated_at, status', { count: 'exact' })
            .eq('organization_id', profile.organization_id);
        
        cashTransactionsQuery = buildDateFilter(cashTransactionsQuery);
        const { data: cashTransactions } = await cashTransactionsQuery
            .order('created_at', { ascending: false })
            .limit(limit * 10);

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
        let clientsQuery = supabase
            .from('clients')
            .select('id, name, phone, created_at, updated_at', { count: 'exact' })
            .eq('organization_id', profile.organization_id);
        
        clientsQuery = buildDateFilter(clientsQuery);
        const { data: clients } = await clientsQuery
            .order('created_at', { ascending: false })
            .limit(limit * 10);

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
        let dealsQuery = supabase
            .from('deals')
            .select('id, customer_name, sale_price, status, created_at, updated_at', { count: 'exact' })
            .eq('organization_id', profile.organization_id);
        
        dealsQuery = buildDateFilter(dealsQuery);
        const { data: deals } = await dealsQuery
            .order('created_at', { ascending: false })
            .limit(limit * 10);

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
        let leadsQuery = supabase
            .from('leads')
            .select('id, customer_name, customer_phone, status, created_at, updated_at', { count: 'exact' })
            .eq('organization_id', profile.organization_id);
        
        leadsQuery = buildDateFilter(leadsQuery);
        const { data: leads } = await leadsQuery
            .order('created_at', { ascending: false })
            .limit(limit * 10);

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

        // Calculate pagination
        const total = activities.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedActivities = activities.slice(startIndex, endIndex);

        return { 
            data: paginatedActivities, 
            error: null,
            total,
            page,
            totalPages,
        };
    } catch (err) {
        console.error('Error in getRecentActivities:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch recent activities.',
            total: 0,
            page: 1,
            totalPages: 0,
        };
    }
}
