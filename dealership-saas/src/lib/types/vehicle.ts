import { z } from 'zod';

// Vehicle Zod Schema
export const vehicleSchema = z.object({
    // Basic Info
    make: z.string().min(1, 'Make is required'),
    model: z.string().min(1, 'Model is required'),
    variant: z.string().optional(),
    year: z.coerce.number().min(1900, 'Year must be valid').max(new Date().getFullYear() + 1, 'Year cannot be in future'),
    color: z.string().min(1, 'Color is required'),

    // Specs
    mileage: z.coerce.number().min(0, 'Mileage cannot be negative'),
    fuel_type: z.enum(['petrol', 'diesel', 'hybrid', 'electric', 'cng']),
    transmission: z.enum(['manual', 'automatic']),
    engine_number: z.string().optional(),
    chassis_number: z.string().optional(),
    registration_number: z.string().optional(),

    // Pricing & Status
    purchase_price: z.coerce.number().min(0, 'Price must be positive').optional(),
    selling_price: z.coerce.number().min(0, 'Price must be positive'),
    minimum_price: z.coerce.number().min(0, 'Price must be positive').optional(),
    status: z.enum(['available', 'reserved', 'sold', 'in_service']),
    condition: z.enum(['new', 'used', 'certified']),

    // Details
    description: z.string().optional(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;

// Mock data for dropdowns
export const CAR_MAKES = [
    'Toyota', 'Honda', 'Suzuki', 'Hyundai', 'Kia', 'Changan', 'MG', 'Proton', 'Haval', 'Nissan', 'Daihatsu', 'Mitsubishi', 'Audi', 'BMW', 'Mercedes'
];

export const FUEL_TYPES = [
    { value: 'petrol', label: 'Petrol' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'electric', label: 'Electric' },
    { value: 'cng', label: 'CNG' },
];

export const TRANSMISSION_TYPES = [
    { value: 'automatic', label: 'Automatic' },
    { value: 'manual', label: 'Manual' },
];

export const VEHICLE_STATUS = [
    { value: 'available', label: 'Available' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'sold', label: 'Sold' },
    { value: 'in_service', label: 'In Service' },
];

export const VEHICLE_CONDITION = [
    { value: 'new', label: 'New' },
    { value: 'used', label: 'Used' },
    { value: 'certified', label: 'Certified' },
];
