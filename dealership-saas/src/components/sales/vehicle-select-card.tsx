'use client';

import Image from 'next/image';
import { Car, Fuel, Gauge, Settings2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface VehicleImage {
    id: string;
    url: string;
    is_primary: boolean;
}

interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    variant?: string;
    color?: string;
    registration_number?: string;
    mileage?: number;
    fuel_type?: string;
    transmission?: string;
    purchase_price?: number;
    selling_price?: number;
    status: string;
    vehicle_images?: VehicleImage[];
    // Seller info from inventory
    seller_name?: string;
    seller_phone?: string;
}

interface VehicleSelectCardProps {
    vehicle: Vehicle;
    isSelected: boolean;
    onSelect: (vehicleId: string) => void;
}

export function VehicleSelectCard({ vehicle, isSelected, onSelect }: VehicleSelectCardProps) {
    // Get primary image or first image
    const primaryImage = vehicle.vehicle_images?.find(img => img.is_primary)
        || vehicle.vehicle_images?.[0];

    // Calculate profit margin
    const purchasePrice = vehicle.purchase_price || 0;
    const sellingPrice = vehicle.selling_price || 0;
    const profit = sellingPrice - purchasePrice;
    const profitPercentage = purchasePrice > 0 ? ((profit / purchasePrice) * 100).toFixed(1) : 0;

    // Fuel type display
    const fuelTypeDisplay: Record<string, string> = {
        petrol: 'Petrol',
        diesel: 'Diesel',
        hybrid: 'Hybrid',
        electric: 'Electric',
        cng: 'CNG',
    };

    // Color display with visual indicator
    const colorMap: Record<string, string> = {
        white: '#ffffff',
        black: '#1a1a1a',
        silver: '#c0c0c0',
        gray: '#808080',
        grey: '#808080',
        red: '#dc2626',
        blue: '#2563eb',
        green: '#16a34a',
        brown: '#92400e',
        gold: '#ca8a04',
        beige: '#d4c5a9',
        maroon: '#7f1d1d',
    };

    const colorHex = vehicle.color ? colorMap[vehicle.color.toLowerCase()] || '#94a3b8' : '#94a3b8';

    return (
        <div
            onClick={() => onSelect(vehicle.id)}
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-xl border-2 cursor-pointer transition-all duration-200',
                'hover:shadow-lg hover:border-primary/50',
                isSelected
                    ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                    : 'border-border bg-card hover:bg-accent/50'
            )}
        >
            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-2.5 right-2.5 z-10 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Check className="h-4 w-4 text-primary-foreground" />
                </div>
            )}

            {/* Vehicle Image */}
            <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                {primaryImage ? (
                    <Image
                        src={primaryImage.url}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <Car className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2.5 left-2.5">
                    <Badge
                        variant="secondary"
                        className="bg-emerald-500/90 text-white border-0 shadow px-2 py-0.5 text-[11px] leading-none"
                    >
                        Available
                    </Badge>
                </div>

                {/* Profit Badge */}
                {profit > 0 && (
                    <div className="absolute bottom-2.5 left-2.5">
                        <Badge
                            variant="secondary"
                            className="bg-blue-500/90 text-white border-0 shadow px-2 py-0.5 text-[11px] leading-none"
                        >
                            +{profitPercentage}% Profit
                        </Badge>
                    </div>
                )}
            </div>

            {/* Vehicle Info */}
            <div className="flex-1 p-3 space-y-2">
                {/* Title */}
                <div>
                    <h3 className="font-semibold text-base leading-snug">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    {vehicle.variant && (
                        <p className="text-xs text-muted-foreground leading-snug">{vehicle.variant}</p>
                    )}
                </div>

                {/* Specs Row */}
                <div className="flex flex-wrap gap-1.5">
                    {vehicle.color && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
                            <span
                                className="h-2.5 w-2.5 rounded-full border border-border shadow-sm"
                                style={{ backgroundColor: colorHex }}
                            />
                            <span className="capitalize">{vehicle.color}</span>
                        </div>
                    )}
                    {vehicle.mileage && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
                            <Gauge className="h-3 w-3" />
                            <span>{(vehicle.mileage / 1000).toFixed(0)}k km</span>
                        </div>
                    )}
                    {vehicle.fuel_type && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
                            <Fuel className="h-3 w-3" />
                            <span>{fuelTypeDisplay[vehicle.fuel_type] || vehicle.fuel_type}</span>
                        </div>
                    )}
                    {vehicle.transmission && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
                            <Settings2 className="h-3 w-3" />
                            <span className="capitalize">{vehicle.transmission}</span>
                        </div>
                    )}
                </div>

                {/* Registration */}
                {vehicle.registration_number && (
                    <div className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded inline-block">
                        {vehicle.registration_number}
                    </div>
                )}

                {/* Price Section */}
                <div className="pt-2 border-t">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-[11px] text-muted-foreground leading-none">Selling Price</p>
                            <p className="text-lg font-bold text-primary leading-tight">
                                PKR {sellingPrice.toLocaleString()}
                            </p>
                        </div>
                        {purchasePrice > 0 && (
                            <div className="text-right">
                                <p className="text-[11px] text-muted-foreground leading-none">Cost</p>
                                <p className="text-xs font-medium text-muted-foreground leading-tight">
                                    PKR {purchasePrice.toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>
                    {profit > 0 && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium leading-tight">
                            Profit: PKR {profit.toLocaleString()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
