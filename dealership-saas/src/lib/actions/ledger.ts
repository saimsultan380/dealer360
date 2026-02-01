'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  CashTransactionStatus,
  CashTransactionType,
  PaymentMethod,
} from '@/lib/types/database';

export type LedgerPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface LedgerFilters {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  transaction_type?: CashTransactionType;
  status?: CashTransactionStatus;
  payment_method?: PaymentMethod;
}

export interface LedgerEntry {
  id: string;
  source: 'cash_transaction';
  transaction_date: string; // YYYY-MM-DD
  transaction_type: CashTransactionType;
  amount: number;
  currency: string;
  description: string;
  reference_number: string | null;
  payment_method: PaymentMethod | null;
  status: CashTransactionStatus;
  notes: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  expense_category: null | {
    id: string;
    name: string;
    color: string;
  };
}

export interface DealProfitRow {
  deal_id: string;
  deal_date: string; // YYYY-MM-DD
  status: string;
  vehicle_id: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  sale_price: number;
  purchase_price: number;
  commission_amount: number;
  gross_profit: number;
  net_profit: number; // gross - commission (expenses are applied at summary level)
}

export interface LedgerSummary {
  cash_in: number;
  cash_out: number;
  expenses: number;
  net_cashflow: number;

  revenue: number;
  cogs: number;
  gross_profit: number;
  commissions: number;
  net_profit: number; // gross - commissions - expenses

  transactions_count: number;
  deals_count: number;
}

export interface LedgerSeriesPoint {
  date: string; // bucket key: day/weekStart/month/year
  cash_in: number;
  cash_out: number;
  expenses: number;
  net_cashflow: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
  commissions: number;
  net_profit: number;
}

function toISODate(d: Date) {
  return d.toISOString().split('T')[0];
}

function bucketKey(dateStr: string, period: LedgerPeriod): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  if (period === 'daily') return toISODate(d);
  if (period === 'monthly') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (period === 'yearly') return String(d.getFullYear());

  // weekly (week starts Monday)
  const day = d.getDay(); // 0=Sun..6=Sat
  const mondayOffset = (day + 6) % 7; // Mon =>0, Sun=>6
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - mondayOffset);
  weekStart.setHours(12, 0, 0, 0);
  return toISODate(weekStart);
}

async function getOrgId(supabase: any): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) return null;
    return profile.organization_id as string;
  } catch {
    return null;
  }
}

export async function getLedgerEntries(
  filters?: LedgerFilters
): Promise<{ data: LedgerEntry[]; error: string | null }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl.includes('your-project-id.supabase.co')
    ) {
      // Mock data for development
      const today = toISODate(new Date());
      const mock: LedgerEntry[] = [
        {
          id: 'mock-ledger-1',
          source: 'cash_transaction',
          transaction_date: today,
          transaction_type: 'cash_in',
          amount: 350000,
          currency: 'PKR',
          description: 'Vehicle sale payment (mock)',
          reference_number: 'TXN-001',
          payment_method: 'bank_transfer',
          status: 'completed',
          notes: null,
          related_entity_type: 'deal',
          related_entity_id: 'mock-deal-1',
          expense_category: null,
        },
        {
          id: 'mock-ledger-2',
          source: 'cash_transaction',
          transaction_date: today,
          transaction_type: 'expense',
          amount: 25000,
          currency: 'PKR',
          description: 'Showroom electricity bill (mock)',
          reference_number: null,
          payment_method: 'cash',
          status: 'completed',
          notes: null,
          related_entity_type: null,
          related_entity_id: null,
          expense_category: { id: 'mock-cat-1', name: 'Utilities', color: '#f59e0b' },
        },
      ];
      return { data: mock, error: null };
    }

    const supabase = (await createClient()) as any;
    const orgId = await getOrgId(supabase);

    if (!orgId) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('cash_transactions')
      .select(`
        *,
        expense_categories (*)
      `)
      .eq('organization_id', orgId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.transaction_type) query = query.eq('transaction_type', filters.transaction_type);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.payment_method) query = query.eq('payment_method', filters.payment_method);
    if (filters?.start_date) query = query.gte('transaction_date', filters.start_date);
    if (filters?.end_date) query = query.lte('transaction_date', filters.end_date);

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    const rows: LedgerEntry[] = (data || []).map((tx: any) => ({
      id: tx.id,
      source: 'cash_transaction',
      transaction_date: tx.transaction_date,
      transaction_type: tx.transaction_type,
      amount: Number(tx.amount) || 0,
      currency: tx.currency || 'PKR',
      description: tx.description,
      reference_number: tx.reference_number ?? null,
      payment_method: tx.payment_method ?? null,
      status: tx.status,
      notes: tx.notes ?? null,
      related_entity_type: tx.related_entity_type ?? null,
      related_entity_id: tx.related_entity_id ?? null,
      expense_category: tx.expense_categories?.[0]
        ? {
            id: tx.expense_categories[0].id,
            name: tx.expense_categories[0].name,
            color: tx.expense_categories[0].color,
          }
        : null,
    }));

    return { data: rows, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch ledger entries.' };
  }
}

