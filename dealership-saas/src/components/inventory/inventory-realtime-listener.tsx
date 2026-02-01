'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * Realtime listener component that automatically refreshes the inventory page
 * when vehicles are created, updated, or deleted in Supabase.
 * 
 * This enables real-time synchronization across multiple browser tabs/devices.
 */
export function InventoryRealtimeListener() {
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();

        // Subscribe to changes on the vehicles table
        const channel = supabase
            .channel('inventory-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'vehicles',
                },
                (payload) => {
                    console.log('Inventory change detected:', payload.eventType, payload.new || payload.old);
                    // Refresh the current page to show updated data
                    router.refresh();
                }
            )
            .subscribe();

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [router]);

    // This component doesn't render anything
    return null;
}
