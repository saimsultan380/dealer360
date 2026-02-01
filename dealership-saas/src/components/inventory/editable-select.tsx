'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
    placeholder = 'Select...',
    className,
    storageKey,
    disabled = false,
}: EditableSelectProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newItemValue, setNewItemValue] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const didUserMutateOptionsRef = useRef(false);

    // IMPORTANT:
    // - Parent handles loading options for a given storageKey (e.g. make -> models)
    // - This component should only persist when the user *adds/deletes* via this UI.
    // Otherwise, on make change, we could accidentally write the *previous make's* options
    // into the *new make's* storageKey before the parent finishes updating options.
    useEffect(() => {
        if (!storageKey || typeof window === 'undefined' || !Array.isArray(options)) return;
        if (!didUserMutateOptionsRef.current) return;

        didUserMutateOptionsRef.current = false;
        try {
            localStorage.setItem(storageKey, JSON.stringify(options));
        } catch {
            // ignore localStorage quota / write errors
        }
    }, [options, storageKey]);

    const handleAddNew = useCallback(() => {
        if (!newItemValue.trim()) return;

        const trimmed = newItemValue.trim();
        if (options.includes(trimmed)) {
            // Item already exists, just select it
            onValueChange(trimmed);
            setIsAddDialogOpen(false);
            setNewItemValue('');
            return;
        }

        const updated = [...options, trimmed].sort();
        didUserMutateOptionsRef.current = true;
        onOptionsChange(updated);
        onValueChange(trimmed);
        setIsAddDialogOpen(false);
        setNewItemValue('');
    }, [newItemValue, options, onOptionsChange, onValueChange]);

    const handleDeleteClick = useCallback(
        (itemToDelete: string, e: React.MouseEvent | React.PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDeleting(itemToDelete);
        },
        []
    );

    const confirmDelete = useCallback(() => {
        if (!isDeleting) return;
        
        const updated = options.filter((opt) => opt !== isDeleting);
        didUserMutateOptionsRef.current = true;
        onOptionsChange(updated);
        if (value === isDeleting) {
            onValueChange('');
        }
        setIsDeleting(null);
    }, [isDeleting, options, value, onOptionsChange, onValueChange]);

    const handleCancelDelete = useCallback(() => {
        setIsDeleting(null);
    }, []);

    const selectValue = value && value.trim() !== '' ? value : undefined;

    return (
        <div className={className}>
            <Select value={selectValue} onValueChange={onValueChange} disabled={disabled}>
                <SelectTrigger className="w-full" disabled={disabled}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                    {options.length > 0 && options.map((option) => (
                        <SelectItem key={option} value={option}>
                            <div className="flex items-center justify-between w-full gap-2 pr-6 group">
                                <span className="flex-1">{option}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 shrink-0 z-10 relative"
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
                            {options.length > 0 ? 'Add New' : 'Add New Model'}
                        </Button>
                    </div>
                </SelectContent>
            </Select>

            {/* Delete confirmation dialog */}
            {isDeleting && (
                <Dialog open={!!isDeleting} onOpenChange={handleCancelDelete}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Item</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete &quot;{isDeleting}&quot;? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={handleCancelDelete}>
                                Cancel
                            </Button>
                            <Button type="button" variant="destructive" onClick={confirmDelete}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Add new item dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Item</DialogTitle>
                        <DialogDescription>Enter a new item to add to the list.</DialogDescription>
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
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddNew();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleAddNew} disabled={!newItemValue.trim()}>
                            Add
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
