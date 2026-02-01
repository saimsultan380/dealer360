import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Phone, MapPin, Car, DollarSign, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { markDealAsPaid } from '@/lib/actions/deals';
import { DealActions } from '@/components/deals/deal-actions';

function getMockDeal(id: string) {
    // Return mock deal data for development
    if (id === 'mock-1') {
        return {
            id: 'mock-1',
            customer_name: 'John Doe',
            customer_phone: '+92 300 1234567',
            customer_cnic: '12345-1234567-1',
            customer_address: '123 Main Street, Lahore',
            sale_price: '2500000',
            down_payment: '500000',
            payment_method: 'bank_transfer',
            status: 'pending',
            deal_date: new Date().toISOString(),
            delivery_date: new Date().toISOString(),
            notes: 'Mock data - Configure Supabase to see real deals',
            vehicles: {
                make: 'Toyota',
                model: 'Corolla',
                year: 2023,
                color: 'White',
                registration_number: 'LHR-1234',
                vehicle_images: []
            }
        };
    } else if (id === 'mock-2') {
        return {
            id: 'mock-2',
            customer_name: 'Jane Smith',
            customer_phone: '+92 301 2345678',
            customer_cnic: '23456-2345678-2',
            customer_address: '456 Park Avenue, Karachi',
            sale_price: '3200000',
            down_payment: '800000',
            payment_method: 'cash',
            status: 'pending',
            deal_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            delivery_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'Mock data - Payment overdue',
            vehicles: {
                make: 'Honda',
                model: 'Civic',
                year: 2022,
                color: 'Black',
                registration_number: 'KHI-5678',
                vehicle_images: []
            }
        };
    }
    return null;
}

