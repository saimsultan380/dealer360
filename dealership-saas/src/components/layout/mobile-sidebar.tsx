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
  BookOpen,
  BookText,
  TrendingUp,
  CircleUser,
  Wallet,
  ShoppingCart,
  Repeat2,
  CreditCard,
  Globe,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SheetClose } from "@/components/ui/sheet";
import { useAuthStore } from "@/lib/store";
import { filterNavByRole } from "@/lib/auth/permissions";
import {
  filterNavByStaffModules,
  type StaffModuleKey,
} from "@/lib/auth/module-access";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { LucideIcon } from "lucide-react";

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
    name: "Deals",
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

export function MobileSidebar() {
  const pathname = usePathname();
  const { profile, organization } = useAuthStore();

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
        // Off by default unless explicitly enabled
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
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Logo - top padding for status bar / safe area; match desktop spacing */}
      <div className="flex min-h-[4.5rem] shrink-0 items-center border-b px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Car className="h-6 w-6 shrink-0 text-primary" />
          <span className="text-lg font-bold truncate">Dealer 360</span>
        </Link>
      </div>

      {/* Navigation - flex-1 min-h-0 so bottom section stays visible */}
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
                pathname === item.href || pathname.startsWith(`${item.href}/`);
            }
            return (
              <SheetClose asChild key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                    "rounded-[4px]",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              </SheetClose>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom: Settings + Theme + Close (always visible, safe-area padding) */}
      <div className="shrink-0 border-t px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Separator className="mb-4" />
        <nav className="flex flex-col gap-1">
          {bottomNavigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <SheetClose asChild key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                    "rounded-[4px]",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              </SheetClose>
            );
          })}
        </nav>
        <Separator className="my-3" />
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-sm font-medium text-muted-foreground">
              Theme
            </span>
            <ThemeToggle />
          </div>
          <SheetClose asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-[4px] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5 shrink-0" />
              <span>Close menu</span>
            </button>
          </SheetClose>
        </div>
      </div>
    </div>
  );
}
