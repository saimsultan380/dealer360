'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CashTransaction, ExpenseCategory } from '@/lib/types/database';
import type { CashTransactionType, CashTransactionStatus, PaymentMethod, RelatedEntityType } from '@/lib/types/database';

export interface CashFlowSummary {
    total_cash_in: number;
    total_cash_out: number;
    total_expenses: number;
    current_balance: number;
}

export interface ExpenseCategoryFormData {
    name: string;
    description?: string;
    color?: string;
    is_active?: boolean;
}

export interface CashTransactionFormData {
    transaction_type: CashTransactionType;
    amount: number;
    currency?: string;
    expense_category_id?: string;
    payment_method?: PaymentMethod;
    description: string;
    reference_number?: string;
    transaction_date: string;
    related_entity_type?: RelatedEntityType;
    related_entity_id?: string;
    status?: CashTransactionStatus;
    notes?: string;
}

export interface CashTransactionWithCategory extends CashTransaction {
    expense_category?: ExpenseCategory | null;
}

// =============================================================================
// EXPENSE CATEGORIES
// =============================================================================

export async function getExpenseCategories(): Promise<{ data: ExpenseCategory[] | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            // Return mock data for development
            const mockCategories: ExpenseCategory[] = [
                {
                    id: 'mock-cat-1',
                    organization_id: 'mock-org',
                    name: 'Rent',
                    description: 'Showroom rent',
                    color: '#ef4444',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                {
                    id: 'mock-cat-2',
                    organization_id: 'mock-org',
                    name: 'Utilities',
                    description: 'Electricity, water, gas bills',
                    color: '#f59e0b',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                {
                    id: 'mock-cat-3',
                    organization_id: 'mock-org',
                    name: 'Staff Salary',
                    description: 'Employee salaries',
                    color: '#3b82f6',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ];

            return {
                data: mockCategories,
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

        const { data: categories, error } = await supabase
            .from('expense_categories')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching expense categories:', error);
            return { data: null, error: error.message };
        }

        return { data: categories, error: null };
    } catch (err) {
        console.error('Error in getExpenseCategories:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch expense categories.',
        };
    }
}

export async function createExpenseCategory(
    data: ExpenseCategoryFormData
): Promise<{ data: ExpenseCategory | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            const mockCategory: ExpenseCategory = {
                id: `mock-cat-${Date.now()}`,
                organization_id: 'mock-org',
                name: data.name,
                description: data.description || null,
                color: data.color || '#3b82f6',
                is_active: data.is_active ?? true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            console.warn('⚠️ Supabase not configured. Category creation is simulated.');
            return {
                data: mockCategory,
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

        const { data: category, error: categoryError } = await supabase
            .from('expense_categories')
            .insert({
                organization_id: profile.organization_id,
                name: data.name,
                description: data.description || null,
                color: data.color || '#3b82f6',
                is_active: data.is_active ?? true,
            })
            .select()
            .single();

        if (categoryError) {
            console.error('Error creating expense category:', categoryError);
            return { data: null, error: categoryError.message };
        }

        revalidatePath('/dashboard/cash-flow');
        return { data: category, error: null };
    } catch (err) {
        console.error('Error in createExpenseCategory:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to create expense category.',
        };
    }
}

export async function updateExpenseCategory(
    id: string,
    data: Partial<ExpenseCategoryFormData>
): Promise<{ data: ExpenseCategory | null; error: string | null }> {
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

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.color !== undefined) updateData.color = data.color;
        if (data.is_active !== undefined) updateData.is_active = data.is_active;

        const { data: category, error: categoryError } = await supabase
            .from('expense_categories')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .select()
            .single();

        if (categoryError) {
            console.error('Error updating expense category:', categoryError);
            return { data: null, error: categoryError.message };
        }

        revalidatePath('/dashboard/cash-flow');
        return { data: category, error: null };
    } catch (err) {
        console.error('Error in updateExpenseCategory:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to update expense category.',
        };
    }
}

export async function deleteExpenseCategory(id: string): Promise<{ error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { error: 'No organization found' };
        }

        const { error } = await supabase
            .from('expense_categories')
            .delete()
            .eq('id', id)
            .eq('organization_id', profile.organization_id);

        if (error) {
            console.error('Error deleting expense category:', error);
            return { error: error.message };
        }

        revalidatePath('/dashboard/cash-flow');
        return { error: null };
    } catch (err) {
        console.error('Error in deleteExpenseCategory:', err);
        return {
            error: err instanceof Error ? err.message : 'Failed to delete expense category.',
        };
    }
}

