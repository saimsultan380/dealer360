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
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
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
import { Separator } from "@/components/ui/separator";
import { useAuthStore, useSidebarStore } from "@/lib/store";
import { filterNavByRole } from "@/lib/auth/permissions";
import {
  filterNavByStaffModules,
  type StaffModuleKey,
} from "@/lib/auth/module-access";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = profile?.role;

  const featureFlags = organization?.feature_flags as any;
  const isEnabled = (key: string): boolean => {
    // Always allow core shell routes
    if (key === "dashboard" || key === "today_book") return true;

    // Backward compatibility: if flags missing, default to existing behavior (enabled)
    const fallbackTrue = (v: any) => (v === undefined ? true : !!v);

    switch (key) {
      case "inventory":
        return fallbackTrue(featureFlags?.enable_inventory);
      case "sales":
        return fallbackTrue(featureFlags?.enable_sales);
      case "exchange_deals":
        return fallbackTrue(featureFlags?.enable_exchange_deals);
      case "financing":
        return fallbackTrue(featureFlags?.enable_financing);
      case "leads":
        return fallbackTrue(featureFlags?.enable_leads);
      case "deals":
        return fallbackTrue(featureFlags?.enable_deals);
      case "documents":
        return fallbackTrue(featureFlags?.enable_documents);
      case "cash_flow":
        return fallbackTrue(featureFlags?.enable_cash_flow);
      case "ledger":
        return fallbackTrue(featureFlags?.enable_ledger);
      case "clients":
        return fallbackTrue(featureFlags?.enable_clients);
      case "investors":
        return fallbackTrue(featureFlags?.enable_investors);
      case "japan_import":
        return !!featureFlags?.enable_japan_import;
      default:
        return true;
    }
  };

  const moduleFiltered = navigation.filter((item) => isEnabled(item.moduleKey));
  const staffOverride = (organization?.settings as any)?.staff_module_access?.[
    profile?.id ?? ""
  ] as StaffModuleKey[] | undefined;
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
        {/* Logo - top padding so icon/name not flush to viewport edge */}
        <div className="flex min-h-[4.5rem] shrink-0 items-center justify-between border-b px-4 pt-4 pb-3">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Car className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Dealer 360</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/dashboard" className="mx-auto">
              <Car className="h-6 w-6 text-primary" />
            </Link>
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

        {/* Bottom Navigation - shrink-0 so Theme + Collapse always visible */}
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

          <Separator className="my-2" />

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? "Theme" : undefined}
              >
                {mounted && theme === "dark" ? (
                  <Moon className="h-5 w-5 shrink-0" />
                ) : (
                  <Sun className="h-5 w-5 shrink-0" />
                )}
                {!isCollapsed && <span className="ml-3">Theme</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isCollapsed ? "start" : "end"}
              side={isCollapsed ? "right" : "top"}
            >
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <span className="mr-2 h-4 w-4">⚙️</span>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator className="my-2" />

          {/* Collapse Button */}
          <Button
            variant="ghost"
            onClick={() => setCollapsed(!isCollapsed)}
            className={cn(
              "w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground",
              "px-3 py-2 text-sm font-medium rounded-[4px]",
              isCollapsed && "justify-center px-2"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 shrink-0" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
