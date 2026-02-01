import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getOrganizationByIdAdmin } from '@/lib/actions/organizations';
import { OrganizationEditor } from '../../../../../components/admin/organization-editor';

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-700 dark:text-green-400',
  trial: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  suspended: 'bg-red-500/10 text-red-700 dark:text-red-400',
  cancelled: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

const planColors: Record<string, string> = {
  basic: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  professional: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  enterprise: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: org, error } = await getOrganizationByIdAdmin(id);

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/admin/organizations">
          <Button variant="outline">← Back</Button>
        </Link>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{org?.name}</h1>
          <p className="text-muted-foreground">Organization management and module configuration.</p>
          <div className="flex gap-2 pt-2">
            <Badge variant="secondary" className={statusColors[org.subscription_status] ?? ''}>
              {org.subscription_status}
            </Badge>
            <Badge variant="secondary" className={planColors[org.subscription_plan] ?? ''}>
              {org.subscription_plan}
            </Badge>
          </div>
        </div>

        <Link href="/admin/organizations">
          <Button variant="outline">← Back</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Basic organization details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">City:</span> {org.city ?? '-'}
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span> {org.phone ?? '-'}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span> {org.email ?? '-'}
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>{' '}
              {org.created_at ? new Date(org.created_at).toLocaleString() : '-'}
            </div>
            <div className="flex gap-4 pt-2">
              <div>
                <span className="text-muted-foreground">Users:</span> {org.profiles?.[0]?.count ?? 0}
              </div>
              <div>
                <span className="text-muted-foreground">Vehicles:</span> {org.vehicles?.[0]?.count ?? 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <OrganizationEditor organization={org} />
      </div>
    </div>
  );
}

