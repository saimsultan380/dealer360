'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface InvoiceSettings {
  id: string;
  organization_id: string;
  business_name: string;
  tagline: string;
  slogan: string;
  logo_url: string;
  ntn_number: string;
  ceo_name: string;
  phone_numbers: string[];
  business_address: string;
  primary_color: string;
  show_seller_photo: boolean;
  show_buyer_photo: boolean;
  show_vehicle_photo: boolean;
  show_accessories_section: boolean;
  show_documents_section: boolean;
  show_witness_section: boolean;
  show_notes_section: boolean;
  show_extra_requirements: boolean;
  show_profession_field: boolean;
  show_swdo_field: boolean;
  default_note_text: string;
  default_extra_requirements: string;
  invoice_prefix: string;
  next_serial_number: number;
  created_at: string;
  updated_at: string;
}

async function getOrgCtx() {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .maybeSingle();

  let organization_id = profile?.organization_id ?? null;
  if (!organization_id) {
    const metaOrgId =
      (user.user_metadata as any)?.organization_id ??
      (user.app_metadata as any)?.organization_id ??
      null;
    if (!metaOrgId) throw new Error('No organization found');
    organization_id = metaOrgId;
  }

  return { supabase, user_id: user.id as string, organization_id: organization_id as string, role: profile?.role };
}

