"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type {
  PlatformAuditLog,
  PlatformEmailTemplate,
  PlatformPublicSettings,
  PlatformSettings,
  PlatformSubscriptionPlan,
} from "@/lib/types/database";

type PlatformStats = {
  total_organizations: number;
  active_subscriptions: number;
  total_users: number;
  total_vehicles: number;
  total_leads: number;
  active_leads: number;
  total_deals: number;
  completed_deals: number;
  total_revenue: number;
};

function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

async function requireSuperAdmin(): Promise<void> {
  // NOTE: Supabase generated types are not fully wired up yet in this repo.
  // Cast to avoid blocking builds with `never` inference for select strings.
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

  // If RLS blocks reading the profile row (common misconfiguration), fall back to
  // the SECURITY DEFINER function so real super admins aren't denied.
  if (error || profile?.role !== "super_admin") {
    try {
      const { data, error: rpcError } = await supabase.rpc("is_super_admin");
      if (!rpcError && data === true) return;
    } catch {
      // ignore and throw below
    }

    if (error) throw new Error(error.message);
    throw new Error("Forbidden");
  }
}

export async function getPlatformStatsAdmin(): Promise<{
  data: PlatformStats | null;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const countOrThrow = async (
      q: Promise<{ count: number | null; error: unknown }>
    ) => {
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    };

    const total_organizations = await countOrThrow(
      admin.from("organizations").select("id", { count: "exact", head: true })
    );
    const active_subscriptions = await countOrThrow(
      admin
        .from("organizations")
        .select("id", { count: "exact", head: true })
        .eq("subscription_status", "active")
    );
    const total_users = await countOrThrow(
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .neq("role", "super_admin")
    );
    const total_vehicles = await countOrThrow(
      admin.from("vehicles").select("id", { count: "exact", head: true })
    );
    const total_leads = await countOrThrow(
      admin.from("leads").select("id", { count: "exact", head: true })
    );
    const active_leads = await countOrThrow(
      admin
        .from("leads")
        .select("id", { count: "exact", head: true })
        .in("status", ["new", "contacted", "qualified", "negotiating"])
    );
    const total_deals = await countOrThrow(
      admin.from("deals").select("id", { count: "exact", head: true })
    );
    const completed_deals = await countOrThrow(
      admin
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
    );

    // Revenue: try deals.sale_price, otherwise 0
    let total_revenue = 0;
    try {
      const { data: deals, error } = await admin
        .from("deals")
        .select("sale_price")
        .eq("status", "completed");
      if (!error && Array.isArray(deals)) {
        total_revenue = deals.reduce(
          (sum, d) => sum + Number(d.sale_price ?? 0),
          0
        );
      }
    } catch {
      total_revenue = 0;
    }

    return {
      data: {
        total_organizations,
        active_subscriptions,
        total_users,
        total_vehicles,
        total_leads,
        active_leads,
        total_deals,
        completed_deals,
        total_revenue,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Failed to load platform stats",
    };
  }
}

export async function getRecentOrganizationsAdmin(): Promise<{
  data: Array<{
    id: string;
    name: string;
    city: string | null;
    created_at: string;
  }>;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const { data, error } = await admin
      .from("organizations")
      .select("id, name, city, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) return { data: [], error: error.message };
    return {
      data: (data ?? []) as Array<{
        id: string;
        name: string;
        city: string | null;
        created_at: string;
      }>,
      error: null,
    };
  } catch (err) {
    return {
      data: [],
      error:
        err instanceof Error
          ? err.message
          : "Failed to load recent organizations",
    };
  }
}

async function insertPlatformAuditLog(params: {
  actor_user_id: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = (await createClient()) as any;
    await supabase.from("platform_audit_logs").insert({
      actor_user_id: params.actor_user_id,
      action: params.action,
      entity_type: params.entity_type ?? null,
      entity_id: params.entity_id ?? null,
      details: params.details ?? {},
    });
  } catch {
    // best-effort; audit logging should not break admin flows
  }
}

export async function getPlatformPublicSettingsAdmin(): Promise<{
  data: PlatformPublicSettings | null;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const supabase = (await createClient()) as any;
    const { data, error } = await supabase
      .from("platform_public_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data: data ?? null, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Failed to load platform settings",
    };
  }
}

