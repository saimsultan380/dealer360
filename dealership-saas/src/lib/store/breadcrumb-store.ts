import { create } from "zustand";

interface BreadcrumbState {
  /** Human-readable label for current detail page (e.g. "2024 Toyota Corolla"). Shown in header instead of UUID. */
  breadcrumbLabel: string | null;
  setBreadcrumbLabel: (label: string | null) => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  breadcrumbLabel: null,
  setBreadcrumbLabel: (breadcrumbLabel) => set({ breadcrumbLabel }),
}));
