import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";
import type { UserRole } from "@/lib/types/database";
import { canAccessPath } from "@/lib/auth/permissions";
import {
  canAccessPathByStaffModules,
  type StaffModuleKey,
} from "@/lib/auth/module-access";
import type { FeatureFlags } from "@/lib/types/database";
import { isFeatureEnabled } from "@/lib/feature-flags";

type OrganizationAccessPayload = {
  feature_flags?: Partial<FeatureFlags> | null;
  settings?: Record<string, unknown> | null;
};

function isStaffModuleList(value: unknown): value is StaffModuleKey[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === "string")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optional dev bypass (defaults to TRUE - set NEXT_PUBLIC_DEV_BYPASS_AUTH=false to enable auth)
  const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH !== "false";
  const pathname = request.nextUrl.pathname;

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    "/maintenance",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect unauthenticated users to login (bypassed in dev mode)
  if (
    !DEV_BYPASS_AUTH &&
    !user &&
    !isPublicRoute &&
    !request.nextUrl.pathname.startsWith("/api")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Fetch profile for active users (needed for RBAC + deactivated accounts)
  let profile: {
    role?: string;
    is_active?: boolean;
    organization_id?: string | null;
  } | null = null;
  let profileReadError: string | null = null;
  if (!DEV_BYPASS_AUTH && user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, is_active, organization_id")
      .eq("id", user.id)
      .maybeSingle();
    profile = (data as any) ?? null;
    profileReadError = error?.message ?? null;

    // Block deactivated accounts everywhere except auth/public routes
    if (
      profile?.is_active === false &&
      !isPublicRoute &&
      !request.nextUrl.pathname.startsWith("/api")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "inactive");
      return NextResponse.redirect(url);
    }
  }

  // Some deployments end up with RLS that hides the current user's profile row (common for super_admin
  // with organization_id = NULL). In that case, fall back to the SECURITY DEFINER function.
  let cachedIsSuperAdmin: boolean | null = null;
  const isSuperAdmin = async () => {
    if (profile?.role === "super_admin") return true;
    if (cachedIsSuperAdmin !== null) return cachedIsSuperAdmin;
    try {
      const { data, error } = await supabase.rpc("is_super_admin");
      cachedIsSuperAdmin = !error && data === true;
      return cachedIsSuperAdmin;
    } catch {
      cachedIsSuperAdmin = false;
      return false;
    }
  };

  // Role-based redirect for /admin routes
  if (!DEV_BYPASS_AUTH && user && pathname.startsWith("/admin")) {
    // If we can't read the profile row due to RLS, don't incorrectly treat the user as non-admin.
    // Use `is_super_admin()` as a robust source of truth.
    const allowed = await isSuperAdmin();
    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("error", "admin_required");
      if (profileReadError)
        url.searchParams.set("details", "profile_hidden_by_rls");
      return NextResponse.redirect(url);
    }
  }

  // Role-based restrictions for dashboard routes (feature-limited staff access)
  if (!DEV_BYPASS_AUTH && user && pathname.startsWith("/dashboard")) {
    const role = (
      (profile?.role ?? null) === "super_admin" || (await isSuperAdmin())
        ? "super_admin"
        : (profile?.role ?? "salesperson")
    ) as UserRole;
    if (!canAccessPath({ role, pathname: request.nextUrl.pathname })) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
  }

  // Maintenance mode: redirect non-super-admin users away from app routes
  if (
    !DEV_BYPASS_AUTH &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))
  ) {
    const allowed = user ? await isSuperAdmin() : false;
    if (!allowed) {
      try {
        const { data } = await supabase
          .from("platform_public_settings")
          .select("maintenance_mode")
          .eq("id", 1)
          .maybeSingle();
        const maintenanceMode =
          ((data as { maintenance_mode?: boolean } | null)?.maintenance_mode ??
            false) === true;
        if (maintenanceMode && !pathname.startsWith("/maintenance")) {
          const url = request.nextUrl.clone();
          url.pathname = "/maintenance";
          return NextResponse.redirect(url);
        }
      } catch {
        // fail open if table/migration isn't applied yet
      }
    }
  }

  // Module-based restrictions (per-organization feature flags) + per-staff module overrides
  if (!DEV_BYPASS_AUTH && user && pathname.startsWith("/dashboard")) {
    const orgId = profile?.organization_id ?? null;
    if (orgId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("feature_flags, settings")
        .eq("id", orgId)
        .single();

      const orgPayload = (org ?? null) as OrganizationAccessPayload | null;
      const flags = orgPayload?.feature_flags ?? {};
      const settings = orgPayload?.settings ?? {};
      const rawStaffAccess = settings["staff_module_access"];
      const staffMap =
        rawStaffAccess && typeof rawStaffAccess === "object"
          ? (rawStaffAccess as Record<string, unknown>)
          : undefined;
      const staffOverride = staffMap?.[user.id];

      // If staff override exists, enforce it at the route level.
      if (isStaffModuleList(staffOverride) && staffOverride.length) {
        if (
          !canAccessPathByStaffModules({
            modules: staffOverride,
            pathname: request.nextUrl.pathname,
          })
        ) {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          url.searchParams.set("error", "forbidden");
          return NextResponse.redirect(url);
        }
      }

      const pathname = request.nextUrl.pathname;
      const blocked =
        (pathname.startsWith("/dashboard/documents") &&
          !isFeatureEnabled(flags, "enable_documents")) ||
        (pathname.startsWith("/dashboard/leads") &&
          !isFeatureEnabled(flags, "enable_leads")) ||
        (pathname.startsWith("/dashboard/deals") &&
          !isFeatureEnabled(flags, "enable_deals")) ||
        (pathname.startsWith("/dashboard/exchange-deals") &&
          !isFeatureEnabled(flags, "enable_exchange_deals")) ||
        (pathname.startsWith("/dashboard/financing") &&
          !isFeatureEnabled(flags, "enable_financing")) ||
        (pathname.startsWith("/dashboard/inventory") &&
          !isFeatureEnabled(flags, "enable_inventory")) ||
        (pathname.startsWith("/dashboard/sales") &&
          !isFeatureEnabled(flags, "enable_sales")) ||
        (pathname.startsWith("/dashboard/investors") &&
          !isFeatureEnabled(flags, "enable_investors")) ||
        (pathname.startsWith("/dashboard/clients") &&
          !isFeatureEnabled(flags, "enable_clients")) ||
        (pathname.startsWith("/dashboard/cash-flow") &&
          !isFeatureEnabled(flags, "enable_cash_flow")) ||
        (pathname.startsWith("/dashboard/ledger") &&
          !isFeatureEnabled(flags, "enable_ledger")) ||
        (pathname.startsWith("/dashboard/japan-import") &&
          !isFeatureEnabled(flags, "enable_japan_import"));

      if (blocked) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.searchParams.set("error", "module_disabled");
        return NextResponse.redirect(url);
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && isPublicRoute) {
    // If account is inactive, allow access to login so they can see the message
    if (!DEV_BYPASS_AUTH && profile?.is_active === false) {
      return supabaseResponse;
    }

    const url = request.nextUrl.clone();
    if (
      !DEV_BYPASS_AUTH &&
      (profile?.role === "super_admin" || (await isSuperAdmin()))
    ) {
      url.pathname = "/admin";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse

  return supabaseResponse;
}