export async function updatePlatformPublicSettingsAdmin(input: {
  maintenance_mode?: boolean;
  maintenance_message?: string | null;
  brand_name?: string | null;
  brand_primary_color?: string | null;
  brand_secondary_color?: string | null;
}): Promise<{ data: PlatformPublicSettings | null; error: string | null }> {
  try {
    await requireSuperAdmin();
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const updateData = pruneUndefined(input);

    const { data, error } = await supabase
      .from("platform_public_settings")
      .update(updateData)
      .eq("id", 1)
      .select("*")
      .maybeSingle();

    if (error) return { data: null, error: error.message };

    await insertPlatformAuditLog({
      actor_user_id: user?.id ?? null,
      action: "platform_public_settings.update",
      entity_type: "platform_public_settings",
      entity_id: null,
      details: updateData,
    });

    revalidatePath("/admin/settings");
    return { data: data ?? null, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Failed to update platform settings",
    };
  }
}

export async function getPlatformSettingsAdmin(): Promise<{
  data: PlatformSettings | null;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const supabase = (await createClient()) as any;
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data: data ?? null, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Failed to load platform settings",
    };
  }
}

export async function updatePlatformSettingsAdmin(
  input: Partial<
    Pick<
      PlatformSettings,
      | "default_currency"
      | "default_country"
      | "default_timezone"
      | "session_timeout_minutes"
      | "support_email"
    >
  >
): Promise<{ data: PlatformSettings | null; error: string | null }> {
  try {
    await requireSuperAdmin();
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const updateData = pruneUndefined(input);

    const { data, error } = await supabase
      .from("platform_settings")
      .update(updateData)
      .eq("id", 1)
      .select("*")
      .maybeSingle();
    if (error) return { data: null, error: error.message };

    await insertPlatformAuditLog({
      actor_user_id: user?.id ?? null,
      action: "platform_settings.update",
      entity_type: "platform_settings",
      entity_id: null,
      details: updateData,
    });

    revalidatePath("/admin/settings");
    return { data: data ?? null, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Failed to update platform settings",
    };
  }
}

export async function listPlatformEmailTemplatesAdmin(): Promise<{
  data: PlatformEmailTemplate[];
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const supabase = (await createClient()) as any;
    const { data, error } = await supabase
      .from("platform_email_templates")
      .select("*")
      .order("name", { ascending: true });
    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error:
        err instanceof Error ? err.message : "Failed to load email templates",
    };
  }
}

export async function updatePlatformEmailTemplateAdmin(input: {
  id: string;
  name?: string;
  subject?: string;
  body?: string;
  is_enabled?: boolean;
}): Promise<{ data: PlatformEmailTemplate | null; error: string | null }> {
  try {
    await requireSuperAdmin();
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { id, ...rest } = input;
    const updateData = pruneUndefined(rest);

    const { data, error } = await supabase
      .from("platform_email_templates")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return { data: null, error: error.message };

    await insertPlatformAuditLog({
      actor_user_id: user?.id ?? null,
      action: "platform_email_templates.update",
      entity_type: "platform_email_templates",
      entity_id: id,
      details: updateData,
    });

    revalidatePath("/admin/settings");
    return { data: data ?? null, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Failed to update email template",
    };
  }
}

export async function listPlatformSubscriptionPlansAdmin(): Promise<{
  data: PlatformSubscriptionPlan[];
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const supabase = (await createClient()) as any;
    const { data, error } = await supabase
      .from("platform_subscription_plans")
      .select("*")
      .order("name", { ascending: true });
    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error:
        err instanceof Error
          ? err.message
          : "Failed to load subscription plans",
    };
  }
}

export async function upsertPlatformSubscriptionPlanAdmin(input: {
  id?: string;
  code: string;
  name: string;
  price: number;
  currency: string;
  billing_period: "monthly" | "yearly";
  limits: Record<string, unknown>;
  is_active: boolean;
}): Promise<{ data: PlatformSubscriptionPlan | null; error: string | null }> {
  try {
    await requireSuperAdmin();
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      code: input.code,
      name: input.name,
      price: input.price,
      currency: input.currency,
      billing_period: input.billing_period,
      limits: input.limits ?? {},
      is_active: input.is_active,
    };

    const q = input.id
      ? supabase
          .from("platform_subscription_plans")
          .update(payload)
          .eq("id", input.id)
          .select("*")
          .maybeSingle()
      : supabase
          .from("platform_subscription_plans")
          .insert(payload)
          .select("*")
          .maybeSingle();

    const { data, error } = await q;
    if (error) return { data: null, error: error.message };
    const saved = data ?? null;

    await insertPlatformAuditLog({
      actor_user_id: user?.id ?? null,
      action: input.id
        ? "platform_subscription_plans.update"
        : "platform_subscription_plans.create",
      entity_type: "platform_subscription_plans",
      entity_id: saved?.id ?? input.id ?? null,
      details: payload,
    });

    revalidatePath("/admin/settings");
    return { data: saved, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Failed to save subscription plan",
    };
  }
}