// Helper function to render deal detail JSX
function renderDealDetail(deal: any, vehicle: any, remainingAmount: number, isMock: boolean = false) {
    const primaryImage = vehicle?.vehicle_images?.find((img: any) => img.is_primary) || vehicle?.vehicle_images?.[0];
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Deal Details</h1>
                    <p className="text-muted-foreground mt-2">View and manage deal information</p>
                    {isMock && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                            ⚠️ Using mock data - {deal.id.startsWith('mock') ? 'Configure Supabase for real data' : 'Deal not found in database'}
                        </p>
                    )}
                </div>
                <Link href="/dashboard/deals/pending">
                    <Button variant="outline">Back to Pending Deals</Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Deal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Deal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant={deal.status === 'completed' ? 'default' : 'secondary'}>
                                {deal.status}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Deal Date</span>
                            <span className="font-medium">
                                {new Date(deal.deal_date).toLocaleDateString('en-PK', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                        {deal.delivery_date && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Delivery Date</span>
                                <span className="font-medium">
                                    {new Date(deal.delivery_date).toLocaleDateString('en-PK', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Payment Method</span>
                            <span className="font-medium capitalize">{deal.payment_method || 'N/A'}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Sale Price</span>
                            <span className="font-bold text-lg">PKR {parseFloat(deal.sale_price).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Down Payment</span>
                            <span className="font-medium">PKR {parseFloat(deal.down_payment).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                            <span className="text-sm font-semibold">Remaining Amount</span>
                            <span className="font-bold text-lg text-primary">
                                PKR {remainingAmount.toLocaleString()}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <span className="text-sm text-muted-foreground">Name</span>
                            <p className="font-medium">{deal.customer_name}</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                Phone
                            </span>
                            <p className="font-medium">{deal.customer_phone}</p>
                        </div>
                        {deal.customer_cnic && (
                            <div>
                                <span className="text-sm text-muted-foreground">CNIC</span>
                                <p className="font-medium">{deal.customer_cnic}</p>
                            </div>
                        )}
                        {deal.customer_address && (
                            <div>
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    Address
                                </span>
                                <p className="font-medium">{deal.customer_address}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Vehicle Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <span className="text-sm text-muted-foreground">Vehicle</span>
                            <p className="font-medium text-lg">
                                {vehicle?.year} {vehicle?.make} {vehicle?.model}
                            </p>
                            {vehicle?.color && (
                                <p className="text-sm text-muted-foreground">Color: {vehicle.color}</p>
                            )}
                            {vehicle?.registration_number && (
                                <p className="text-sm text-muted-foreground">
                                    Reg: {vehicle.registration_number}
                                </p>
                            )}
                        </div>
                        {primaryImage && (
                            <div className="mt-4">
                                <img
                                    src={primaryImage.url}
                                    alt={`${vehicle?.make} ${vehicle?.model}`}
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                            </div>
                        )}
                        {deal.vehicle_id && !deal.vehicle_id.startsWith('mock') && (
                            <Link href={`/dashboard/inventory/${deal.vehicle_id}`}>
                                <Button variant="outline" className="w-full">
                                    <Car className="mr-2 h-4 w-4" />
                                    View Vehicle Details
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Notes */}
            {deal.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            {deal.status === 'pending' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DealActions dealId={deal.id} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
        const mockDeal = getMockDeal(id);
        if (!mockDeal) {
            notFound();
        }
        const deal = mockDeal as any;
        const vehicle = deal.vehicles;
        const remainingAmount = parseFloat(deal.sale_price) - parseFloat(deal.down_payment);
        
        return renderDealDetail(deal, vehicle, remainingAmount, true);
    }

    // Real Supabase implementation
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // Fall back to mock data if no user
            const mockDeal = getMockDeal(id);
            if (!mockDeal) {
                notFound();
            }
            const deal = mockDeal as any;
            const vehicle = deal.vehicles;
            const remainingAmount = parseFloat(deal.sale_price) - parseFloat(deal.down_payment);
            return renderDealDetail(deal, vehicle, remainingAmount, true);
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        const { data: deal, error } = await supabase
            .from('deals')
            .select(`
                *,
                vehicles!inner(make, model, year, color, registration_number, vehicle_images(url, is_primary))
            `)
            .eq('id', id)
            .eq('organization_id', profile?.organization_id)
            .single();

        if (error || !deal) {
            // Fall back to mock data if deal not found
            const mockDeal = getMockDeal(id);
            if (!mockDeal) {
                notFound();
            }
            const deal = mockDeal as any;
            const vehicle = deal.vehicles;
            const remainingAmount = parseFloat(deal.sale_price) - parseFloat(deal.down_payment);
            return renderDealDetail(deal, vehicle, remainingAmount, true);
        }

        // Fetch optional deal metadata (used for exchange net totals)
        let remainingAmount = parseFloat(deal.sale_price) - parseFloat(deal.down_payment);
        let exchangeMeta: any = null;
        try {
            const { data: docs } = await supabase
                .from('documents')
                .select('file_url')
                .eq('organization_id', profile?.organization_id)
                .eq('entity_type', 'deal')
                .eq('entity_id', deal.id)
                .eq('document_type', 'other')
                .eq('file_name', 'deal_metadata.json')
                .limit(1);

            const doc = docs?.[0];
            if (doc?.file_url?.startsWith('data:application/json')) {
                const base64Data = doc.file_url.split(',')[1];
                const jsonData = Buffer.from(base64Data, 'base64').toString('utf-8');
                const parsed = JSON.parse(jsonData);
                exchangeMeta = parsed?.exchange ?? null;
                const pd = parsed?.paymentDetails;
                if (pd?.isExchange && typeof pd.remainingAmount === 'number') {
                    remainingAmount = pd.remainingAmount;
                }
            }
        } catch (e) {
            // ignore metadata failures
        }

        // Real deal from Supabase
        const vehicle = deal.vehicles;
        const ui = renderDealDetail(deal, vehicle, remainingAmount, false);

        // Append exchange info card (if present)
        if (exchangeMeta?.tradeInVehicleId) {
            return (
                <div className="space-y-6">
                    {ui}
                    <Card>
                        <CardHeader>
                            <CardTitle>Exchange Deal</CardTitle>
                            <CardDescription>Trade-in vehicle was added to your inventory.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href={`/dashboard/inventory/${exchangeMeta.tradeInVehicleId}`}>
                                <Button variant="outline">View Trade-in Vehicle</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return ui;
    } catch (error) {
        // If Supabase fails, fall back to mock data
        console.error('Error fetching deal:', error);
        const mockDeal = getMockDeal(id);
        if (!mockDeal) {
            notFound();
        }
        const deal = mockDeal as any;
        const vehicle = deal.vehicles;
        const remainingAmount = parseFloat(deal.sale_price) - parseFloat(deal.down_payment);
        return renderDealDetail(deal, vehicle, remainingAmount, true);
    }
}
