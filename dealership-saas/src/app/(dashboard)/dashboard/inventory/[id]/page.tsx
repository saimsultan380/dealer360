import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Pencil, Calendar, Settings, Fuel, Gauge, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VehicleImageCarousel } from '@/components/inventory/vehicle-image-carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function getMockVehicle(id: string) {
    const mockVehicles: Record<string, any> = {
        'mock-vehicle-1': {
            id: 'mock-vehicle-1',
            organization_id: 'mock-org-1',
            make: 'Toyota',
            model: 'Corolla',
            variant: 'XLI',
            year: 2023,
            color: 'White',
            registration_number: 'LHR-1234',
            engine_number: 'ENG-001',
            chassis_number: 'CHS-001',
            purchase_price: 2000000,
            selling_price: 2500000,
            minimum_price: 2300000,
            status: 'available',
            condition: 'used',
            mileage: 15000,
            fuel_type: 'petrol',
            transmission: 'automatic',
            description: 'Well maintained Toyota Corolla in excellent condition. Mock data for testing.',
            added_by: 'mock-user-1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            vehicle_images: [
                {
                    id: 'mock-img-1',
                    vehicle_id: 'mock-vehicle-1',
                    url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
                    is_primary: true,
                    created_at: new Date().toISOString(),
                }
            ]
        },
        'mock-vehicle-2': {
            id: 'mock-vehicle-2',
            organization_id: 'mock-org-1',
            make: 'Honda',
            model: 'Civic',
            variant: 'RS',
            year: 2022,
            color: 'Black',
            registration_number: 'KHI-5678',
            engine_number: 'ENG-002',
            chassis_number: 'CHS-002',
            purchase_price: 2400000,
            selling_price: 3200000,
            minimum_price: 3000000,
            status: 'reserved',
            condition: 'used',
            mileage: 25000,
            fuel_type: 'petrol',
            transmission: 'automatic',
            description: 'Honda Civic RS with premium features. Mock data for testing.',
            added_by: 'mock-user-1',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            vehicle_images: [
                {
                    id: 'mock-img-2',
                    vehicle_id: 'mock-vehicle-2',
                    url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0ad6?w=800',
                    is_primary: true,
                    created_at: new Date().toISOString(),
                }
            ]
        },
    };
    return mockVehicles[id] || null;
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Await params for Next.js 15+ compatibility
    const { id } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if Supabase is configured
    const isSupabaseConfigured = 
        supabaseUrl && 
        supabaseAnonKey && 
        !supabaseUrl.includes('your-project-id.supabase.co') &&
        supabaseUrl.startsWith('http');

    if (!isSupabaseConfigured) {
        // Use mock data for development
        const mockVehicle = getMockVehicle(id);
        if (!mockVehicle) {
            notFound();
        }
        const vehicle = mockVehicle;
        const documents: any[] = [];
        const buyerDocs: any[] = [];
        const sellerDocs: any[] = [];
        const chassisDoc = null;

        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                        <Link href="/dashboard/inventory">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold truncate">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                            </h1>
                            <p className="text-muted-foreground truncate">{vehicle.variant}</p>
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                ⚠️ Using mock data - Configure Supabase for real data
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end sm:shrink-0">
                        <Link href={`/dashboard/inventory/${vehicle.id}/edit`}>
                            <Button>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Vehicle
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Images */}
                    <Card className="overflow-hidden">
                        <div className="p-4">
                            <VehicleImageCarousel
                                images={vehicle.vehicle_images ?? []}
                                alt={`${vehicle.make} ${vehicle.model}`}
                            />
                        </div>
                    </Card>

                    {/* Details */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Price</p>
                                        <p className="text-lg font-bold">PKR {Number(vehicle.selling_price).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                        <Gauge className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Mileage</p>
                                        <p className="text-lg font-bold">{Number(vehicle.mileage).toLocaleString()} km</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                                        <Fuel className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Fuel</p>
                                        <p className="text-lg font-bold capitalize">{vehicle.fuel_type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                                        <Settings className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Transmission</p>
                                        <p className="text-lg font-bold capitalize">{vehicle.transmission}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Specifications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Status</p>
                                        <Badge variant="outline" className="mt-1 capitalize">{vehicle.status}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Condition</p>
                                        <p className="font-medium capitalize">{vehicle.condition}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Color</p>
                                        <p className="font-medium">{vehicle.color}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Registration</p>
                                        <p className="font-medium">{vehicle.registration_number || 'Unregistered'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Engine No</p>
                                        <p className="font-medium">{vehicle.engine_number || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Chassis No</p>
                                        <p className="font-medium">{vehicle.chassis_number || '-'}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                                    <p className="text-sm leading-relaxed">{vehicle.description || 'No description provided.'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Buyer & Seller Images</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium mb-2">Seller</p>
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-12 w-12 overflow-hidden rounded-full border bg-muted">
                                            <Image src="/avatar-placeholder.svg" alt="Seller" fill className="object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate">Seller</div>
                                            <div className="text-xs text-muted-foreground truncate">No seller details (mock)</div>
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium mb-2">Buyer</p>
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-12 w-12 overflow-hidden rounded-full border bg-muted">
                                            <Image src="/avatar-placeholder.svg" alt="Buyer" fill className="object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate">Buyer</div>
                                            <div className="text-xs text-muted-foreground truncate">No buyer details (mock)</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Real Supabase implementation
    try {
        // NOTE: Supabase generated types are not fully wired up yet in this repo.
        // Cast to avoid blocking builds with `never` inference for select strings.
        const supabase = (await createClient()) as any;

        const { data: vehicle, error } = await supabase
            .from('vehicles')
            .select('*, vehicle_images(*)')
            .eq('id', id)
            .single();

        if (error || !vehicle) {
            // Fall back to mock data if vehicle not found
            const mockVehicle = getMockVehicle(id);
            if (!mockVehicle) {
                notFound();
            }
            const vehicle = mockVehicle;
            const documents: any[] = [];
            const buyerDocs: any[] = [];
            const sellerDocs: any[] = [];
            const chassisDoc = null;
            const primaryImage = vehicle.vehicle_images?.[0]?.url || null;

            return (
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                            <Link href="/dashboard/inventory">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold truncate">
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                </h1>
                                <p className="text-muted-foreground truncate">{vehicle.variant}</p>
                                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                    ⚠️ Using mock data - Vehicle not found in database
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end sm:shrink-0">
                            <Link href={`/dashboard/inventory/${vehicle.id}/edit`}>
                                <Button>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Vehicle
                                </Button>
                            </Link>
                        </div>
                    </div>
                    {/* ... rest of vehicle detail JSX ... */}
                </div>
            );
        }

        const { data: documents } = await supabase
            .from('documents')
            .select('*')
            .eq('entity_type', 'vehicle')
            .eq('entity_id', id);

        const buyerDocs = (documents || []).filter((d: any) => String(d.file_name || '').startsWith('buyer-'));
        const sellerDocs = (documents || []).filter((d: any) => String(d.file_name || '').startsWith('seller-'));
        const chassisDoc = (documents || []).find((d: any) => String(d.file_name || '').startsWith('chassis-'));
        const metadataDoc = (documents || []).find((d: any) => d.file_name === 'vehicle_metadata.json');

        let metadata: any = null;
        if (metadataDoc?.file_url?.startsWith('data:application/json;base64,')) {
            const base64 = metadataDoc.file_url.split(',')[1] || '';
            try {
                const json = Buffer.from(base64, 'base64').toString('utf-8');
                metadata = JSON.parse(json);
            } catch {
                metadata = null;
            }
        }

        const vehicleDocs = (documents || []).filter((d: any) => {
            const name = String(d.file_name || '');
            if (d.id === metadataDoc?.id) return false;
            if (name.startsWith('buyer-') || name.startsWith('seller-') || name.startsWith('chassis-')) {
                return false;
            }
            return true;
        });

        const sellerInfo = metadata?.sellerDetails ?? null;
        const buyerInfo = metadata?.buyerDetails ?? null;
        const sellerAvatar = sellerDocs?.[0]?.file_url || '/avatar-placeholder.svg';
        const buyerAvatar = buyerDocs?.[0]?.file_url || '/avatar-placeholder.svg';
        const sellerExtraDocs = sellerDocs.length > 1 ? sellerDocs.slice(1) : [];
        const buyerExtraDocs = buyerDocs.length > 1 ? buyerDocs.slice(1) : [];

        const { data: deals } = await supabase
            .from('deals')
            .select(
                'id,status,sale_price,down_payment,payment_method,deal_date,delivery_date,customer_name,customer_phone,customer_cnic,customer_address,notes'
            )
            .eq('vehicle_id', id)
            .order('deal_date', { ascending: false });

        const latestDeal = (deals || [])[0] || null;

        const isPresent = (v: any) => {
            if (v === null || v === undefined) return false;
            if (typeof v === 'string') return v.trim().length > 0;
            return true;
        };

        const formatPKR = (n: any) => {
            const num = Number(n);
            if (!Number.isFinite(num)) return null;
            return `PKR ${num.toLocaleString()}`;
        };

        const formatDate = (d: any) => {
            if (!d) return null;
            const dt = new Date(d);
            if (Number.isNaN(dt.getTime())) return null;
            return dt.toLocaleDateString();
        };

        const detailItems = (items: { label: string; value: any; mono?: boolean }[]) =>
            items.filter((i) => isPresent(i.value));

        const canShowParties =
            isPresent(sellerInfo?.name) ||
            isPresent(sellerInfo?.phone) ||
            isPresent(sellerInfo?.cnic) ||
            isPresent(buyerInfo?.name) ||
            isPresent(buyerInfo?.phone) ||
            isPresent(buyerInfo?.cnic) ||
            sellerDocs.length > 0 ||
            buyerDocs.length > 0;

        const canShowDocuments = !!chassisDoc || vehicleDocs.length > 0;
        const canShowDeals = (deals || []).length > 0;

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                        <Link href="/dashboard/inventory">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold truncate">
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                </h1>
                                <Badge variant="outline" className="capitalize">
                                    {vehicle.status}
                                </Badge>
                                <Badge variant="secondary" className="capitalize">
                                    {vehicle.condition}
                                </Badge>
                            </div>
                            {isPresent(vehicle.variant) && (
                                <p className="text-muted-foreground truncate">{vehicle.variant}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end sm:shrink-0">
                        {canShowDeals && latestDeal?.id && (
                            <Button asChild variant="outline">
                                <Link href={`/dashboard/deals/${latestDeal.id}`}>View Deal</Link>
                            </Button>
                        )}
                        <Button asChild>
                            <Link href={`/dashboard/inventory/${vehicle.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Vehicle
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Left: Media + key summary */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card className="overflow-hidden">
                            <div className="p-4">
                                <VehicleImageCarousel images={vehicle.vehicle_images ?? []} alt={`${vehicle.make} ${vehicle.model}`} />
                            </div>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                {detailItems([
                                    { label: 'Selling Price', value: formatPKR(vehicle.selling_price) },
                                    { label: 'Mileage', value: isPresent(vehicle.mileage) ? `${Number(vehicle.mileage).toLocaleString()} km` : null },
                                    { label: 'Fuel', value: isPresent(vehicle.fuel_type) ? String(vehicle.fuel_type).toUpperCase() : null },
                                    { label: 'Transmission', value: isPresent(vehicle.transmission) ? String(vehicle.transmission).toUpperCase() : null },
                                ]).map((it) => (
                                    <div key={it.label} className="rounded-lg border bg-card p-3">
                                        <div className="text-xs text-muted-foreground">{it.label}</div>
                                        <div className="text-base font-semibold mt-1">{it.value}</div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {isPresent(vehicle.description) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Description</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm leading-relaxed whitespace-pre-line">
                                    {vehicle.description}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right: Clean, only-filled details */}
                    <div className="lg:col-span-5">
                        <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue={canShowDeals ? 'deal' : 'vehicle'}>
                                    <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4">
                                        <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
                                        {canShowDeals && <TabsTrigger value="deal">Deal</TabsTrigger>}
                                        {canShowParties && <TabsTrigger value="parties">Parties</TabsTrigger>}
                                        {canShowDocuments && <TabsTrigger value="docs">Docs</TabsTrigger>}
                                    </TabsList>

                                    <TabsContent value="vehicle">
                                        <div className="space-y-5 pt-2">
                                            <div className="space-y-3">
                                                <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                    Basic
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    {detailItems([
                                                        { label: 'Make', value: vehicle.make },
                                                        { label: 'Model', value: vehicle.model },
                                                        { label: 'Variant', value: vehicle.variant },
                                                        { label: 'Year', value: vehicle.year },
                                                        { label: 'Color', value: vehicle.color },
                                                        { label: 'Registration', value: vehicle.registration_number },
                                                    ]).map((it) => (
                                                        <div key={it.label} className="min-w-0">
                                                            <div className="text-muted-foreground text-xs">{it.label}</div>
                                                            <div className="font-medium truncate">{String(it.value)}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="space-y-3">
                                                <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                    Specs
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    {detailItems([
                                                        { label: 'Mileage', value: isPresent(vehicle.mileage) ? `${Number(vehicle.mileage).toLocaleString()} km` : null },
                                                        { label: 'Fuel', value: vehicle.fuel_type },
                                                        { label: 'Transmission', value: vehicle.transmission },
                                                        { label: 'Engine No', value: vehicle.engine_number },
                                                        { label: 'Chassis No', value: vehicle.chassis_number },
                                                    ]).map((it) => (
                                                        <div key={it.label} className="min-w-0">
                                                            <div className="text-muted-foreground text-xs">{it.label}</div>
                                                            <div className="font-medium truncate">{String(it.value)}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="space-y-3">
                                                <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                    Pricing
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    {detailItems([
                                                        { label: 'Selling', value: formatPKR(vehicle.selling_price) },
                                                        { label: 'Purchase', value: formatPKR(vehicle.purchase_price) },
                                                        { label: 'Minimum', value: formatPKR(vehicle.minimum_price) },
                                                    ]).map((it) => (
                                                        <div key={it.label} className="min-w-0">
                                                            <div className="text-muted-foreground text-xs">{it.label}</div>
                                                            <div className="font-medium truncate">{String(it.value)}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {canShowDeals && (
                                        <TabsContent value="deal">
                                            <div className="space-y-4 pt-2">
                                                {latestDeal ? (
                                                    <div className="rounded-lg border bg-card p-3 space-y-3">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="text-sm font-semibold">Latest Deal</div>
                                                            <Badge variant="outline" className="capitalize">
                                                                {latestDeal.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                                            {detailItems([
                                                                { label: 'Sale Price', value: formatPKR(latestDeal.sale_price) },
                                                                { label: 'Down Payment', value: formatPKR(latestDeal.down_payment) },
                                                                { label: 'Method', value: latestDeal.payment_method },
                                                                { label: 'Deal Date', value: formatDate(latestDeal.deal_date) },
                                                                { label: 'Delivery', value: formatDate(latestDeal.delivery_date) },
                                                            ]).map((it) => (
                                                                <div key={it.label} className="min-w-0">
                                                                    <div className="text-muted-foreground text-xs">{it.label}</div>
                                                                    <div className="font-medium truncate">{String(it.value)}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <Separator />
                                                        <div className="space-y-2 text-sm">
                                                            <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                                Customer
                                                            </div>
                                                            <div className="space-y-1">
                                                                {detailItems([
                                                                    { label: 'Name', value: latestDeal.customer_name },
                                                                    { label: 'Phone', value: latestDeal.customer_phone },
                                                                    { label: 'CNIC', value: latestDeal.customer_cnic },
                                                                    { label: 'Address', value: latestDeal.customer_address },
                                                                ]).map((it) => (
                                                                    <div key={it.label} className="flex items-start justify-between gap-3">
                                                                        <div className="text-muted-foreground">{it.label}</div>
                                                                        <div className="font-medium text-right break-words">{String(it.value)}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {isPresent(latestDeal.notes) && (
                                                            <>
                                                                <Separator />
                                                                <div className="text-sm whitespace-pre-line">
                                                                    <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1">
                                                                        Notes
                                                                    </div>
                                                                    {latestDeal.notes}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-muted-foreground">No deal record found for this vehicle.</div>
                                                )}

                                                {(deals || []).length > 1 && (
                                                    <div className="space-y-2">
                                                        <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                            Deal History
                                                        </div>
                                                        <div className="space-y-2">
                                                            {(deals || []).slice(1, 6).map((d: any) => (
                                                                <div key={d.id} className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm">
                                                                    <div className="min-w-0">
                                                                        <div className="font-medium truncate">{d.customer_name}</div>
                                                                        <div className="text-xs text-muted-foreground truncate">
                                                                            {formatDate(d.deal_date) || ''} • {formatPKR(d.sale_price) || ''}
                                                                        </div>
                                                                    </div>
                                                                    <Button asChild size="sm" variant="outline">
                                                                        <Link href={`/dashboard/deals/${d.id}`}>Open</Link>
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    )}

                                    {canShowParties && (
                                        <TabsContent value="parties">
                                            <div className="space-y-4 pt-2">
                                                {/* Seller */}
                                                {(sellerDocs.length > 0 || isPresent(sellerInfo?.name) || isPresent(sellerInfo?.phone) || isPresent(sellerInfo?.cnic)) && (
                                                    <div className="rounded-lg border bg-card p-3 space-y-3">
                                                        <div className="text-sm font-semibold">Seller</div>
                                                        <div className="flex items-start gap-3">
                                                            <div className="relative h-14 w-14 overflow-hidden rounded-full border bg-muted shrink-0">
                                                                <Image src={sellerAvatar} alt="Seller" fill className="object-cover" />
                                                            </div>
                                                            <div className="min-w-0 text-sm space-y-1">
                                                                {detailItems([
                                                                    { label: 'Name', value: sellerInfo?.name },
                                                                    { label: 'Phone', value: sellerInfo?.phone },
                                                                    { label: 'CNIC', value: sellerInfo?.cnic },
                                                                ]).map((it) => (
                                                                    <div key={it.label} className="text-muted-foreground">
                                                                        {it.label}: <span className="text-foreground font-medium">{String(it.value)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {sellerExtraDocs.length > 0 && (
                                                            <div className="flex gap-2 overflow-x-auto">
                                                                {sellerExtraDocs.map((doc: any) => (
                                                                    <a
                                                                        key={doc.id}
                                                                        href={doc.file_url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted"
                                                                    >
                                                                        <Image src={doc.file_url} alt="Seller document" fill className="object-cover" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Buyer */}
                                                {(buyerDocs.length > 0 || isPresent(buyerInfo?.name) || isPresent(buyerInfo?.phone) || isPresent(buyerInfo?.cnic)) && (
                                                    <div className="rounded-lg border bg-card p-3 space-y-3">
                                                        <div className="text-sm font-semibold">Buyer</div>
                                                        <div className="flex items-start gap-3">
                                                            <div className="relative h-14 w-14 overflow-hidden rounded-full border bg-muted shrink-0">
                                                                <Image src={buyerAvatar} alt="Buyer" fill className="object-cover" />
                                                            </div>
                                                            <div className="min-w-0 text-sm space-y-1">
                                                                {detailItems([
                                                                    { label: 'Name', value: buyerInfo?.name },
                                                                    { label: 'Phone', value: buyerInfo?.phone },
                                                                    { label: 'CNIC', value: buyerInfo?.cnic },
                                                                ]).map((it) => (
                                                                    <div key={it.label} className="text-muted-foreground">
                                                                        {it.label}: <span className="text-foreground font-medium">{String(it.value)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {buyerExtraDocs.length > 0 && (
                                                            <div className="flex gap-2 overflow-x-auto">
                                                                {buyerExtraDocs.map((doc: any) => (
                                                                    <a
                                                                        key={doc.id}
                                                                        href={doc.file_url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted"
                                                                    >
                                                                        <Image src={doc.file_url} alt="Buyer document" fill className="object-cover" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    )}

                                    {canShowDocuments && (
                                        <TabsContent value="docs">
                                            <div className="space-y-4 pt-2">
                                                {chassisDoc && (
                                                    <div className="space-y-2">
                                                        <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                            Chassis Image
                                                        </div>
                                                        <a
                                                            href={chassisDoc.file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted block"
                                                        >
                                                            <Image src={chassisDoc.file_url} alt="Chassis number" fill className="object-contain bg-muted" />
                                                        </a>
                                                    </div>
                                                )}

                                                {vehicleDocs.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                            Vehicle Documents
                                                        </div>
                                                        <div className="space-y-2">
                                                            {vehicleDocs.map((doc: any) => (
                                                                <div
                                                                    key={doc.id}
                                                                    className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm"
                                                                >
                                                                    <div className="min-w-0">
                                                                        <div className="font-medium truncate">
                                                                            {doc.document_type
                                                                                ? String(doc.document_type).replace(/_/g, ' ')
                                                                                : 'Document'}
                                                                        </div>
                                                                        {doc.file_name && <div className="text-xs text-muted-foreground truncate">{doc.file_name}</div>}
                                                                    </div>
                                                                    {doc.file_url && (
                                                                        <Button asChild size="sm" variant="outline">
                                                                            <a href={doc.file_url} target="_blank" rel="noreferrer">
                                                                                View
                                                                            </a>
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    )}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        // If Supabase fails, fall back to mock data
        console.error('Error fetching vehicle:', error);
        const mockVehicle = getMockVehicle(id);
        if (!mockVehicle) {
            notFound();
        }
        const vehicle = mockVehicle;
        const documents: any[] = [];
        const buyerDocs: any[] = [];
        const sellerDocs: any[] = [];
        const chassisDoc = null;
        const primaryImage = vehicle.vehicle_images?.[0]?.url || null;

        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                        <Link href="/dashboard/inventory">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold truncate">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                            </h1>
                            <p className="text-muted-foreground truncate">{vehicle.variant}</p>
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                ⚠️ Using mock data - Supabase connection failed
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end sm:shrink-0">
                        <Link href={`/dashboard/inventory/${vehicle.id}/edit`}>
                            <Button>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Vehicle
                            </Button>
                        </Link>
                    </div>
                </div>
                {/* Simplified view for error case - same structure as mock data view */}
            </div>
        );
    }
}