// =============================================================================
// CASH TRANSACTIONS
// =============================================================================

export async function getCashFlowSummary(): Promise<{ data: CashFlowSummary | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            return {
                data: {
                    total_cash_in: 5000000,
                    total_cash_out: 500000,
                    total_expenses: 150000,
                    current_balance: 4350000,
                },
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

        // Get summary using database functions
        const { data: balanceData } = await supabase.rpc('get_cash_balance', {
            p_org_id: profile.organization_id,
        });

        const { data: cashInData } = await supabase.rpc('get_total_cash_in', {
            p_org_id: profile.organization_id,
        });

        const { data: cashOutData } = await supabase.rpc('get_total_cash_out', {
            p_org_id: profile.organization_id,
        });

        const { data: expensesData } = await supabase.rpc('get_total_expenses', {
            p_org_id: profile.organization_id,
        });

        return {
            data: {
                total_cash_in: cashInData || 0,
                total_cash_out: cashOutData || 0,
                total_expenses: expensesData || 0,
                current_balance: balanceData || 0,
            },
            error: null,
        };
    } catch (err) {
        console.error('Error in getCashFlowSummary:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch cash flow summary.',
        };
    }
}

export async function getCashTransactions(
    filters?: {
        transaction_type?: CashTransactionType;
        start_date?: string;
        end_date?: string;
    }
): Promise<{ data: CashTransactionWithCategory[] | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            const mockTransactions: CashTransactionWithCategory[] = [
                {
                    id: 'mock-tx-1',
                    organization_id: 'mock-org',
                    transaction_type: 'cash_in',
                    amount: 500000,
                    currency: 'PKR',
                    expense_category_id: null,
                    payment_method: 'bank_transfer',
                    description: 'Vehicle sale payment',
                    reference_number: 'TXN-001',
                    transaction_date: new Date().toISOString().split('T')[0],
                    related_entity_type: 'deal',
                    related_entity_id: 'mock-deal-1',
                    status: 'completed',
                    notes: 'Payment received for Toyota Corolla',
                    created_by: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    expense_category: null,
                },
                {
                    id: 'mock-tx-2',
                    organization_id: 'mock-org',
                    transaction_type: 'expense',
                    amount: 50000,
                    currency: 'PKR',
                    expense_category_id: 'mock-cat-1',
                    payment_method: 'cash',
                    description: 'Monthly rent payment',
                    reference_number: null,
                    transaction_date: new Date().toISOString().split('T')[0],
                    related_entity_type: null,
                    related_entity_id: null,
                    status: 'completed',
                    notes: 'Showroom rent for January',
                    created_by: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    expense_category: {
                        id: 'mock-cat-1',
                        organization_id: 'mock-org',
                        name: 'Rent',
                        description: 'Showroom rent',
                        color: '#ef4444',
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
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

        let query = supabase
            .from('cash_transactions')
            .select(`
                *,
                expense_categories (*)
            `)
            .eq('organization_id', profile.organization_id)
            .order('transaction_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (filters?.transaction_type) {
            query = query.eq('transaction_type', filters.transaction_type);
        }

        if (filters?.start_date) {
            query = query.gte('transaction_date', filters.start_date);
        }

        if (filters?.end_date) {
            query = query.lte('transaction_date', filters.end_date);
        }

        const { data: transactions, error } = await query;

        if (error) {
            console.error('Error fetching cash transactions:', error);
            return { data: null, error: error.message };
        }

        return {
            data: transactions?.map((tx: any) => ({
                ...tx,
                expense_category: tx.expense_categories?.[0] || null,
            })) || [],
            error: null,
        };
    } catch (err) {
        console.error('Error in getCashTransactions:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch cash transactions.',
        };
    }
}

export async function getCashTransactionById(
    id: string
): Promise<{ data: CashTransactionWithCategory | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            const mockTransaction: CashTransactionWithCategory = {
                id,
                organization_id: 'mock-org',
                transaction_type: 'expense',
                amount: 50000,
                currency: 'PKR',
                expense_category_id: 'mock-cat-1',
                payment_method: 'cash',
                description: 'Monthly rent payment',
                reference_number: null,
                transaction_date: new Date().toISOString().split('T')[0],
                related_entity_type: null,
                related_entity_id: null,
                status: 'completed',
                notes: 'Showroom rent for January',
                created_by: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                expense_category: {
                    id: 'mock-cat-1',
                    organization_id: 'mock-org',
                    name: 'Rent',
                    description: 'Showroom rent',
                    color: '#ef4444',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            };

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

        const { data: transaction, error } = await supabase
            .from('cash_transactions')
            .select(`
                *,
                expense_categories (*)
            `)
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single();

        if (error) {
            console.error('Error fetching cash transaction:', error);
            return { data: null, error: error.message };
        }

        return {
            data: {
                ...transaction,
                expense_category: transaction.expense_categories?.[0] || null,
            },
            error: null,
        };
    } catch (err) {
        console.error('Error in getCashTransactionById:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch cash transaction.',
        };
    }
}

export async function createCashTransaction(
    data: CashTransactionFormData
): Promise<{ data: CashTransaction | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            const mockTransaction: CashTransaction = {
                id: `mock-tx-${Date.now()}`,
                organization_id: 'mock-org',
                transaction_type: data.transaction_type,
                amount: data.amount,
                currency: data.currency || 'PKR',
                expense_category_id: data.expense_category_id || null,
                payment_method: data.payment_method || null,
                description: data.description,
                reference_number: data.reference_number || null,
                transaction_date: data.transaction_date,
                related_entity_type: data.related_entity_type || null,
                related_entity_id: data.related_entity_id || null,
                status: data.status || 'completed',
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

        const { data: transaction, error: transactionError } = await supabase
            .from('cash_transactions')
            .insert({
                organization_id: profile.organization_id,
                transaction_type: data.transaction_type,
                amount: data.amount,
                currency: data.currency || 'PKR',
                expense_category_id: data.expense_category_id || null,
                payment_method: data.payment_method || null,
                description: data.description,
                reference_number: data.reference_number || null,
                transaction_date: data.transaction_date,
                related_entity_type: data.related_entity_type || null,
                related_entity_id: data.related_entity_id || null,
                status: data.status || 'completed',
                notes: data.notes || null,
                created_by: user.id,
            })
            .select()
            .single();

        if (transactionError) {
            console.error('Error creating cash transaction:', transactionError);
            return { data: null, error: transactionError.message };
        }

        revalidatePath('/dashboard/cash-flow');
        return { data: transaction, error: null };
    } catch (err) {
        console.error('Error in createCashTransaction:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to create cash transaction.',
        };
    }
}

export async function updateCashTransaction(
    id: string,
    data: Partial<CashTransactionFormData>
): Promise<{ data: CashTransaction | null; error: string | null }> {
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

        const updateData: any = {};
        if (data.transaction_type !== undefined) updateData.transaction_type = data.transaction_type;
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.currency !== undefined) updateData.currency = data.currency;
        if (data.expense_category_id !== undefined) updateData.expense_category_id = data.expense_category_id;
        if (data.payment_method !== undefined) updateData.payment_method = data.payment_method;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.reference_number !== undefined) updateData.reference_number = data.reference_number;
        if (data.transaction_date !== undefined) updateData.transaction_date = data.transaction_date;
        if (data.related_entity_type !== undefined) updateData.related_entity_type = data.related_entity_type;
        if (data.related_entity_id !== undefined) updateData.related_entity_id = data.related_entity_id;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.notes !== undefined) updateData.notes = data.notes;

        const { data: transaction, error: transactionError } = await supabase
            .from('cash_transactions')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .select()
            .single();

        if (transactionError) {
            console.error('Error updating cash transaction:', transactionError);
            return { data: null, error: transactionError.message };
        }

        revalidatePath('/dashboard/cash-flow');
        return { data: transaction, error: null };
    } catch (err) {
        console.error('Error in updateCashTransaction:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to update cash transaction.',
        };
    }
}

