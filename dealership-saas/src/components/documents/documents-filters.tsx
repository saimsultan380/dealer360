'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { DocumentType, EntityType } from '@/lib/types/database';

const DOCUMENT_TYPES: { value: DocumentType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'cnic_front', label: 'CNIC Front' },
    { value: 'cnic_back', label: 'CNIC Back' },
    { value: 'registration', label: 'Registration' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'other', label: 'Other' },
];

const ENTITY_TYPES: { value: EntityType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Entities' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'deal', label: 'Deal' },
    { value: 'lead', label: 'Lead' },
];

export function DocumentsFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const entityType = searchParams.get('entity_type') || 'all';
    const documentType = searchParams.get('document_type') || 'all';
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    const updateFilters = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete('page'); // Reset to page 1
        router.push(`/dashboard/documents?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push('/dashboard/documents');
    };

    const hasActiveFilters = entityType !== 'all' || documentType !== 'all' || search || startDate || endDate;

    return (
        <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search files..."
                    value={search}
                    onChange={(e) => updateFilters('search', e.target.value)}
                    className="pl-9 h-9 w-full"
                />
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 min-w-0">
                    <Select value={entityType} onValueChange={(v) => updateFilters('entity_type', v)}>
                        <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="Entity Type" />
                        </SelectTrigger>
                        <SelectContent>
                            {ENTITY_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1 min-w-0">
                    <Select value={documentType} onValueChange={(v) => updateFilters('document_type', v)}>
                        <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="Document Type" />
                        </SelectTrigger>
                        <SelectContent>
                            {DOCUMENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1 min-w-0">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => updateFilters('start_date', e.target.value)}
                        className="w-full h-9 text-sm"
                        placeholder="Start Date"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => updateFilters('end_date', e.target.value)}
                        className="w-full h-9 text-sm"
                        placeholder="End Date"
                    />
                </div>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-9 px-3 shrink-0"
                        title="Clear all filters"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
