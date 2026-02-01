'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface OnboardOrganizationInput {
  orgName: string;
  city: string;
  orgPhone: string;
  orgEmail: string;
  subscriptionPlan: 'basic' | 'professional' | 'enterprise';
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  /**
   * Temporary password set by super admin during onboarding.
   * The dealership admin can change it later from Dashboard → Settings.
   */
  adminTempPassword: string;
  maxVehicles: string;
  maxUsers: string;
}

export async function onboardOrganization(
  input: OnboardOrganizationInput
): Promise<{ success: boolean; error?: string; organizationId?: string }> {
  try {
    const admin = (createAdminClient() as any);

    if (!input.adminTempPassword || input.adminTempPassword.length < 6) {
      return { success: false, error: 'Temporary password must be at least 6 characters long.' };
    }

    // 1. Create the organization
    const { data: orgData, error: orgError } = await admin
      .from('organizations')
      .insert([
        {
          name: input.orgName.trim(),
          slug: input.orgName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
          address: null,
          city: input.city.trim(),
          phone: input.orgPhone.trim(),
          email: input.orgEmail.trim(),
          subscription_status: 'trial',
          subscription_plan: input.subscriptionPlan,
          subscription_expires_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days trial
          feature_flags: {
            max_vehicles: parseInt(input.maxVehicles) || 100,
            max_users: parseInt(input.maxUsers) || 10,
            enable_documents: true,
            enable_leads: true,
            enable_deals: true,
            enable_analytics: true,

            // Hybrid dealership defaults
            dealership_type: 'local',
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
      console.error('Organization creation error:', orgError);
      return { success: false, error: `Failed to create organization: ${orgError.message}` };
    }

    const organizationId = orgData.id;

    // 2. Create the admin user in auth.users with organization_id in metadata
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: input.adminEmail.trim().toLowerCase(),
      password: input.adminTempPassword,
      user_metadata: {
        full_name: input.adminName.trim(),
        organization_id: organizationId,
        role: 'admin',
      },
      // Allow immediate login with the temporary password.
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      // Rollback organization creation
      await admin.from('organizations').delete().eq('id', organizationId);
      return { success: false, error: `Failed to create admin user: ${authError.message}` };
    }

    // 3. Create the admin profile (this is automatically done via trigger, but ensure it exists)
    const { error: profileError } = await admin
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          organization_id: organizationId,
          full_name: input.adminName.trim(),
          email: input.adminEmail.trim().toLowerCase(),
          phone: input.adminPhone.trim(),
          role: 'admin',
          is_active: true,
        },
      ] as any);

    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('Profile creation error:', profileError);
      return {
        success: false,
        error: `Failed to create admin profile: ${profileError.message}`,
      };
    }

    // 4. Send invitation email (optional - Supabase handles this automatically)
    // You can customize this by using Supabase's email templates or a third-party service

    revalidatePath('/admin/organizations');

    return { success: true, organizationId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Onboarding error:', err);
    return { success: false, error: message };
  }
}

export async function getOrganizations(): Promise<{ data: any[] | null; error: string | null }> {
  try {
    // Only super_admin should use this from /admin area.
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Unauthorized' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'super_admin') return { data: null, error: 'Forbidden' };

    const admin = (createAdminClient() as any);

    const { data, error } = await admin
      .from('organizations')
      .select(
        `
        *,
        profiles:profiles(count),
        vehicles:vehicles(count)
        `
      )
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch organizations' };
  }
}

export async function getOrganizationByIdAdmin(id: string): Promise<{ data: any | null; error: string | null }> {
  try {
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Unauthorized' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'super_admin') return { data: null, error: 'Forbidden' };

    const admin = (createAdminClient() as any);
    const { data, error } = await admin
      .from('organizations')
      .select(
        `
        *,
        profiles:profiles(count),
        vehicles:vehicles(count)
        `
      )
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch organization' };
  }
}

export async function updateOrganizationAdmin(input: {
  id: string;
  subscription_status?: 'trial' | 'active' | 'suspended' | 'cancelled';
  subscription_plan?: 'basic' | 'professional' | 'enterprise';
  subscription_expires_at?: string | null;
  name?: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  feature_flags?: Record<string, unknown>;
}): Promise<{ error: string | null }> {
  try {
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'super_admin') return { error: 'Forbidden' };

    const admin = (createAdminClient() as any);

    const update: any = {};
    if (input.subscription_status !== undefined) update.subscription_status = input.subscription_status;
    if (input.subscription_plan !== undefined) update.subscription_plan = input.subscription_plan;
    if (input.subscription_expires_at !== undefined) update.subscription_expires_at = input.subscription_expires_at;
    if (input.name !== undefined) update.name = input.name;
    if (input.city !== undefined) update.city = input.city;
    if (input.phone !== undefined) update.phone = input.phone;
    if (input.email !== undefined) update.email = input.email;
    if (input.feature_flags !== undefined) update.feature_flags = input.feature_flags;

    const { error } = await admin.from('organizations').update(update).eq('id', input.id);
    if (error) return { error: error.message };

    revalidatePath('/admin');
    revalidatePath('/admin/organizations');
    revalidatePath(`/admin/organizations/${input.id}`);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update organization' };
  }
}

async function requireSuperAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Try profile role first
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'super_admin') return { userId: user.id as string };

  // Fallback to SECURITY DEFINER helper (handles cases where profile row is hidden by RLS)
  try {
    const { data, error } = await supabase.rpc('is_super_admin');
    if (!error && data === true) return { userId: user.id as string };
  } catch {
    // ignore
  }

  // If we couldn't read profile due to RLS, return a clearer message.
  if (profileErr?.message) return { error: 'Forbidden' };
  return { error: 'Forbidden' };
}

export async function deleteOrganizationAdmin(params: { id: string }): Promise<{ error: string | null }> {
  try {
    const gate = await requireSuperAdmin();
    if ('error' in gate) return { error: gate.error };

    const admin = (createAdminClient() as any);

    // Best-effort: delete auth users that belong to the org (so they can't log in anymore).
    // (profiles will be deleted via FK cascade when org is deleted)
    const { data: orgProfiles, error: profilesErr } = await admin
      .from('profiles')
      .select('id')
      .eq('organization_id', params.id);

    if (profilesErr) return { error: profilesErr.message };

    const ids: string[] = (orgProfiles ?? []).map((p: any) => p.id).filter(Boolean);
    const results = await Promise.allSettled(ids.map((id) => admin.auth.admin.deleteUser(id)));

    const failed = results.find((r) => r.status === 'rejected');
    if (failed && failed.status === 'rejected') {
      // Continue anyway; we'll still delete the org data. Report best-effort error.
      console.error('Some auth users failed to delete:', failed.reason);
    }

    const { error: delErr } = await admin.from('organizations').delete().eq('id', params.id);
    if (delErr) return { error: delErr.message };

    revalidatePath('/admin');
    revalidatePath('/admin/organizations');
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete organization' };
  }
}
