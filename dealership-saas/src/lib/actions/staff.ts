'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Profile, UserRole } from '@/lib/types/database';
import { isStaffModuleKey, normalizeStaffModules, type StaffModuleKey } from '@/lib/auth/module-access';

export type StaffMember = Pick<
  Profile,
  'id' | 'email' | 'full_name' | 'role' | 'is_active' | 'created_at'
> & {
  module_access?: StaffModuleKey[] | null;
};

type OrgContext = {
  userId: string;
  organizationId: string;
  role: UserRole;
};

async function getOrgContext(): Promise<{ data: OrgContext | null; error: string | null }> {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Unauthorized' };

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, organization_id, role, is_active')
    .eq('id', user.id)
    .single();

  if (error) return { data: null, error: error.message };
  if (!profile?.organization_id) return { data: null, error: 'No organization found' };
  if (profile.is_active === false) return { data: null, error: 'Account is inactive' };

  return {
    data: {
      userId: user.id,
      organizationId: profile.organization_id,
      role: profile.role as UserRole,
    },
    error: null,
  };
}

async function logActivity(params: {
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const supabase = (await createClient()) as any;
    await supabase.from('activity_logs').insert({
      action: params.action,
      entity_type: params.entity_type ?? null,
      entity_id: params.entity_id ?? null,
      details: params.details ?? {},
    } as never);
  } catch {
    // best-effort audit logging; don't block primary action
  }
}

export async function getStaffMembers(): Promise<{ data: StaffMember[] | null; error: string | null }> {
  try {
    const ctx = await getOrgContext();
    if (!ctx.data) return { data: null, error: ctx.error };

    const supabase = (await createClient()) as any;

    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', ctx.data.organizationId)
      .single();

    const settings = ((org as any)?.settings ?? {}) as Record<string, unknown>;
    const staffModuleAccess = (settings as any)?.staff_module_access as Record<string, unknown> | undefined;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active, created_at')
      .eq('organization_id', ctx.data.organizationId)
      .order('full_name', { ascending: true });

    if (error) return { data: null, error: error.message };

    const staffList = ((data ?? []) as StaffMember[]).map((m) => {
      const raw = staffModuleAccess?.[m.id];
      const modules = Array.isArray(raw) ? raw.filter(isStaffModuleKey) : null;
      return { ...m, module_access: modules && modules.length ? normalizeStaffModules(modules) : null };
    });

    return { data: staffList, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch staff.' };
  }
}

export async function createStaffMember(input: {
  email: string;
  full_name: string;
  role: Exclude<UserRole, 'super_admin'>;
  /** Optional: if provided, staff can log in immediately with email+password */
  temporary_password?: string;
}): Promise<{ error: string | null; staff_id?: string }> {
  try {
    const ctx = await getOrgContext();
    if (!ctx.data) return { error: ctx.error };

    // Only org admins (or super admin) can create staff accounts
    if (ctx.data.role !== 'admin' && ctx.data.role !== 'super_admin') {
      return { error: 'Insufficient permissions' };
    }

    const email = input.email.trim().toLowerCase();
    if (!email) return { error: 'Email is required' };
    if (!input.full_name?.trim()) return { error: 'Full name is required' };

    const admin = createAdminClient();

    const userMetadata = {
      full_name: input.full_name.trim(),
      organization_id: ctx.data.organizationId,
      role: input.role,
    };

    let createdUserId: string | undefined;
    if (input.temporary_password && input.temporary_password.length >= 6) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: input.temporary_password,
        email_confirm: true,
        user_metadata: userMetadata,
      });
      if (error) return { error: error.message };
      createdUserId = (data as any)?.user?.id;
    } else {
      // Invite flow: staff sets their password via email link (requires Supabase email configured)
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: userMetadata,
      });
      if (error) return { error: error.message };
      createdUserId = (data as any)?.user?.id;
    }

    await logActivity({
      action: 'staff.create',
      entity_type: 'profile',
      entity_id: createdUserId,
      details: { email, role: input.role },
    });

    revalidatePath('/dashboard/settings');
    return { error: null, staff_id: createdUserId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create staff member.' };
  }
}

