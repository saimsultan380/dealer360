import { getCurrentProfile, getCurrentOrganization } from '@/lib/actions/settings';
import { ProfilePageContent } from '@/components/profile/profile-page-content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
    const { data: profile, error: profileError } = await getCurrentProfile();
    const { data: organization } = await getCurrentOrganization();

    // If unauthorized, redirect to login
    if (profileError === 'Unauthorized') {
        redirect('/login');
    }

    // If profile doesn't exist, show error
    if (!profile) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Profile</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your profile information and account settings
                    </p>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <p>{profileError || 'Profile not found'}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Profile</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your profile information and account settings
                </p>
            </div>

            <ProfilePageContent profile={profile} organization={organization} />
        </div>
    );
}
