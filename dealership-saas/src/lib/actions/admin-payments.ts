"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PaymentRow = {
  id: string;
  organization_id: string;
  amount: number;
  currency: string | null;
  payment_method: string | null;
  status: "pending" | "completed" | "failed" | "refunded";
  transaction_id: string | null;
  external_reference: string | null;
  subscription_plan: string | null;
  period_start: string | null;
  period_end: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

async function requireSuperAdmin(): Promise<{ userId: string }> {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "super_admin") {
    // Fall back to SECURITY DEFINER function (robust against RLS edge cases)
    try {
      const { data, error: rpcError } = await supabase.rpc("is_super_admin");
      if (!rpcError && data === true) return { userId: user.id };
    } catch {
      // ignore
    }
    throw new Error("Forbidden");
  }

  return { userId: user.id };
}

async function insertPlatformAudit(params: {
  actor_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details?: Record<string, unknown>;
}) {
  try {
    const supabase = (await createClient()) as any;
    await supabase.from("platform_audit_logs").insert({
      actor_user_id: params.actor_user_id,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      details: params.details ?? {},
    });
  } catch {
    // best-effort
  }
}

export async function listPaymentsAdmin(params?: {
  status?: PaymentRow["status"] | "all";
  query?: string;
  limit?: number;
}): Promise<{
  data: Array<
    PaymentRow & {
      organization_name: string | null;
      organization_city: string | null;
      organization_plan: string | null;
      organization_expires_at: string | null;
    }
  >;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const limit = Math.max(1, Math.min(params?.limit ?? 50, 200));
    const status = params?.status ?? "all";
    const query = (params?.query ?? "").trim();

    let q = admin
      .from("payments")
      .select(
        "id, organization_id, amount, currency, payment_method, status, transaction_id, external_reference, subscription_plan, period_start, period_end, verified_by, verified_at, notes, created_at, updated_at, organizations(name, city, subscription_plan, subscription_expires_at)"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status !== "all") q = q.eq("status", status);

    // Basic search support (transaction/external refs). Organization name search is handled client-side fallback.
    if (query) {
      q = q.or(
        `transaction_id.ilike.%${query}%,external_reference.ilike.%${query}%`
      );
    }

    const { data, error } = await q;
    if (error) return { data: [], error: error.message };

    const rows =
      (data ?? []).map((r: any) => ({
        ...(r as PaymentRow),
        organization_name: r.organizations?.name ?? null,
        organization_city: r.organizations?.city ?? null,
        organization_plan: r.organizations?.subscription_plan ?? null,
        organization_expires_at:
          r.organizations?.subscription_expires_at ?? null,
      })) ?? [];

    // If query provided, also filter by org name locally (since Supabase join ilike is awkward without RPC/view)
    const filtered = query
      ? rows.filter((r: any) => {
          const hay =
            `${r.organization_name ?? ""} ${r.organization_city ?? ""}`.toLowerCase();
          return (
            hay.includes(query.toLowerCase()) ||
            String(r.organization_id).includes(query)
          );
        })
      : rows;

    return { data: filtered, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to load payments",
    };
  }
}

export async function getPaymentsStatsAdmin(): Promise<{
  data: {
    total_payments: number;
    total_amount: number;
    completed_payments: number;
    completed_amount: number;
    pending_payments: number;
    pending_amount: number;
    failed_payments: number;
    failed_amount: number;
    refunded_payments: number;
    refunded_amount: number;
    org_active: number;
    org_trial: number;
    org_suspended: number;
    org_cancelled: number;
  } | null;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const { data: payments, error: payErr } = await admin
      .from("payments")
      .select("status, amount")
      .order("created_at", { ascending: false });

    if (payErr) {
      return { data: null, error: payErr.message };
    }

    const stats = {
      total_payments: 0,
      total_amount: 0,
      completed_payments: 0,
      completed_amount: 0,
      pending_payments: 0,
      pending_amount: 0,
      failed_payments: 0,
      failed_amount: 0,
      refunded_payments: 0,
      refunded_amount: 0,
      org_active: 0,
      org_trial: 0,
      org_suspended: 0,
      org_cancelled: 0,
    };

    (payments ?? []).forEach((p: any) => {
      const amountNum = Number(p.amount ?? 0);
      stats.total_payments += 1;
      stats.total_amount += amountNum;
      switch (p.status) {
        case "completed":
          stats.completed_payments += 1;
          stats.completed_amount += amountNum;
          break;
        case "pending":
          stats.pending_payments += 1;
          stats.pending_amount += amountNum;
          break;
        case "failed":
          stats.failed_payments += 1;
          stats.failed_amount += amountNum;
          break;
        case "refunded":
          stats.refunded_payments += 1;
          stats.refunded_amount += amountNum;
          break;
        default:
          break;
      }
    });

    const { data: orgs, error: orgErr } = await admin
      .from("organizations")
      .select("subscription_status");

    if (!orgErr && orgs) {
      (orgs as any[]).forEach((o) => {
        switch (o.subscription_status) {
          case "active":
            stats.org_active += 1;
            break;
          case "trial":
            stats.org_trial += 1;
            break;
          case "suspended":
            stats.org_suspended += 1;
            break;
          case "cancelled":
            stats.org_cancelled += 1;
            break;
          default:
            break;
        }
      });
    }

    return { data: stats, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Failed to load payments stats",
    };
  }
}

export async function getOrganizationPaymentsAdmin(params: {
  organizationId: string;
}): Promise<{
  data: PaymentRow[];
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const { data, error } = await admin
      .from("payments")
      .select("*")
      .eq("organization_id", params.organizationId)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as PaymentRow[], error: null };
  } catch (err) {
    return {
      data: [],
      error:
        err instanceof Error
          ? err.message
          : "Failed to load organization payments",
    };
  }
}

