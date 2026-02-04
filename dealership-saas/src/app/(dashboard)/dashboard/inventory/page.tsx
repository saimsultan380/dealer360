import Link from "next/link";
import {
  Car,
  CheckCircle2,
  Clock3,
  DollarSign,
  Plus,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVehicles } from "@/lib/actions/inventory";
import { VehiclesTable } from "@/components/inventory/vehicles-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryRealtimeListener } from "@/components/inventory/inventory-realtime-listener";
import { InventoryFilterBar } from "@/components/inventory/inventory-filter-bar";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
}) {
  const sp = await searchParams;
  const query = sp.q || "";
  const status = sp.status || "all";
  const page = Number(sp.page) || 1;
  const limit = Number(sp.limit) || 10;

  const {
    data: vehicles,
    metadata,
    error,
  } = await getVehicles({ query, status, page, limit });

  const allVehicles = (vehicles || []) as any[];
  const totalVehicles = metadata?.total ?? allVehicles.length;
  const availableCount = allVehicles.filter(
    (v) => v.status === "available"
  ).length;
  const reservedCount = allVehicles.filter(
    (v) => v.status === "reserved"
  ).length;
  const inServiceCount = allVehicles.filter(
    (v) => v.status === "in_service"
  ).length;
  const soldCount = allVehicles.filter((v) => v.status === "sold").length;
  const totalStockValue = allVehicles.reduce(
    (sum, v) => sum + (v.selling_price || 0),
    0
  );

  return (
    <div className="space-y-6">
      <InventoryRealtimeListener />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your vehicle stock, pricing, and availability.
          </p>
        </div>
        <Link href="/dashboard/inventory/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Vehicles
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Car className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-figures tabular-nums">
              {totalVehicles}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-figures tabular-nums">
              {availableCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reserved / In Service
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock3 className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-figures tabular-nums">
              {reservedCount + inServiceCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-figures tabular-nums">
              PKR {totalStockValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <InventoryFilterBar initialQuery={query} initialStatus={status} />

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <VehiclesTable
        vehicles={(Array.isArray(vehicles) ? vehicles : []) as any}
        pagination={{
          page: metadata?.page ?? page,
          limit: metadata?.limit ?? limit,
          total: metadata?.total ?? allVehicles.length,
          totalPages: metadata?.totalPages ?? 1,
        }}
      />
    </div>
  );
}
