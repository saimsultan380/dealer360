"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleForm } from "@/components/inventory/vehicle-form";
import { FormConfigProvider } from "@/components/inventory/form-config";

interface EditVehicleClientProps {
  vehicleId: string;
  initial: {
    vehicle: Record<string, unknown>;
    metadata: Record<string, unknown> | null;
    imageUrls: string[];
    documents?: {
      buyerItems: { id: string; url: string }[];
      sellerItems: { id: string; url: string }[];
      chassisImage: { id: string; url: string } | null;
      vehicleDocs: { id: string; url: string; type: string; name: string }[];
    } | null;
  };
  vehicleLabel: string;
}

export function EditVehicleClient({
  vehicleId,
  initial,
  vehicleLabel,
}: EditVehicleClientProps) {
  return (
    <FormConfigProvider>
      <div className="space-y-6">
        <div className="flex gap-4 items-center">
          <Link href="/dashboard/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Vehicle</h1>
            <p className="text-muted-foreground">
              Update details for {vehicleLabel}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <VehicleForm mode="edit" vehicleId={vehicleId} initial={initial} />
        </div>
      </div>
    </FormConfigProvider>
  );
}
