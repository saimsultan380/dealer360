'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type {
  JapanImportCase,
  JapanImportStatus,
  JapanImportDocument,
  JapanImportDocumentType,
  JapanImportShipment,
  JapanImportCustoms,
  JapanImportInspection,
  JapanImportAuction,
  JapanImportCosting,
} from '@/lib/types/database';

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

export async function getJapanImportCases(params?: {
  search?: string;
  status?: JapanImportStatus | 'all';
  page?: number;
  limit?: number;
}): Promise<{
  data: JapanImportCase[];
  metadata: { total: number; page: number; limit: number; totalPages: number };
  error: string | null;
}> {
  try {
    const { supabase, organization_id } = await getOrgCtxOrThrow();
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    let q = supabase
      .from('japan_import_cases')
      .select('*', { count: 'exact' })
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (params?.status && params.status !== 'all') q = q.eq('status', params.status);
    if (params?.search) {
      const pattern = `%${params.search}%`;
      q = q.or(`stock_code.ilike.${pattern},make.ilike.${pattern},model.ilike.${pattern},chassis_number.ilike.${pattern}`);
    }

    const { data, error, count } = await q;
    if (error) {
      return { data: [], metadata: { total: 0, page, limit, totalPages: 0 }, error: error.message };
    }
    const total = count ?? 0;
    return {
      data: (data ?? []) as JapanImportCase[],
      metadata: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
      error: null,
    };
  } catch (err) {
    return {
      data: [],
      metadata: { total: 0, page: params?.page ?? 1, limit: params?.limit ?? 10, totalPages: 0 },
      error: err instanceof Error ? err.message : 'Failed to load import cases',
    };
  }
}

