# Realtime Configuration Guide

## Overview

Realtime enables live updates across all connected clients. When one user updates inventory, all other users see the change instantly.

## Tables to Enable for Realtime

The following tables need realtime enabled:

1. **vehicles** - Inventory updates
2. **sales** - Sales tracking
3. **financing_loans** - Financing updates
4. **japan_import_cases** - Japan import tracking
5. **notifications** - Real-time notifications

---

## Enable Realtime via SQL

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy and paste this SQL:

```sql
-- Enable realtime for all required tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financing_loans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.japan_import_cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Verify realtime is enabled
SELECT schemaname, tablename, 
       EXISTS (
         SELECT 1 FROM pg_publication_rel pr 
         WHERE pr.prrelid = (schemaname||'.'||tablename)::regclass
       ) as is_realtime
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('vehicles', 'sales', 'financing_loans', 'japan_import_cases', 'notifications')
ORDER BY tablename;
```

4. Click **Run** or press `Ctrl+Enter`
5. You should see all 5 tables listed with `is_realtime = true`

### Option 2: Using Supabase CLI

```bash
# Add tables to realtime publication
supabase db publish

# Or manually:
# npx supabase db push
```

---

## Verify Realtime is Enabled

### In Supabase Dashboard:

1. Go to **Realtime** in Project Settings
2. Under **Replication**, you should see:
   - ✅ `public.vehicles`
   - ✅ `public.sales`
   - ✅ `public.financing_loans`
   - ✅ `public.japan_import_cases`
   - ✅ `public.notifications`

### Query to Verify:

Run in SQL Editor:
```sql
SELECT publication, schemaname, tablename 
FROM pg_publication_tables 
WHERE publication = 'supabase_realtime'
ORDER BY tablename;
```

Should show 5 rows.

---

## Realtime Configuration in Code

After enabling realtime in Supabase, the application code will:

1. **Subscribe** to table changes using `src/lib/supabase/realtime.ts`
2. **Listen** for INSERT, UPDATE, DELETE events
3. **Update** UI components in real-time
4. **Cleanup** subscriptions when components unmount

---

## Testing Realtime (Manual)

### Test Scenario: Live Inventory Update

1. **Terminal 1**: Open app in browser
   ```bash
   npm run dev
   ```
   Navigate to Inventory page

2. **Terminal 2**: Open same app in different browser/incognito
   ```
   Same inventory page
   ```

3. **Browser 1**: Create new vehicle or update existing
   - Click "New Vehicle"
   - Fill in details
   - Click "Save"

4. **Browser 2**: Watch for live update
   - Within 1-2 seconds, should see new vehicle appear
   - No page refresh needed
   - No button click needed

5. **Verify console**:
   - Both browsers should show connection messages
   - Check for realtime subscription logs

---

## Realtime in Application

### Components Using Realtime:

- `src/components/inventory/vehicles-table.tsx`
- `src/components/sales/sales-table.tsx`
- `src/components/layout/header.tsx` (notifications)
- `src/app/(dashboard)/dashboard/japan-import/page.tsx`

### How It Works:

1. **Component mounts** → Subscribe to table changes
2. **New data arrives** → Update local state
3. **UI re-renders** → Users see live update
4. **Component unmounts** → Cleanup subscription

---

## Realtime Limits & Costs

### Free Tier:
- Up to 100 concurrent connections
- Real-time updates for up to 10 tables

### Pro Tier:
- Up to 500 concurrent connections
- Unlimited realtime tables
- Priority support

### Cost:
- **Realtime Connections**: $5 per 1 million connections
- **Database**: Standard pricing applies

---

## Troubleshooting Realtime

### Issue: Real-time updates not working

**Debug Steps:**

1. Check Supabase dashboard for errors:
   - Logs → Real-time

2. Verify table is in publication:
   ```sql
   SELECT * FROM pg_publication_tables 
   WHERE publication = 'supabase_realtime'
   ```

3. Check browser console for subscription errors

4. Verify RLS policies allow SELECT:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'vehicles'
   ```

### Issue: Too many connections warning

**Solution:**
- Increase connection pool
- Or unsubscribe from non-critical tables

### Issue: Realtime lag (updates not instant)

**Solution:**
- Check network latency
- Reduce frequency of updates
- Move heavy processing to background jobs

### Issue: Memory leaks in browser

**Solution:**
- Ensure subscriptions are cleaned up
- Check `useEffect` cleanup in components
- Review `realtime.ts` for proper unsubscribe

---

## Production Considerations

### Before Going Live:

1. **Performance Test**:
   - Test with 100+ concurrent users
   - Monitor database performance
   - Check memory usage on client

2. **Security Check**:
   - Verify RLS policies block unauthorized data
   - Test with different user roles
   - Check service role key is not exposed

3. **Monitoring**:
   - Enable database metrics
   - Setup alerts for connection spikes
   - Monitor error rates

4. **Backup**:
   - Enable automated backups
   - Test restore process
   - Document recovery procedure

---

## Next Steps

1. ✅ Run SQL to enable realtime
2. ✅ Verify in dashboard
3. → Create `src/lib/supabase/realtime.ts`
4. → Integrate into components
5. → Test in development
6. → Monitor in production

---

## Related Documentation

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Realtime Subscribe](https://supabase.com/docs/reference/javascript/subscribe)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