export async function listPlatformAuditLogsAdmin(params?: {
  limit?: number;
}): Promise<{ data: PlatformAuditLog[]; error: string | null }> {
  try {
    await requireSuperAdmin();
    const supabase = (await createClient()) as any;
    const limit = Math.max(1, Math.min(params?.limit ?? 50, 200));
    const { data, error } = await supabase
      .from("platform_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to load audit logs",
    };
  }
}

export async function getRevenueTrendAdmin(params?: {
  months?: number;
}): Promise<{
  data: Array<{ month: string; revenue: number }>;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const months = Math.max(1, Math.min(params?.months ?? 6, 24));
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const { data: deals, error } = await admin
      .from("deals")
      .select("deal_date, sale_price")
      .eq("status", "completed")
      .gte("deal_date", start.toISOString());
    if (error) return { data: [], error: error.message };

    const monthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = (d: Date) => d.toLocaleString("en-US", { month: "short" });

    const buckets = new Map<string, { month: string; revenue: number }>();
    for (let i = 0; i < months; i++) {
      const dt = new Date(start.getFullYear(), start.getMonth() + i, 1);
      buckets.set(monthKey(dt), { month: label(dt), revenue: 0 });
    }

    for (const row of deals ?? []) {
      const dt = row?.deal_date ? new Date(row.deal_date) : null;
      if (!dt) continue;
      const key = monthKey(new Date(dt.getFullYear(), dt.getMonth(), 1));
      const b = buckets.get(key);
      if (!b) continue;
      b.revenue += Number(row.sale_price ?? 0);
    }

    return { data: Array.from(buckets.values()), error: null };
  } catch (err) {
    return {
      data: [],
      error:
        err instanceof Error ? err.message : "Failed to load revenue trend",
    };
  }
}

export async function getInventoryByTypeAdmin(): Promise<{
  data: Array<{ type: string; count: number }>;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient() as any;

    // Prefer view added by migration 021
    const { data: viewRows, error: viewError } = await admin
      .from("platform_inventory_by_type")
      .select("type, count");

    if (!viewError && Array.isArray(viewRows)) {
      return { data: viewRows as any, error: null };
    }

    // Fallback: aggregate in JS (works even if view isn't created yet)
    const { data: vehicles, error } = await admin
      .from("vehicles")
      .select("body_type");
    if (error) return { data: [], error: error.message };

    const label = (v: string | null) => {
      switch (v) {
        case "sedan":
          return "Sedan";
        case "suv":
          return "SUV";
        case "hatchback":
          return "Hatchback";
        case "truck":
          return "Truck";
        case "van":
          return "Van";
        case "other":
          return "Other";
        default:
          return "Unknown";
      }
    };

    const map = new Map<string, number>();
    for (const row of vehicles ?? []) {
      const t = label(row?.body_type ?? null);
      map.set(t, (map.get(t) ?? 0) + 1);
    }

    const data = Array.from(map.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return { data, error: null };
  } catch (err) {
    return {
      data: [],
      error:
        err instanceof Error
          ? err.message
          : "Failed to load inventory breakdown",
    };
  }
}

export async function getPendingActionsAdmin(): Promise<{
  data: { pending_payment_verifications: number; renewals_due_7d: number };
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const countOrThrow = async (
      q: Promise<{ count: number | null; error: unknown }>
    ) => {
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    };

    const pending_payment_verifications = await countOrThrow(
      admin
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
    );

    const now = new Date();
    const due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const renewals_due_7d = await countOrThrow(
      admin
        .from("organizations")
        .select("id", { count: "exact", head: true })
        .eq("subscription_status", "active")
        .not("subscription_expires_at", "is", null)
        .lte("subscription_expires_at", due.toISOString())
    );

    return {
      data: { pending_payment_verifications, renewals_due_7d },
      error: null,
    };
  } catch (err) {
    return {
      data: { pending_payment_verifications: 0, renewals_due_7d: 0 },
      error:
        err instanceof Error ? err.message : "Failed to load pending actions",
    };
  }
}