export async function createJapanImportCase(input: any): Promise<{ data: JapanImportCase | null; error: string | null }> {
  try {
    const { supabase, organization_id, user_id } = await getOrgCtxOrThrow();
    const { data, error } = await supabase
      .from('japan_import_cases')
      .insert([
        {
          ...input,
          organization_id,
          created_by: user_id,
          status: input.status ?? 'planned',
        },
      ] as any)
      .select('*')
      .single();
    if (error) return { data: null, error: error.message };
    revalidatePath('/dashboard/japan-import');
    return { data: data as JapanImportCase, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create import case' };
  }
}

export async function updateJapanImportCase(
  id: string,
  input: Partial<JapanImportCase>
): Promise<{ data: JapanImportCase | null; error: string | null }> {
  try {
    const { supabase, organization_id } = await getOrgCtxOrThrow();
    const { data, error } = await supabase
      .from('japan_import_cases')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .eq('organization_id', organization_id)
      .select('*')
      .single();
    if (error) return { data: null, error: error.message };
    revalidatePath('/dashboard/japan-import');
    revalidatePath(`/dashboard/japan-import/${id}`);
    revalidatePath(`/dashboard/japan-import/${id}/edit`);
    return { data: data as JapanImportCase, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update import case' };
  }
}

export async function getJapanImportCaseById(id: string): Promise<{
  data:
    | {
        importCase: JapanImportCase;
        documents: JapanImportDocument[];
        shipment: JapanImportShipment | null;
        customs: JapanImportCustoms | null;
        inspection: JapanImportInspection | null;
        auction: JapanImportAuction | null;
        costing: JapanImportCosting | null;
      }
    | null;
  error: string | null;
}> {
  try {
    const { supabase, organization_id } = await getOrgCtxOrThrow();

    const { data: importCase, error } = await supabase
      .from('japan_import_cases')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single();
    if (error) return { data: null, error: error.message };

    const [docs, shipment, customs, inspection, auction, costing] = await Promise.all([
      supabase
        .from('japan_import_documents')
        .select('*')
        .eq('import_case_id', id)
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false }),
      supabase.from('japan_import_shipments').select('*').eq('import_case_id', id).eq('organization_id', organization_id).maybeSingle(),
      supabase.from('japan_import_customs').select('*').eq('import_case_id', id).eq('organization_id', organization_id).maybeSingle(),
      supabase.from('japan_import_inspections').select('*').eq('import_case_id', id).eq('organization_id', organization_id).maybeSingle(),
      supabase.from('japan_import_auctions').select('*').eq('import_case_id', id).eq('organization_id', organization_id).maybeSingle(),
      supabase.from('japan_import_costing').select('*').eq('import_case_id', id).eq('organization_id', organization_id).maybeSingle(),
    ]);

    return {
      data: {
        importCase: importCase as JapanImportCase,
        documents: (docs.data ?? []) as JapanImportDocument[],
        shipment: (shipment.data ?? null) as JapanImportShipment | null,
        customs: (customs.data ?? null) as JapanImportCustoms | null,
        inspection: (inspection.data ?? null) as JapanImportInspection | null,
        auction: (auction.data ?? null) as JapanImportAuction | null,
        costing: (costing.data ?? null) as JapanImportCosting | null,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to load import case' };
  }
}

export async function addJapanImportDocument(params: {
  import_case_id: string;
  input: {
    document_type: JapanImportDocumentType;
    title?: string | null;
    file_url: string;
    status?: 'pending' | 'verified' | 'rejected';
    notes?: string | null;
  };
}): Promise<{ error: string | null }> {
  try {
    const { supabase, organization_id } = await getOrgCtxOrThrow();
    const { error } = await supabase.from('japan_import_documents').insert([
      {
        organization_id,
        import_case_id: params.import_case_id,
        document_type: params.input.document_type,
        title: params.input.title ?? null,
        file_url: params.input.file_url,
        status: params.input.status ?? 'pending',
        notes: params.input.notes ?? null,
      },
    ] as any);
    if (error) return { error: error.message };
    revalidatePath(`/dashboard/japan-import/${params.import_case_id}`);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to add document' };
  }
}

async function upsertOne(table: string, params: { import_case_id: string; input: Record<string, any> }) {
  const { supabase, organization_id } = await getOrgCtxOrThrow();
  const { error } = await supabase
    .from(table)
    .upsert([{ ...params.input, organization_id, import_case_id: params.import_case_id }] as any, {
      onConflict: 'import_case_id',
    });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/japan-import/${params.import_case_id}`);
}

export async function upsertJapanImportShipment(params: { import_case_id: string; input: Partial<JapanImportShipment> }) {
  try {
    await upsertOne('japan_import_shipments', { import_case_id: params.import_case_id, input: params.input as any });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save shipment' };
  }
}

export async function upsertJapanImportCustoms(params: { import_case_id: string; input: Partial<JapanImportCustoms> }) {
  try {
    await upsertOne('japan_import_customs', { import_case_id: params.import_case_id, input: params.input as any });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save customs' };
  }
}

export async function upsertJapanImportInspection(params: { import_case_id: string; input: Partial<JapanImportInspection> }) {
  try {
    await upsertOne('japan_import_inspections', { import_case_id: params.import_case_id, input: params.input as any });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save inspection' };
  }
}

export async function upsertJapanImportAuction(params: { import_case_id: string; input: Partial<JapanImportAuction> }) {
  try {
    await upsertOne('japan_import_auctions', { import_case_id: params.import_case_id, input: params.input as any });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save auction' };
  }
}

export async function upsertJapanImportCosting(params: { import_case_id: string; input: Partial<JapanImportCosting> }) {
  try {
    await upsertOne('japan_import_costing', { import_case_id: params.import_case_id, input: params.input as any });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save costing' };
  }
}

export async function createInventoryVehicleFromImportCase(import_case_id: string): Promise<{ vehicleId: string | null; error: string | null }> {
  try {
    const { supabase, organization_id, user_id } = await getOrgCtxOrThrow();

    const { data: c, error } = await supabase
      .from('japan_import_cases')
      .select('*')
      .eq('id', import_case_id)
      .eq('organization_id', organization_id)
      .single();
    if (error) return { vehicleId: null, error: error.message };
    if (!c) return { vehicleId: null, error: 'Import case not found' };
    if (c.vehicle_id) return { vehicleId: c.vehicle_id, error: null };
    if (c.status !== 'ready_for_sale') return { vehicleId: null, error: 'Import case must be ready_for_sale' };

    const { data: vehicle, error: vErr } = await supabase
      .from('vehicles')
      .insert([
        {
          organization_id,
          make: c.make,
          model: c.model,
          variant: c.variant,
          year: c.year ?? new Date().getFullYear(),
          color: c.color,
          chassis_number: c.chassis_number,
          engine_number: c.engine_number,
          purchase_price: c.purchase_price_pkr ?? null,
          selling_price: null,
          status: 'available',
          condition: 'used',
          added_by: user_id,
        },
      ] as any)
      .select('*')
      .single();
    if (vErr) return { vehicleId: null, error: vErr.message };

    const { error: linkErr } = await supabase
      .from('japan_import_cases')
      .update({ vehicle_id: vehicle.id } as any)
      .eq('id', import_case_id)
      .eq('organization_id', organization_id);
    if (linkErr) return { vehicleId: vehicle.id, error: linkErr.message };

    revalidatePath('/dashboard/inventory');
    revalidatePath(`/dashboard/japan-import/${import_case_id}`);
    return { vehicleId: vehicle.id, error: null };
  } catch (err) {
    return { vehicleId: null, error: err instanceof Error ? err.message : 'Failed to create inventory vehicle' };
  }
}

