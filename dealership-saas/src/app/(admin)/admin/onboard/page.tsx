'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, User, Settings, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { onboardOrganization } from '@/lib/actions/organizations';

const onboardSchema = z.object({
    // Organization
    orgName: z.string().min(2, 'Organization name is required'),
    city: z.string().min(2, 'City is required'),
    orgPhone: z.string().min(10, 'Valid phone required'),
    orgEmail: z.string().email('Valid email required'),
    subscriptionPlan: z.enum(['basic', 'professional', 'enterprise']),
    // Admin User
    adminName: z.string().min(2, 'Admin name is required'),
    adminEmail: z.string().email('Valid email required'),
    adminPhone: z.string().min(10, 'Valid phone required'),
    adminTempPassword: z.string().min(6, 'Temporary password must be at least 6 characters'),
    // Settings
    maxVehicles: z.string(),
    maxUsers: z.string(),
});

type OnboardForm = z.infer<typeof onboardSchema>;

const steps = [
    { id: 1, name: 'Organization', icon: Building2 },
    { id: 2, name: 'Admin User', icon: User },
    { id: 3, name: 'Settings', icon: Settings },
    { id: 4, name: 'Complete', icon: CheckCircle },
];

export default function OnboardPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [completedOrgId, setCompletedOrgId] = useState<string | null>(null);
    const [showTempPassword, setShowTempPassword] = useState(false);

    const generateTempPassword = () => {
        // Avoid ambiguous characters (0/O, 1/l/I)
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        const length = 10;
        let out = '';
        for (let i = 0; i < length; i++) {
            out += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        return out;
    };

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<OnboardForm>({
        resolver: zodResolver(onboardSchema),
        defaultValues: {
            subscriptionPlan: 'basic',
            maxVehicles: '100',
            maxUsers: '10',
        },
    });

    const onSubmit = async (data: OnboardForm) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await onboardOrganization(data);

            if (!result.success) {
                setError(result.error || 'Failed to create organization');
                setIsSubmitting(false);
                return;
            }

            setCompletedOrgId(result.organizationId || null);
            setCurrentStep(4);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Onboard New Client</h1>
                <p className="text-muted-foreground">
                    Create a new dealership and set up their admin account.
                </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                        <div
                            className={cn(
                                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                                currentStep >= step.id
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-muted-foreground text-muted-foreground'
                            )}
                        >
                            <step.icon className="h-5 w-5" />
                        </div>
                        <span
                            className={cn(
                                'ml-2 text-sm font-medium hidden sm:inline',
                                currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                            )}
                        >
                            {step.name}
                        </span>
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    'w-12 sm:w-24 h-0.5 mx-2 sm:mx-4',
                                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                                )}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {/* Step 1: Organization */}
                {currentStep === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Details</CardTitle>
                            <CardDescription>Basic information about the dealership.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="orgName">Dealership Name</Label>
                                <Input id="orgName" placeholder="ABC Motors" {...register('orgName')} />
                                {errors.orgName && (
                                    <p className="text-sm text-destructive">{errors.orgName.message}</p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" placeholder="Lahore" {...register('city')} />
                                    {errors.city && (
                                        <p className="text-sm text-destructive">{errors.city.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="orgPhone">Phone</Label>
                                    <Input id="orgPhone" placeholder="0300-1234567" {...register('orgPhone')} />
                                    {errors.orgPhone && (
                                        <p className="text-sm text-destructive">{errors.orgPhone.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="orgEmail">Email</Label>
                                    <Input id="orgEmail" type="email" placeholder="info@abcmotors.pk" {...register('orgEmail')} />
                                    {errors.orgEmail && (
                                        <p className="text-sm text-destructive">{errors.orgEmail.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Subscription Plan</Label>
                                    <Select
                                        defaultValue="basic"
                                        onValueChange={(value) => setValue('subscriptionPlan', value as 'basic' | 'professional' | 'enterprise')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basic">Basic - PKR 5,000/mo</SelectItem>
                                            <SelectItem value="professional">Professional - PKR 15,000/mo</SelectItem>
                                            <SelectItem value="enterprise">Enterprise - PKR 30,000/mo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="button" onClick={nextStep}>
                                    Next Step →
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Admin User */}
                {currentStep === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Admin User</CardTitle>
                            <CardDescription>Create the primary admin account for this dealership.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="adminName">Full Name</Label>
                                <Input id="adminName" placeholder="Muhammad Ali" {...register('adminName')} />
                                {errors.adminName && (
                                    <p className="text-sm text-destructive">{errors.adminName.message}</p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="adminEmail">Email</Label>
                                    <Input id="adminEmail" type="email" placeholder="admin@abcmotors.pk" {...register('adminEmail')} />
                                    {errors.adminEmail && (
                                        <p className="text-sm text-destructive">{errors.adminEmail.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="adminPhone">Phone</Label>
                                    <Input id="adminPhone" placeholder="0300-1234567" {...register('adminPhone')} />
                                    {errors.adminPhone && (
                                        <p className="text-sm text-destructive">{errors.adminPhone.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adminTempPassword">Temporary password</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="adminTempPassword"
                                        type={showTempPassword ? 'text' : 'password'}
                                        placeholder="Set a temporary password"
                                        {...register('adminTempPassword')}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setValue('adminTempPassword', generateTempPassword(), { shouldValidate: true })}
                                    >
                                        Generate
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowTempPassword((v) => !v)}
                                    >
                                        {showTempPassword ? 'Hide' : 'Show'}
                                    </Button>
                                </div>
                                {errors.adminTempPassword && (
                                    <p className="text-sm text-destructive">{errors.adminTempPassword.message}</p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Share this temporary password securely with the dealership admin. They can change it later in
                                    Dashboard → Settings → Password.
                                </p>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button type="button" variant="outline" onClick={prevStep}>
                                    ← Back
                                </Button>
                                <Button type="button" onClick={nextStep}>
                                    Next Step →
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Settings */}
                {currentStep === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Feature Settings</CardTitle>
                            <CardDescription>Configure limits and features for this organization.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="maxVehicles">Max Vehicles</Label>
                                    <Input id="maxVehicles" type="number" {...register('maxVehicles')} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxUsers">Max Users</Label>
                                    <Input id="maxUsers" type="number" {...register('maxUsers')} />
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button type="button" variant="outline" onClick={prevStep}>
                                    ← Back
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Organization'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Complete */}
                {currentStep === 4 && (
                    <Card>
                        <CardContent className="pt-6 text-center space-y-4">
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold">Organization Created!</h2>
                            <p className="text-muted-foreground">
                                The dealership has been set up successfully. The admin can sign in using the temporary password you set.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Organization ID: <code className="bg-muted px-2 py-1 rounded">{completedOrgId}</code>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Temporary password:{' '}
                                <code className="bg-muted px-2 py-1 rounded">
                                    {watch('adminTempPassword') || '(not set)'}
                                </code>
                            </p>
                            <div className="flex justify-center gap-4 pt-4">
                                <Button variant="outline" onClick={() => router.push('/admin/organizations')}>
                                    View Organizations
                                </Button>
                                <Button onClick={() => { setCurrentStep(1); setError(null); setCompletedOrgId(null); }}>
                                    Onboard Another
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </form>
        </div>
    );
}
