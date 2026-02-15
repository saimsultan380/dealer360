"use client";

import { useEffect, useRef } from "react";
import {
  subscribeToClient,
  subscribeToClientTransactionsForClient,
  subscribeToDeals,
} from "@/lib/supabase/realtime";

interface ClientDetailRealtimeListenerProps {
  clientId: string;
  organizationId: string;
  onRefresh: () => void;
}

/**
 * Realtime listener that refreshes client details when relevant data changes.
 * Subscribes to: clients, client_transactions, and deals (for total_dues).
 * Uses ref for onRefresh so effect only depends on clientId/organizationId (Strict Mode safe).
 */
export function ClientDetailRealtimeListener({
  clientId,
  organizationId,
  onRefresh,
}: ClientDetailRealtimeListenerProps) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!clientId) return;

    const handleChange = () => {
      onRefreshRef.current();
    };

    const unsubClient = subscribeToClient(clientId, {
      onInsert: handleChange,
      onUpdate: handleChange,
      onDelete: handleChange,
    });

    const unsubTransactions = subscribeToClientTransactionsForClient(clientId, {
      onInsert: handleChange,
      onUpdate: handleChange,
      onDelete: handleChange,
    });

    const unsubDeals = subscribeToDeals(
      {
        onInsert: handleChange,
        onUpdate: handleChange,
        onDelete: handleChange,
      },
      organizationId
    );

    return () => {
      unsubClient();
      unsubTransactions();
      unsubDeals();
    };
  }, [clientId, organizationId]);

  return null;
}
