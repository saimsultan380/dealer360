# 🚀 Quick Integration Guide - Pagination System

## Add Pagination to Any Table in 5 Minutes

### Step 1: Import the Component (30 seconds)
```tsx
import { Pagination } from '@/components/ui/pagination-advanced';
```

### Step 2: Add State Management (1 minute)
```tsx
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
```

### Step 3: Calculate Displayed Data (1 minute)
```tsx
// For table/list components
const displayedItems = items.slice(0, itemsPerPage);

// For grid/paginated components
const displayedItems = items.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

const totalPages = Math.ceil(items.length / itemsPerPage);
```

### Step 4: Update Rendering (1 minute)
```tsx
// Change your map from:
{items.map(item => <Component key={item.id} {...item} />)}

// To:
{displayedItems.map(item => <Component key={item.id} {...item} />)}
```

### Step 5: Add Pagination Component (1 minute)
```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={items.length}
  itemsPerPage={itemsPerPage}
  onPageChange={setCurrentPage}
  onItemsPerPageChange={setItemsPerPage}
/>
```

---

## Complete Working Example

### Exchange Deals Table (Ready to Integrate)

```tsx
'use client';

import { useState } from 'react';
import { Pagination } from '@/components/ui/pagination-advanced';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function ExchangeDealsTable({ deals }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate pagination
  const displayedDeals = deals.slice(0, itemsPerPage);
  const totalPages = Math.ceil(deals.length / itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From Vehicle</TableHead>
              <TableHead>To Vehicle</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Price Difference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedDeals.map(deal => (
              <TableRow key={deal.id}>
                <TableCell>{deal.from_vehicle}</TableCell>
                <TableCell>{deal.to_vehicle}</TableCell>
                <TableCell>{deal.customer_name}</TableCell>
                <TableCell>PKR {deal.price_difference.toLocaleString()}</TableCell>
                <TableCell>{deal.status}</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={deals.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
}
```

---

## File Locations to Modify

### For Tables (easy - add pagination below table)
- `src/components/*/[name]-table.tsx`

### For Pages (medium - restructure page component)
- `src/app/(dashboard)/dashboard/*/page.tsx`

### For Grid Layouts (easy - add pagination below grid)
- Any grid-based component

---

## Props Reference

```typescript
interface PaginationProps {
  currentPage: number;           // Current page (1-indexed)
  totalPages: number;            // Total number of pages
  totalItems: number;            // Total items count
  itemsPerPage: number;          // Items shown per page
  onPageChange: (page) => void;  // Page change handler
  onItemsPerPageChange: (items) => void; // Items per page handler
  isLoading?: boolean;           // Optional loading state
}
```

---

## Common Implementations

### Pattern 1: Simple Table (Slice at display)
```tsx
const [page, setPage] = useState(1);
const [perPage, setPerPage] = useState(10);

const displayed = items.slice(0, perPage);
const totalPages = Math.ceil(items.length / perPage);

return (
  <div>
    <Table>... rendered items ...</Table>
    <Pagination {...props} />
  </div>
);
```

### Pattern 2: Offset Pagination (For larger datasets)
```tsx
const displayed = items.slice(
  (page - 1) * perPage,
  page * perPage
);

// Use same totalPages calculation
```

### Pattern 3: Grid Layout (Card-based)
```tsx
return (
  <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {displayed.map(item => <Card key={item.id}>{item}</Card>)}
    </div>
    <Pagination {...props} />
  </div>
);
```

---

## Modules Ready for Integration

### Exchange Deals
📁 Location: `src/app/(dashboard)/dashboard/exchange-deals/page.tsx`
⏱️ Est. Time: 5 minutes

### Leads
📁 Location: `src/components/leads/leads-table.tsx`
⏱️ Est. Time: 3 minutes

### Clients
📁 Location: `src/components/clients/clients-table.tsx`
⏱️ Est. Time: 3 minutes

### Investors
📁 Location: `src/components/investors/investors-table.tsx`
⏱️ Est. Time: 3 minutes

### Documents
📁 Location: `src/app/(dashboard)/dashboard/documents/page.tsx`
⏱️ Est. Time: 5 minutes

### Ledger
📁 Location: `src/app/(dashboard)/dashboard/ledger/page.tsx`
⏱️ Est. Time: 5 minutes

### Cash Flow
📁 Location: `src/app/(dashboard)/dashboard/cash-flow/page.tsx`
⏱️ Est. Time: 5 minutes

---

## Troubleshooting

### Issue: Pagination not showing
**Solution**: Check if `totalPages > 1` - pagination hides on single page

### Issue: Items not updating when page changes
**Solution**: Make sure you're using `displayedItems` in your render, not `items`

### Issue: Mobile layout broken
**Solution**: Check breakpoint - should use `sm:` prefix for responsive changes

### Issue: TypeScript errors
**Solution**: Ensure props match interface - check `PaginationProps` type

---

## Testing Your Implementation

### Desktop Test
1. Click next/previous buttons
2. Click page numbers
3. Change entries per page
4. Verify items update
5. Check dark mode

### Mobile Test
1. Type page number in input
2. Click navigation buttons
3. Verify responsive layout
4. Check spacing on small screens
5. Test in landscape mode

---

## Performance Tips

### For Large Datasets (1000+ items)
- Consider server-side pagination
- Use `useMemo` to prevent recalculation
- Implement data virtualization for very large lists

### For Normal Datasets (< 1000 items)
- Current implementation is optimal
- Client-side slicing is fast enough
- No additional optimization needed

---

## Styling Customization

### Colors (in Tailwind config)
```tsx
// Change active button color
<Button variant={page === current ? 'default' : 'outline'}>
```

### Spacing (Tailwind classes)
```tsx
<div className="gap-4 sm:gap-6">  // Change gap size
<div className="flex-col sm:flex-row"> // Change direction
```

### Sizes (Button sizes)
```tsx
<Button size="icon">  // Icon buttons
<Button size="sm">    // Small buttons
<Button size="lg">    // Large buttons
```

---

## Deploy Checklist

- [ ] Import component
- [ ] Add state (currentPage, itemsPerPage)
- [ ] Calculate displayedItems
- [ ] Update render to use displayedItems
- [ ] Add Pagination component
- [ ] Test on desktop
- [ ] Test on mobile
- [ ] Test dark mode
- [ ] Build successfully
- [ ] Deploy to production

---

## Quick Reference

### Copy-Paste Ready Code

```tsx
'use client';
import { useState } from 'react';
import { Pagination } from '@/components/ui/pagination-advanced';

export function MyComponent({ items }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const displayedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(items.length / itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Your content */}
      <div>{/* Render displayedItems */}</div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={items.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
}
```

---

**Estimated Time to Add to One Module**: 5 minutes
**Total Time for All Remaining Modules**: ~40 minutes

🚀 **Ready to scale pagination across your app!**
