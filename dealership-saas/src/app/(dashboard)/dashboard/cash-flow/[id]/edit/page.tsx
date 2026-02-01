'use client';

import { useState, useEffect } from 'react';
import { CashTransactionForm } from '@/components/cash-flow/cash-transaction-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditCashTransactionPage({ params }: { params: Promise<{ id: string }> }) {
    const [id, setId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        params.then((resolvedParams) => {
            setId(resolvedParams.id);
            setLoading(false);
        });
    }, [params]);

    if (loading || !id) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/cash-flow">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Edit Transaction</h1>
                    <p className="text-muted-foreground">
                        Update transaction details.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <CashTransactionForm transactionId={id} />
            </div>
        </div>
    );
}
