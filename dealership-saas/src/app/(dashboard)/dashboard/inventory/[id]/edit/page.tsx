'use client';

import { VehicleForm } from '@/components/inventory/vehicle-form';
import { FormConfigProvider } from '@/components/inventory/form-config';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Vehicle } from '@/lib/types/database';

export default function EditVehiclePage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [initial, setInitial] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchVehicle() {
            if (!id) return;
            const supabase = createClient();
            const { data, error } = await supabase
                .from('vehicles')
                .select('*, vehicle_images(*)')
                .eq('id', id)
                .single();

            if (error || !data) {
                // In client component we can't use notFound() directly same way, but let's handle graceful loading
                if (error) console.error('Error fetching vehicle:', error);
            }
            setVehicle(data);

            // Fetch metadata/documents to prefill extended fields
            const { data: docs } = await supabase
                .from('documents')
                .select('*')
                .eq('entity_type', 'vehicle')
                .eq('entity_id', id);

            const metadataDoc = (docs as any[] | null | undefined)?.find((d: any) => d.file_name === 'vehicle_metadata.json');
            let metadata: any = null;
            if (metadataDoc?.file_url?.startsWith('data:application/json;base64,')) {
                const base64 = metadataDoc.file_url.split(',')[1] || '';
                try {
                    metadata = JSON.parse(atob(base64));
                } catch {
                    metadata = null;
                }
            }

            const imageUrls = (data as any)?.vehicle_images?.map((x: any) => x.url).filter(Boolean) ?? [];
            setInitial({ vehicle: data, metadata, imageUrls });
            setLoading(false);
        }
        fetchVehicle();
    }, [id]);

    if (loading) return <div className="py-8">Loading vehicle details...</div>;
    if (!vehicle) return <div className="py-8">Vehicle not found</div>;

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
                        <h1 className="text-2xl font-bold">Edit Vehicle</h1>
                        <p className="text-muted-foreground">
                            Update details for {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <VehicleForm mode="edit" vehicleId={vehicle.id} initial={initial} />
                </div>
            </div>
        </FormConfigProvider>
    );
}
