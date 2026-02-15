'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToVehicles } from '@/lib/supabase/realtime';

/**
 * Realtime listener that refreshes the inventory page when vehicles change.
 * Uses centralized RealtimeManager and a stable subscription ID so only one
 * channel is created (Strict Mode / HMR safe). Callback uses ref to avoid
 * effect re-runs when router identity changes.
 */
export function InventoryRealtimeListener() {
    const router = useRouter();
    const routerRef = useRef(router);
    routerRef.current = router;

    useEffect(() => {
        const unsubscribe = subscribeToVehicles(
            {
                onInsert: () => routerRef.current.refresh(),
                onUpdate: () => routerRef.current.refresh(),
                onDelete: () => routerRef.current.refresh(),
            },
            undefined // all orgs; filter can be added if page is org-scoped
        );
        return unsubscribe;
    }, []);

    return null;
}