export async function deleteCashTransaction(id: string): Promise<{ error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { error: 'No organization found' };
        }

        const { error } = await supabase
            .from('cash_transactions')
            .delete()
            .eq('id', id)
            .eq('organization_id', profile.organization_id);

        if (error) {
            console.error('Error deleting cash transaction:', error);
            return { error: error.message };
        }

        revalidatePath('/dashboard/cash-flow');
        return { error: null };
    } catch (err) {
        console.error('Error in deleteCashTransaction:', err);
        return {
            error: err instanceof Error ? err.message : 'Failed to delete cash transaction.',
        };
    }
}

// =============================================================================
// TIME-BASED CASH FLOW DATA FOR CHARTS
// =============================================================================

export interface TimeSeriesDataPoint {
    date: string;
    cash_in: number;
    cash_out: number;
    expenses: number;
    balance: number;
}

export interface CategoryExpenseData {
    category_id: string;
    category_name: string;
    category_color: string;
    total_amount: number;
    transaction_count: number;
}

export async function getCashFlowTimeSeries(
    period: 'daily' | 'weekly' | 'monthly',
    startDate?: string,
    endDate?: string
): Promise<{ data: TimeSeriesDataPoint[] | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            // Generate mock time series data
            const mockData: TimeSeriesDataPoint[] = [];
            const now = new Date();
            const days = period === 'daily' ? 30 : period === 'weekly' ? 12 : 12;
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now);
                if (period === 'daily') {
                    date.setDate(date.getDate() - i);
                } else if (period === 'weekly') {
                    date.setDate(date.getDate() - (i * 7));
                } else {
                    date.setMonth(date.getMonth() - i);
                }
                
                mockData.push({
                    date: date.toISOString().split('T')[0],
                    cash_in: Math.floor(Math.random() * 500000) + 100000,
                    cash_out: Math.floor(Math.random() * 200000) + 50000,
                    expenses: Math.floor(Math.random() * 100000) + 20000,
                    balance: Math.floor(Math.random() * 5000000) + 2000000,
                });
            }
            
            return { data: mockData, error: null };
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

        // Calculate date range
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : (() => {
            const s = new Date(end);
            if (period === 'daily') s.setDate(s.getDate() - 30);
            else if (period === 'weekly') s.setDate(s.getDate() - 84); // 12 weeks
            else s.setMonth(s.getMonth() - 12); // 12 months
            return s;
        })();

        // Fetch transactions in date range
        let query = supabase
            .from('cash_transactions')
            .select('transaction_type, amount, transaction_date')
            .eq('organization_id', profile.organization_id)
            .gte('transaction_date', start.toISOString().split('T')[0])
            .lte('transaction_date', end.toISOString().split('T')[0])
            .order('transaction_date', { ascending: true });

        const { data: transactions, error } = await query;

        if (error) {
            console.error('Error fetching time series data:', error);
            return { data: null, error: error.message };
        }

        // Group transactions by period
        const grouped: Record<string, { cash_in: number; cash_out: number; expenses: number }> = {};
        let runningBalance = 0;

        transactions?.forEach((tx: any) => {
            const date = new Date(tx.transaction_date);
            let key: string;
            
            if (period === 'daily') {
                key = date.toISOString().split('T')[0];
            } else if (period === 'weekly') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
                key = weekStart.toISOString().split('T')[0];
            } else {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!grouped[key]) {
                grouped[key] = { cash_in: 0, cash_out: 0, expenses: 0 };
            }

            if (tx.transaction_type === 'cash_in') {
                grouped[key].cash_in += tx.amount;
                runningBalance += tx.amount;
            } else if (tx.transaction_type === 'cash_out') {
                grouped[key].cash_out += tx.amount;
                runningBalance -= tx.amount;
            } else if (tx.transaction_type === 'expense') {
                grouped[key].expenses += tx.amount;
                runningBalance -= tx.amount;
            }
        });

        // Convert to array and calculate balances
        const result: TimeSeriesDataPoint[] = [];
        let balance = 0;

        // Get initial balance before start date
        const { data: balanceData } = await supabase.rpc('get_cash_balance', {
            p_org_id: profile.organization_id,
        });
        balance = (balanceData || 0) - (transactions?.reduce((sum: number, tx: any) => {
            if (tx.transaction_type === 'cash_in') return sum + tx.amount;
            return sum - tx.amount;
        }, 0) || 0);

        const sortedKeys = Object.keys(grouped).sort();
        sortedKeys.forEach((key) => {
            const group = grouped[key];
            balance += group.cash_in - group.cash_out - group.expenses;
            result.push({
                date: key,
                cash_in: group.cash_in,
                cash_out: group.cash_out,
                expenses: group.expenses,
                balance: balance,
            });
        });

        return { data: result, error: null };
    } catch (err) {
        console.error('Error in getCashFlowTimeSeries:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch time series data.',
        };
    }
}

