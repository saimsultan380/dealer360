'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { updatePassword } from '@/lib/actions/settings';

const passwordSchema = z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function PasswordSettings() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
    });

    const onSubmit = async (data: PasswordFormValues) => {
        setError(null);
        setSuccess(null);

        const result = await updatePassword({
            current_password: data.current_password,
            new_password: data.new_password,
            confirm_password: data.confirm_password,
        });

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess('Password updated successfully');
            reset();
            setTimeout(() => setSuccess(null), 3000);
        }
    };

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

            <div className="space-y-4">
                <div>
                    <Label htmlFor="current_password" className="text-sm sm:text-base mb-2 block">Current Password *</Label>
                    <div className="relative">
                        <Input
                            id="current_password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            {...register('current_password')}
                            placeholder="Enter your current password"
                            className="pr-10 w-full"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full w-10"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                            {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    {errors.current_password && (
                        <p className="text-xs sm:text-sm text-destructive mt-1">{errors.current_password.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="new_password" className="text-sm sm:text-base mb-2 block">New Password *</Label>
                    <div className="relative">
                        <Input
                            id="new_password"
                            type={showNewPassword ? 'text' : 'password'}
                            {...register('new_password')}
                            placeholder="Enter your new password"
                            className="pr-10 w-full"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full w-10"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                            {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    {errors.new_password && (
                        <p className="text-xs sm:text-sm text-destructive mt-1">{errors.new_password.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                        Password must be at least 6 characters long
                    </p>
                </div>

                <div>
                    <Label htmlFor="confirm_password" className="text-sm sm:text-base mb-2 block">Confirm New Password *</Label>
                    <div className="relative">
                        <Input
                            id="confirm_password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            {...register('confirm_password')}
                            placeholder="Confirm your new password"
                            className="pr-10 w-full"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full w-10"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    {errors.confirm_password && (
                        <p className="text-xs sm:text-sm text-destructive mt-1">{errors.confirm_password.message}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        'Update Password'
                    )}
                </Button>
            </div>
        </form>
    );
}
