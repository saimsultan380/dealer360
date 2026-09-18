"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Users,
  HandshakeIcon,
  FileText,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  BookOpen,
  BookText,
  TrendingUp,
  CircleUser,
  Wallet,
  ShoppingCart,
  Repeat2,
  CreditCard,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore, useSidebarStore } from "@/lib/store";
import { filterNavByRole } from "@/lib/auth/permissions";
import {
  filterNavByStaffModules,
  type StaffModuleKey,
} from "@/lib/auth/module-access";
import { isFeatureEnabled } from "@/lib/feature-flags";

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
  | "documents";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  moduleKey: ModuleKey;
};

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    moduleKey: "dashboard",
  },
  {
    name: "Today Book",
    href: "/dashboard/today-book",
    icon: BookOpen,
    moduleKey: "today_book",
  },
  {
    name: "Inventory",
    href: "/dashboard/inventory",
    icon: Car,
    moduleKey: "inventory",
  },
  {
    name: "Sales",
    href: "/dashboard/sales",
    icon: ShoppingCart,
    moduleKey: "sales",
  },
  {
    name: "Exchange Deals",
    href: "/dashboard/exchange-deals",
    icon: Repeat2,
    moduleKey: "exchange_deals",
  },
  {
    name: "Financing",
    href: "/dashboard/financing",
    icon: CreditCard,
    moduleKey: "financing",
  },
  {
    name: "Japan Import",
    href: "/dashboard/japan-import",
    icon: Globe,
    moduleKey: "japan_import",
  },
  { name: "Leads", href: "/dashboard/leads", icon: Users, moduleKey: "leads" },
  {
    name: "Pending Deals",
    href: "/dashboard/deals/pending",
    icon: HandshakeIcon,
    moduleKey: "deals",
  },
  {
    name: "Investors",
    href: "/dashboard/investors",
    icon: TrendingUp,
    moduleKey: "investors",
  },
  {
    name: "Clients",
    href: "/dashboard/clients",
    icon: CircleUser,
    moduleKey: "clients",
  },
  {
    name: "Cash Flow",
    href: "/dashboard/cash-flow",
    icon: Wallet,
    moduleKey: "cash_flow",
  },
  {
    name: "Ledger",
    href: "/dashboard/ledger",
    icon: BookText,
    moduleKey: "ledger",
  },
  {
    name: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
    moduleKey: "documents",
  },
];

const bottomNavigation = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setCollapsed } = useSidebarStore();
  const { profile, organization } = useAuthStore();

  const role = profile?.role;

  const featureFlags = organization?.feature_flags;
  const isEnabled = (key: string): boolean => {
    // Always allow core shell routes
    if (key === "dashboard" || key === "today_book") return true;

    switch (key) {
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

  const moduleFiltered = navigation.filter((item) => isEnabled(item.moduleKey));
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
          items: moduleFiltered,
        })
      : moduleFiltered;
  const navItems: NavItem[] = role
    ? filterNavByRole({ role, items: staffFiltered })
    : staffFiltered;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full min-h-0 flex-col">
        {/* Logo + collapse control */}
        <div
          className={cn(
            "flex min-h-[4.5rem] shrink-0 items-center border-b px-3 pt-4 pb-3",
            isCollapsed ? "justify-center" : "justify-between gap-2"
          )}
        >
          {!isCollapsed ? (
            <>
              <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
                <Car className="h-6 w-6 shrink-0 text-primary" />
                <span className="truncate text-lg font-bold">Dealer 360</span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse sidebar"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Expand"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation - min-h-0 so it shrinks and bottom section stays visible */}
        <ScrollArea className="min-h-0 flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              // Special handling for Dashboard - only active on exact match
              let isActive: boolean;
              if (item.href === "/dashboard") {
                isActive =
                  pathname === "/dashboard" || pathname === "/dashboard/";
              } else {
                // For other routes, check exact match or if pathname starts with the href followed by /
                isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                    "rounded-[4px]",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Navigation */}
        <div className="shrink-0 border-t px-3 py-3">
          <nav className="flex flex-col gap-1">
            {bottomNavigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                    "rounded-[4px]",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
