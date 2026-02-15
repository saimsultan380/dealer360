"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/lib/store";

interface SetHeaderBreadcrumbProps {
  /** Human-readable label for this page (e.g. "2024 Toyota Corolla"). Shown in header breadcrumb instead of UUID. */
  label: string | null;
}

/**
 * Call from a detail page to set the header breadcrumb to a friendly name.
 * Clears the label on unmount so other pages are not affected.
 */
export function SetHeaderBreadcrumb({ label }: SetHeaderBreadcrumbProps) {
  const { setBreadcrumbLabel } = useBreadcrumbStore();

  useEffect(() => {
    setBreadcrumbLabel(label);
    return () => setBreadcrumbLabel(null);
  }, [label, setBreadcrumbLabel]);

  return null;
}
