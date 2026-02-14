"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Car,
  Handshake,
  User,
  Users,
  Building2,
  Wallet,
  Landmark,
  Globe,
  ArrowRight,
  Loader2,
  Command,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  globalSearch,
  SearchResult,
  SearchCategory,
} from "@/lib/actions/global-search";

const CATEGORIES: { value: SearchCategory; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All", icon: <Layers className="h-3.5 w-3.5" /> },
  { value: "vehicles", label: "Inventory", icon: <Car className="h-3.5 w-3.5" /> },
  { value: "deals", label: "Deals", icon: <Handshake className="h-3.5 w-3.5" /> },
  { value: "clients", label: "Clients", icon: <User className="h-3.5 w-3.5" /> },
  { value: "investors", label: "Investors", icon: <Building2 className="h-3.5 w-3.5" /> },
  { value: "leads", label: "Leads", icon: <Users className="h-3.5 w-3.5" /> },
  { value: "cash_flow", label: "Cash Flow", icon: <Wallet className="h-3.5 w-3.5" /> },
  { value: "financing", label: "Financing", icon: <Landmark className="h-3.5 w-3.5" /> },
  { value: "japan_import", label: "Japan Import", icon: <Globe className="h-3.5 w-3.5" /> },
];

function getCategoryIcon(icon: string, className?: string) {
  const cls = cn("shrink-0", className);
  switch (icon) {
    case "car": return <Car className={cls} />;
    case "handshake": return <Handshake className={cls} />;
    case "user": return <User className={cls} />;
    case "users": return <Users className={cls} />;
    case "building": return <Building2 className={cls} />;
    case "wallet": return <Wallet className={cls} />;
    case "landmark": return <Landmark className={cls} />;
    case "globe": return <Globe className={cls} />;
    default: return <Search className={cls} />;
  }
}

function getCategoryColor(category: SearchCategory) {
  switch (category) {
    case "vehicles": return "text-blue-500 bg-blue-500/10";
    case "deals": return "text-emerald-500 bg-emerald-500/10";
    case "clients": return "text-cyan-500 bg-cyan-500/10";
    case "investors": return "text-teal-500 bg-teal-500/10";
    case "leads": return "text-orange-500 bg-orange-500/10";
    case "cash_flow": return "text-indigo-500 bg-indigo-500/10";
    case "financing": return "text-purple-500 bg-purple-500/10";
    case "japan_import": return "text-sky-500 bg-sky-500/10";
    default: return "text-muted-foreground bg-muted";
  }
}

function getCategoryLabel(category: SearchCategory) {
  switch (category) {
    case "vehicles": return "Inventory";
    case "deals": return "Deal";
    case "clients": return "Client";
    case "investors": return "Investor";
    case "leads": return "Lead";
    case "cash_flow": return "Cash Flow";
    case "financing": return "Financing";
    case "japan_import": return "Japan Import";
    default: return category;
  }
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is ready
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    } else {
      // Reset state when closed
      setQuery("");
      setCategory("all");
      setResults([]);
      setActiveIndex(-1);
      setHasSearched(false);
    }
  }, [open]);

  // Debounced search
  const doSearch = useCallback(
    (q: string, cat: SearchCategory) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (q.trim().length < 2) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const { results: data } = await globalSearch(q, cat, 8);
          setResults(data);
          setHasSearched(true);
          setActiveIndex(-1);
        } finally {
          setIsLoading(false);
        }
      }, 250);
    },
    []
  );

  useEffect(() => {
    doSearch(query, category);
  }, [query, category, doSearch]);

  // Keyboard shortcut: Ctrl+K / Cmd+K to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  // Keyboard navigation inside results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      navigateTo(results[activeIndex]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const navigateTo = (result: SearchResult) => {
    onOpenChange(false);
    router.push(result.link);
  };

  if (!open) return null;

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  // Flatten for keyboard navigation index
  let flatIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={() => onOpenChange(false)}
      />

      {/* Search Panel */}
      <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-[12vh] sm:pt-[15vh] pointer-events-none">
        <div
          className={cn(
            "pointer-events-auto w-full max-w-2xl",
            "bg-background border rounded-xl shadow-2xl",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200",
            "flex flex-col max-h-[70vh] sm:max-h-[65vh]"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3 sm:px-4 border-b">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search inventory, deals, clients, investors..."
              className="flex-1 h-12 sm:h-14 bg-transparent text-sm sm:text-base outline-none placeholder:text-muted-foreground/60"
              autoComplete="off"
              spellCheck={false}
            />
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
            )}
            {query && !isLoading && (
              <button
                onClick={() => setQuery("")}
                className="p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 border-b overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  category === cat.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {cat.icon}
                <span className="hidden xs:inline sm:inline">{cat.label}</span>
                <span className="xs:hidden sm:hidden">{cat.label.length > 6 ? cat.label.slice(0, 3) : cat.label}</span>
              </button>
            ))}
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto overscroll-contain"
          >
            {/* Empty State - Initial */}
            {!hasSearched && !query && (
              <div className="flex flex-col items-center justify-center py-10 sm:py-14 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Quick Search
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Search across all your inventory, deals, clients, investors, leads, cash flow, and financing records instantly.
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <kbd className="inline-flex h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground">
                    <Command className="h-3 w-3" />K
                  </kbd>
                  <span className="text-[10px] text-muted-foreground">to toggle search</span>
                </div>
              </div>
            )}

            {/* Empty State - No results */}
            {hasSearched && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 sm:py-14 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  No results found
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Try a different search term or change the category filter.
                </p>
              </div>
            )}

            {/* Grouped Results */}
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-3 sm:px-4 py-2 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {getCategoryLabel(cat as SearchCategory)} ({items.length})
                  </p>
                </div>
                {items.map((result) => {
                  flatIndex++;
                  const idx = flatIndex;
                  return (
                    <button
                      key={result.id}
                      onClick={() => navigateTo(result)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-colors",
                        "hover:bg-muted/60 focus:bg-muted/60 focus:outline-none",
                        activeIndex === idx && "bg-muted/80"
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shrink-0",
                          getCategoryColor(result.category as SearchCategory)
                        )}
                      >
                        {getCategoryIcon(result.icon, "h-4 w-4 sm:h-5 sm:w-5")}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {result.title}
                          </p>
                          {category === "all" && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4 shrink-0 hidden sm:inline-flex"
                            >
                              {getCategoryLabel(result.category as SearchCategory)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {result.subtitle}
                        </p>
                      </div>

                      {/* Meta (price etc.) */}
                      {result.meta && (
                        <span className="text-xs font-semibold font-figures tabular-nums text-foreground shrink-0 hidden sm:block">
                          {result.meta}
                        </span>
                      )}

                      {/* Arrow */}
                      <ArrowRight
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground/50 shrink-0 transition-transform",
                          activeIndex === idx && "translate-x-0.5 text-muted-foreground"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          {results.length > 0 && (
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-t bg-muted/30 text-[11px] text-muted-foreground rounded-b-xl">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="inline-flex h-5 items-center rounded border bg-background px-1 font-mono text-[10px]">↑</kbd>
                  <kbd className="inline-flex h-5 items-center rounded border bg-background px-1 font-mono text-[10px]">↓</kbd>
                  navigate
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="inline-flex h-5 items-center rounded border bg-background px-1 font-mono text-[10px]">↵</kbd>
                  open
                </span>
              </div>
              <span className="font-figures tabular-nums">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
