'use server';

import { createClient } from '@/lib/supabase/server';

export interface TodayActivity {
    id: string;
    type: 'deal' | 'payment' | 'vehicle' | 'lead' | 'activity_log';
    title: string;
    description: string;
    amount?: number;
    status?: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

export interface TodaySummary {
    totalDeals: number;
    totalRevenue: number;
    totalPayments: number;
    newVehicles: number;
    newLeads: number;
    activities: TodayActivity[];
    series?: {
        hourly: { hour: number; deals: number; payments: number; vehicles: number; leads: number; revenue: number }[];
        revenueByPaymentMethod: { name: string; value: number; color: string }[];
        dailyRevenue7d: { day: string; date: string; revenue: number }[];
    };
}

function isoDate(d: Date) {
    return d.toISOString().slice(0, 10);
}

export async function getTodayActivities(): Promise<{ data: TodaySummary | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            // Return mock data for development
            const mockActivities: TodayActivity[] = [
                {
                    id: 'mock-1',
                    type: 'deal',
                    title: 'New Deal - John Doe',
                    description: 'Toyota Corolla 2023 - PKR 2,500,000',
                    amount: 2500000,
                    status: 'pending',
                    timestamp: new Date().toISOString(),
                    metadata: { customer_name: 'John Doe', vehicle: 'Toyota Corolla 2023' },
                },
                {
                    id: 'mock-2',
                    type: 'payment',
                    title: 'Payment Received',
                    description: 'Bank Transfer - PKR 500,000',
                    amount: 500000,
                    status: 'completed',
                    timestamp: new Date().toISOString(),
                },
                {
                    id: 'mock-3',
                    type: 'vehicle',
                    title: 'New Vehicle Added',
                    description: 'Honda Civic 2022',
                    timestamp: new Date().toISOString(),
                },
            ];

            return {
                data: {
                    totalDeals: 3,
                    totalRevenue: 5000000,
                    totalPayments: 2,
                    newVehicles: 1,
                    newLeads: 2,
                    activities: mockActivities,
                    series: {
                        hourly: Array.from({ length: 24 }, (_, hour) => ({
                            hour,
                            deals: hour === 10 ? 1 : 0,
                            payments: hour === 11 ? 1 : 0,
                            vehicles: hour === 9 ? 1 : 0,
                            leads: hour === 12 ? 1 : 0,
                            revenue: hour === 10 ? 2500000 : 0,
                        })),
                        revenueByPaymentMethod: [
                            { name: 'Cash', value: 2000000, color: '#10b981' },
                            { name: 'Bank Transfer', value: 2000000, color: '#3b82f6' },
                            { name: 'Financing', value: 1000000, color: '#8b5cf6' },
                        ],
                        dailyRevenue7d: Array.from({ length: 7 }, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (6 - i));
                            return {
                                day: d.toLocaleString('en-US', { weekday: 'short' }),
                                date: isoDate(d),
                                revenue: i === 6 ? 5000000 : 0,
                            };
                        }),
                    },
                },
                error: null,
            };
        }

        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        // If there is no authenticated user (for example in local/dev without auth),
        // fall back to an empty but valid summary instead of throwing an error so
        // the Today Book page can still render.
        if (!user) {
            return {
                data: {
                    totalDeals: 0,
                    totalRevenue: 0,
                    totalPayments: 0,
                    newVehicles: 0,
                    newLeads: 0,
                    activities: [],
                },
                error: null,
            };
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError) {
            console.error('Error fetching profile for Today Book:', profileError);
        }

        // If the user isn't linked to an organization yet (common for super_admin or misconfigured accounts),
        // return an empty but valid summary so the Today Book page can still render.
        if (!profile?.organization_id) {
            return {
                data: {
                    totalDeals: 0,
                    totalRevenue: 0,
                    totalPayments: 0,
                    newVehicles: 0,
                    newLeads: 0,
                    activities: [],
                },
                error: null,
            };
        }

        // Get today's date range (start and end of today in UTC)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.toISOString();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayEnd = tomorrow.toISOString();
        const todayISO = isoDate(today);
        const tomorrowISO = isoDate(tomorrow);

        // Fetch today's deals
        const { data: deals, error: dealsError } = await supabase
            .from('deals')
            .select(`
                id,
                customer_name,
                sale_price,
                down_payment,
                status,
                deal_date,
                created_at,
                vehicles!inner(make, model, year)
            `)
            .eq('organization_id', profile.organization_id)
            .gte('created_at', todayStart)
            .lt('created_at', todayEnd)
            .order('created_at', { ascending: false });

        if (dealsError) {
            console.error('Error fetching deals:', dealsError);
        }

        // Fetch today's cash-in transactions (payments received)
        const { data: cashIns, error: cashInsError } = await supabase
            .from('cash_transactions')
            .select('id, amount, status, payment_method, created_at, transaction_type')
            .eq('organization_id', profile.organization_id)
            .eq('transaction_type', 'cash_in')
            .gte('created_at', todayStart)
            .lt('created_at', todayEnd)
            .order('created_at', { ascending: false });

        if (cashInsError) {
            console.error('Error fetching cash transactions for Today Book:', cashInsError);
        }

        // Fetch today's vehicles
        const { data: vehicles, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('id, make, model, year, created_at')
            .eq('organization_id', profile.organization_id)
            .gte('created_at', todayStart)
            .lt('created_at', todayEnd)
            .order('created_at', { ascending: false });

        if (vehiclesError) {
            console.error('Error fetching vehicles:', vehiclesError);
        }

        // Fetch today's leads
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('id, name, phone, status, created_at')
            .eq('organization_id', profile.organization_id)
            .gte('created_at', todayStart)
            .lt('created_at', todayEnd)
            .order('created_at', { ascending: false });

        if (leadsError) {
            console.error('Error fetching leads:', leadsError);
        }

        // Fetch today's activity logs
        const { data: activityLogs, error: logsError } = await supabase
            .from('activity_logs')
            .select('id, action, entity_type, details, created_at, profiles(full_name)')
            .eq('organization_id', profile.organization_id)
            .gte('created_at', todayStart)
            .lt('created_at', todayEnd)
            .order('created_at', { ascending: false })
            .limit(50);

        if (logsError) {
            console.error('Error fetching activity logs:', logsError);
        }

        // Calculate summary
        const totalDeals = deals?.length || 0;
        const totalRevenue =
            deals?.filter((d: any) => d.status === 'completed')
                .reduce((sum: number, deal: any) => sum + Number(deal.sale_price || 0), 0) || 0;
        const totalPayments =
            (cashIns || []).filter((p: any) => (p.status || '').toLowerCase() === 'completed').length || 0;
        const newVehicles = vehicles?.length || 0;
        const newLeads = leads?.length || 0;

        // Build series (hourly + revenue/payment breakdown + 7d revenue)
        const hourly = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            deals: 0,
            payments: 0,
            vehicles: 0,
            leads: 0,
            revenue: 0,
        }));

        const hourOf = (ts: string) => {
            const d = new Date(ts);
            const h = d.getHours();
            return h >= 0 && h <= 23 ? h : 0;
        };

        (deals || []).forEach((d: any) => {
            const h = hourOf(d.created_at);
            hourly[h].deals += 1;
            if (d.status === 'completed') {
                hourly[h].revenue += Number(d.sale_price || 0);
            }
        });
        (cashIns || []).forEach((p: any) => {
            if ((p.status || '').toLowerCase() !== 'completed') return;
            const h = hourOf(p.created_at);
            hourly[h].payments += 1;
        });
        (vehicles || []).forEach((v: any) => {
            const h = hourOf(v.created_at);
            hourly[h].vehicles += 1;
        });
        (leads || []).forEach((l: any) => {
            const h = hourOf(l.created_at);
            hourly[h].leads += 1;
        });

        const paymentLabel: Record<string, { name: string; color: string }> = {
            cash: { name: 'Cash', color: '#10b981' },
            bank_transfer: { name: 'Bank Transfer', color: '#3b82f6' },
            easypaisa: { name: 'Easypaisa', color: '#22c55e' },
            jazzcash: { name: 'JazzCash', color: '#f97316' },
            financing: { name: 'Financing', color: '#8b5cf6' },
            cheque: { name: 'Cheque', color: '#64748b' },
            unknown: { name: 'Unknown', color: '#94a3b8' },
        };

        const revenueByPaymentMethodMap: Record<string, number> = {};
        (deals || [])
            .filter((d: any) => d.status === 'completed')
            .forEach((d: any) => {
                const key = (d.payment_method || 'unknown').toString().toLowerCase();
                revenueByPaymentMethodMap[key] = (revenueByPaymentMethodMap[key] || 0) + Number(d.sale_price || 0);
            });

        const revenueByPaymentMethod = Object.entries(revenueByPaymentMethodMap)
            .map(([key, value]) => ({
                name: paymentLabel[key]?.name || paymentLabel.unknown.name,
                value,
                color: paymentLabel[key]?.color || paymentLabel.unknown.color,
            }))
            .filter((x) => x.value > 0)
            .sort((a, b) => b.value - a.value);

        // 7-day revenue (completed deals) by deal_date
        const start7 = new Date(today);
        start7.setDate(start7.getDate() - 6);
        const start7ISO = isoDate(start7);

        const { data: weekDeals, error: weekDealsError } = await supabase
            .from('deals')
            .select('sale_price, deal_date, status, payment_method')
            .eq('organization_id', profile.organization_id)
            .eq('status', 'completed')
            .gte('deal_date', start7ISO)
            .lt('deal_date', tomorrowISO);

        if (weekDealsError) {
            console.error('Error fetching 7d deals for Today Book:', weekDealsError);
        }

        const revenueByDate: Record<string, number> = {};
        (weekDeals || []).forEach((d: any) => {
            const dateKey = String(d.deal_date || '');
            if (!dateKey) return;
            revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + Number(d.sale_price || 0);
        });

        const dailyRevenue7d = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start7);
            d.setDate(start7.getDate() + i);
            const date = isoDate(d);
            return {
                day: d.toLocaleString('en-US', { weekday: 'short' }),
                date,
                revenue: revenueByDate[date] || 0,
            };
        });

        // Build activities array
        const activities: TodayActivity[] = [];

        // Add deals
        (deals || []).forEach((deal: any) => {
            const vehicle = deal.vehicles;
            activities.push({
                id: deal.id,
                type: 'deal',
                title: `New Deal - ${deal.customer_name}`,
                description: `${vehicle?.make || ''} ${vehicle?.model || ''} ${vehicle?.year || ''} - PKR ${parseFloat(deal.sale_price || '0').toLocaleString()}`,
                amount: parseFloat(deal.sale_price || '0'),
                status: deal.status,
                timestamp: deal.created_at,
                metadata: {
                    customer_name: deal.customer_name,
                    vehicle: `${vehicle?.make} ${vehicle?.model} ${vehicle?.year}`,
                },
            });
        });

        // Add payments (cash-in transactions)
        (cashIns || []).forEach((payment: any) => {
            activities.push({
                id: payment.id,
                type: 'payment',
                title: 'Payment Received',
                description: `${payment.payment_method || 'Payment'} - PKR ${Number(payment.amount || 0).toLocaleString()}`,
                amount: Number(payment.amount || 0),
                status: payment.status,
                timestamp: payment.created_at,
                metadata: {
                    payment_method: payment.payment_method,
                },
            });
        });

        // Add vehicles
        (vehicles || []).forEach((vehicle: any) => {
            activities.push({
                id: vehicle.id,
                type: 'vehicle',
                title: 'New Vehicle Added',
                description: `${vehicle.make} ${vehicle.model} ${vehicle.year || ''}`,
                timestamp: vehicle.created_at,
                metadata: {
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                },
            });
        });

        // Add leads
        (leads || []).forEach((lead: any) => {
            activities.push({
                id: lead.id,
                type: 'lead',
                title: `New Lead - ${lead.name}`,
                description: `${lead.phone || ''} - ${lead.status || 'new'}`,
                status: lead.status,
                timestamp: lead.created_at,
                metadata: {
                    name: lead.name,
                    phone: lead.phone,
                },
            });
        });

        // Add activity logs (filter out duplicates that are already represented)
        (activityLogs || []).forEach((log: any) => {
            // Skip if we already have the entity represented
            const alreadyAdded = activities.some(
                a => a.metadata?.entity_id === log.id || 
                (log.entity_type === 'deal' && activities.some(a => a.type === 'deal' && a.id === log.entity_id)) ||
                (log.entity_type === 'vehicle' && activities.some(a => a.type === 'vehicle' && a.id === log.entity_id)) ||
                (log.entity_type === 'lead' && activities.some(a => a.type === 'lead' && a.id === log.entity_id))
            );

            if (!alreadyAdded) {
                const userName = log.profiles?.full_name || 'System';
                activities.push({
                    id: log.id,
                    type: 'activity_log',
                    title: `${userName} - ${log.action}`,
                    description: log.entity_type ? `${log.entity_type} ${log.action}` : log.action,
                    timestamp: log.created_at,
                    metadata: {
                        action: log.action,
                        entity_type: log.entity_type,
                        entity_id: log.entity_id,
                        details: log.details,
                    },
                });
            }
        });

        // Sort activities by timestamp (newest first)
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return {
            data: {
                totalDeals,
                totalRevenue,
                totalPayments,
                newVehicles,
                newLeads,
                activities: activities.slice(0, 100), // Limit to 100 most recent
                series: {
                    hourly,
                    revenueByPaymentMethod,
                    dailyRevenue7d,
                },
            },
            error: null,
        };
    } catch (err) {
        console.error('Error in getTodayActivities:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch today\'s activities.',
        };
    }
}
