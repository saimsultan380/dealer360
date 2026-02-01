'use client';

import { User, Phone, CreditCard, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SellerInfoProps {
    seller?: {
        name?: string;
        phone?: string;
        cnic?: string;
        address?: string;
    } | null;
    purchaseDate?: string;
    purchasePrice?: number;
}

export function SellerInfoCard({ seller, purchaseDate, purchasePrice }: SellerInfoProps) {
    // If no seller info, show placeholder
    if (!seller?.name && !seller?.phone) {
        return (
            <Card className="border-dashed bg-muted/30">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Seller Information
                    </CardTitle>
                    <CardDescription>
                        No seller information available for this vehicle
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden gap-0">
            <CardHeader className="-mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 bg-gradient-to-r from-blue-500/10 to-transparent">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        Seller Information
                    </CardTitle>
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        Original Seller
                    </Badge>
                </div>
                <CardDescription>
                    Details of who sold this vehicle to the dealership
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    {seller?.name && (
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Name</p>
                                <p className="font-medium text-sm">{seller.name}</p>
                            </div>
                        </div>
                    )}

                    {seller?.phone && (
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Phone</p>
                                <p className="font-medium text-sm">{seller.phone}</p>
                            </div>
                        </div>
                    )}

                    {seller?.cnic && (
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">CNIC</p>
                                <p className="font-medium text-sm">{seller.cnic}</p>
                            </div>
                        </div>
                    )}

                    {seller?.address && (
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Address</p>
                                <p className="font-medium text-sm line-clamp-1">{seller.address}</p>
                            </div>
                        </div>
                    )}
                </div>

                {(purchaseDate || purchasePrice) && (
                    <>
                        <Separator />
                        <div className="flex items-center justify-between text-sm">
                            {purchaseDate && (
                                <div>
                                    <span className="text-muted-foreground">Purchase Date: </span>
                                    <span className="font-medium">
                                        {new Date(purchaseDate).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            {purchasePrice && purchasePrice > 0 && (
                                <div>
                                    <span className="text-muted-foreground">Purchase Price: </span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                        PKR {purchasePrice.toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