export async function getDealProfitRows(
  start_date?: string,
  end_date?: string
): Promise<{ data: DealProfitRow[]; error: string | null }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl.includes('your-project-id.supabase.co')
    ) {
      const today = toISODate(new Date());
      const mock: DealProfitRow[] = [
        {
          deal_id: 'mock-deal-1',
          deal_date: today,
          status: 'completed',
          vehicle_id: 'mock-vehicle-1',
          vehicle_make: 'Toyota',
          vehicle_model: 'Corolla',
          vehicle_year: 2022,
          sale_price: 2500000,
          purchase_price: 2200000,
          commission_amount: 25000,
          gross_profit: 300000,
          net_profit: 275000,
        },
      ];
      return { data: mock, error: null };
    }

    const supabase = (await createClient()) as any;
    const orgId = await getOrgId(supabase);

    if (!orgId) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('deals')
      .select(`
        id,
        vehicle_id,
        sale_price,
        commission_amount,
        status,
        deal_date,
        vehicles!inner(purchase_price, make, model, year)
      `)
      .eq('organization_id', orgId)
      .eq('status', 'completed')
      .order('deal_date', { ascending: false });

    if (start_date) query = query.gte('deal_date', start_date);
    if (end_date) query = query.lte('deal_date', end_date);

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    const rows: DealProfitRow[] = (data || []).map((d: any) => {
      const v = d.vehicles;
      const sale = Number(d.sale_price) || 0;
      const purchase = Number(v?.purchase_price) || 0;
      const commission = Number(d.commission_amount) || 0;
      const gross = sale - purchase;
      const net = gross - commission;
      return {
        deal_id: d.id,
        deal_date: d.deal_date,
        status: d.status,
        vehicle_id: d.vehicle_id,
        vehicle_make: v?.make ?? null,
        vehicle_model: v?.model ?? null,
        vehicle_year: v?.year ?? null,
        sale_price: sale,
        purchase_price: purchase,
        commission_amount: commission,
        gross_profit: gross,
        net_profit: net,
      };
    });

    return { data: rows, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch deal profit rows.' };
  }
}

