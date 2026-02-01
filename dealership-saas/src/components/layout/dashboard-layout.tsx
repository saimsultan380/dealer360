'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar, Header } from '@/components/layout';
import { MobileBottomNav } from './mobile-bottom-nav';
import { useSidebarStore, useAuthStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Organization } from '@/lib/types/database';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { isCollapsed } = useSidebarStore();
    const { setUser, setProfile, setOrganization, setLoading } = useAuthStore();

    useEffect(() => {
        const supabase = createClient();

        // Get initial session
        const initAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    setUser({ id: user.id, email: user.email || '' });

                    // Fetch profile
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    const profile = profileData as Profile | null;

                    if (profile) {
                        setProfile(profile);

                        // Fetch organization
                        if (profile.organization_id) {
                            const { data: orgData } = await supabase
                                .from('organizations')
                                .select('*')
                                .eq('id', profile.organization_id)
                                .single();

                            const org = orgData as Organization | null;

                            if (org) {
                                setOrganization(org);
                            }
                        }
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setProfile(null);
                    setOrganization(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [setUser, setProfile, setOrganization, setLoading]);

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            {/* Header */}
            <Header />

            {/* Main Content */}
            <main
                className={cn(
                    'pt-14 sm:pt-16 transition-all duration-300',
                    'pb-20 lg:pb-0',
                    'lg:pl-64',
                    isCollapsed && 'lg:pl-16'
                )}
            >
                <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6">{children}</div>
            </main>

            {/* Mobile bottom navigation */}
            <MobileBottomNav />
        </div>
    );
}