export async function getOrganizationPaymentsStatsAdmin(params: {
  organizationId: string;
}): Promise<{
  data: {
    total_payments: number;
    total_amount: number;
    completed_payments: number;
    completed_amount: number;
    pending_payments: number;
    pending_amount: number;
    failed_payments: number;
    failed_amount: number;
    refunded_payments: number;
    refunded_amount: number;
    first_payment_at: string | null;
    last_payment_at: string | null;
  } | null;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const { data, error } = await admin
      .from("payments")
      .select("status, amount, created_at")
      .eq("organization_id", params.organizationId)
      .order("created_at", { ascending: true });

    if (error) return { data: null, error: error.message };

    const stats = {
      total_payments: 0,
      total_amount: 0,
      completed_payments: 0,
      completed_amount: 0,
      pending_payments: 0,
      pending_amount: 0,
      failed_payments: 0,
      failed_amount: 0,
      refunded_payments: 0,
      refunded_amount: 0,
      first_payment_at: null as string | null,
      last_payment_at: null as string | null,
    };

    const rows = (data ?? []) as any[];
    if (rows.length === 0) {
      return { data: stats, error: null };
    }

    stats.first_payment_at = rows[0].created_at ?? null;
    stats.last_payment_at = rows[rows.length - 1].created_at ?? null;

    rows.forEach((p) => {
      const amountNum = Number(p.amount ?? 0);
      stats.total_payments += 1;
      stats.total_amount += amountNum;
      switch (p.status) {
        case "completed":
          stats.completed_payments += 1;
          stats.completed_amount += amountNum;
          break;
        case "pending":
          stats.pending_payments += 1;
          stats.pending_amount += amountNum;
          break;
        case "failed":
          stats.failed_payments += 1;
          stats.failed_amount += amountNum;
          break;
        case "refunded":
          stats.refunded_payments += 1;
          stats.refunded_amount += amountNum;
          break;
        default:
          break;
      }
    });

    return { data: stats, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Failed to load organization payment stats",
    };
  }
}

export async function verifyPaymentAdmin(input: {
  payment_id: string;
  notes?: string;
  period_start?: string; // ISO
  period_end?: string; // ISO
  subscription_plan?: "basic" | "professional" | "enterprise";
}): Promise<{ error: string | null }> {
  try {
    const { userId } = await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const { data: payment, error: payErr } = await admin
      .from("payments")
      .select("*")
      .eq("id", input.payment_id)
      .single();
    if (payErr) return { error: payErr.message };
    const p = payment as PaymentRow;

    const start = input.period_start
      ? new Date(input.period_start)
      : new Date();
    const end = input.period_end
      ? new Date(input.period_end)
      : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (!(end.getTime() > start.getTime())) {
      return { error: "Period end must be after period start" };
    }

    const subscription_plan =
      input.subscription_plan ?? (p.subscription_plan as any) ?? null;

    const { error: updErr } = await admin
      .from("payments")
      .update({
        status: "completed",
        verified_by: userId,
        verified_at: new Date().toISOString(),
        notes: input.notes ?? p.notes ?? null,
        period_start: start.toISOString(),
        period_end: end.toISOString(),
        subscription_plan,
      })
      .eq("id", input.payment_id);
    if (updErr) return { error: updErr.message };

    // Activate subscription for organization
    const { error: orgErr } = await admin
      .from("organizations")
      .update({
        subscription_status: "active",
        subscription_plan: subscription_plan ?? undefined,
        subscription_expires_at: end.toISOString(),
      })
      .eq("id", p.organization_id);
    if (orgErr) return { error: orgErr.message };

    await insertPlatformAudit({
      actor_user_id: userId,
      action: "payments.verify",
      entity_type: "payments",
      entity_id: input.payment_id,
      details: {
        organization_id: p.organization_id,
        period_start: start.toISOString(),
        period_end: end.toISOString(),
        subscription_plan,
      },
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin");
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to verify payment",
    };
  }
}

export async function rejectPaymentAdmin(input: {
  payment_id: string;
  notes?: string;
}): Promise<{ error: string | null }> {
  try {
    const { userId } = await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const { data: payment, error: payErr } = await admin
      .from("payments")
      .select("id, organization_id, notes")
      .eq("id", input.payment_id)
      .single();
    if (payErr) return { error: payErr.message };

    const { error } = await admin
      .from("payments")
      .update({
        status: "failed",
        verified_by: userId,
        verified_at: new Date().toISOString(),
        notes: input.notes ?? payment.notes ?? null,
      })
      .eq("id", input.payment_id);
    if (error) return { error: error.message };

    await insertPlatformAudit({
      actor_user_id: userId,
      action: "payments.reject",
      entity_type: "payments",
      entity_id: input.payment_id,
      details: { organization_id: payment.organization_id },
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin");
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to reject payment",
    };
  }
}

export async function refundPaymentAdmin(input: {
  payment_id: string;
  notes?: string;
}): Promise<{ error: string | null }> {
  try {
    const { userId } = await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const { data: payment, error: payErr } = await admin
      .from("payments")
      .select("id, organization_id, notes")
      .eq("id", input.payment_id)
      .single();
    if (payErr) return { error: payErr.message };

    const { error } = await admin
      .from("payments")
      .update({
        status: "refunded",
        verified_by: userId,
        verified_at: new Date().toISOString(),
        notes: input.notes ?? payment.notes ?? null,
      })
      .eq("id", input.payment_id);
    if (error) return { error: error.message };

    await insertPlatformAudit({
      actor_user_id: userId,
      action: "payments.refund",
      entity_type: "payments",
      entity_id: input.payment_id,
      details: { organization_id: payment.organization_id },
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin");
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to refund payment",
    };
  }
}
