'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { filterNavByRole } from '@/lib/auth/permissions';
import { filterNavByStaffModules, type StaffModuleKey } from '@/lib/auth/module-access';
import type { LucideIcon } from 'lucide-react';

type ModuleKey =
    | 'dashboard'
    | 'today_book'
    | 'inventory'
    | 'sales'
    | 'exchange_deals'
    | 'financing'
    | 'japan_import'
    | 'leads'
    | 'deals'
    | 'investors'
    | 'clients'
    | 'cash_flow'
    | 'ledger'
    | 'documents'
    | 'settings';

type NavItem = {
    name: string;
    href: string;
    icon: LucideIcon;
    moduleKey: ModuleKey;
};

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, moduleKey: 'dashboard' },
    { name: 'Today Book', href: '/dashboard/today-book', icon: BookOpen, moduleKey: 'today_book' },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Car, moduleKey: 'inventory' },
    { name: 'Sales', href: '/dashboard/sales', icon: ShoppingCart, moduleKey: 'sales' },
    { name: 'Exchange', href: '/dashboard/exchange-deals', icon: Repeat2, moduleKey: 'exchange_deals' },
    { name: 'Financing', href: '/dashboard/financing', icon: CreditCard, moduleKey: 'financing' },
    { name: 'Japan Import', href: '/dashboard/japan-import', icon: Globe, moduleKey: 'japan_import' },
    { name: 'Leads', href: '/dashboard/leads', icon: Users, moduleKey: 'leads' },
    { name: 'Deals', href: '/dashboard/deals/pending', icon: HandshakeIcon, moduleKey: 'deals' },
    { name: 'Investors', href: '/dashboard/investors', icon: TrendingUp, moduleKey: 'investors' },
    { name: 'Clients', href: '/dashboard/clients', icon: CircleUser, moduleKey: 'clients' },
    { name: 'Cash Flow', href: '/dashboard/cash-flow', icon: Wallet, moduleKey: 'cash_flow' },
    { name: 'Ledger', href: '/dashboard/ledger', icon: BookText, moduleKey: 'ledger' },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText, moduleKey: 'documents' },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, moduleKey: 'settings' },
];

export function MobileBottomNav() {
    const pathname = usePathname();
    const { profile, organization } = useAuthStore();

    const role = profile?.role;
    const featureFlags = organization?.feature_flags as any;
    const isEnabled = (key: string): boolean => {
        // Always allow core shell routes
        if (key === 'dashboard' || key === 'today_book' || key === 'settings') return true;

        // Backward compatibility: if flags missing, default to existing behavior (enabled)
        const fallbackTrue = (v: any) => (v === undefined ? true : !!v);

        switch (key) {
            case 'inventory':
                return fallbackTrue(featureFlags?.enable_inventory);
            case 'sales':
                return fallbackTrue(featureFlags?.enable_sales);
            case 'exchange_deals':
                return fallbackTrue(featureFlags?.enable_exchange_deals);
            case 'financing':
                return fallbackTrue(featureFlags?.enable_financing);
            case 'leads':
                return fallbackTrue(featureFlags?.enable_leads);
            case 'deals':
                return fallbackTrue(featureFlags?.enable_deals);
            case 'documents':
                return fallbackTrue(featureFlags?.enable_documents);
            case 'cash_flow':
                return fallbackTrue(featureFlags?.enable_cash_flow);
            case 'ledger':
                return fallbackTrue(featureFlags?.enable_ledger);
            case 'clients':
                return fallbackTrue(featureFlags?.enable_clients);
            case 'investors':
                return fallbackTrue(featureFlags?.enable_investors);
            case 'japan_import':
                // Off by default unless explicitly enabled
                return !!featureFlags?.enable_japan_import;
            default:
                return true;
        }
    };

    const moduleFiltered = navigation.filter((item) => isEnabled(item.moduleKey));
    const staffOverride = (organization?.settings as any)?.staff_module_access?.[profile?.id ?? ''] as
        | StaffModuleKey[]
        | undefined;
    const staffFiltered =
        Array.isArray(staffOverride) && staffOverride.length
            ? filterNavByStaffModules({ modules: staffOverride, items: moduleFiltered })
            : moduleFiltered;
    const navItems = role ? filterNavByRole({ role, items: staffFiltered }) : staffFiltered;

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
            {/* Horizontal scroller */}
            <div className="overflow-x-auto">
                <div className="flex items-center gap-1 px-2 py-2 min-w-max">
                    {navItems.map((item) => {
                        // Special handling for Dashboard - only active on exact match
                        let isActive: boolean;
                        if (item.href === '/dashboard') {
                            isActive = pathname === '/dashboard' || pathname === '/dashboard/';
                        } else {
                            // For other routes, check exact match or if pathname starts with the href followed by /
                            isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        }
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors min-w-[72px]',
                                    'rounded-[4px]',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="leading-none whitespace-nowrap">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
            {/* Safe area for iOS */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}

