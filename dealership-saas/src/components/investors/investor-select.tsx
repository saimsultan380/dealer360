'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getInvestors } from '@/lib/actions/investors';

export interface InvestorOption {
    id: string;
    name: string;
    phone: string;
    cnic?: string | null;
    address?: string | null;
    balance?: number;
}

interface InvestorSelectProps {
    label?: string;
    value?: string;
    onValueChange: (investorId: string, investor?: InvestorOption) => void;
    disabled?: boolean;
}

export function InvestorSelect({ label = 'Select Investor', value, onValueChange, disabled }: InvestorSelectProps) {
    const [investors, setInvestors] = useState<InvestorOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        let alive = true;
        const run = async () => {
            setLoading(true);
            const result = await getInvestors();
            if (!alive) return;
            if (result.data) {
                setInvestors(
                    result.data.map((inv) => ({
                        id: inv.id,
                        name: inv.name,
                        phone: inv.phone,
                        cnic: inv.cnic,
                        address: inv.address,
                        balance: inv.balance,
                    }))
                );
            } else {
                setInvestors([]);
            }
            setLoading(false);
        };
        run();
        return () => {
            alive = false;
        };
    }, []);

    const filtered = useMemo(() => {
        if (!search) return investors;
        const q = search.toLowerCase();
        return investors.filter(
            (i) =>
                i.name.toLowerCase().includes(q) ||
                i.phone.toLowerCase().includes(q) ||
                (i.cnic || '').toLowerCase().includes(q)
        );
    }, [investors, search]);

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search investors by name, phone, CNIC..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                        disabled={disabled || loading}
                    />
                </div>
                <Select
                    value={value || ''}
                    onValueChange={(id) => {
                        const inv = investors.find((i) => i.id === id);
                        onValueChange(id, inv);
                    }}
                    disabled={disabled || loading}
                >
                    <SelectTrigger className="w-full">
                        {/* Do not pass children to SelectValue (can cause React portal/ref error). */}
                        <SelectValue placeholder={loading ? 'Loading investors...' : 'Select an investor...'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {filtered.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {loading ? 'Loading...' : 'No investors found'}
                            </div>
                        ) : (
                            filtered.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id}>
                                    {inv.name}
                                    {inv.phone ? ` (${inv.phone})` : ''}
                                    {inv.cnic ? ` • ${inv.cnic}` : ''}
                                    {typeof inv.balance === 'number' ? ` • PKR ${inv.balance.toLocaleString()}` : ''}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

