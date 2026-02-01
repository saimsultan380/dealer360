'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { FinancingLoan, EMIPayment } from '@/lib/types/database';

async function getOrgCtxOrThrow() {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  let organization_id = profile?.organization_id ?? null;

  // Self-heal profile if missing org_id (using service role)
  if (!organization_id) {
    const metaOrgId =
      (user.user_metadata as any)?.organization_id ??
      (user.app_metadata as any)?.organization_id ??
      null;
    if (!metaOrgId) throw new Error('No organization found');

    const admin = createAdminClient() as any;
    await admin
      .from('profiles')
      .upsert(
        [
          {
            id: user.id,
            organization_id: metaOrgId,
            email: user.email,
            full_name: (user.user_metadata as any)?.full_name ?? user.email ?? 'User',
            role: (user.user_metadata as any)?.role ?? 'admin',
            is_active: true,
          },
        ] as any,
        { onConflict: 'id' }
      );
    organization_id = metaOrgId;
  }

  return { supabase, user_id: user.id as string, organization_id: organization_id as string };
}

export async function getFinancingLoans(): Promise<{ data: FinancingLoan[]; error: string | null }> {
  try {
    const { supabase, organization_id } = await getOrgCtxOrThrow();
    const { data, error } = await supabase
      .from('financing_loans')
      .select('*')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false });
    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as FinancingLoan[], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to load financing loans' };
  }
}

export async function getFinancingLoanById(id: string): Promise<{ data: FinancingLoan | null; error: string | null }> {
  try {
    const { supabase, organization_id } = await getOrgCtxOrThrow();
    const { data, error } = await supabase
      .from('financing_loans')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as FinancingLoan, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to load financing loan' };
  }
}

export async function createFinancingLoan(input: any): Promise<{ data: FinancingLoan | null; error: string | null }> {
  try {
    const { supabase, organization_id } = await getOrgCtxOrThrow();

    // Basic EMI calculation (client uses utils for preview)
    const principal = Number(input.principal_amount ?? 0) - Number(input.down_payment ?? 0);
    const rate = Number(input.annual_interest_rate ?? 0) / 100 / 12;
    const months = Number(input.loan_tenure_months ?? 1);
    const pow = Math.pow(1 + rate, months);
    const emi_amount = rate > 0 ? (principal * rate * pow) / (pow - 1) : principal / months;

    const { data, error } = await supabase
      .from('financing_loans')
      .insert([
        {
          ...input,
          organization_id,
          emi_amount: Math.round(emi_amount * 100) / 100,
          status: 'active',
          loan_start_date: new Date().toISOString().split('T')[0],
        },
      ] as any)
      .select('*')
      .single();

    if (error) return { data: null, error: error.message };
    revalidatePath('/dashboard/financing');
    return { data: data as FinancingLoan, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create financing loan' };
  }
}

export async function getEMIPayments(loanId: string): Promise<{ data: EMIPayment[]; error: string | null }> {
  try {
    const { supabase, organization_id } = await getOrgCtxOrThrow();
    const { data, error } = await supabase
      .from('emi_payments')
      .select('*')
      .eq('financing_loan_id', loanId)
      .eq('organization_id', organization_id)
      .order('due_date', { ascending: true });
    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as EMIPayment[], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to load EMI payments' };
  }
}

export async function recordEMIPayment(
  paymentId: string,
  paidAmount: number,
  paymentMethod: string,
  transactionRef: string
): Promise<{ error: string | null }> {
  try {
    const { supabase, organization_id } = await getOrgCtxOrThrow();
    const { error } = await supabase
      .from('emi_payments')
      .update(
        {
          status: 'completed',
          paid_amount: paidAmount,
          payment_method: paymentMethod,
          transaction_reference: transactionRef,
          paid_date: new Date().toISOString().split('T')[0],
        } as any
      )
      .eq('id', paymentId)
      .eq('organization_id', organization_id);
    if (error) return { error: error.message };
    revalidatePath('/dashboard/financing');
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to record EMI payment' };
  }
}