export async function updateStaffModuleAccess(input: {
  staff_id: string;
  modules: StaffModuleKey[] | null;
}): Promise<{ error: string | null }> {
  try {
    const ctx = await getOrgContext();
    if (!ctx.data) return { error: ctx.error };

    // Only admins (or super admin) can change access
    if (ctx.data.role !== 'admin' && ctx.data.role !== 'super_admin') {
      return { error: 'Insufficient permissions' };
    }

    if (!input.staff_id) return { error: 'Invalid staff member' };

    const supabase = (await createClient()) as any;

    const { data: org, error: getErr } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', ctx.data.organizationId)
      .single();
    if (getErr) return { error: getErr.message };

    const settings = (((org as any)?.settings ?? {}) as Record<string, unknown>) ?? {};
    const currentMap = ((settings as any)?.staff_module_access ?? {}) as Record<string, unknown>;

    const nextMap: Record<string, unknown> = { ...currentMap };

    const cleaned = input.modules ? normalizeStaffModules(input.modules).filter(isStaffModuleKey) : [];

    if (!cleaned.length) {
      delete nextMap[input.staff_id];
    } else {
      nextMap[input.staff_id] = cleaned;
    }

    const nextSettings = { ...(settings as any), staff_module_access: nextMap };

    const { error } = await supabase
      .from('organizations')
      .update({ settings: nextSettings } as never)
      .eq('id', ctx.data.organizationId);

    if (error) return { error: error.message };

    await logActivity({
      action: 'staff.module_access_update',
      entity_type: 'profile',
      entity_id: input.staff_id,
      details: { modules: cleaned.length ? cleaned : null },
    });

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update staff access.' };
  }
}

export async function updateStaffRole(input: {
  staff_id: string;
  role: Exclude<UserRole, 'super_admin'>;
}): Promise<{ error: string | null }> {
  try {
    const ctx = await getOrgContext();
    if (!ctx.data) return { error: ctx.error };

    // Only admins (or super admin) can change roles
    if (ctx.data.role !== 'admin' && ctx.data.role !== 'super_admin') {
      return { error: 'Insufficient permissions' };
    }

    if (!input.staff_id) return { error: 'Invalid staff member' };

    const supabase = (await createClient()) as any;
    const { error } = await supabase
      .from('profiles')
      .update({ role: input.role } as never)
      .eq('id', input.staff_id)
      .eq('organization_id', ctx.data.organizationId);

    if (error) return { error: error.message };

    await logActivity({
      action: 'staff.role_update',
      entity_type: 'profile',
      entity_id: input.staff_id,
      details: { role: input.role },
    });

    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update staff role.' };
  }
}

export async function setStaffActive(input: {
  staff_id: string;
  is_active: boolean;
}): Promise<{ error: string | null }> {
  try {
    const ctx = await getOrgContext();
    if (!ctx.data) return { error: ctx.error };

    // Only admins (or super admin) can activate/deactivate
    if (ctx.data.role !== 'admin' && ctx.data.role !== 'super_admin') {
      return { error: 'Insufficient permissions' };
    }

    if (!input.staff_id) return { error: 'Invalid staff member' };
    if (input.staff_id === ctx.data.userId) return { error: 'You cannot deactivate your own account' };

    const supabase = (await createClient()) as any;
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: input.is_active } as never)
      .eq('id', input.staff_id)
      .eq('organization_id', ctx.data.organizationId);

    if (error) return { error: error.message };

    await logActivity({
      action: input.is_active ? 'staff.activate' : 'staff.deactivate',
      entity_type: 'profile',
      entity_id: input.staff_id,
    });

    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update staff status.' };
  }
}

