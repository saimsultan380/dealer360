'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export interface RegisterInput {
  dealershipName: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  password: string;
}

/**
 * Register a new dealership and create admin account
 * Uses admin client to bypass RLS for organization creation
 */
export async function registerAndCreateOrganization(
  input: RegisterInput
): Promise<{ success: boolean; error?: string; organizationId?: string }> {
  try {
    const admin = createAdminClient() as any;

    // 1. Create the organization with admin client
    const slug = input.dealershipName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data: orgData, error: orgError } = await admin
      .from('organizations')
      .insert([
        {
          name: input.dealershipName.trim(),
          slug: `${slug}-${Date.now()}`,
          city: input.city.trim(),
          phone: input.phone.trim(),
          email: input.email.trim(),
          subscription_status: 'trial',
          subscription_plan: 'basic',
          subscription_expires_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          feature_flags: {
            // Core modules
            enable_inventory: true,
            enable_sales: true,
            enable_exchange_deals: true,
            enable_financing: true,
            enable_leads: true,
            enable_deals: true,
            enable_documents: true,
            enable_clients: true,
            enable_investors: true,
            enable_cash_flow: true,
            enable_ledger: true,

            // Hybrid dealership defaults
            dealership_type: 'local',
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

    // 2. Create auth user with admin client
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      user_metadata: {
        full_name: input.fullName.trim(),
        organization_id: organizationId,
        role: 'admin',
      },
      email_confirm: false,
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      // Rollback organization creation
      await admin.from('organizations').delete().eq('id', organizationId);
      return { success: false, error: `Failed to create account: ${authError.message}` };
    }

    // 3. Create the admin profile
    const { error: profileError } = await admin
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          organization_id: organizationId,
          full_name: input.fullName.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone.trim(),
          role: 'admin',
          is_active: true,
        },
      ] as any);

    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('Profile creation error:', profileError);
      // Rollback
      await admin.from('organizations').delete().eq('id', organizationId);
      return {
        success: false,
        error: `Failed to create profile: ${profileError.message}`,
      };
    }

    return { success: true, organizationId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Registration error:', err);
    return { success: false, error: message };
  }
}
