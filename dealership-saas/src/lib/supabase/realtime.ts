"use client";

import { createClient } from "@supabase/supabase-js";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

/**
 * Realtime subscription manager for live data updates
 * Handles subscriptions to database changes with proper cleanup
 */

interface SubscriptionConfig {
  schema?: string;
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
}

interface SubscriptionCallbacks {
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onError?: (error: Error) => void;
}

class RealtimeManager {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, () => void> = new Map();
  private warnedChannelError = false;

  constructor() {}

  /**
   * Subscribe to realtime database changes
   * @param config Subscription configuration (table, events, filters)
   * @param callbacks Callbacks for INSERT, UPDATE, DELETE events
   * @param subscriptionId Unique ID for this subscription (for cleanup)
   * @returns Unsubscribe function
   */
  subscribe(
    config: SubscriptionConfig,
    callbacks: SubscriptionCallbacks,
    subscriptionId: string = `${config.table}_${Date.now()}_${Math.random()}`
  ): () => void {
    const channelName = `realtime_${subscriptionId}`;
    const schema = config.schema || "public";
    const event = config.event || "*";

    // Create channel
    const channel = this.supabase.channel(channelName);

    // Subscribe to changes
    channel
      .on(
        "postgres_changes",
        {
          event: event as any,
          schema,
          table: config.table,
          filter: config.filter,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          try {
            if (payload.eventType === "INSERT" && callbacks.onInsert) {
              callbacks.onInsert(payload);
            } else if (payload.eventType === "UPDATE" && callbacks.onUpdate) {
              callbacks.onUpdate(payload);
            } else if (payload.eventType === "DELETE" && callbacks.onDelete) {
              callbacks.onDelete(payload);
            }
          } catch (error) {
            console.error(
              `Realtime callback error for ${config.table}:`,
              error
            );
            callbacks.onError?.(
              error instanceof Error ? error : new Error(String(error))
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === "CLOSED") {
          // Normal lifecycle during navigation/unmount.
          return;
        } else if (status === "CHANNEL_ERROR") {
          // Don't spam the console. This commonly happens when Realtime is not enabled
          // for the project's tables (Database → Replication → Realtime).
          if (!this.warnedChannelError) {
            this.warnedChannelError = true;
            // One-time, actionable hint for developers.
            console.warn(
              "Supabase Realtime channel error. If this persists, enable Realtime for your tables in Supabase (Database → Replication → Realtime) and ensure the tables are added to the realtime publication."
            );
          }
          callbacks.onError?.(
            new Error(
              `Realtime channel error for ${schema}.${config.table}. Check Supabase Realtime/Replication settings.`
            )
          );
        } else if (status === "SUBSCRIBED") {
          // Keep quiet to avoid noisy consoles in app usage.
          return;
        }
      });

    // Store channel and unsubscribe function
    this.channels.set(subscriptionId, channel);

    const unsubscribe = () => {
      this.unsubscribe(subscriptionId);
    };

    this.subscriptions.set(subscriptionId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const channel = this.channels.get(subscriptionId);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(subscriptionId);
      this.subscriptions.delete(subscriptionId);
      console.log(`Unsubscribed from realtime ${subscriptionId}`);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    for (const [subscriptionId] of this.channels) {
      this.unsubscribe(subscriptionId);
    }
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.channels.size;
  }
}

// Singleton instance
let realtimeManager: RealtimeManager | null = null;

/**
 * Get the global realtime manager instance
 */
export function getRealtimeManager(): RealtimeManager {
  if (!realtimeManager) {
    realtimeManager = new RealtimeManager();
  }
  return realtimeManager;
}

/**
 * Hook for subscribing to realtime updates in React components
 * Automatically handles cleanup on unmount
 */
export function useRealtimeSubscription<T = any>(
  config: SubscriptionConfig,
  callbacks: SubscriptionCallbacks,
  subscriptionId?: string
) {
  const { useEffect } = require("react");
  const manager = getRealtimeManager();

  useEffect(() => {
    const unsubscribe = manager.subscribe(config, callbacks, subscriptionId);
    return unsubscribe;
  }, [config.table, config.schema, config.filter]);
}

/**
 * Subscribe to vehicles table changes
 */
export function subscribeToVehicles(
  callbacks: SubscriptionCallbacks,
  organizationId?: string
) {
  const manager = getRealtimeManager();
  const filter = organizationId
    ? `organization_id=eq.${organizationId}`
    : undefined;

  return manager.subscribe(
    {
      table: "vehicles",
      event: "*",
      filter,
    },
    callbacks,
    `vehicles_${organizationId || "all"}`
  );
}

/**
 * Subscribe to leads table changes
 */
export function subscribeToLeads(
  callbacks: SubscriptionCallbacks,
  organizationId?: string
) {
  const manager = getRealtimeManager();
  const filter = organizationId
    ? `organization_id=eq.${organizationId}`
    : undefined;

  return manager.subscribe(
    {
      table: "leads",
      event: "*",
      filter,
    },
    callbacks,
    `leads_${organizationId || "all"}`
  );
}

/**
 * Subscribe to deals table changes
 */
export function subscribeToDeals(
  callbacks: SubscriptionCallbacks,
  organizationId?: string
) {
  const manager = getRealtimeManager();
  const filter = organizationId
    ? `organization_id=eq.${organizationId}`
    : undefined;

  return manager.subscribe(
    {
      table: "deals",
      event: "*",
      filter,
    },
    callbacks,
    `deals_${organizationId || "all"}`
  );
}

/**
 * Subscribe to payments table changes
 */
export function subscribeToPayments(
  callbacks: SubscriptionCallbacks,
  organizationId?: string
) {
  const manager = getRealtimeManager();
  const filter = organizationId
    ? `organization_id=eq.${organizationId}`
    : undefined;

  return manager.subscribe(
    {
      table: "payments",
      event: "*",
      filter,
    },
    callbacks,
    `payments_${organizationId || "all"}`
  );
}

/**
 * Subscribe to cash transactions changes
 */
export function subscribeToCashTransactions(
  callbacks: SubscriptionCallbacks,
  organizationId?: string
) {
  const manager = getRealtimeManager();
  const filter = organizationId
    ? `organization_id=eq.${organizationId}`
    : undefined;

  return manager.subscribe(
    {
      table: "cash_transactions",
      event: "*",
      filter,
    },
    callbacks,
    `cash_transactions_${organizationId || "all"}`
  );
}

/**
 * Subscribe to activity_logs table changes
 */
export function subscribeToActivityLogs(
  callbacks: SubscriptionCallbacks,
  organizationId?: string
) {
  const manager = getRealtimeManager();
  const filter = organizationId
    ? `organization_id=eq.${organizationId}`
    : undefined;

  return manager.subscribe(
    {
      table: "activity_logs",
      event: "*",
      filter,
    },
    callbacks,
    `activity_logs_${organizationId || "all"}`
  );
}

/**
 * Subscribe to sales table changes
 */
export function subscribeToSales(
  callbacks: SubscriptionCallbacks,
  organizationId?: string
) {
  const manager = getRealtimeManager();
  const filter = organizationId
    ? `organization_id=eq.${organizationId}`
    : undefined;

  return manager.subscribe(
    {
      table: "sales",
      event: "*",
      filter,
    },
    callbacks,
    `sales_${organizationId || "all"}`
  );
}

/**
 * Subscribe to client_transactions table changes
 */
export function subscribeToClientTransactions(
  callbacks: SubscriptionCallbacks,
  organizationId?: string
) {
  const manager = getRealtimeManager();
  const filter = organizationId
    ? `organization_id=eq.${organizationId}`
    : undefined;

  return manager.subscribe(
    {
      table: "client_transactions",
      event: "*",
      filter,
    },
    callbacks,
    `client_transactions_${organizationId || "all"}`
  );
}

/**
 * Subscribe to financing loans table changes
 */
export function subscribeToFinancingLoans(
  callbacks: SubscriptionCallbacks,
  organizationId?: string
) {
  const manager = getRealtimeManager();
  const filter = organizationId
    ? `organization_id=eq.${organizationId}`
    : undefined;

  return manager.subscribe(
    {
      table: "financing_loans",
      event: "*",
      filter,
    },
    callbacks,
    `financing_loans_${organizationId || "all"}`
  );
}

/**
 * Subscribe to Japan import cases changes
 */
export function subscribeToJapanImportCases(
  callbacks: SubscriptionCallbacks,
  organizationId?: string
) {
  const manager = getRealtimeManager();
  const filter = organizationId
    ? `organization_id=eq.${organizationId}`
    : undefined;

  return manager.subscribe(
    {
      table: "japan_import_cases",
      event: "*",
      filter,
    },
    callbacks,
    `japan_import_cases_${organizationId || "all"}`
  );
}

/**
 * Subscribe to notifications for current user
 */
export function subscribeToNotifications(
  callbacks: SubscriptionCallbacks,
  userId: string
) {
  const manager = getRealtimeManager();
  const filter = `recipient_id=eq.${userId}`;

  return manager.subscribe(
    {
      table: "notifications",
      event: "INSERT",
      filter,
    },
    callbacks,
    `notifications_${userId}`
  );
}

/**
 * Subscribe to a specific client's updates
 */
export function subscribeToClient(
  clientId: string,
  callbacks: SubscriptionCallbacks
) {
  const manager = getRealtimeManager();
  const filter = `id=eq.${clientId}`;

  return manager.subscribe(
    {
      table: "clients",
      event: "*",
      filter,
    },
    callbacks,
    `client_${clientId}`
  );
}

/**
 * Subscribe to client_transactions for a specific client
 */
export function subscribeToClientTransactionsForClient(
  clientId: string,
  callbacks: SubscriptionCallbacks
) {
  const manager = getRealtimeManager();
  const filter = `client_id=eq.${clientId}`;

  return manager.subscribe(
    {
      table: "client_transactions",
      event: "*",
      filter,
    },
    callbacks,
    `client_transactions_${clientId}`
  );
}

/**
 * Subscribe to a specific vehicle's updates
 */
export function subscribeToVehicle(
  vehicleId: string,
  callbacks: SubscriptionCallbacks
) {
  const manager = getRealtimeManager();
  const filter = `id=eq.${vehicleId}`;

  return manager.subscribe(
    {
      table: "vehicles",
      event: "UPDATE",
      filter,
    },
    callbacks,
    `vehicle_${vehicleId}`
  );
}

/**
 * Subscribe to a specific import case's updates
 */
export function subscribeToJapanImportCase(
  importCaseId: string,
  callbacks: SubscriptionCallbacks
) {
  const manager = getRealtimeManager();
  const filter = `id=eq.${importCaseId}`;

  return manager.subscribe(
    {
      table: "japan_import_cases",
      event: "*",
      filter,
    },
    callbacks,
    `japan_import_case_${importCaseId}`
  );
}

/**
 * Clean up all active subscriptions
 * Call this when app unmounts or user logs out
 */
export function cleanupAllRealtimeSubscriptions(): void {
  const manager = getRealtimeManager();
  manager.unsubscribeAll();
}

export default getRealtimeManager;
