"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface OnboardOrganizationInput {
  orgName: string;
  city: string;
  orgPhone: string;
  orgEmail: string;
  subscriptionPlan: "basic" | "professional" | "enterprise";
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  /**
   * Temporary password set by super admin during onboarding.
   * The dealership admin can change it later from Dashboard → Settings.
   */
  adminTempPassword?: string;
  /** If true, sends Supabase invite email instead of setting a temporary password */
  sendInviteEmail?: boolean;
  /** Trial length in days (default: 30) */
  trialDays?: number;
  maxVehicles: string;
  maxUsers: string;
  ownerCnic?: string;
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `org-${Date.now()}`;
}

async function requireSuperAdminUserId(): Promise<string> {
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
      if (!rpcError && data === true) return user.id as string;
    } catch {
      // ignore
    }
    throw new Error("Forbidden");
  }

  return user.id as string;
}

const PLAN_PRICING: Record<
  OnboardOrganizationInput["subscriptionPlan"],
  { amount: number; currency: string }
> = {
  basic: { amount: 5000, currency: "PKR" },
  professional: { amount: 15000, currency: "PKR" },
  enterprise: { amount: 30000, currency: "PKR" },
};

export async function onboardOrganization(
  input: OnboardOrganizationInput
): Promise<{ success: boolean; error?: string; organizationId?: string }> {
  try {
    await requireSuperAdminUserId();
    const admin = createAdminClient() as any;

    const sendInvite = !!input.sendInviteEmail;
    if (
      !sendInvite &&
      (!input.adminTempPassword || input.adminTempPassword.length < 6)
    ) {
      return {
        success: false,
        error:
          "Temporary password must be at least 6 characters long (or use invite email).",
      };
    }

    const baseSlug = slugify(input.orgName.trim());
    // Ensure a unique slug (avoid common collisions like "abc-motors")
    let slug = baseSlug;
    try {
      const { data: existing } = await admin
        .from("organizations")
        .select("slug")
        .like("slug", `${baseSlug}%`)
        .limit(50);
      const used = new Set((existing ?? []).map((r: any) => String(r.slug)));
      if (used.has(slug)) {
        let i = 2;
        while (used.has(`${baseSlug}-${i}`)) i++;
        slug = `${baseSlug}-${i}`;
      }
    } catch {
      // ignore slug precheck and rely on insert error
    }

    const trialDays = Math.max(1, Math.min(Number(input.trialDays ?? 30), 365));

    // 1. Create the organization
    const { data: orgData, error: orgError } = await admin
      .from("organizations")
      .insert([
        {
          name: input.orgName.trim(),
          slug,
          address: null,
          city: input.city.trim(),
          phone: input.orgPhone.trim(),
          email: input.orgEmail.trim(),
          owner_cnic: input.ownerCnic ?? null,
          subscription_status: "trial",
          subscription_plan: input.subscriptionPlan,
          subscription_expires_at: new Date(
            Date.now() + trialDays * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days trial
          feature_flags: {
            max_vehicles: parseInt(input.maxVehicles) || 100,
            max_users: parseInt(input.maxUsers) || 10,
            enable_documents: true,
            enable_leads: true,
            enable_deals: true,
            enable_analytics: true,

            // Hybrid dealership defaults
            dealership_type: "local",
            enable_inventory: true,
            enable_sales: true,
            enable_exchange_deals: true,
            enable_financing: true,
            enable_investors: true,
            enable_clients: true,
            enable_cash_flow: true,
            enable_ledger: true,

            // Japan import modules (off by default)
            enable_japan_import: false,
            enable_import_documents: false,
            enable_import_shipments: false,
            enable_import_customs: false,
            enable_import_inspections: false,
          },
          settings: {},
        },
      ] as any)
      .select()
      .single();

    if (orgError) {
      console.error("Organization creation error:", orgError);
      // Friendly message for slug conflicts
      if (String(orgError.message).toLowerCase().includes("slug")) {
        return {
          success: false,
          error: "A similar organization already exists. Try a different name.",
        };
      }
      return {
        success: false,
        error: `Failed to create organization: ${orgError.message}`,
      };
    }

    const organizationId = orgData.id;

    // 2. Create the admin user in auth.users with organization_id in metadata
    const adminEmail = input.adminEmail.trim().toLowerCase();
    const userMetadata = {
      full_name: input.adminName.trim(),
      organization_id: organizationId,
      role: "admin",
    };

    const authRes = sendInvite
      ? await admin.auth.admin.inviteUserByEmail(adminEmail, {
          data: userMetadata,
        })
      : await admin.auth.admin.createUser({
          email: adminEmail,
          password: input.adminTempPassword,
          user_metadata: userMetadata,
          // Allow immediate login with the temporary password.
          email_confirm: true,
        });

    const authData = authRes.data;
    const authError = authRes.error;

    if (authError) {
      console.error("Auth user creation error:", authError);
      // Rollback organization creation
      await admin.from("organizations").delete().eq("id", organizationId);
      const msg = String(authError.message || "");
      if (
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("registered")
      ) {
        return {
          success: false,
          error: "Admin email is already registered. Use a different email.",
        };
      }
      return { success: false, error: `Failed to create admin user: ${msg}` };
    }

    // 3. Create the admin profile (this is automatically done via trigger, but ensure it exists)
    const { error: profileError } = await admin.from("profiles").insert([
      {
        id: (authData as any).user.id,
        organization_id: organizationId,
        full_name: input.adminName.trim(),
        email: adminEmail,
        phone: input.adminPhone.trim(),
        role: "admin",
        is_active: true,
      },
    ] as any);

    if (profileError && !profileError.message.includes("duplicate")) {
      console.error("Profile creation error:", profileError);
      return {
        success: false,
        error: `Failed to create admin profile: ${profileError.message}`,
      };
    }

    // 4. Create initial pending payment record for monthly subscription
    try {
      const pricing = PLAN_PRICING[input.subscriptionPlan];
      const now = new Date();
      const periodStart = now.toISOString();
      const periodEnd = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      await admin.from("payments").insert({
        organization_id: organizationId,
        amount: pricing.amount,
        currency: pricing.currency,
        payment_method: "bank_transfer",
        status: "pending",
        subscription_plan: input.subscriptionPlan,
        period_start: periodStart,
        period_end: periodEnd,
        notes: "Initial subscription payment created during onboarding.",
      } as never);
    } catch (payErr) {
      console.error("Initial payment creation error:", payErr);
      // Non-fatal: org + admin are created; super admin can add/adjust payments manually.
    }

    revalidatePath("/admin/organizations");

    return { success: true, organizationId };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("Onboarding error:", err);
    return { success: false, error: message };
  }
}

export async function getOrganizations(): Promise<{
  data: any[] | null;
  error: string | null;
}> {
  try {
    // Only super_admin should use this from /admin area.
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Unauthorized" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "super_admin")
      return { data: null, error: "Forbidden" };

    const admin = createAdminClient() as any;

    const { data, error } = await admin
      .from("organizations")
      .select(
        `
        *,
        profiles:profiles(count),
        vehicles:vehicles(count)
        `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Failed to fetch organizations",
    };
  }
}

export async function getOrganizationByIdAdmin(
  id: string
): Promise<{ data: any | null; error: string | null }> {
  try {
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Unauthorized" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "super_admin")
      return { data: null, error: "Forbidden" };

    const admin = createAdminClient() as any;
    const { data, error } = await admin
      .from("organizations")
      .select(
        `
        *,
        profiles:profiles(count),
        vehicles:vehicles(count)
        `
      )
      .eq("id", id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Failed to fetch organization",
    };
  }
}

export async function updateOrganizationAdmin(input: {
  id: string;
  subscription_status?: "trial" | "active" | "suspended" | "cancelled";
  subscription_plan?: "basic" | "professional" | "enterprise";
  subscription_expires_at?: string | null;
  name?: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  owner_cnic?: string | null;
  feature_flags?: Record<string, unknown>;
}): Promise<{ error: string | null }> {
  try {
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "super_admin") return { error: "Forbidden" };

    const admin = createAdminClient() as any;

    const update: any = {};
    if (input.subscription_status !== undefined)
      update.subscription_status = input.subscription_status;
    if (input.subscription_plan !== undefined)
      update.subscription_plan = input.subscription_plan;
    if (input.subscription_expires_at !== undefined)
      update.subscription_expires_at = input.subscription_expires_at;
    if (input.name !== undefined) update.name = input.name;
    if (input.city !== undefined) update.city = input.city;
    if (input.phone !== undefined) update.phone = input.phone;
    if (input.email !== undefined) update.email = input.email;
    if (input.owner_cnic !== undefined) update.owner_cnic = input.owner_cnic;
    if (input.feature_flags !== undefined)
      update.feature_flags = input.feature_flags;

    const { error } = await admin
      .from("organizations")
      .update(update)
      .eq("id", input.id);
    if (error) return { error: error.message };

    revalidatePath("/admin");
    revalidatePath("/admin/organizations");
    revalidatePath(`/admin/organizations/${input.id}`);
    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to update organization",
    };
  }
}

export async function deleteOrganizationAdmin(params: {
  id: string;
}): Promise<{ error: string | null }> {
  try {
    await requireSuperAdminUserId();

    const admin = createAdminClient() as any;

    // Best-effort: delete auth users that belong to the org (so they can't log in anymore).
    // (profiles will be deleted via FK cascade when org is deleted)
    const { data: orgProfiles, error: profilesErr } = await admin
      .from("profiles")
      .select("id")
      .eq("organization_id", params.id);

    if (profilesErr) return { error: profilesErr.message };

    const ids: string[] = (orgProfiles ?? [])
      .map((p: any) => p.id)
      .filter(Boolean);
    const results = await Promise.allSettled(
      ids.map((id) => admin.auth.admin.deleteUser(id))
    );

    const failed = results.find((r) => r.status === "rejected");
    if (failed && failed.status === "rejected") {
      // Continue anyway; we'll still delete the org data. Report best-effort error.
      console.error("Some auth users failed to delete:", failed.reason);
    }

    const { error: delErr } = await admin
      .from("organizations")
      .delete()
      .eq("id", params.id);
    if (delErr) return { error: delErr.message };

    revalidatePath("/admin");
    revalidatePath("/admin/organizations");
    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to delete organization",
    };
  }
}
