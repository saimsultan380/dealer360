'use client';

import { ClientForm } from '@/components/clients/client-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewClientPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/clients">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Add New Client</h1>
                    <p className="text-muted-foreground">
                        Enter client details to add to your system.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <ClientForm />
            </div>
        </div>
    );
}
