'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { DealershipType, FeatureFlags, Organization, UserRole } from '@/lib/types/database';

export type OrgModuleKey =
  | 'inventory'
  | 'sales'
  | 'exchange_deals'
  | 'financing'
  | 'leads'
  | 'deals'
  | 'documents'
  | 'cash_flow'
  | 'ledger'
  | 'clients'
  | 'investors'
  | 'japan_import'
  | 'import_documents'
  | 'import_shipments'
  | 'import_customs'
  | 'import_inspections';

export type OrgModulesConfig = Record<OrgModuleKey, boolean>;

function normalizeFeatureFlags(flags: FeatureFlags | null | undefined): FeatureFlags {
  return {
    max_vehicles: flags?.max_vehicles ?? 100,
    max_users: flags?.max_users ?? 10,
    enable_documents: flags?.enable_documents ?? true,
    enable_leads: flags?.enable_leads ?? true,
    enable_deals: flags?.enable_deals ?? true,
    enable_analytics: flags?.enable_analytics ?? true,

    dealership_type: flags?.dealership_type ?? 'local',

    enable_inventory: flags?.enable_inventory ?? true,
    enable_sales: flags?.enable_sales ?? true,
    enable_exchange_deals: flags?.enable_exchange_deals ?? true,
    enable_financing: flags?.enable_financing ?? true,
    enable_investors: flags?.enable_investors ?? true,
    enable_clients: flags?.enable_clients ?? true,
    enable_cash_flow: flags?.enable_cash_flow ?? true,
    enable_ledger: flags?.enable_ledger ?? true,

    enable_japan_import: flags?.enable_japan_import ?? false,
    enable_import_documents: flags?.enable_import_documents ?? false,
    enable_import_shipments: flags?.enable_import_shipments ?? false,
    enable_import_customs: flags?.enable_import_customs ?? false,
    enable_import_inspections: flags?.enable_import_inspections ?? false,
  };
}

function getModulesFromFeatureFlags(flags: FeatureFlags): OrgModulesConfig {
  const f = normalizeFeatureFlags(flags);
  return {
    inventory: !!f.enable_inventory,
    sales: !!f.enable_sales,
    exchange_deals: !!f.enable_exchange_deals,
    financing: !!f.enable_financing,
    leads: !!f.enable_leads,
    deals: !!f.enable_deals,
    documents: !!f.enable_documents,
    cash_flow: !!f.enable_cash_flow,
    ledger: !!f.enable_ledger,
    clients: !!f.enable_clients,
    investors: !!f.enable_investors,
    japan_import: !!f.enable_japan_import,
    import_documents: !!f.enable_import_documents,
    import_shipments: !!f.enable_import_shipments,
    import_customs: !!f.enable_import_customs,
    import_inspections: !!f.enable_import_inspections,
  };
}

function mergeFeatureFlags(params: {
  current: FeatureFlags | null | undefined;
  dealershipType?: DealershipType;
  modules?: Partial<OrgModulesConfig>;
}): FeatureFlags {
  const current = normalizeFeatureFlags(params.current);
  const modules = params.modules ?? {};

  return {
    ...current,
    dealership_type: params.dealershipType ?? current.dealership_type,

    enable_inventory: modules.inventory ?? current.enable_inventory,
    enable_sales: modules.sales ?? current.enable_sales,
    enable_exchange_deals: modules.exchange_deals ?? current.enable_exchange_deals,
    enable_financing: modules.financing ?? current.enable_financing,
    enable_leads: modules.leads ?? current.enable_leads,
    enable_deals: modules.deals ?? current.enable_deals,
    enable_documents: modules.documents ?? current.enable_documents,
    enable_cash_flow: modules.cash_flow ?? current.enable_cash_flow,
    enable_ledger: modules.ledger ?? current.enable_ledger,
    enable_clients: modules.clients ?? current.enable_clients,
    enable_investors: modules.investors ?? current.enable_investors,

    enable_japan_import: modules.japan_import ?? current.enable_japan_import,
    enable_import_documents: modules.import_documents ?? current.enable_import_documents,
    enable_import_shipments: modules.import_shipments ?? current.enable_import_shipments,
    enable_import_customs: modules.import_customs ?? current.enable_import_customs,
    enable_import_inspections: modules.import_inspections ?? current.enable_import_inspections,
  };
}

async function requireOrgAdminRole(): Promise<{ orgId: string; role: UserRole }> {
  const supabase = (await createClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (error) throw new Error(error.message);
  if (!profile?.organization_id) throw new Error('No organization found');

  const role = (profile.role ?? 'salesperson') as UserRole;
  if (role !== 'admin' && role !== 'manager' && role !== 'super_admin') {
    throw new Error('Insufficient permissions');
  }

  return { orgId: profile.organization_id as string, role };
}

export async function getOrganizationModuleConfig(): Promise<{
  data: { dealership_type: DealershipType; modules: OrgModulesConfig } | null;
  error: string | null;
}> {
  try {
    const supabase = (await createClient()) as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Unauthorized' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (!profile?.organization_id) return { data: null, error: 'No organization found' };

    const { data: org, error } = await supabase
      .from('organizations')
      .select('feature_flags')
      .eq('id', profile.organization_id)
      .single();
    if (error) return { data: null, error: error.message };

    const flags = normalizeFeatureFlags((org as any)?.feature_flags);
    return {
      data: {
        dealership_type: (flags.dealership_type ?? 'local') as DealershipType,
        modules: getModulesFromFeatureFlags(flags),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to load module config' };
  }
}

export async function updateOrganizationModuleConfig(params: {
  dealership_type?: DealershipType;
  modules?: Partial<OrgModulesConfig>;
}): Promise<{ data: Organization | null; error: string | null }> {
  try {
    const { orgId } = await requireOrgAdminRole();
    const supabase = (await createClient()) as any;

    const { data: org, error: getErr } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    if (getErr) return { data: null, error: getErr.message };

    const nextFlags = mergeFeatureFlags({
      current: (org as any)?.feature_flags,
      dealershipType: params.dealership_type,
      modules: params.modules,
    });

    const { data: updated, error } = await supabase
      .from('organizations')
      .update({ feature_flags: nextFlags })
      .eq('id', orgId)
      .select('*')
      .single();

    if (error) return { data: null, error: error.message };

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { data: updated as any, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update module config' };
  }
}

