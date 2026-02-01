'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Lead, LeadStatus, LeadSource, LeadPriority } from '@/lib/types/database';

export interface LeadFormData {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    customer_cnic?: string;
    customer_address?: string;
    source?: LeadSource;
    status?: LeadStatus;
    priority?: LeadPriority;
    interested_vehicle_id?: string;
    budget_min?: number;
    budget_max?: number;
    preferred_makes?: string[];
    notes?: string;
    assigned_to?: string;
    next_follow_up?: string;
}

export interface LeadWithDetails extends Lead {
    interested_vehicle?: {
        id: string;
        make: string;
        model: string;
        year: number;
    } | null;
    assigned_user?: {
        id: string;
        full_name: string;
    } | null;
}

export async function getLeads(filters?: {
    status?: LeadStatus | 'all';
    source?: LeadSource | 'all';
    priority?: LeadPriority | 'all';
    assigned_to?: string | 'all';
    search?: string;
}): Promise<{ data: LeadWithDetails[] | null; error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: [], error: null };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: [], error: null };
        }

        let query = supabase
            .from('leads')
            .select(`
                *,
                interested_vehicle:vehicles!leads_interested_vehicle_id_fkey(id, make, model, year),
                assigned_user:profiles!leads_assigned_to_fkey(id, full_name)
            `)
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }

        if (filters?.source && filters.source !== 'all') {
            query = query.eq('source', filters.source);
        }

        if (filters?.priority && filters.priority !== 'all') {
            query = query.eq('priority', filters.priority);
        }

        if (filters?.assigned_to && filters.assigned_to !== 'all') {
            query = query.eq('assigned_to', filters.assigned_to);
        }

        if (filters?.search) {
            const searchTerm = filters.search.toLowerCase();
            query = query.or(`customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,customer_cnic.ilike.%${searchTerm}%`);
        }

        const { data: leads, error } = await query;

        if (error) {
            console.error('Error fetching leads:', error);
            return { data: null, error: error.message };
        }

        return { data: leads as LeadWithDetails[], error: null };
    } catch (err) {
        console.error('Error in getLeads:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch leads.',
        };
    }
}

export async function getLeadById(id: string): Promise<{ data: LeadWithDetails | null; error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: null, error: 'No organization found' };
        }

        const { data: lead, error } = await supabase
            .from('leads')
            .select(`
                *,
                interested_vehicle:vehicles!leads_interested_vehicle_id_fkey(id, make, model, year),
                assigned_user:profiles!leads_assigned_to_fkey(id, full_name)
            `)
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single();

        if (error) {
            console.error('Error fetching lead:', error);
            return { data: null, error: error.message };
        }

        return { data: lead as LeadWithDetails, error: null };
    } catch (err) {
        console.error('Error in getLeadById:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch lead.',
        };
    }
}

export async function createLead(data: LeadFormData): Promise<{ data: Lead | null; error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: null, error: 'No organization found' };
        }

        const leadData: any = {
            organization_id: profile.organization_id,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            customer_email: data.customer_email || null,
            customer_cnic: data.customer_cnic || null,
            customer_address: data.customer_address || null,
            source: data.source || null,
            status: data.status || 'new',
            priority: data.priority || 'medium',
            interested_vehicle_id: data.interested_vehicle_id || null,
            budget_min: data.budget_min || null,
            budget_max: data.budget_max || null,
            preferred_makes: data.preferred_makes || null,
            notes: data.notes || null,
            assigned_to: data.assigned_to || null,
            next_follow_up: data.next_follow_up || null,
        };

        const { data: lead, error } = await supabase
            .from('leads')
            .insert(leadData)
            .select()
            .single();

        if (error) {
            console.error('Error creating lead:', error);
            return { data: null, error: error.message };
        }

        revalidatePath('/dashboard/leads');
        return { data: lead, error: null };
    } catch (err) {
        console.error('Error in createLead:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to create lead.',
        };
    }
}

