'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, X } from 'lucide-react';
import {
    getExpenseCategories,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
} from '@/lib/actions/cash-flow';
import type { ExpenseCategory } from '@/lib/types/database';

const categorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const PRESET_COLORS = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#eab308', // yellow
    '#22c55e', // green
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f97316', // orange
    '#14b8a6', // teal
];

interface ExpenseCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExpenseCategoryDialog({ open, onOpenChange }: ExpenseCategoryDialogProps) {
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#3b82f6');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch,
    } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: '',
            description: '',
            color: '#3b82f6',
        },
    });

    const watchedColor = watch('color');

    useEffect(() => {
        if (open) {
            fetchCategories();
        }
    }, [open]);

    useEffect(() => {
        setValue('color', selectedColor);
    }, [selectedColor, setValue]);

    const fetchCategories = async () => {
        setLoading(true);
        const result = await getExpenseCategories();
        if (result.data) {
            setCategories(result.data);
        }
        setLoading(false);
    };

    const onSubmit = async (data: CategoryFormData) => {
        const result = await createExpenseCategory({
            name: data.name,
            description: data.description,
            color: data.color,
        });

        if (result.error) {
            alert(result.error);
        } else {
            reset();
            setSelectedColor('#3b82f6');
            fetchCategories();
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this category?')) {
            const result = await deleteExpenseCategory(id);
            if (result.error) {
                alert(result.error);
            } else {
                fetchCategories();
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Expense Categories</DialogTitle>
                    <DialogDescription>
                        Create and manage expense categories for better organization
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Add New Category Form */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold">Add New Category</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Category Name</Label>
                                <Input
                                    id="name"
                                    {...register('name')}
                                    placeholder="e.g., Rent, Utilities, Salary"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    {...register('description')}
                                    placeholder="Brief description of this category"
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Color</Label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${
                                                selectedColor === color
                                                    ? 'border-foreground scale-110'
                                                    : 'border-border hover:scale-105'
                                            }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <Input
                                    type="text"
                                    {...register('color')}
                                    value={watchedColor}
                                    onChange={(e) => {
                                        setValue('color', e.target.value);
                                        setSelectedColor(e.target.value);
                                    }}
                                    className="font-mono"
                                    placeholder="#3b82f6"
                                />
                                {errors.color && (
                                    <p className="text-sm text-destructive mt-1">{errors.color.message}</p>
                                )}
                            </div>

                            <Button type="submit" disabled={isSubmitting}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Category
                            </Button>
                        </form>
                    </div>

                    {/* Existing Categories */}
                    <div className="space-y-2">
                        <h3 className="font-semibold">Existing Categories</h3>
                        {loading ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No categories yet. Create one above.</p>
                        ) : (
                            <div className="space-y-2">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <div>
                                                <div className="font-medium">{category.name}</div>
                                                {category.description && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {category.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(category.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
