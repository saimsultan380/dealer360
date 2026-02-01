import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentProfile } from '@/lib/actions/settings';

export default async function AdminSettingsPage() {
  const { data: profile, error } = await getCurrentProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">Super admin profile and platform settings.</p>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your super admin account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span> {profile?.full_name ?? '-'}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span> {profile?.email ?? '-'}
            </div>
            <div>
              <span className="text-muted-foreground">Role:</span> {profile?.role ?? '-'}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Platform</CardTitle>
          <CardDescription>Basic platform settings (more controls can be added).</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This page is ready. Next enhancements: maintenance mode, email templates, payment gateway configuration, audit logs.
        </CardContent>
      </Card>
    </div>
  );
}

