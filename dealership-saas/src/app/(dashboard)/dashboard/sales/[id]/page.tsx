import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
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
    Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getSaleById } from '@/lib/actions/sales';
import { cn } from '@/lib/utils';

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data: sale, error } = await getSaleById(id);

    if (error || !sale) {
        notFound();
    }

    const vehicle = sale.vehicles;
    const remainingAmount = parseFloat(sale.sale_price) - parseFloat(sale.down_payment);
    const profit = parseFloat(sale.sale_price) - (vehicle?.purchase_price || 0);
    const profitPercentage = vehicle?.purchase_price > 0
        ? ((profit / vehicle.purchase_price) * 100).toFixed(1)
        : 0;

    const statusConfig: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
        completed: {
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-emerald-500/10 border-emerald-500/20',
            icon: CheckCircle2,
            label: 'Completed'
        },
        pending: {
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-500/10 border-amber-500/20',
            icon: Clock,
            label: 'Pending'
        },
        cancelled: {
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-500/10 border-red-500/20',
            icon: X,
            label: 'Cancelled'
        },
    };

    const status = statusConfig[sale.status] || statusConfig.pending;
    const StatusIcon = status.icon;

    // Get vehicle images
    const vehicleImages = vehicle?.vehicle_images?.sort((a: any, b: any) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return (a.display_order || 0) - (b.display_order || 0);
    }) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/sales">
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">Sale Details</h1>
                            <Badge
                                variant="outline"
                                className={cn('gap-1', status.bgColor, status.color)}
                            >
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {vehicle?.year} {vehicle?.make} {vehicle?.model}
                            {vehicle?.variant && ` - ${vehicle.variant}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                    <Link href={`/dashboard/sales/${sale.id}/edit`}>
                        <Button size="sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Vehicle & Sale Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Vehicle Card */}
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
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
                        <CardContent className="p-0">
                            {/* Vehicle Images */}
                            {vehicleImages.length > 0 ? (
                                <div className="relative aspect-[16/9] bg-muted">
                                    <Image
                                        src={vehicleImages[0].url}
                                        alt={`${vehicle?.make} ${vehicle?.model}`}
                                        fill
                                        className="object-cover"
                                    />
                                    {vehicleImages.length > 1 && (
                                        <div className="absolute bottom-3 right-3 flex gap-1">
                                            {vehicleImages.slice(1, 4).map((img: any, index: number) => (
                                                <div
                                                    key={img.id}
                                                    className="relative h-12 w-16 rounded-md overflow-hidden border-2 border-white shadow-lg"
                                                >
                                                    <Image
                                                        src={img.url}
                                                        alt={`Vehicle image ${index + 2}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ))}
                                            {vehicleImages.length > 4 && (
                                                <div className="h-12 w-16 rounded-md bg-black/70 flex items-center justify-center border-2 border-white shadow-lg">
                                                    <span className="text-white text-sm font-medium">
                                                        +{vehicleImages.length - 4}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="aspect-[16/9] bg-muted flex items-center justify-center">
                                    <Car className="h-16 w-16 text-muted-foreground/30" />
                                </div>
                            )}

                            {/* Vehicle Details */}
                            <div className="p-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Make & Model</p>
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
                                            <p className="text-sm text-muted-foreground">Registration</p>
                                            <Badge variant="outline">{vehicle.registration_number}</Badge>
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
                                            <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
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
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <CardTitle>Sale Details</CardTitle>
                                    <CardDescription>Transaction and payment information</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <p className="text-sm text-muted-foreground mb-1">Sale Price</p>
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        PKR {parseFloat(sale.sale_price).toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <p className="text-sm text-muted-foreground mb-1">Down Payment</p>
                                    <p className="text-2xl font-bold">
                                        PKR {parseFloat(sale.down_payment).toLocaleString()}
                                    </p>
                                </div>
                                {remainingAmount > 0 && (
                                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 sm:col-span-2">
                                        <p className="text-sm text-muted-foreground mb-1">Remaining Amount</p>
                                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                            PKR {remainingAmount.toLocaleString()}
                                        </p>
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
                                        <p className="text-sm text-muted-foreground">Payment Method</p>
                                        <p className="font-medium capitalize">
                                            {sale.payment_method?.replace('_', ' ') || '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Deal Date</p>
                                        <p className="font-medium">
                                            {new Date(sale.deal_date).toLocaleDateString('en-PK', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
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
                                            <p className="text-sm text-muted-foreground">Delivery Date</p>
                                            <p className="font-medium">
                                                {new Date(sale.delivery_date).toLocaleDateString('en-PK', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
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
                                        <p className="text-sm bg-muted/50 p-3 rounded-lg">{sale.notes}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Customer & Profit */}
                <div className="space-y-6">
                    {/* Customer Card */}
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border-b">
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
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4 mb-6">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xl">
                                        {sale.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-lg font-semibold">{sale.customer_name}</p>
                                    <p className="text-sm text-muted-foreground">Buyer</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="font-medium">{sale.customer_phone}</p>
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

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => window.open(`tel:${sale.customer_phone}`)}
                                >
                                    <Phone className="mr-2 h-4 w-4" />
                                    Call
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => window.open(`https://wa.me/${sale.customer_phone?.replace(/[^0-9]/g, '')}`)}
                                >
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    WhatsApp
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Profit Summary Card */}
                    {vehicle?.purchase_price > 0 && (
                        <Card className="overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border-b">
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
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Purchase Price</span>
                                        <span className="font-medium">PKR {vehicle.purchase_price.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Sale Price</span>
                                        <span className="font-medium">PKR {parseFloat(sale.sale_price).toLocaleString()}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Net Profit</span>
                                        <span className={cn(
                                            'text-xl font-bold',
                                            profit >= 0
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-red-600 dark:text-red-400'
                                        )}>
                                            {profit >= 0 ? '+' : ''}PKR {profit.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                                        <span className="text-sm text-muted-foreground">Profit Margin: </span>
                                        <span className={cn(
                                            'font-bold',
                                            profit >= 0
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-red-600 dark:text-red-400'
                                        )}>
                                            {profitPercentage}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href={`/dashboard/inventory/${sale.vehicle_id}`} className="block">
                                <Button variant="outline" className="w-full justify-start">
                                    <Car className="mr-2 h-4 w-4" />
                                    View Vehicle Details
                                </Button>
                            </Link>
                            <Link href={`/dashboard/clients?q=${encodeURIComponent(sale.customer_phone)}`} className="block">
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
