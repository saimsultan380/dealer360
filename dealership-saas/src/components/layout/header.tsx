"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  LogOut,
  User,
  Settings,
  AlertTriangle,
  Clock,
  Building2,
  Menu,
  Car,
  Users,
  Handshake,
  FileText,
  Wallet,
  Search,
  Command,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSidebarStore, useAuthStore, useBreadcrumbStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { MobileSidebar } from "./mobile-sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GlobalSearch } from "./global-search";
// import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { getPendingDeals, PendingDeal } from "@/lib/actions/deals";
import {
  getRecentActivities,
  RecentActivity,
} from "@/lib/actions/recent-activities";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, organization } = useAuthStore();
  const { isCollapsed } = useSidebarStore();
  const { breadcrumbLabel, setBreadcrumbLabel } = useBreadcrumbStore();
  const [pendingDeals, setPendingDeals] = useState<PendingDeal[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [brandLogoError, setBrandLogoError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Get module name from pathname
  const getModuleName = () => {
    if (pathname === "/dashboard" || pathname === "/dashboard/")
      return "Dashboard";
    if (pathname.startsWith("/dashboard/today-book")) return "Today Book";
    if (pathname.startsWith("/dashboard/inventory")) return "Inventory";
    if (pathname.startsWith("/dashboard/leads")) return "Leads";
    if (pathname.startsWith("/dashboard/deals")) return "Deals";
    if (pathname.startsWith("/dashboard/investors")) return "Investors";
    if (pathname.startsWith("/dashboard/clients")) return "Clients";
    if (pathname.startsWith("/dashboard/cash-flow")) return "Cash Flow";
    if (pathname.startsWith("/dashboard/documents")) return "Documents";
    if (pathname.startsWith("/dashboard/settings")) return "Settings";
    if (pathname.startsWith("/dashboard/profile")) return "Profile";
    return "Dashboard";
  };

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const { data } = await getPendingDeals();
        if (data) {
          setPendingDeals(data);
          // Count overdue and upcoming (within 7 days) deals
          const overdue = data.filter((d) => d.is_overdue).length;
          const upcoming = data.filter(
            (d) =>
              !d.is_overdue &&
              d.days_until_payment !== null &&
              d.days_until_payment <= 7 &&
              d.days_until_payment >= 0
          ).length;
          setNotificationCount(overdue + upcoming);
        }

        const { data: activities } = await getRecentActivities(5);
        if (activities) {
          setRecentActivities(activities);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }
    fetchNotifications();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(max-width: 639px)");
    const onChange = () => setIsMobile(mql.matches);

    onChange();

    // Safari < 14 support
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    // eslint-disable-next-line deprecation/deprecation
    mql.addListener(onChange);
    // eslint-disable-next-line deprecation/deprecation
    return () => mql.removeListener(onChange);
  }, []);

  useEffect(() => {
    // If org logo changes (e.g. after upload), try it again.
    setBrandLogoError(false);
  }, [organization?.logo_url]);

  // Close mobile sidebar when route changes (e.g. after clicking a nav link)
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const overdueDeals = pendingDeals.filter((d) => d.is_overdue);
  const upcomingDeals = pendingDeals.filter(
    (d) =>
      !d.is_overdue &&
      d.days_until_payment !== null &&
      d.days_until_payment <= 7 &&
      d.days_until_payment >= 0
  );

  const moduleName = getModuleName();
  const showBrandText = isMobile || isCollapsed;
  const fallbackLogoSrc = "/dashboard-logo.svg";
  const brandLogoSrc = !brandLogoError
    ? organization?.logo_url || fallbackLogoSrc
    : fallbackLogoSrc;

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b",
        "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "px-2 sm:px-4 md:px-6 transition-all duration-300",
        // Only offset on desktop; keep full-width on mobile.
        isCollapsed ? "lg:left-16" : "lg:left-64"
      )}
    >
      {/* Left Side - Mobile Menu, Brand, Module */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-2 sm:pr-4 md:pr-6">
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 sm:h-10 sm:w-10"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 max-w-[85vw] p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <MobileSidebar />
          </SheetContent>
        </Sheet>

        {/* Brand (text only, no icon) */}
        <Link
          href="/dashboard"
          className={cn(
            "hidden sm:flex flex-col leading-tight min-w-0 rounded-md px-1.5 py-1 transition-colors",
            "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            !showBrandText && "lg:hidden"
          )}
          aria-label="Go to dashboard"
        >
          <span className="text-sm font-semibold truncate">
            {organization?.name || "Dealer 360"}
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            Dealership management
          </span>
        </Link>

        {/* Page title + breadcrumb – refined hierarchy and readable breadcrumb */}
        <div
          className={cn(
            "min-w-0 flex-1 pl-3 sm:pl-4 py-1.5",
            "flex flex-col justify-center gap-1",
            "border-l border-border/80"
          )}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {moduleName}
            </h1>
            {organization?.name && (
              <span className="hidden sm:inline-flex items-center shrink-0 gap-1 text-xs text-muted-foreground">
                <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                <span className="truncate max-w-[140px]">{organization.name}</span>
              </span>
            )}
          </div>
          {pathname !== "/dashboard" && pathname !== "/dashboard/" && (
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0"
            >
              {breadcrumbLabel ? (
                <>
                  <span className="truncate opacity-80">{moduleName}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  <span className="truncate font-medium text-foreground/95">
                    {breadcrumbLabel}
                  </span>
                </>
              ) : (
                <span className="truncate font-mono text-[11px] opacity-90">
                  {pathname
                    .replace("/dashboard", "")
                    .split("/")
                    .filter(Boolean)
                    .join(" / ") || "/"}
                </span>
              )}
            </nav>
          )}
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Right Side - Menu, Notification, User */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
        {/* Language Switcher */}
        {/* <LanguageSwitcher /> */}

        {/* Global Search Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchOpen(true)}
          className="relative h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center sm:hidden"
          aria-label="Search"
        >
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <Button
          variant="outline"
          onClick={() => setSearchOpen(true)}
          className="hidden sm:inline-flex items-center gap-2 h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="pointer-events-none hidden lg:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-destructive text-[9px] sm:text-[10px] font-medium text-destructive-foreground flex items-center justify-center min-w-[16px] sm:min-w-[20px] px-0.5">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[calc(100vw-1rem)] sm:w-80 md:w-96 max-h-[80vh] overflow-y-auto z-50"
            align={isMobile ? "center" : "end"}
            sideOffset={8}
            alignOffset={isMobile ? 0 : -8}
            collisionPadding={isMobile ? 8 : 0}
          >
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {notificationCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {notificationCount}
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* {overdueDeals.length === 0 && upcomingDeals.length === 0 ? (
                            <div className="p-6 flex items-center justify-center">
                                <p className="text-sm text-muted-foreground text-center">
                                    No pending notifications
                                </p>
                            </div>
                        ) : ( */}
            <>
              {overdueDeals.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-destructive font-semibold">
                    Overdue Payments ({overdueDeals.length})
                  </DropdownMenuLabel>
                  {overdueDeals.slice(0, 5).map((deal) => (
                    <DropdownMenuItem
                      key={deal.id}
                      className="flex flex-col items-start gap-1 p-2 sm:p-3 cursor-pointer focus:bg-destructive/10"
                      onClick={() => {
                        router.push(`/dashboard/deals/${deal.id}`);
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {deal.customer_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {deal.vehicle_make} {deal.vehicle_model}
                          </p>
                          <p className="text-xs font-semibold text-destructive mt-1">
                            PKR {deal.remaining_amount.toLocaleString()} overdue
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  {overdueDeals.length > 5 && (
                    <DropdownMenuItem
                      className="text-center text-xs text-muted-foreground"
                      onClick={() =>
                        router.push("/dashboard/deals/pending?filter=overdue")
                      }
                      onSelect={(e) => e.preventDefault()}
                    >
                      View {overdueDeals.length - 5} more overdue deals
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}

              {upcomingDeals.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    Upcoming Payments ({upcomingDeals.length})
                  </DropdownMenuLabel>
                  {upcomingDeals.slice(0, 5).map((deal) => (
                    <DropdownMenuItem
                      key={deal.id}
                      className="flex flex-col items-start gap-1 p-2 sm:p-3 cursor-pointer focus:bg-amber-50 dark:focus:bg-amber-950"
                      onClick={() => {
                        router.push(`/dashboard/deals/${deal.id}`);
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {deal.customer_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {deal.vehicle_make} {deal.vehicle_model}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                              PKR {deal.remaining_amount.toLocaleString()}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {deal.days_until_payment === 0
                                ? "Due today"
                                : deal.days_until_payment === 1
                                  ? "Due tomorrow"
                                  : `Due in ${deal.days_until_payment} days`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  {upcomingDeals.length > 5 && (
                    <DropdownMenuItem
                      className="text-center text-xs text-muted-foreground"
                      onClick={() =>
                        router.push("/dashboard/deals/pending?filter=upcoming")
                      }
                    >
                      View {upcomingDeals.length - 5} more upcoming deals
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                className="text-center justify-center font-medium"
                onClick={() => router.push("/dashboard/deals/pending")}
                onSelect={(e) => e.preventDefault()}
              >
                <span>View All Pending Deals</span>
              </DropdownMenuItem>
            </>

            {recentActivities.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">
                  Recent Activity
                </DropdownMenuLabel>
                {recentActivities.map((activity) => (
                  <DropdownMenuItem
                    key={activity.id}
                    className="flex flex-col items-start gap-1 p-2 sm:p-3 cursor-pointer"
                    onClick={() => {
                      if (activity.link) router.push(activity.link);
                    }}
                  >
                    <div className="flex items-start gap-2 w-full">
                      {activity.type === "vehicle" && (
                        <Car className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      )}
                      {activity.type === "sale" && (
                        <Handshake className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      )}
                      {activity.type === "deal" && (
                        <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      )}
                      {activity.type === "lead" && (
                        <Users className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      )}
                      {activity.type === "investor" && (
                        <Building2 className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                      )}
                      {activity.type === "client" && (
                        <User className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                      )}
                      {activity.type === "cash_flow" && (
                        <Wallet className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                      )}
                      {![
                        "vehicle",
                        "sale",
                        "deal",
                        "lead",
                        "investor",
                        "client",
                        "cash_flow",
                      ].includes(activity.type) && (
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(activity.timestamp).toLocaleDateString()}{" "}
                          {new Date(activity.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {overdueDeals.length === 0 &&
              upcomingDeals.length === 0 &&
              recentActivities.length === 0 && (
                <div className="p-6 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground text-center">
                    No notifications
                  </p>
                </div>
              )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full"
            >
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                <AvatarImage
                  src={profile?.avatar_url || undefined}
                  alt={profile?.full_name || "User"}
                />
                <AvatarFallback className="text-xs sm:text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 z-50" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.full_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {profile?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