export async function getExpenseByCategory(
    startDate?: string,
    endDate?: string
): Promise<{ data: CategoryExpenseData[] | null; error: string | null }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
            !supabaseUrl ||
            !supabaseAnonKey ||
            supabaseUrl.includes('your-project-id.supabase.co')
        ) {
            const mockData: CategoryExpenseData[] = [
                {
                    category_id: 'mock-cat-1',
                    category_name: 'Rent',
                    category_color: '#ef4444',
                    total_amount: 150000,
                    transaction_count: 3,
                },
                {
                    category_id: 'mock-cat-2',
                    category_name: 'Utilities',
                    category_color: '#f59e0b',
                    total_amount: 75000,
                    transaction_count: 5,
                },
                {
                    category_id: 'mock-cat-3',
                    category_name: 'Staff Salary',
                    category_color: '#3b82f6',
                    total_amount: 200000,
                    transaction_count: 2,
                },
            ];
            return { data: mockData, error: null };
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

        let query = supabase
            .from('cash_transactions')
            .select(`
                amount,
                expense_category_id,
                expense_categories!inner(id, name, color)
            `)
            .eq('organization_id', profile.organization_id)
            .eq('transaction_type', 'expense')
            .not('expense_category_id', 'is', null);

        if (startDate) {
            query = query.gte('transaction_date', startDate);
        }
        if (endDate) {
            query = query.lte('transaction_date', endDate);
        }

        const { data: transactions, error } = await query;

        if (error) {
            console.error('Error fetching expense by category:', error);
            return { data: null, error: error.message };
        }

        // Group by category
        const grouped: Record<string, CategoryExpenseData> = {};
        
        transactions?.forEach((tx: any) => {
            const cat = tx.expense_categories;
            if (!cat) return;
            
            if (!grouped[cat.id]) {
                grouped[cat.id] = {
                    category_id: cat.id,
                    category_name: cat.name,
                    category_color: cat.color,
                    total_amount: 0,
                    transaction_count: 0,
                };
            }
            
            grouped[cat.id].total_amount += tx.amount;
            grouped[cat.id].transaction_count += 1;
        });

        return {
            data: Object.values(grouped).sort((a, b) => b.total_amount - a.total_amount),
            error: null,
        };
    } catch (err) {
        console.error('Error in getExpenseByCategory:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch expense by category.',
        };
    }
}