export async function getLedgerSummary(
  filters?: LedgerFilters
): Promise<{ data: LedgerSummary | null; error: string | null }> {
  try {
    const [entriesRes, profitRes] = await Promise.all([
      getLedgerEntries(filters),
      getDealProfitRows(filters?.start_date, filters?.end_date),
    ]);

    if (entriesRes.error) return { data: null, error: entriesRes.error };
    if (profitRes.error) return { data: null, error: profitRes.error };

    // If no data (unauthorized), return empty summary
    if (!entriesRes.data && !profitRes.data) {
      return {
        data: {
          cash_in: 0,
          cash_out: 0,
          expenses: 0,
          net_cashflow: 0,
          revenue: 0,
          cogs: 0,
          gross_profit: 0,
          commissions: 0,
          net_profit: 0,
          transactions_count: 0,
          deals_count: 0,
        },
        error: null,
      };
    }

    const entries = entriesRes.data || [];
    const deals = profitRes.data || [];

    const cash_in = entries
      .filter((e) => e.transaction_type === 'cash_in' && e.status === 'completed')
      .reduce((sum, e) => sum + e.amount, 0);
    const cash_out = entries
      .filter((e) => e.transaction_type === 'cash_out' && e.status === 'completed')
      .reduce((sum, e) => sum + e.amount, 0);
    const expenses = entries
      .filter((e) => e.transaction_type === 'expense' && e.status === 'completed')
      .reduce((sum, e) => sum + e.amount, 0);
    const net_cashflow = cash_in - cash_out - expenses;

    const revenue = deals.reduce((sum, r) => sum + r.sale_price, 0);
    const cogs = deals.reduce((sum, r) => sum + r.purchase_price, 0);
    const gross_profit = revenue - cogs;
    const commissions = deals.reduce((sum, r) => sum + r.commission_amount, 0);
    const net_profit = gross_profit - commissions - expenses;

    return {
      data: {
        cash_in,
        cash_out,
        expenses,
        net_cashflow,
        revenue,
        cogs,
        gross_profit,
        commissions,
        net_profit,
        transactions_count: entries.length,
        deals_count: deals.length,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch ledger summary.' };
  }
}

export async function getLedgerTimeSeries(params: {
  period: LedgerPeriod;
  start_date?: string;
  end_date?: string;
}): Promise<{ data: LedgerSeriesPoint[]; error: string | null }> {
  try {
    const { period, start_date, end_date } = params;

    const [entriesRes, profitRes] = await Promise.all([
      getLedgerEntries({ start_date, end_date }),
      getDealProfitRows(start_date, end_date),
    ]);

    // Return empty array instead of error for unauthorized states
    if (entriesRes.error && entriesRes.error !== 'Unauthorized' && entriesRes.error !== 'No organization found') {
      return { data: [], error: entriesRes.error };
    }
    if (profitRes.error && profitRes.error !== 'Unauthorized' && profitRes.error !== 'No organization found') {
      return { data: [], error: profitRes.error };
    }

    // If unauthorized, return empty data gracefully
    if (!entriesRes.data && !profitRes.data) {
      return { data: [], error: null };
    }

    const grouped: Record<string, LedgerSeriesPoint> = {};

    // Cash transactions (completed only for series)
    for (const e of entriesRes.data || []) {
      if (e.status !== 'completed') continue;
      const key = bucketKey(e.transaction_date, period);
      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          cash_in: 0,
          cash_out: 0,
          expenses: 0,
          net_cashflow: 0,
          revenue: 0,
          cogs: 0,
          gross_profit: 0,
          commissions: 0,
          net_profit: 0,
        };
      }
      if (e.transaction_type === 'cash_in') grouped[key].cash_in += e.amount;
      if (e.transaction_type === 'cash_out') grouped[key].cash_out += e.amount;
      if (e.transaction_type === 'expense') grouped[key].expenses += e.amount;
    }

    // Deals profit (completed already)
    for (const d of profitRes.data || []) {
      const key = bucketKey(d.deal_date, period);
      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          cash_in: 0,
          cash_out: 0,
          expenses: 0,
          net_cashflow: 0,
          revenue: 0,
          cogs: 0,
          gross_profit: 0,
          commissions: 0,
          net_profit: 0,
        };
      }
      grouped[key].revenue += d.sale_price;
      grouped[key].cogs += d.purchase_price;
      grouped[key].commissions += d.commission_amount;
    }

    // finalize derived
    const points = Object.values(grouped)
      .map((p) => {
        p.net_cashflow = p.cash_in - p.cash_out - p.expenses;
        p.gross_profit = p.revenue - p.cogs;
        p.net_profit = p.gross_profit - p.commissions - p.expenses;
        return p;
      })
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    return { data: points, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch ledger time series.' };
  }
}

