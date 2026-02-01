'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X, Building2 } from 'lucide-react';
import { getCurrentOrganization, updateOrganization } from '@/lib/actions/settings';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

const organizationSchema = z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters'),
    phone: z.string().optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

export function OrganizationSettings() {
    const router = useRouter();
    const { profile } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [canEdit, setCanEdit] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<OrganizationFormValues>({
        resolver: zodResolver(organizationSchema),
    });

    useEffect(() => {
        fetchOrganization();
        // Check if user can edit (admin, super_admin, or manager)
        if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'manager') {
            setCanEdit(true);
        }
    }, [profile]);

    const fetchOrganization = async () => {
        setLoading(true);
        const result = await getCurrentOrganization();
        if (result.data) {
            reset({
                name: result.data.name,
                phone: result.data.phone || '',
                email: result.data.email || '',
                address: result.data.address || '',
                city: result.data.city || '',
            });
            setLogoUrl(result.data.logo_url);
        } else if (result.error) {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('Image size must be less than 2MB');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setError('Unauthorized');
                setUploading(false);
                return;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `org-logo-${Date.now()}.${fileExt}`;
            const filePath = `organization-logos/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('vehicles')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                setError('Failed to upload image');
                setUploading(false);
                return;
            }

            // Get public URL
            const {
                data: { publicUrl },
            } = supabase.storage.from('vehicles').getPublicUrl(filePath);

            setLogoUrl(publicUrl);

            // Update organization with new logo URL
            const updateResult = await updateOrganization({ logo_url: publicUrl });
            if (updateResult.error) {
                setError(updateResult.error);
            } else {
                setSuccess('Logo updated successfully');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            console.error('Error uploading logo:', err);
            setError('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const removeLogo = async () => {
        const updateResult = await updateOrganization({ logo_url: null });
        if (updateResult.error) {
            setError(updateResult.error);
        } else {
            setLogoUrl(null);
            setSuccess('Logo removed successfully');
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    const onSubmit = async (data: OrganizationFormValues) => {
        setError(null);
        setSuccess(null);

        const updateData: any = {
            name: data.name,
        };
        if (data.phone) updateData.phone = data.phone;
        if (data.email) updateData.email = data.email;
        if (data.address) updateData.address = data.address;
        if (data.city) updateData.city = data.city;

        const result = await updateOrganization(updateData);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess('Organization updated successfully');
            setTimeout(() => setSuccess(null), 3000);
            router.refresh();
        }
    };

    if (loading) {
        return <div className="space-y-4">Loading...</div>;
    }

    if (!canEdit) {
        return (
            <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-muted-foreground">
                    You don't have permission to edit organization settings. Contact an administrator.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
                    {success}
                </div>
            )}

            {/* Logo Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                {logoUrl ? (
                    <div className="relative shrink-0">
                        <img
                            src={logoUrl}
                            alt="Organization logo"
                            className="h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-lg border"
                        />
                    </div>
                ) : (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center border rounded-lg bg-muted shrink-0">
                        <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                    </div>
                )}
                <div className="space-y-2 w-full sm:w-auto text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                            <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                                <span>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {uploading ? 'Uploading...' : 'Upload Logo'}
                                </span>
                            </Button>
                        </Label>
                        <Input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                        {logoUrl && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removeLogo}
                                disabled={uploading}
                                className="w-full sm:w-auto"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Remove
                            </Button>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        JPG, PNG or GIF. Max size of 2MB.
                    </p>
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Label htmlFor="name" className="mb-2 block">Organization Name *</Label>
                    <Input
                        id="name"
                        {...register('name')}
                        placeholder="Enter organization name"
                        className="w-full"
                    />
                    {errors.name && (
                        <p className="text-xs sm:text-sm text-destructive mt-1">{errors.name.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="phone" className="mb-2 block">Phone Number</Label>
                    <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="+92 300 1234567"
                        className="w-full"
                    />
                    {errors.phone && (
                        <p className="text-xs sm:text-sm text-destructive mt-1">{errors.phone.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="email" className="mb-2 block">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="info@organization.com"
                        className="w-full"
                    />
                    {errors.email && (
                        <p className="text-xs sm:text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="city" className="mb-2 block">City</Label>
                    <Input
                        id="city"
                        {...register('city')}
                        placeholder="Lahore"
                        className="w-full"
                    />
                    {errors.city && (
                        <p className="text-xs sm:text-sm text-destructive mt-1">{errors.city.message}</p>
                    )}
                </div>

                <div className="sm:col-span-2">
                    <Label htmlFor="address" className="mb-2 block">Address</Label>
                    <Textarea
                        id="address"
                        {...register('address')}
                        placeholder="Enter organization address"
                        rows={3}
                        className="w-full"
                    />
                    {errors.address && (
                        <p className="text-xs sm:text-sm text-destructive mt-1">{errors.address.message}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </Button>
            </div>
        </form>
    );
}
