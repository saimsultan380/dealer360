"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useSidebarStore, useAuthStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Organization } from "@/lib/types/database";

// Avoid SSR for Radix-driven components to prevent hydration id mismatches.
const Sidebar = dynamic(() => import("./sidebar").then((m) => m.Sidebar), {
  ssr: false,
});
const Header = dynamic(() => import("./header").then((m) => m.Header), {
  ssr: false,
});
const MobileBottomNav = dynamic(
  () => import("./mobile-bottom-nav").then((m) => m.MobileBottomNav),
  { ssr: false }
);

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
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUser({ id: user.id, email: user.email || "" });

          // Fetch profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          const profile = profileData as Profile | null;

          if (profile) {
            setProfile(profile);

            // Fetch organization
            if (profile.organization_id) {
              const { data: orgData } = await supabase
                .from("organizations")
                .select("*")
                .eq("id", profile.organization_id)
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setOrganization(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setOrganization, setLoading]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Desktop Sidebar - fixed so it doesn't affect flex */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Header */}
      <Header />

      {/* Main Content - scrollable so Theme and all options stay reachable on small desktop */}
      <main
        className={cn(
          "flex-1 min-h-0 overflow-y-auto transition-all duration-300",
          "pt-14 sm:pt-16",
          "pb-20 lg:pb-6",
          "lg:pl-64",
          isCollapsed && "lg:pl-16"
        )}
      >
        <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
