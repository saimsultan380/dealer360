'use client';

import { VehicleForm } from '@/components/inventory/vehicle-form';
import { FormConfigProvider } from '@/components/inventory/form-config';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewVehiclePage() {
    return (
        <FormConfigProvider>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/inventory">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Add New Vehicle</h1>
                        <p className="text-muted-foreground">
                            Enter vehicle details to add to your inventory.
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <VehicleForm />
                </div>
            </div>
        </FormConfigProvider>
    );
}
