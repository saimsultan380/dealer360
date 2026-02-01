'use client';

import { useState, useEffect } from 'react';
import { ClientForm } from '@/components/clients/client-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
    const [clientId, setClientId] = useState<string | null>(null);

    useEffect(() => {
        params.then((p) => setClientId(p.id));
    }, [params]);

    if (!clientId) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/clients/${clientId}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Edit Client</h1>
                    <p className="text-muted-foreground">
                        Update client information.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <ClientForm clientId={clientId} />
            </div>
        </div>
    );
}
