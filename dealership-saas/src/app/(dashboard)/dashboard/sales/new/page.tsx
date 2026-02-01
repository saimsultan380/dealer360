'use client';

import { SaleForm } from '@/components/sales/sale-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewSalePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/sales">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">New Sale</h1>
                    <p className="text-muted-foreground">
                        Record a new vehicle sale transaction
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <SaleForm />
            </div>
        </div>
    );
}
