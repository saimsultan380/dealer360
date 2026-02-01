'use server';

import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types/database';

export async function getUsers(): Promise<{ data: Profile[] | null; error: string | null }> {
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

        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, full_name, role, is_active')
            .eq('organization_id', profile.organization_id)
            .eq('is_active', true)
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Error fetching users:', error);
            return { data: null, error: error.message };
        }

        return { data: users as Profile[], error: null };
    } catch (err) {
        console.error('Error in getUsers:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch users.',
        };
    }
}
