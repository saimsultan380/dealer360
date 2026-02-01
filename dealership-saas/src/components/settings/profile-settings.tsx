'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, X } from 'lucide-react';
import { getCurrentProfile, updateProfile } from '@/lib/actions/settings';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileSettings() {
    const router = useRouter();
    const { profile: authProfile, setProfile } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        const result = await getCurrentProfile();
        if (result.data) {
            reset({
                full_name: result.data.full_name,
                phone: result.data.phone || '',
            });
            setAvatarUrl(result.data.avatar_url);
        }
        setLoading(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
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
            const fileName = `profile-avatar-${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `profile-avatars/${fileName}`;

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

            setAvatarUrl(publicUrl);

            // Update profile with new avatar URL
            const updateResult = await updateProfile({ avatar_url: publicUrl });
            if (updateResult.error) {
                setError(updateResult.error);
            } else {
                if (updateResult.data) {
                    setProfile(updateResult.data);
                }
                setSuccess('Avatar updated successfully');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            console.error('Error uploading avatar:', err);
            setError('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const removeAvatar = async () => {
        const updateResult = await updateProfile({ avatar_url: null });
        if (updateResult.error) {
            setError(updateResult.error);
        } else {
            setAvatarUrl(null);
            if (updateResult.data) {
                setProfile(updateResult.data);
            }
            setSuccess('Avatar removed successfully');
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const onSubmit = async (data: ProfileFormValues) => {
        setError(null);
        setSuccess(null);

        const updateData: any = {
            full_name: data.full_name,
        };
        if (data.phone) {
            updateData.phone = data.phone;
        }

        const result = await updateProfile(updateData);

        if (result.error) {
            setError(result.error);
        } else {
            if (result.data) {
                setProfile(result.data);
            }
            setSuccess('Profile updated successfully');
            setTimeout(() => setSuccess(null), 3000);
            router.refresh();
        }
    };

    if (loading) {
        return <div className="space-y-4">Loading...</div>;
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

            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 shrink-0">
                    <AvatarImage src={avatarUrl || undefined} alt={authProfile?.full_name || 'User'} />
                    <AvatarFallback className="text-xl sm:text-2xl">
                        {authProfile?.full_name ? getInitials(authProfile.full_name) : 'U'}
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-2 w-full sm:w-auto text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Label htmlFor="avatar-upload" className="cursor-pointer">
                            <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                                <span>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {uploading ? 'Uploading...' : 'Upload Photo'}
                                </span>
                            </Button>
                        </Label>
                        <Input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                        {avatarUrl && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removeAvatar}
                                disabled={uploading}
                                className="w-full sm:w-auto"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Remove
                            </Button>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        JPG, PNG or GIF. Max size of 5MB.
                    </p>
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Label htmlFor="full_name" className="mb-2 block">Full Name *</Label>
                    <Input
                        id="full_name"
                        {...register('full_name')}
                        placeholder="Enter your full name"
                        className="w-full"
                    />
                    {errors.full_name && (
                        <p className="text-xs sm:text-sm text-destructive mt-1">{errors.full_name.message}</p>
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
                        value={authProfile?.id ? 'Email managed by authentication' : ''}
                        disabled
                        className="bg-muted w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed here. Contact support if needed.
                    </p>
                </div>

                <div className="sm:col-span-2">
                    <Label htmlFor="role" className="mb-2 block">Role</Label>
                    <Input
                        id="role"
                        value={authProfile?.role ? authProfile.role.replace('_', ' ').toUpperCase() : ''}
                        disabled
                        className="bg-muted capitalize w-full"
                    />
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
