"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import {
  Car,
  Users,
  HandshakeIcon,
  TrendingUp,
  DollarSign,
  CircleUser,
  LayoutGrid,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  FileText,
  ShieldAlert,
  X,
  ShoppingCart,
  Repeat2,
  CreditCard,
  Globe,
  BookOpen,
  BookText,
  Wallet,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { RevenueChart, DealStatusChart } from "@/components/charts";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTranslations } from "@/lib/hooks/use-translations";
import { getDashboardMetrics } from "@/lib/actions/dashboard";
import { filterNavByRole } from "@/lib/auth/permissions";
import {
  filterNavByStaffModules,
  type StaffModuleKey,
} from "@/lib/auth/module-access";
import {
  subscribeToDeals,
  subscribeToLeads,
  subscribeToVehicles,
} from "@/lib/supabase/realtime";
import { isFeatureEnabled } from "@/lib/feature-flags";

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return null;
  const chartData = useMemo(() => data.map((v, i) => ({ i, v })), [data]);

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 6, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id={`spark-${color.replace("#", "")}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${color.replace("#", "")})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type ModuleKey =
  | "dashboard"
  | "today_book"
  | "inventory"
  | "sales"
  | "exchange_deals"
  | "financing"
  | "japan_import"
  | "leads"
  | "deals"
  | "investors"
  | "clients"
  | "cash_flow"
  | "ledger"
  | "documents"
  | "settings";

type QuickActionItem = {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  moduleKey: ModuleKey;
  accentClass: string;
};

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organization, profile } = useAuthStore();
  const { t } = useTranslations();
  // Charts should be visible by default; user preference persisted.
  const [showCharts, setShowCharts] = useState(true);
  const adminRequired = searchParams.get("error") === "admin_required";
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metrics, setMetrics] =
    useState<Awaited<ReturnType<typeof getDashboardMetrics>>["data"]>(null);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  const DEFAULT_VISIBLE_STAT_IDS = useMemo(
    () => [
      "totalVehicles",
      "activeLeads",
      "dealsThisMonth",
      "pendingDeals",
      "totalInvestors",
      "totalClients",
      "revenueThisMonth",
    ],
    []
  );

  const [visibleStatIds, setVisibleStatIds] = useState<Set<string>>(
    () => new Set(DEFAULT_VISIBLE_STAT_IDS)
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dashboard.visibleStatIds");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
        setVisibleStatIds(new Set(parsed));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dashboard.showCharts");
      if (raw === null) return;
      if (raw === "0" || raw === "false") setShowCharts(false);
      if (raw === "1" || raw === "true") setShowCharts(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("dashboard.showCharts", showCharts ? "1" : "0");
    } catch {
      // ignore
    }
  }, [showCharts]);

  const setAndPersistVisibleStatIds = (next: Set<string>) => {
    setVisibleStatIds(next);
    try {
      localStorage.setItem(
        "dashboard.visibleStatIds",
        JSON.stringify(Array.from(next))
      );
    } catch {
      // ignore
    }
  };

  const toggleStatVisibility = (id: string) => {
    setVisibleStatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(
          "dashboard.visibleStatIds",
          JSON.stringify(Array.from(next))
        );
      } catch {
        // ignore
      }
      return next;
    });
  };

  const dismissAdminRequired = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    router.replace(url.pathname + (url.search || ""));
  };

  const loadMetrics = async () => {
    try {
      setMetricsLoading(true);
      const result = await getDashboardMetrics();
      if (result.error) {
        setMetricsError(result.error);
        setMetrics(result.data);
      } else {
        setMetricsError(null);
        setMetrics(result.data);
      }
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const orgId = organization?.id;
    if (!orgId) return;

    // Refresh KPIs/charts when underlying tables change.
    const unsubVehicles = subscribeToVehicles(
      { onInsert: loadMetrics, onUpdate: loadMetrics, onDelete: loadMetrics },
      orgId
    );
    const unsubLeads = subscribeToLeads(
      { onInsert: loadMetrics, onUpdate: loadMetrics, onDelete: loadMetrics },
      orgId
    );
    const unsubDeals = subscribeToDeals(
      { onInsert: loadMetrics, onUpdate: loadMetrics, onDelete: loadMetrics },
      orgId
    );

    return () => {
      unsubVehicles?.();
      unsubLeads?.();
      unsubDeals?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

  const stats = useMemo(
    () => [
      {
        id: "totalVehicles",
        title: t("dashboard.totalVehicles"),
        value: metricsLoading ? "—" : String(metrics?.totalVehicles ?? 0),
        description: "Total in inventory",
        icon: Car,
        accent: "#8b5cf6", // purple (vehicles)
        trend: "up" as const,
        spark: [],
      },
      {
        id: "activeLeads",
        title: t("dashboard.activeLeads"),
        value: metricsLoading ? "—" : String(metrics?.activeLeads ?? 0),
        description: "Open leads",
        icon: Users,
        accent: "#f97316", // orange (leads)
        trend: "up" as const,
        spark: [],
      },
      {
        id: "dealsThisMonth",
        title: t("dashboard.dealsThisMonth"),
        value: metricsLoading ? "—" : String(metrics?.dealsThisMonth ?? 0),
        description: "Deals in current month",
        icon: HandshakeIcon,
        accent: "#3b82f6", // blue (deals)
        trend: "up" as const,
        spark: [],
      },
      {
        id: "pendingDeals",
        title: "Pending Deals",
        value: metricsLoading ? "—" : String(metrics?.pendingDeals ?? 0),
        description: "Awaiting completion",
        icon: HandshakeIcon,
        accent: "#a855f7", // purple/fuchsia
        trend: "up" as const,
        spark: [],
      },
      {
        id: "totalInvestors",
        title: "Investors",
        value: metricsLoading ? "—" : String(metrics?.totalInvestors ?? 0),
        description: "Total investors",
        icon: TrendingUp,
        accent: "#14b8a6", // teal
        trend: "up" as const,
        spark: [],
      },
      {
        id: "totalClients",
        title: "Clients",
        value: metricsLoading ? "—" : String(metrics?.totalClients ?? 0),
        description: "Total clients",
        icon: CircleUser,
        accent: "#06b6d4", // cyan
        trend: "up" as const,
        spark: [],
      },
      {
        id: "revenueThisMonth",
        title: t("dashboard.revenue"),
        value: metricsLoading
          ? "—"
          : `PKR ${(metrics?.revenueThisMonth ?? 0).toLocaleString()}`,
        description: "Revenue (this month)",
        icon: DollarSign,
        accent: "#10b981", // emerald (revenue)
        trend: "up" as const,
        spark: [],
        badgeBelow: true,
      },
    ],
    [t, metrics, metricsLoading]
  );

  const visibleStats = useMemo(
    () => stats.filter((s: any) => visibleStatIds.has(s.id)),
    [stats, visibleStatIds]
  );

  const createActions = useMemo(
    () => [
      {
        name: t("dashboard.addVehicle"),
        description: "Add a new vehicle and publish inventory details",
        href: "/dashboard/inventory/new",
        icon: Car,
        accentClass:
          "bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/30",
      },
      {
        name: t("dashboard.createLead"),
        description: "Capture a new lead and assign follow-up",
        href: "/dashboard/leads/new",
        icon: Users,
        accentClass:
          "bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-orange-500/30",
      },
      {
        name: t("dashboard.recordDeal"),
        description: "Create a deal record and track pending payments",
        href: "/dashboard/deals/new",
        icon: HandshakeIcon,
        accentClass:
          "bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-blue-500/30",
      },
      {
        name: "Record Sale",
        description: "Complete a sale with vehicle and customer details",
        href: "/dashboard/sales/new",
        icon: ShoppingCart,
        accentClass:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
      },
      {
        name: t("dashboard.uploadDocuments"),
        description: "Open documents module to upload and manage files",
        href: "/dashboard/documents",
        icon: FileText,
        accentClass:
          "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-cyan-500/30",
      },
    ],
    [t]
  );

  const moduleActions = useMemo<QuickActionItem[]>(
    () => [
      {
        name: "Today Book",
        description: "See today's activity and cash snapshot",
        href: "/dashboard/today-book",
        icon: BookOpen,
        moduleKey: "today_book",
        accentClass:
          "bg-slate-500/10 text-slate-700 dark:text-slate-300 ring-slate-500/30",
      },
      {
        name: "Inventory",
        description: "Browse and manage all vehicles",
        href: "/dashboard/inventory",
        icon: Car,
        moduleKey: "inventory",
        accentClass:
          "bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/30",
      },
      {
        name: "Sales",
        description: "Track sold units and sale progress",
        href: "/dashboard/sales",
        icon: ShoppingCart,
        moduleKey: "sales",
        accentClass:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
      },
      {
        name: "Exchange",
        description: "Manage customer vehicle exchange deals",
        href: "/dashboard/exchange-deals",
        icon: Repeat2,
        moduleKey: "exchange_deals",
        accentClass:
          "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-indigo-500/30",
      },
      {
        name: "Financing",
        description: "Handle financing applications and EMI",
        href: "/dashboard/financing",
        icon: CreditCard,
        moduleKey: "financing",
        accentClass:
          "bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-purple-500/30",
      },
      {
        name: "Japan Import",
        description: "Manage import cases and shipment flow",
        href: "/dashboard/japan-import",
        icon: Globe,
        moduleKey: "japan_import",
        accentClass:
          "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/30",
      },
      {
        name: "Leads",
        description: "Follow up leads and conversion pipeline",
        href: "/dashboard/leads",
        icon: Users,
        moduleKey: "leads",
        accentClass:
          "bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-orange-500/30",
      },
      {
        name: "Pending Deals",
        description: "Track due payments and overdue deals",
        href: "/dashboard/deals/pending",
        icon: HandshakeIcon,
        moduleKey: "deals",
        accentClass:
          "bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-blue-500/30",
      },
      {
        name: "Investors",
        description: "View investors and profit participation",
        href: "/dashboard/investors",
        icon: TrendingUp,
        moduleKey: "investors",
        accentClass:
          "bg-teal-500/10 text-teal-700 dark:text-teal-300 ring-teal-500/30",
      },
      {
        name: "Clients",
        description: "Access customer records and interactions",
        href: "/dashboard/clients",
        icon: CircleUser,
        moduleKey: "clients",
        accentClass:
          "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-cyan-500/30",
      },
      {
        name: "Cash Flow",
        description: "Review income, expenses, and categories",
        href: "/dashboard/cash-flow",
        icon: Wallet,
        moduleKey: "cash_flow",
        accentClass:
          "bg-lime-500/10 text-lime-700 dark:text-lime-300 ring-lime-500/30",
      },
      {
        name: "Ledger",
        description: "Open ledger entries and balances",
        href: "/dashboard/ledger",
        icon: BookText,
        moduleKey: "ledger",
        accentClass:
          "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30",
      },
      {
        name: "Documents",
        description: "Store and retrieve dealership paperwork",
        href: "/dashboard/documents",
        icon: FileText,
        moduleKey: "documents",
        accentClass:
          "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-cyan-500/30",
      },
      {
        name: "Settings",
        description: "Configure users, modules, and preferences",
        href: "/dashboard/settings",
        icon: Zap,
        moduleKey: "settings",
        accentClass:
          "bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-500/30",
      },
    ],
    []
  );

  const visibleModuleActions = useMemo(() => {
    const featureFlags = organization?.feature_flags;
    const role = profile?.role;

    const isEnabled = (moduleKey: ModuleKey): boolean => {
      if (
        moduleKey === "dashboard" ||
        moduleKey === "today_book" ||
        moduleKey === "settings"
      )
        return true;

      switch (moduleKey) {
        case "inventory":
          return isFeatureEnabled(featureFlags, "enable_inventory");
        case "sales":
          return isFeatureEnabled(featureFlags, "enable_sales");
        case "exchange_deals":
          return isFeatureEnabled(featureFlags, "enable_exchange_deals");
        case "financing":
          return isFeatureEnabled(featureFlags, "enable_financing");
        case "leads":
          return isFeatureEnabled(featureFlags, "enable_leads");
        case "deals":
          return isFeatureEnabled(featureFlags, "enable_deals");
        case "documents":
          return isFeatureEnabled(featureFlags, "enable_documents");
        case "cash_flow":
          return isFeatureEnabled(featureFlags, "enable_cash_flow");
        case "ledger":
          return isFeatureEnabled(featureFlags, "enable_ledger");
        case "clients":
          return isFeatureEnabled(featureFlags, "enable_clients");
        case "investors":
          return isFeatureEnabled(featureFlags, "enable_investors");
        case "japan_import":
          return isFeatureEnabled(featureFlags, "enable_japan_import", false);
        default:
          return true;
      }
    };

    const enabled = moduleActions.filter((item) => isEnabled(item.moduleKey));
    const staffModuleAccessRaw = organization?.settings?.staff_module_access;
    const staffModuleAccess =
      staffModuleAccessRaw && typeof staffModuleAccessRaw === "object"
        ? (staffModuleAccessRaw as Record<string, unknown>)
        : undefined;
    const staffOverrideRaw = staffModuleAccess?.[profile?.id ?? ""];
    const staffOverride = Array.isArray(staffOverrideRaw)
      ? staffOverrideRaw.filter(
          (module): module is StaffModuleKey => typeof module === "string"
        )
      : undefined;
    const staffFiltered =
      Array.isArray(staffOverride) && staffOverride.length
        ? filterNavByStaffModules({
            modules: staffOverride,
            items: enabled,
          })
        : enabled;

    return role ? filterNavByRole({ role, items: staffFiltered }) : staffFiltered;
  }, [moduleActions, organization?.feature_flags, organization?.settings, profile]);

  return (
    <div
      className="space-y-8 pb-8"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {adminRequired && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 relative">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">
            Platform administration
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            The area you tried to open is reserved for platform administrators only.
            Your account has access to this dashboard to manage your organization.
            If you need platform-level support, please contact your software provider.
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 text-amber-600 hover:bg-amber-200/50 dark:text-amber-400 dark:hover:bg-amber-800/50"
            onClick={dismissAdminRequired}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {metricsError &&
        metricsError !== "Unauthorized" &&
        metricsError !== "No organization found" && (
          <Alert className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
            <AlertTitle className="text-red-900 dark:text-red-100">
              Dashboard data error
            </AlertTitle>
            <AlertDescription className="text-red-800 dark:text-red-200">
              {metricsError}
            </AlertDescription>
          </Alert>
        )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("common.welcome")}, {profile?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-muted-foreground">
            {t("dashboard.subtitle", {
              name: organization?.name || "your dealership",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Cards
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Show cards</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {stats.map((s: any) => (
                <DropdownMenuCheckboxItem
                  key={s.id}
                  checked={visibleStatIds.has(s.id)}
                  onCheckedChange={() => toggleStatVisibility(s.id)}
                >
                  {s.title}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setAndPersistVisibleStatIds(new Set(DEFAULT_VISIBLE_STAT_IDS))
                }
              >
                Reset (all)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setAndPersistVisibleStatIds(new Set())}
              >
                Hide all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={() => setShowCharts((v) => !v)}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {showCharts ? t("dashboard.hideCharts") : t("dashboard.showCharts")}
            {showCharts ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Sheet open={quickActionsOpen} onOpenChange={setQuickActionsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Zap className="h-4 w-4" />
                Quick Actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:max-w-2xl p-0 overflow-y-auto"
            >
              <div className="p-4 sm:p-6 space-y-6">
                <SheetHeader className="space-y-2 text-left">
                  <SheetTitle className="text-xl sm:text-2xl">
                    Dealer Quick Actions
                  </SheetTitle>
                  <SheetDescription>
                    Open any major area in one click. Designed for fast navigation
                    on desktop and mobile.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Create Fast
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {createActions.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => {
                          setQuickActionsOpen(false);
                          router.push(item.href);
                        }}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 h-10 w-10 shrink-0 rounded-lg ring-1 flex items-center justify-center",
                              item.accentClass
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base">
                              {item.name}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Navigate Modules
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {visibleModuleActions.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => {
                          setQuickActionsOpen(false);
                          router.push(item.href);
                        }}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 h-10 w-10 shrink-0 rounded-lg ring-1 flex items-center justify-center",
                              item.accentClass
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base">
                              {item.name}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleStats.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm">No cards selected</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Use the “Cards” menu to choose what you want to see.
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setAndPersistVisibleStatIds(new Set(DEFAULT_VISIBLE_STAT_IDS))
                }
              >
                Reset cards
              </Button>
            </CardContent>
          </Card>
        ) : (
          visibleStats.map((stat: any) => {
            const Pill = (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                  stat.trend === "up"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 shrink-0" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate">{stat.description}</span>
              </span>
            );

            return (
              <Card
                key={stat.title}
                className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>

                    {stat.badgeBelow ? (
                      <div className="space-y-2">
                        <div className="text-xl sm:text-2xl font-bold tabular-nums leading-tight break-words font-figures">
                          {stat.value}
                        </div>
                        <div className="w-fit">{Pill}</div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="min-w-0 truncate text-xl sm:text-2xl font-bold tabular-nums leading-none font-figures">
                          {stat.value}
                        </span>
                        <span className="shrink-0">{Pill}</span>
                      </div>
                    )}
                  </div>

                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ml-2"
                    style={{ backgroundColor: `${stat.accent}15` }}
                  >
                    <stat.icon
                      className="h-5 w-5"
                      style={{ color: stat.accent }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <MiniSparkline data={stat.spark} color={stat.accent} />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Charts (hidden by default) */}
      {showCharts && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="lg:col-span-4">
            <RevenueChart data={metrics?.revenueByMonth || []} />
          </div>
          <div className="lg:col-span-3">
            <DealStatusChart data={metrics?.dealStatus || []} />
          </div>
        </div>
      )}

      {/* Recent Activity - Full Width */}
      <RecentActivities limit={20} />
    </div>
  );
}
