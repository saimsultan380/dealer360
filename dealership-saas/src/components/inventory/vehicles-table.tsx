"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Eye, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Vehicle } from "@/lib/types/database";
import { deleteVehicle } from "@/lib/actions/inventory";
import { Pagination } from "@/components/ui/pagination-advanced";
import { subscribeToVehicles } from "@/lib/supabase/realtime";
import { useAuthStore } from "@/lib/store";

interface VehiclesTableProps {
  vehicles: Vehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function VehiclesTable({
  vehicles: initialVehicles,
  pagination,
}: VehiclesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organization } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const safeInitial = Array.isArray(initialVehicles) ? initialVehicles : [];
  const [displayVehicles, setDisplayVehicles] = useState(safeInitial);
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connected" | "disconnected" | "error"
  >("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync display with server data when filters/pagination change (new data from server)
  useEffect(() => {
    const next = Array.isArray(initialVehicles) ? initialVehicles : [];
    setDisplayVehicles(next);
  }, [initialVehicles]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!organization?.id) {
      setRealtimeStatus("connected");
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const setupSubscription = () => {
      unsubscribe = subscribeToVehicles(
        {
          onInsert: (payload) => {
            console.log("Vehicle inserted in realtime:", payload.new);
            setRealtimeStatus("connected");
            // Refresh the page to get updated data with pagination
            router.refresh();
          },
          onUpdate: (payload) => {
            console.log("Vehicle updated in realtime:", payload.new);
            setRealtimeStatus("connected");
            const updated = payload.new as any;
            if (!updated?.id) return;
            setDisplayVehicles((prev) =>
              prev.map((v) => (v.id === updated.id ? (updated as Vehicle) : v))
            );
          },
          onDelete: (payload) => {
            console.log("Vehicle deleted in realtime:", payload.old);
            setRealtimeStatus("connected");
            const oldRow = payload.old as any;
            if (!oldRow?.id) return;
            setDisplayVehicles((prev) =>
              prev.filter((v) => v.id !== oldRow.id)
            );
          },
          onError: (error) => {
            console.error("Realtime subscription error:", error);
            setRealtimeStatus("error");
            setErrorMessage(
              "Realtime connection error. Live updates disabled."
            );
            setTimeout(() => setErrorMessage(null), 5000);
          },
        },
        organization.id
      );
    };

    setupSubscription();
    setRealtimeStatus("connected");

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [organization?.id, router]);

  const statusColors: Record<string, string> = {
    available: "bg-green-500/10 text-green-500",
    reserved: "bg-blue-500/10 text-blue-500",
    sold: "bg-gray-500/10 text-gray-500",
    in_service: "bg-amber-500/10 text-amber-500",
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      setIsDeleting(id);
      await deleteVehicle(id);
      setIsDeleting(null);
    }
  };

  const currentPage = pagination.page;
  const itemsPerPage = pagination.limit;
  const totalPages = pagination.totalPages;
  const totalItems = pagination.total;

  const updateQuery = (next: { page?: number; limit?: number }) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (next.page !== undefined) params.set("page", String(next.page));
    if (next.limit !== undefined) params.set("limit", String(next.limit));
    router.push(`/dashboard/inventory?${params.toString()}`);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Realtime Status Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Realtime Connection Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`h-2 w-2 rounded-full ${
            realtimeStatus === "connected"
              ? "bg-green-500"
              : realtimeStatus === "error"
                ? "bg-red-500"
                : "bg-yellow-500"
          }`}
          aria-label={`Realtime connection: ${realtimeStatus}`}
        />
        <span className="text-muted-foreground">
          {realtimeStatus === "connected"
            ? "Live updates enabled"
            : realtimeStatus === "error"
              ? "Connection error"
              : "Connecting..."}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[120px] font-semibold">Image</TableHead>
              <TableHead className="font-semibold">Vehicle Info</TableHead>
              <TableHead className="font-semibold">Price</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Mileage</TableHead>
              <TableHead className="text-right font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No vehicles found.
                </TableCell>
              </TableRow>
            ) : (
              displayVehicles.map((vehicle: any) => (
                <TableRow
                  key={vehicle.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() =>
                    router.push(`/dashboard/inventory/${vehicle.id}`)
                  }
                >
                  <TableCell>
                    <div className="relative h-16 w-24 overflow-hidden rounded-lg bg-muted border">
                      <Image
                        src={
                          vehicle.vehicle_images &&
                          vehicle.vehicle_images.length > 0
                            ? vehicle.vehicle_images[0].url
                            : "/vehicle-placeholder.svg"
                        }
                        alt={`${vehicle.make} ${vehicle.model}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-base">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {vehicle.variant}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    PKR {(vehicle.selling_price || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${statusColors[vehicle.status]} capitalize`}
                    >
                      {vehicle.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(vehicle.mileage || 0).toLocaleString()} km
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/inventory/${vehicle.id}`);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/dashboard/inventory/${vehicle.id}/edit`
                            );
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Vehicle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={isDeleting === vehicle.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(vehicle.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {displayVehicles.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={(p) => updateQuery({ page: p })}
          onItemsPerPageChange={(l) => updateQuery({ page: 1, limit: l })}
        />
      )}
    </div>
  );
}