export async function getPendingPaymentsAdmin(params?: {
  limit?: number;
}): Promise<{
  data: Array<{
    id: string;
    organization_id: string;
    organization_name: string | null;
    amount: number;
    currency: string;
    payment_method: string;
    created_at: string;
  }>;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient() as any;
    const limit = Math.max(1, Math.min(params?.limit ?? 5, 20));

    const { data, error } = await admin
      .from("payments")
      .select(
        "id, organization_id, amount, currency, payment_method, created_at, organizations(name)"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { data: [], error: error.message };

    const rows =
      (data ?? []).map((r: any) => ({
        id: r.id,
        organization_id: r.organization_id,
        organization_name: r.organizations?.name ?? null,
        amount: Number(r.amount ?? 0),
        currency: r.currency ?? "PKR",
        payment_method: r.payment_method ?? "-",
        created_at: r.created_at,
      })) ?? [];

    return { data: rows, error: null };
  } catch (err) {
    return {
      data: [],
      error:
        err instanceof Error ? err.message : "Failed to load pending payments",
    };
  }
}

export async function getOrganizationsTrendAdmin(params?: {
  months?: number;
}): Promise<{
  data: Array<{ month: string; count: number }>;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const months = Math.max(1, Math.min(params?.months ?? 6, 24));
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const { data: orgs, error } = await admin
      .from("organizations")
      .select("created_at")
      .gte("created_at", start.toISOString());
    if (error) return { data: [], error: error.message };

    const monthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = (d: Date) => d.toLocaleString("en-US", { month: "short" });
    const buckets = new Map<string, { month: string; count: number }>();
    for (let i = 0; i < months; i++) {
      const dt = new Date(start.getFullYear(), start.getMonth() + i, 1);
      buckets.set(monthKey(dt), { month: label(dt), count: 0 });
    }
    for (const r of orgs ?? []) {
      const dt = r?.created_at ? new Date(r.created_at) : null;
      if (!dt) continue;
      const key = monthKey(new Date(dt.getFullYear(), dt.getMonth(), 1));
      const b = buckets.get(key);
      if (!b) continue;
      b.count += 1;
    }

    return { data: Array.from(buckets.values()), error: null };
  } catch (err) {
    return {
      data: [],
      error:
        err instanceof Error
          ? err.message
          : "Failed to load organization trend",
    };
  }
}

export async function getLeadsTrendAdmin(params?: {
  months?: number;
}): Promise<{
  data: Array<{ month: string; count: number }>;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const months = Math.max(1, Math.min(params?.months ?? 6, 24));
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const { data: leads, error } = await admin
      .from("leads")
      .select("created_at")
      .gte("created_at", start.toISOString());
    if (error) return { data: [], error: error.message };

    const monthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = (d: Date) => d.toLocaleString("en-US", { month: "short" });
    const buckets = new Map<string, { month: string; count: number }>();
    for (let i = 0; i < months; i++) {
      const dt = new Date(start.getFullYear(), start.getMonth() + i, 1);
      buckets.set(monthKey(dt), { month: label(dt), count: 0 });
    }
    for (const r of leads ?? []) {
      const dt = r?.created_at ? new Date(r.created_at) : null;
      if (!dt) continue;
      const key = monthKey(new Date(dt.getFullYear(), dt.getMonth(), 1));
      const b = buckets.get(key);
      if (!b) continue;
      b.count += 1;
    }

    return { data: Array.from(buckets.values()), error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to load leads trend",
    };
  }
}

export async function getSubscriptionBreakdownAdmin(): Promise<{
  data: { byStatus: Record<string, number>; byPlan: Record<string, number> };
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient() as any;

    const countOrThrow = async (
      q: Promise<{ count: number | null; error: unknown }>
    ) => {
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    };

    const statuses = ["trial", "active", "suspended", "cancelled"] as const;
    const plans = ["basic", "professional", "enterprise"] as const;

    const byStatus: Record<string, number> = {};
    for (const s of statuses) {
      byStatus[s] = await countOrThrow(
        admin
          .from("organizations")
          .select("id", { count: "exact", head: true })
          .eq("subscription_status", s)
      );
    }

    const byPlan: Record<string, number> = {};
    for (const p of plans) {
      byPlan[p] = await countOrThrow(
        admin
          .from("organizations")
          .select("id", { count: "exact", head: true })
          .eq("subscription_plan", p)
      );
    }

    return { data: { byStatus, byPlan }, error: null };
  } catch (err) {
    return {
      data: {
        byStatus: { trial: 0, active: 0, suspended: 0, cancelled: 0 },
        byPlan: { basic: 0, professional: 0, enterprise: 0 },
      },
      error:
        err instanceof Error
          ? err.message
          : "Failed to load subscription breakdown",
    };
  }
}
