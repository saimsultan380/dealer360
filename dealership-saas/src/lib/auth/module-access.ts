import type { UserRole } from '@/lib/types/database';

type PathPrefix = `/${string}`;

/**
 * Staff-visible dashboard modules.
 *
 * Notes:
 * - This is for **UI visibility** and **route guards** (middleware).
 * - It does NOT replace database RLS.
 * - We always keep `/dashboard` and `/dashboard/settings` accessible to avoid locking users out.
 */
export type StaffModuleKey =
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

export const STAFF_MODULE_LABELS: Record<StaffModuleKey, string> = {
  dashboard: 'Dashboard',
  today_book: 'Today Book',
  inventory: 'Inventory',
  sales: 'Sales',
  exchange_deals: 'Exchange Deals',
  financing: 'Financing',
  japan_import: 'Japan Import',
  leads: 'Leads',
  deals: 'Deals',
  investors: 'Investors',
  clients: 'Clients',
  cash_flow: 'Cash Flow',
  ledger: 'Ledger',
  documents: 'Documents',
  settings: 'Settings',
};

export const STAFF_MODULE_PREFIXES: Record<StaffModuleKey, PathPrefix> = {
  dashboard: '/dashboard',
  today_book: '/dashboard/today-book',
  inventory: '/dashboard/inventory',
  sales: '/dashboard/sales',
  exchange_deals: '/dashboard/exchange-deals',
  financing: '/dashboard/financing',
  japan_import: '/dashboard/japan-import',
  leads: '/dashboard/leads',
  deals: '/dashboard/deals',
  investors: '/dashboard/investors',
  clients: '/dashboard/clients',
  cash_flow: '/dashboard/cash-flow',
  ledger: '/dashboard/ledger',
  documents: '/dashboard/documents',
  settings: '/dashboard/settings',
};

export function isStaffModuleKey(v: unknown): v is StaffModuleKey {
  return typeof v === 'string' && (v as StaffModuleKey) in STAFF_MODULE_PREFIXES;
}

export function normalizeStaffModules(input: unknown): StaffModuleKey[] {
  const arr = Array.isArray(input) ? input : [];
  const uniq = new Set<StaffModuleKey>();
  for (const v of arr) {
    if (isStaffModuleKey(v)) uniq.add(v);
  }
  // Always keep shell routes accessible
  uniq.add('dashboard');
  uniq.add('settings');
  return Array.from(uniq);
}

export function canAccessPathByStaffModules(params: {
  modules: StaffModuleKey[] | null | undefined;
  pathname: string;
}): boolean {
  const pathname = params.pathname;
  // Always allow non-dashboard routes (auth, admin, api, etc.)
  if (!pathname.startsWith('/dashboard')) return true;

  // Always allow profile/settings shell pages.
  if (pathname.startsWith('/dashboard/profile')) return true;
  if (pathname.startsWith('/dashboard/settings')) return true;

  const modules = normalizeStaffModules(params.modules);
  // Dashboard root always allowed (normalize enforces it)
  const allowedPrefixes = modules.map((m) => STAFF_MODULE_PREFIXES[m]);

  return allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Default module sets per role (used as a sensible starter in UI).
 * This does not override the existing role-based route guards; it just provides defaults.
 */
export function getDefaultStaffModulesForRole(role: UserRole): StaffModuleKey[] {
  switch (role) {
    case 'admin':
    case 'manager':
    case 'super_admin':
      return Object.keys(STAFF_MODULE_PREFIXES) as StaffModuleKey[];
    case 'accountant':
      return [
        'dashboard',
        'cash_flow',
        'ledger',
        'financing',
        'clients',
        'investors',
        'documents',
        'settings',
      ];
    case 'salesperson':
    default:
      return [
        'dashboard',
        'sales',
        'exchange_deals',
        'financing',
        'leads',
        'deals',
        'inventory',
        'clients',
        'documents',
        'settings',
      ];
  }
}

export function filterNavByStaffModules<T extends { moduleKey: string }>(params: {
  modules: StaffModuleKey[] | null | undefined;
  items: T[];
}): T[] {
  const modules = normalizeStaffModules(params.modules);
  const set = new Set(modules);
  return params.items.filter((item) => set.has(item.moduleKey as StaffModuleKey));
}

