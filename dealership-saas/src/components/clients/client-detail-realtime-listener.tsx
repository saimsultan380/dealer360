"use client";

import { useEffect } from "react";
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
 */
export function ClientDetailRealtimeListener({
  clientId,
  organizationId,
  onRefresh,
}: ClientDetailRealtimeListenerProps) {
  useEffect(() => {
    if (!clientId) return;

    const handleChange = () => {
      onRefresh();
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
  }, [clientId, organizationId, onRefresh]);

  return null;
}
