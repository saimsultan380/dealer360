import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  DollarSign,
  Calendar,
  User,
  Phone,
  MapPin,
  FileText,
  Car,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  Clock,
  X,
  MessageCircle,
  Printer,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSaleById } from "@/lib/actions/sales";
import { BuyerContactActions } from "@/components/sales/buyer-contact-actions";
import { VehicleImageCarousel } from "@/components/inventory/vehicle-image-carousel";
import { getClientAvatarUrl } from "@/lib/utils/avatar-url";
import { cn } from "@/lib/utils";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: sale, error } = await getSaleById(id);

  if (error || !sale) {
    notFound();
  }

  const vehicle = sale.vehicles;
  const remainingAmount =
    parseFloat(sale.sale_price) - parseFloat(sale.down_payment);
  const profit = parseFloat(sale.sale_price) - (vehicle?.purchase_price || 0);
  const profitPercentage =
    vehicle?.purchase_price > 0
      ? ((profit / vehicle.purchase_price) * 100).toFixed(1)
      : 0;

  const statusConfig: Record<
    string,
    { color: string; bgColor: string; icon: any; label: string }
  > = {
    completed: {
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
      icon: CheckCircle2,
      label: "Completed",
    },
    pending: {
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
      icon: Clock,
      label: "Pending",
    },
    cancelled: {
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10 border-red-500/20",
      icon: X,
      label: "Cancelled",
    },
  };

  const status = statusConfig[sale.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  // Get vehicle images
  const vehicleImages =
    vehicle?.vehicle_images?.sort((a: any, b: any) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.display_order || 0) - (b.display_order || 0);
    }) || [];

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <Link href="/dashboard/sales" className="shrink-0">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl font-bold truncate sm:text-2xl">
                Sale Details
              </h1>
              <Badge
                variant="outline"
                className={cn("gap-1 shrink-0", status.bgColor, status.color)}
              >
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate sm:text-base">
              {vehicle?.year} {vehicle?.make} {vehicle?.model}
              {vehicle?.variant && ` - ${vehicle.variant}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Link
            href={`/dashboard/sales/${sale.id}/edit`}
            className="flex-1 sm:flex-none"
          >
            <Button size="sm" className="w-full sm:w-auto">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 min-w-0">
        {/* Left Column - Vehicle & Sale Details */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Vehicle Card */}
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="bg-primary/10 border-b -mt-4 px-4 py-4 sm:-mt-6 sm:px-6 sm:py-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Vehicle Information</CardTitle>
                  <CardDescription>Details of the sold vehicle</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 min-w-0">
              {/* Vehicle Images Carousel */}
              <div className="p-3 sm:p-4 min-w-0">
                <VehicleImageCarousel
                  images={vehicleImages}
                  alt={`${vehicle?.make} ${vehicle?.model}`}
                />
              </div>

              {/* Vehicle Details */}
              <div className="p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Make & Model
                    </p>
                    <p className="font-medium">
                      {vehicle?.make} {vehicle?.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p className="font-medium">{vehicle?.year}</p>
                  </div>
                  {vehicle?.variant && (
                    <div>
                      <p className="text-sm text-muted-foreground">Variant</p>
                      <p className="font-medium">{vehicle.variant}</p>
                    </div>
                  )}
                  {vehicle?.registration_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Registration
                      </p>
                      <Badge variant="outline">
                        {vehicle.registration_number}
                      </Badge>
                    </div>
                  )}
                  {vehicle?.color && (
                    <div>
                      <p className="text-sm text-muted-foreground">Color</p>
                      <p className="font-medium capitalize">{vehicle.color}</p>
                    </div>
                  )}
                  {vehicle?.mileage && (
                    <div>
                      <p className="text-sm text-muted-foreground">Mileage</p>
                      <p className="font-medium">
                        {vehicle.mileage.toLocaleString()} km
                      </p>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <Link href={`/dashboard/inventory/${sale.vehicle_id}`}>
                  <Button variant="outline" className="w-full">
                    <Car className="mr-2 h-4 w-4" />
                    View Full Vehicle Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Sale Details Card */}
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="bg-emerald-500/10 border-b -mt-4 px-4 py-4 sm:-mt-6 sm:px-6 sm:py-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle>Sale Details</CardTitle>
                  <CardDescription>
                    Transaction and payment information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                <div className="p-3 sm:p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Sale Price
                  </p>
                  <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 font-figures tabular-nums truncate sm:text-xl">
                    PKR {parseFloat(sale.sale_price).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Down Payment
                  </p>
                  <p className="text-lg font-semibold font-figures tabular-nums truncate sm:text-xl">
                    PKR {parseFloat(sale.down_payment).toLocaleString()}
                  </p>
                </div>
                {remainingAmount > 0 && (
                  <div className="p-3 sm:p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 sm:col-span-2 space-y-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      Remaining Amount at Deal Time
                    </p>
                    <p className="text-xl font-semibold text-amber-600 dark:text-amber-400">
                      PKR {remainingAmount.toLocaleString()}
                    </p>
                    {sale.status === "completed" && (
                      <p className="text-xs text-muted-foreground">
                        This amount was pending when the deal was created but
                        has since been paid in full. It is shown here only for
                        payment history.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Payment Method
                    </p>
                    <p className="font-medium capitalize">
                      {sale.payment_method?.replace("_", " ") || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Deal Date
                    </p>
                    <p className="font-medium">
                      {new Date(sale.deal_date).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {sale.delivery_date && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Delivery Date
                      </p>
                      <p className="font-medium">
                        {new Date(sale.delivery_date).toLocaleDateString(
                          "en-PK",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {sale.notes && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">
                      {sale.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer & Profit */}
        <div className="space-y-6 min-w-0">
          {/* Customer Card */}
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="bg-blue-500/10 border-b -mt-4 px-4 py-4 sm:-mt-6 sm:px-6 sm:py-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Buyer Information</CardTitle>
                  <CardDescription>Customer details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                  <AvatarImage
                    src={
                      getClientAvatarUrl(sale.client_avatar_url) ?? undefined
                    }
                    alt={sale.customer_name || "Buyer"}
                  />
                  <AvatarFallback className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xl">
                    {sale.customer_name?.charAt(0)?.toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold truncate sm:text-lg">
                    {sale.customer_name}
                  </p>
                  <p className="text-sm text-muted-foreground">Buyer</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium truncate">
                      {sale.customer_phone}
                    </p>
                  </div>
                </div>
                {sale.customer_cnic && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">CNIC</p>
                      <p className="font-medium">{sale.customer_cnic}</p>
                    </div>
                  </div>
                )}
                {sale.customer_address && (
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center mt-0.5">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{sale.customer_address}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <BuyerContactActions phone={sale.customer_phone} />
            </CardContent>
          </Card>

          {/* Profit Summary Card */}
          {vehicle?.purchase_price > 0 && (
            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="bg-purple-500/10 border-b -mt-4 px-4 py-4 sm:-mt-6 sm:px-6 sm:py-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle>Profit Summary</CardTitle>
                    <CardDescription>Sale margin analysis</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">
                      Purchase Price
                    </span>
                    <span className="font-medium font-figures tabular-nums text-right truncate">
                      PKR {vehicle.purchase_price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">
                      Sale Price
                    </span>
                    <span className="font-medium font-figures tabular-nums text-right truncate">
                      PKR {parseFloat(sale.sale_price).toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium shrink-0">Net Profit</span>
                    <span
                      className={cn(
                        "text-lg font-bold font-figures tabular-nums text-right truncate sm:text-xl",
                        profit >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {profit >= 0 ? "+" : ""}PKR {profit.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <span className="text-sm text-muted-foreground">
                      Profit Margin:{" "}
                    </span>
                    <span
                      className={cn(
                        "font-bold",
                        profit >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {profitPercentage}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="min-w-0">
            <CardHeader className="pb-3 px-4 sm:px-6">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 sm:px-6">
              <Link
                href={`/dashboard/inventory/${sale.vehicle_id}`}
                className="block"
              >
                <Button variant="outline" className="w-full justify-start">
                  <Car className="mr-2 h-4 w-4" />
                  View Vehicle Details
                </Button>
              </Link>
              <Link
                href={`/dashboard/clients?q=${encodeURIComponent(
                  sale.customer_phone
                )}`}
                className="block"
              >
                <Button variant="outline" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  View Customer Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
