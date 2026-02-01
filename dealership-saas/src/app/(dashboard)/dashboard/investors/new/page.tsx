'use client';

import { InvestorForm } from '@/components/investors/investor-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewInvestorPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/investors">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Add New Investor</h1>
                    <p className="text-muted-foreground">
                        Enter investor details to add to your system.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <InvestorForm />
            </div>
        </div>
    );
}