export async function getInvoiceSettings(): Promise<{
  data: InvoiceSettings | null;
  error: string | null;
}> {
  try {
    const { supabase, organization_id } = await getOrgCtx();

    const { data, error } = await supabase
      .from('invoice_settings')
      .select('*')
      .eq('organization_id', organization_id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    // If no settings exist, return defaults
    if (!data) {
      return {
        data: {
          id: '',
          organization_id,
          business_name: '',
          tagline: '',
          slogan: '',
          logo_url: '',
          ntn_number: '',
          ceo_name: '',
          phone_numbers: [],
          business_address: '',
          primary_color: '#DC2626',
          show_seller_photo: true,
          show_buyer_photo: true,
          show_vehicle_photo: true,
          show_accessories_section: true,
          show_documents_section: true,
          show_witness_section: true,
          show_notes_section: true,
          show_extra_requirements: true,
          show_profession_field: true,
          show_swdo_field: true,
          default_note_text: `Note: Seller is liable to clear all documents, token taxes and all liabilities before handing over the vehicle before this day seller is responsible for the use the above mentioned vehicle, any FIR, token taxes, liabilities challan etc.\nBoth parties (Seller and buyer) have agreed the sale in their clear consciousness, if any of the party steps back from the deal then showroom is not responsible. Both parties are liable to pay the commission of the showroom. This receipt is written and signed by both parties for the record.\nBuyer is required to transfer the Vehicle in his Name and complete 15 Police Verification within fifteen days of receiving the vehicle. After 15 days, the showroom will not be responsible.`,
          default_extra_requirements: 'Vehicle and documents, along with the original slip and number plates, have been handed over to the client.',
          invoice_prefix: '',
          next_serial_number: 1,
          created_at: '',
          updated_at: '',
        },
        error: null,
      };
    }

    return { data: data as InvoiceSettings, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch settings' };
  }
}

export async function upsertInvoiceSettings(
  input: Partial<InvoiceSettings>
): Promise<{ data: InvoiceSettings | null; error: string | null }> {
  try {
    const { supabase, organization_id, role } = await getOrgCtx();

    // Only admin/manager can update
    if (!['admin', 'manager', 'super_admin'].includes(role)) {
      return { data: null, error: 'Insufficient permissions' };
    }

    const payload = {
      organization_id,
      business_name: input.business_name ?? '',
      tagline: input.tagline ?? '',
      slogan: input.slogan ?? '',
      logo_url: input.logo_url ?? '',
      ntn_number: input.ntn_number ?? '',
      ceo_name: input.ceo_name ?? '',
      phone_numbers: input.phone_numbers ?? [],
      business_address: input.business_address ?? '',
      primary_color: input.primary_color ?? '#DC2626',
      show_seller_photo: input.show_seller_photo ?? true,
      show_buyer_photo: input.show_buyer_photo ?? true,
      show_vehicle_photo: input.show_vehicle_photo ?? true,
      show_accessories_section: input.show_accessories_section ?? true,
      show_documents_section: input.show_documents_section ?? true,
      show_witness_section: input.show_witness_section ?? true,
      show_notes_section: input.show_notes_section ?? true,
      show_extra_requirements: input.show_extra_requirements ?? true,
      show_profession_field: input.show_profession_field ?? true,
      show_swdo_field: input.show_swdo_field ?? true,
      default_note_text: input.default_note_text ?? '',
      default_extra_requirements: input.default_extra_requirements ?? '',
      invoice_prefix: input.invoice_prefix ?? '',
      next_serial_number: input.next_serial_number ?? 1,
    };

    const { data, error } = await supabase
      .from('invoice_settings')
      .upsert(payload, { onConflict: 'organization_id' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    revalidatePath('/dashboard/settings');
    return { data: data as InvoiceSettings, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to save settings' };
  }
}

export async function getNextInvoiceNumber(
  invoiceType: 'sale' | 'exchange' | 'japan_import',
  entityId: string
): Promise<{ invoiceNumber: string | null; serialNumber: number | null; error: string | null }> {
  try {
    const { supabase, organization_id } = await getOrgCtx();

    // Check if an invoice already exists for this entity
    const { data: existing } = await supabase
      .from('invoice_records')
      .select('invoice_number, serial_number')
      .eq('organization_id', organization_id)
      .eq('entity_id', entityId)
      .maybeSingle();

    if (existing) {
      return {
        invoiceNumber: existing.invoice_number,
        serialNumber: existing.serial_number,
        error: null,
      };
    }

    // Get next number atomically
    const { data, error } = await supabase.rpc('get_next_invoice_number', {
      p_org_id: organization_id,
      p_invoice_type: invoiceType,
      p_entity_id: entityId,
    });

    if (error) {
      return { invoiceNumber: null, serialNumber: null, error: error.message };
    }

    const row = data?.[0] || data;
    return {
      invoiceNumber: row?.invoice_num ?? null,
      serialNumber: row?.serial_num ?? null,
      error: null,
    };
  } catch (err) {
    return { invoiceNumber: null, serialNumber: null, error: err instanceof Error ? err.message : 'Failed to get invoice number' };
  }
}

export async function getSaleInvoiceData(saleId: string): Promise<{ data: any; error: string | null }> {
  try {
    const { supabase, organization_id } = await getOrgCtx();

    // Get sale with vehicle details
    const { data: sale, error: saleError } = await supabase
      .from('deals')
      .select(`
        *,
        vehicles (
          id, make, model, year, variant, color, registration_number,
          engine_number, chassis_number, mileage, fuel_type,
          vehicle_images (url, is_primary)
        )
      `)
      .eq('id', saleId)
      .eq('organization_id', organization_id)
      .single();

    if (saleError) {
      return { data: null, error: saleError.message };
    }

    // Get invoice settings
    const { data: settings } = await getInvoiceSettings();

    // Get or create invoice number
    const { invoiceNumber, serialNumber } = await getNextInvoiceNumber('sale', saleId);

    return {
      data: {
        type: 'sale',
        sale,
        settings,
        invoiceNumber,
        serialNumber,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to get sale data' };
  }
}

export async function getExchangeInvoiceData(dealId: string): Promise<{ data: any; error: string | null }> {
  try {
    const { supabase, organization_id } = await getOrgCtx();

    // Get exchange deal
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        *,
        vehicles (
          id, make, model, year, variant, color, registration_number,
          engine_number, chassis_number, mileage, fuel_type,
          vehicle_images (url, is_primary)
        )
      `)
      .eq('id', dealId)
      .eq('organization_id', organization_id)
      .single();

    if (dealError) {
      return { data: null, error: dealError.message };
    }

    // Get exchange metadata from documents
    const { data: docs } = await supabase
      .from('documents')
      .select('metadata')
      .eq('entity_type', 'deal')
      .eq('entity_id', dealId)
      .eq('organization_id', organization_id)
      .maybeSingle();

    const { data: settings } = await getInvoiceSettings();
    const { invoiceNumber, serialNumber } = await getNextInvoiceNumber('exchange', dealId);

    return {
      data: {
        type: 'exchange',
        deal,
        metadata: docs?.metadata || {},
        settings,
        invoiceNumber,
        serialNumber,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to get exchange data' };
  }
}

export async function getJapanImportInvoiceData(importCaseId: string): Promise<{ data: any; error: string | null }> {
  try {
    const { supabase, organization_id } = await getOrgCtx();

    const { data: importCase, error: importError } = await supabase
      .from('japan_import_cases')
      .select('*')
      .eq('id', importCaseId)
      .eq('organization_id', organization_id)
      .single();

    if (importError) {
      return { data: null, error: importError.message };
    }

    // Get costing
    const { data: costing } = await supabase
      .from('japan_import_costing')
      .select('*')
      .eq('import_case_id', importCaseId)
      .maybeSingle();

    // Get auction
    const { data: auction } = await supabase
      .from('japan_import_auctions')
      .select('*')
      .eq('import_case_id', importCaseId)
      .maybeSingle();

    const { data: settings } = await getInvoiceSettings();
    const { invoiceNumber, serialNumber } = await getNextInvoiceNumber('japan_import', importCaseId);

    return {
      data: {
        type: 'japan_import',
        importCase,
        costing,
        auction,
        settings,
        invoiceNumber,
        serialNumber,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to get import data' };
  }
}
