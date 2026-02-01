import type { UserRole } from '@/lib/types/database';

/**
 * Route-level permissions for dashboard feature access.
 *
 * NOTE:
 * - This is used for UI navigation filtering and middleware guards.
 * - Database RLS remains the final security boundary for tenant isolation.
 */

type PathPrefix = `/${string}`;

const DASHBOARD_PREFIXES = {
  dashboard: '/dashboard',
  todayBook: '/dashboard/today-book',
  inventory: '/dashboard/inventory',
  sales: '/dashboard/sales',
  exchangeDeals: '/dashboard/exchange-deals',
  financing: '/dashboard/financing',
  japanImport: '/dashboard/japan-import',
  leads: '/dashboard/leads',
  deals: '/dashboard/deals',
  investors: '/dashboard/investors',
  clients: '/dashboard/clients',
  cashFlow: '/dashboard/cash-flow',
  ledger: '/dashboard/ledger',
  documents: '/dashboard/documents',
  profile: '/dashboard/profile',
  settings: '/dashboard/settings',
} as const satisfies Record<string, PathPrefix>;

// Staff roles → allowed dashboard areas
const ROLE_ALLOWED_PREFIXES: Record<UserRole, PathPrefix[]> = {
  super_admin: [
    // super admin uses /admin, but allow full dashboard too (useful for testing)
    DASHBOARD_PREFIXES.dashboard,
    DASHBOARD_PREFIXES.todayBook,
    DASHBOARD_PREFIXES.inventory,
    DASHBOARD_PREFIXES.sales,
    DASHBOARD_PREFIXES.exchangeDeals,
    DASHBOARD_PREFIXES.financing,
    DASHBOARD_PREFIXES.japanImport,
    DASHBOARD_PREFIXES.leads,
    DASHBOARD_PREFIXES.deals,
    DASHBOARD_PREFIXES.investors,
    DASHBOARD_PREFIXES.clients,
    DASHBOARD_PREFIXES.cashFlow,
    DASHBOARD_PREFIXES.ledger,
    DASHBOARD_PREFIXES.documents,
    DASHBOARD_PREFIXES.profile,
    DASHBOARD_PREFIXES.settings,
  ],
  admin: [
    DASHBOARD_PREFIXES.dashboard,
    DASHBOARD_PREFIXES.todayBook,
    DASHBOARD_PREFIXES.inventory,
    DASHBOARD_PREFIXES.sales,
    DASHBOARD_PREFIXES.exchangeDeals,
    DASHBOARD_PREFIXES.financing,
    DASHBOARD_PREFIXES.japanImport,
    DASHBOARD_PREFIXES.leads,
    DASHBOARD_PREFIXES.deals,
    DASHBOARD_PREFIXES.investors,
    DASHBOARD_PREFIXES.clients,
    DASHBOARD_PREFIXES.cashFlow,
    DASHBOARD_PREFIXES.ledger,
    DASHBOARD_PREFIXES.documents,
    DASHBOARD_PREFIXES.profile,
    DASHBOARD_PREFIXES.settings,
  ],
  manager: [
    DASHBOARD_PREFIXES.dashboard,
    DASHBOARD_PREFIXES.todayBook,
    DASHBOARD_PREFIXES.inventory,
    DASHBOARD_PREFIXES.sales,
    DASHBOARD_PREFIXES.exchangeDeals,
    DASHBOARD_PREFIXES.financing,
    DASHBOARD_PREFIXES.japanImport,
    DASHBOARD_PREFIXES.leads,
    DASHBOARD_PREFIXES.deals,
    DASHBOARD_PREFIXES.investors,
    DASHBOARD_PREFIXES.clients,
    DASHBOARD_PREFIXES.cashFlow,
    DASHBOARD_PREFIXES.ledger,
    DASHBOARD_PREFIXES.documents,
    DASHBOARD_PREFIXES.profile,
    DASHBOARD_PREFIXES.settings,
  ],
  salesperson: [
    DASHBOARD_PREFIXES.dashboard,
    DASHBOARD_PREFIXES.sales,
    DASHBOARD_PREFIXES.exchangeDeals,
    DASHBOARD_PREFIXES.financing,
    DASHBOARD_PREFIXES.japanImport,
    DASHBOARD_PREFIXES.leads,
    DASHBOARD_PREFIXES.deals,
    DASHBOARD_PREFIXES.inventory, // view inventory context
    DASHBOARD_PREFIXES.clients, // customer follow-up
    DASHBOARD_PREFIXES.documents, // upload/view documents
    DASHBOARD_PREFIXES.profile,
    DASHBOARD_PREFIXES.settings,
  ],
  accountant: [
    DASHBOARD_PREFIXES.dashboard,
    DASHBOARD_PREFIXES.cashFlow,
    DASHBOARD_PREFIXES.ledger,
    DASHBOARD_PREFIXES.financing,
    DASHBOARD_PREFIXES.japanImport,
    DASHBOARD_PREFIXES.clients,
    DASHBOARD_PREFIXES.investors,
    DASHBOARD_PREFIXES.documents,
    DASHBOARD_PREFIXES.profile,
    DASHBOARD_PREFIXES.settings,
  ],
};

export function getAllowedDashboardPrefixes(role: UserRole): PathPrefix[] {
  return ROLE_ALLOWED_PREFIXES[role] ?? [DASHBOARD_PREFIXES.dashboard];
}

export function canAccessPath(params: { role: UserRole; pathname: string }): boolean {
  const pathname = params.pathname;
  if (!pathname.startsWith('/dashboard')) return true;

  const allowed = getAllowedDashboardPrefixes(params.role);
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function filterNavByRole<T extends { href: string }>(params: {
  role: UserRole;
  items: T[];
}): T[] {
  return params.items.filter((item) => canAccessPath({ role: params.role, pathname: item.href }));
}

