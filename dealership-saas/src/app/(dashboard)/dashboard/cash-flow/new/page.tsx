'use client';

import { CashTransactionForm } from '@/components/cash-flow/cash-transaction-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewCashTransactionPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/cash-flow">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Add New Transaction</h1>
                    <p className="text-muted-foreground">
                        Record a new cash in, cash out, or expense transaction.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <CashTransactionForm />
            </div>
        </div>
    );
}
