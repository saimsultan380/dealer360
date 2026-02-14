'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Car, User, DollarSign, Calendar, FileText, Image as ImageIcon, Phone, Mail, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PrintInvoiceButton } from '@/components/invoice/print-invoice-button';

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    completed: 'bg-green-500/10 text-green-700 dark:text-green-400',
    cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export default function ExchangeDealDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [deal, setDeal] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Since DB table doesn't exist yet, this is a placeholder
        setLoading(false);
        setError('Exchange deal not found. Create one to get started.');
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">{deal?.seller_name}</h1>
                    <p className="text-muted-foreground">Exchange Deal Details</p>
                </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
                <Badge className={statusColors[deal?.status] || ''}>
                    {deal?.status || 'pending'}
                </Badge>
                <span className="text-sm text-muted-foreground">Created {deal?.created_at}</span>
            </div>

            {/* Seller & Trade-in */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Seller Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Seller Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-semibold">{deal?.seller_name}</p>
                        </div>
                        {deal?.seller_phone && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    Phone
                                </p>
                                <p className="font-medium">{deal.seller_phone}</p>
                            </div>
                        )}
                        {deal?.seller_email && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    Email
                                </p>
                                <p className="font-medium">{deal.seller_email}</p>
                            </div>
                        )}
                        {deal?.seller_cnic && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">CNIC</p>
                                <p className="font-medium">{deal.seller_cnic}</p>
                            </div>
                        )}
                        {deal?.seller_address && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="text-sm">{deal.seller_address}</p>
                            </div>
                        )}
                        {deal?.seller_swdo_name && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">S/W/D/O Name</p>
                                <p className="font-medium">{deal.seller_swdo_name}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Trade-in Vehicle Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            Trade-in Vehicle
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Vehicle</p>
                            <p className="font-bold text-lg">
                                {deal?.trade_in_year} {deal?.trade_in_make} {deal?.trade_in_model}
                            </p>
                        </div>
                        {deal?.trade_in_registration && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Registration</p>
                                <p className="font-medium">{deal.trade_in_registration}</p>
                            </div>
                        )}
                        {deal?.trade_in_color && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Color</p>
                                <p className="font-medium">{deal.trade_in_color}</p>
                            </div>
                        )}
                        <div className="space-y-2 pt-2 border-t">
                            <p className="text-sm text-muted-foreground">Agreed Value</p>
                            <p className="font-bold text-primary text-lg">
                                PKR {Number(deal?.trade_in_agreed_value || 0).toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Summary */}
            <Card className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Deal Financials
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Sale Price</p>
                            <p className="font-bold text-lg">PKR {Number(deal?.sale_price || 0).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Trade-in Value</p>
                            <p className="font-bold text-lg text-orange-600">
                                -PKR {Number(deal?.trade_in_agreed_value || 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-1 border-l pl-4">
                            <p className="text-sm text-muted-foreground">Net Amount</p>
                            <p className="font-bold text-lg">
                                PKR{' '}
                                {Math.max(
                                    0,
                                    Number(deal?.sale_price || 0) - Number(deal?.trade_in_agreed_value || 0)
                                ).toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Down Payment</p>
                            <p className="font-bold text-lg text-green-600">
                                +PKR {Number(deal?.down_payment || 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-1 border-l pl-4">
                            <p className="text-sm text-muted-foreground">Remaining Due</p>
                            <p className="font-bold text-lg text-primary">
                                PKR{' '}
                                {Math.max(
                                    0,
                                    Number(deal?.sale_price || 0) -
                                        Number(deal?.trade_in_agreed_value || 0) -
                                        Number(deal?.down_payment || 0)
                                ).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Deal Info */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Deal Date</p>
                            <p className="font-medium">{deal?.deal_date}</p>
                        </div>
                        {deal?.delivery_date && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Delivery Date</p>
                                <p className="font-medium">{deal.delivery_date}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Payment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Payment Method</p>
                            <p className="font-medium capitalize">{deal?.payment_method?.replace('_', ' ')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => router.push('/dashboard/exchange-deals')}>
                    Back to Deals
                </Button>
                <PrintInvoiceButton
                    entityId={params.id}
                    type="exchange"
                    variant="outline"
                    label="Print Invoice"
                />
                <Button onClick={() => router.push(`/dashboard/exchange-deals/${params.id}/edit`)}>
                    Edit Deal
                </Button>
            </div>
        </div>
    );
}
