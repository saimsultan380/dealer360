# Pagination System Implementation

## Overview
A comprehensive, responsive pagination component has been implemented for all data tables across the application.

## Features

### 1. **Advanced Pagination Component** (`pagination-advanced.tsx`)
- **Mobile-Responsive Design**: Different layouts for mobile and desktop
- **Entries Per Page Selector**: Choose 5, 10, 25, 50, or 100 items per page
- **Page Navigation**: 
  - First/Last page buttons (desktop)
  - Previous/Next buttons (all screens)
  - Direct page number buttons (desktop)
  - Page input field (mobile)
- **Smart Page Number Display**: Shows only relevant pages with ellipsis for gaps
- **Real-time Info**: Displays current viewing range and total items

### 2. **Desktop Features**
- ✅ First page button (ChevronsLeft icon)
- ✅ Previous page button (ChevronLeft icon)
- ✅ Page number buttons with smart display
- ✅ Next page button (ChevronRight icon)
- ✅ Last page button (ChevronsRight icon)
- ✅ Entries per page dropdown
- ✅ Current range display (e.g., "Showing 1 to 10 of 150 entries")
- ✅ Page info (e.g., "Page 1 of 15")

### 3. **Mobile Features**
- ✅ Compact button layout (Previous/Next only)
- ✅ Page input field (type page number)
- ✅ Entries per page dropdown
- ✅ Responsive stacking
- ✅ Touch-friendly button sizes

## Implementation Example

### Inventory Table
```tsx
import { Pagination } from '@/components/ui/pagination-advanced';

export function VehiclesTable({ vehicles, totalCount }: VehiclesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const displayedVehicles = vehicles.slice(0, itemsPerPage);
  const totalPages = Math.ceil(Math.max(totalCount, vehicles.length) / itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Table content */}
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={Math.max(totalCount, vehicles.length)}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
}
```

## Pagination Properties

| Property | Type | Description |
|----------|------|-------------|
| `currentPage` | number | Current active page (1-indexed) |
| `totalPages` | number | Total number of pages |
| `totalItems` | number | Total count of all items |
| `itemsPerPage` | number | Number of items displayed per page |
| `onPageChange` | (page: number) => void | Callback when page changes |
| `onItemsPerPageChange` | (items: number) => void | Callback when items per page changes |
| `isLoading` | boolean (optional) | Disable pagination while loading |

## Responsive Breakpoints

- **Mobile (< 640px)**:
  - Stacked layout
  - Page input field for navigation
  - Compact button group
  - Single-line info display

- **Desktop (≥ 640px)**:
  - Horizontal layout
  - Page number buttons
  - First/Last page buttons
  - Two-line info display

## Design Features

- **Color Coding**: Active page highlighted with primary color
- **Disabled States**: Buttons disabled at boundaries and during loading
- **Icons**: Clear navigation icons for intuitive UX
- **Tooltips**: Button titles for accessibility
- **Accessibility**: Keyboard navigable, screen reader friendly

## Default Items Per Page Options
- 5 entries
- 10 entries (default)
- 25 entries
- 50 entries
- 100 entries

## Usage Tips

1. **State Management**: Keep `currentPage` state in the parent component
2. **Reset on Filter**: Reset to page 1 when filters change
3. **Server Pagination**: For large datasets, implement backend pagination
4. **Loading States**: Pass `isLoading` to disable controls during fetch

## Modules with Pagination

### ✅ Implemented
- Inventory (Vehicles Table)

### 🔄 To Be Implemented
- Sales
- Exchange Deals
- Leads
- Clients
- Financing & Loans
- Investors
- Documents
- Ledger
- Cash Flow

## File Location
`src/components/ui/pagination-advanced.tsx`

## Theme Support
- ✅ Light mode
- ✅ Dark mode
- ✅ System preference
- ✅ Tailwind CSS integration
