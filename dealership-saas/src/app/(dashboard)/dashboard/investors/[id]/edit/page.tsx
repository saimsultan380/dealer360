'use client';

import { useState, useEffect } from 'react';
import { InvestorForm } from '@/components/investors/investor-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditInvestorPage({ params }: { params: Promise<{ id: string }> }) {
    const [investorId, setInvestorId] = useState<string | null>(null);

    useEffect(() => {
        params.then((p) => setInvestorId(p.id));
    }, [params]);

    if (!investorId) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/investors/${investorId}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Edit Investor</h1>
                    <p className="text-muted-foreground">
                        Update investor information.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <InvestorForm investorId={investorId} />
            </div>
        </div>
    );
}