export async function updateLead(
    id: string,
    data: Partial<LeadFormData>
): Promise<{ data: Lead | null; error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: null, error: 'No organization found' };
        }

        const updateData: any = {};
        if (data.customer_name !== undefined) updateData.customer_name = data.customer_name;
        if (data.customer_phone !== undefined) updateData.customer_phone = data.customer_phone;
        if (data.customer_email !== undefined) updateData.customer_email = data.customer_email || null;
        if (data.customer_cnic !== undefined) updateData.customer_cnic = data.customer_cnic || null;
        if (data.customer_address !== undefined) updateData.customer_address = data.customer_address || null;
        if (data.source !== undefined) updateData.source = data.source || null;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.interested_vehicle_id !== undefined) updateData.interested_vehicle_id = data.interested_vehicle_id || null;
        if (data.budget_min !== undefined) updateData.budget_min = data.budget_min || null;
        if (data.budget_max !== undefined) updateData.budget_max = data.budget_max || null;
        if (data.preferred_makes !== undefined) updateData.preferred_makes = data.preferred_makes || null;
        if (data.notes !== undefined) updateData.notes = data.notes || null;
        if (data.assigned_to !== undefined) updateData.assigned_to = data.assigned_to || null;
        if (data.next_follow_up !== undefined) updateData.next_follow_up = data.next_follow_up || null;

        // Update last_contacted_at if status changes to contacted or beyond
        if (data.status && ['contacted', 'qualified', 'negotiating', 'won', 'lost'].includes(data.status)) {
            updateData.last_contacted_at = new Date().toISOString();
        }

        updateData.updated_at = new Date().toISOString();

        const { data: lead, error } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating lead:', error);
            return { data: null, error: error.message };
        }

        revalidatePath('/dashboard/leads');
        revalidatePath(`/dashboard/leads/${id}`);
        return { data: lead, error: null };
    } catch (err) {
        console.error('Error in updateLead:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to update lead.',
        };
    }
}

export async function deleteLead(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { success: false, error: 'No organization found' };
        }

        // Check if user has permission (admin or manager)
        if (profile.role !== 'admin' && profile.role !== 'manager' && profile.role !== 'super_admin') {
            return { success: false, error: 'Insufficient permissions' };
        }

        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id)
            .eq('organization_id', profile.organization_id);

        if (error) {
            console.error('Error deleting lead:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/leads');
        return { success: true, error: null };
    } catch (err) {
        console.error('Error in deleteLead:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to delete lead.',
        };
    }
}

export async function getLeadsSummary(): Promise<{
    data: {
        total: number;
        new: number;
        contacted: number;
        qualified: number;
        negotiating: number;
        won: number;
        lost: number;
    } | null;
    error: string | null;
}> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: { total: 0, new: 0, contacted: 0, qualified: 0, negotiating: 0, won: 0, lost: 0 }, error: null };
        }

        const { data: leads, error } = await supabase
            .from('leads')
            .select('status')
            .eq('organization_id', profile.organization_id);

        if (error) {
            console.error('Error fetching leads summary:', error);
            return { data: null, error: error.message };
        }

        const summary = {
            total: leads?.length || 0,
            new: leads?.filter((l: { status: string }) => l.status === 'new').length || 0,
            contacted: leads?.filter((l: { status: string }) => l.status === 'contacted').length || 0,
            qualified: leads?.filter((l: { status: string }) => l.status === 'qualified').length || 0,
            negotiating: leads?.filter((l: { status: string }) => l.status === 'negotiating').length || 0,
            won: leads?.filter((l: { status: string }) => l.status === 'won').length || 0,
            lost: leads?.filter((l: { status: string }) => l.status === 'lost').length || 0,
        };

        return { data: summary, error: null };
    } catch (err) {
        console.error('Error in getLeadsSummary:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch leads summary.',
        };
    }
}
