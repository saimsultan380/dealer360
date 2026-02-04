"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface EditableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: string[];
  onOptionsChange: (options: string[]) => void;
  placeholder?: string;
  className?: string;
  storageKey?: string; // For localStorage persistence
  disabled?: boolean; // Disable the select
}

export function EditableSelect({
  value,
  onValueChange,
  options,
  onOptionsChange,
  placeholder = "Select...",
  className,
  storageKey,
  disabled = false,
}: EditableSelectProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItemValue, setNewItemValue] = useState("");
  const didUserMutateOptionsRef = useRef(false);
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});
  const didUserMutateUsageRef = useRef(false);

  // Load usage counts from localStorage once
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`${storageKey}-usage`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setUsageMap(parsed);
        }
      }
    } catch {
      // ignore corrupt usage data
    }
  }, [storageKey]);

  // Keep usage map keys in sync with incoming options
  useEffect(() => {
    setUsageMap((prev) => {
      const next: Record<string, number> = { ...prev };
      let changed = false;
      for (const opt of options) {
        if (next[opt] == null) {
          next[opt] = 0;
          changed = true;
        }
      }
      // Drop usage for options that no longer exist
      Object.keys(next).forEach((key) => {
        if (!options.includes(key)) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [options]);

  // IMPORTANT (options persistence):
  // - Parent handles loading options for a given storageKey (e.g. make -> models)
  // - This component should only persist when the user *adds/deletes* via this UI.
  // Otherwise, on make change, we could accidentally write the *previous make's* options
  // into the *new make's* storageKey before the parent finishes updating options.
  useEffect(() => {
    if (!storageKey || typeof window === "undefined" || !Array.isArray(options))
      return;
    if (!didUserMutateOptionsRef.current) return;

    didUserMutateOptionsRef.current = false;
    try {
      localStorage.setItem(storageKey, JSON.stringify(options));
    } catch {
      // ignore localStorage quota / write errors
    }
  }, [options, storageKey]);

  // Persist usage map when user changes it
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    if (!didUserMutateUsageRef.current) return;
    didUserMutateUsageRef.current = false;
    try {
      localStorage.setItem(`${storageKey}-usage`, JSON.stringify(usageMap));
    } catch {
      // ignore storage errors
    }
  }, [usageMap, storageKey]);

  // Sort options by usage (most used first) then alphabetically
  const sortedOptions = Array.isArray(options)
    ? [...options].sort((a, b) => {
        const ua = usageMap[a] ?? 0;
        const ub = usageMap[b] ?? 0;
        if (ua !== ub) return ub - ua;
        return a.localeCompare(b);
      })
    : options;

  const bumpUsage = useCallback((val: string) => {
    if (!val) return;
    setUsageMap((prev) => {
      const next = { ...prev, [val]: (prev[val] ?? 0) + 1 };
      didUserMutateUsageRef.current = true;
      return next;
    });
  }, []);

  const handleAddNew = useCallback(() => {
    if (!newItemValue.trim()) return;

    const trimmed = newItemValue.trim();
    if (options.includes(trimmed)) {
      // Item already exists, just select it
      bumpUsage(trimmed);
      onValueChange(trimmed);
      setIsAddDialogOpen(false);
      setNewItemValue("");
      return;
    }

    const updated = [...options, trimmed].sort();
    didUserMutateOptionsRef.current = true;
    onOptionsChange(updated);
    bumpUsage(trimmed);
    onValueChange(trimmed);
    setIsAddDialogOpen(false);
    setNewItemValue("");
  }, [newItemValue, options, onOptionsChange, onValueChange]);

  const handleDeleteClick = useCallback(
    (itemToDelete: string, e: React.MouseEvent | React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const updated = options.filter((opt) => opt !== itemToDelete);
      didUserMutateOptionsRef.current = true;
      onOptionsChange(updated);
      if (value === itemToDelete) {
        onValueChange("");
      }
    },
    [onOptionsChange, onValueChange, options, value]
  );

  const selectValue = value && value.trim() !== "" ? value : undefined;

  const handleSelectChange = useCallback(
    (val: string) => {
      bumpUsage(val);
      onValueChange(val);
    },
    [bumpUsage, onValueChange]
  );

  return (
    <div className={className}>
      <Select
        value={selectValue}
        onValueChange={handleSelectChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full" disabled={disabled}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {sortedOptions.length > 0 &&
            sortedOptions.map((option) => (
              <SelectItem key={option} value={option}>
                <div className="relative flex items-center w-full gap-2 pr-8 group">
                  <span className="flex-1 truncate">{option}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 z-10"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteClick(option, e);
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </SelectItem>
            ))}
          <div className="border-t p-1">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsAddDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {options.length > 0 ? "Add New" : "Add New Model"}
            </Button>
          </div>
        </SelectContent>
      </Select>

      {/* Add new item dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Enter a new item to add to the list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-item">Item Name</Label>
              <Input
                id="new-item"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                placeholder="Enter item name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNew();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddNew}
              disabled={!newItemValue.trim()}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
