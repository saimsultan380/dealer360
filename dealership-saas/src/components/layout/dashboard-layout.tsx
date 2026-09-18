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
  loading: () => (
    <aside className="hidden lg:block fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background/95" />
  ),
});
const Header = dynamic(() => import("./header").then((m) => m.Header), {
  ssr: false,
  loading: () => (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 border-b bg-background lg:left-64" />
  ),
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
    let isActive = true;

    // Get initial session
    const initAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isActive) return;

        if (user) {
          setUser({ id: user.id, email: user.email || "" });

          // Fetch profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (!isActive) return;
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

              if (!isActive) return;
              const org = orgData as Organization | null;

              if (org) {
                setOrganization(org);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize dashboard auth state:", error);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isActive) return;
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setOrganization(null);
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setOrganization, setLoading]);

  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-muted/30">
      {/* Desktop Sidebar - fixed so it doesn't affect flex */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Header */}
      <Header />

      {/* Main Content - scrollable so Theme and all options stay reachable on small desktop */}
      <main
        className={cn(
          "flex-1 min-h-0 overflow-x-hidden overflow-y-auto transition-all duration-300",
          "pt-[calc(3.5rem+env(safe-area-inset-top))] sm:pt-[calc(4rem+env(safe-area-inset-top))]",
          "pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8",
          "lg:pl-64",
          isCollapsed && "lg:pl-16"
        )}
      >
        <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
