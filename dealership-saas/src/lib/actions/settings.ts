'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Profile, Organization } from '@/lib/types/database';

export interface ProfileUpdateData {
    full_name?: string;
    phone?: string;
    avatar_url?: string | null;
}

export interface PasswordUpdateData {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

export interface OrganizationUpdateData {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    logo_url?: string | null;
}

// =============================================================================
// PROFILE MANAGEMENT
// =============================================================================

export async function getCurrentProfile(): Promise<{ data: Profile | null; error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return { data: null, error: error.message };
        }

        return { data: profile, error: null };
    } catch (err) {
        console.error('Error in getCurrentProfile:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch profile.',
        };
    }
}

export async function updateProfile(
    data: ProfileUpdateData
): Promise<{ data: Profile | null; error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Unauthorized' };
        }

        const updateData: any = {};
        if (data.full_name !== undefined) updateData.full_name = data.full_name;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;

        const { data: profile, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            return { data: null, error: error.message };
        }

        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard/profile');
        return { data: profile, error: null };
    } catch (err) {
        console.error('Error in updateProfile:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to update profile.',
        };
    }
}

// =============================================================================
// PASSWORD MANAGEMENT
// =============================================================================

export async function updatePassword(
    data: PasswordUpdateData
): Promise<{ error: string | null }> {
    try {
        if (data.new_password !== data.confirm_password) {
            return { error: 'New passwords do not match' };
        }

        if (data.new_password.length < 6) {
            return { error: 'Password must be at least 6 characters long' };
        }

        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: 'Unauthorized' };
        }

        // Update password using Supabase Auth
        const { error: updateError } = await supabase.auth.updateUser({
            password: data.new_password,
        });

        if (updateError) {
            console.error('Error updating password:', updateError);
            return { error: updateError.message };
        }

        return { error: null };
    } catch (err) {
        console.error('Error in updatePassword:', err);
        return {
            error: err instanceof Error ? err.message : 'Failed to update password.',
        };
    }
}

// =============================================================================
// ORGANIZATION MANAGEMENT
// =============================================================================

export async function getCurrentOrganization(): Promise<{ data: Organization | null; error: string | null }> {
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

        const { data: organization, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profile.organization_id)
            .single();

        if (error) {
            console.error('Error fetching organization:', error);
            return { data: null, error: error.message };
        }

        return { data: organization, error: null };
    } catch (err) {
        console.error('Error in getCurrentOrganization:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch organization.',
        };
    }
}

export async function updateOrganization(
    data: OrganizationUpdateData
): Promise<{ data: Organization | null; error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Unauthorized' };
        }

        // Check if user is admin or manager
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: null, error: 'No organization found' };
        }

        if (profile.role !== 'admin' && profile.role !== 'super_admin' && profile.role !== 'manager') {
            return { data: null, error: 'Insufficient permissions' };
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.city !== undefined) updateData.city = data.city;
        if (data.logo_url !== undefined) updateData.logo_url = data.logo_url;

        const { data: organization, error } = await supabase
            .from('organizations')
            .update(updateData)
            .eq('id', profile.organization_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating organization:', error);
            return { data: null, error: error.message };
        }

        revalidatePath('/dashboard/settings');
        return { data: organization, error: null };
    } catch (err) {
        console.error('Error in updateOrganization:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to update organization.',
        };
    }
}
