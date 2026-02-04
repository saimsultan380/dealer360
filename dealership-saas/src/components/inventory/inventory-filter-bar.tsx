"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface InventoryFilterBarProps {
  initialQuery: string;
  initialStatus: string;
}

const SEARCH_DEBOUNCE_MS = 300;

export function InventoryFilterBar({
  initialQuery,
  initialStatus,
}: InventoryFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(initialQuery);

  const applyFilters = useCallback(
    (query: string, status: string, resetPage = true) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (query) params.set("q", query);
      else params.delete("q");
      params.set("status", status);
      if (resetPage) {
        params.set("page", "1");
      }
      router.replace(`/dashboard/inventory?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Sync local search with URL when navigating back/forward
  useEffect(() => {
    setSearchValue(initialQuery);
  }, [initialQuery]);

  // Debounced live search
  useEffect(() => {
    if (searchValue === initialQuery) return;
    const timeoutId = setTimeout(() => {
      applyFilters(searchValue, initialStatus, true);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchValue, initialQuery, initialStatus, applyFilters]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    applyFilters(searchValue, newStatus, true);
  };

  return (
    <div className="rounded-lg border bg-card/60 backdrop-blur-sm">
      <div className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Input
            placeholder="Search make, model, or reg number..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <select
            value={initialStatus}
            onChange={handleStatusChange}
            className="w-full min-w-[180px] rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[200px]"
          >
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="in_service">In Service</option>
          </select>
        </div>
      </div>
    </div>
  );
}
