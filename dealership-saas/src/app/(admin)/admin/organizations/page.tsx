'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, MoreHorizontal, Building2, Users, Car, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteOrganizationAdmin, getOrganizations, updateOrganizationAdmin } from '@/lib/actions/organizations';

const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-500',
    trial: 'bg-blue-500/10 text-blue-500',
    suspended: 'bg-red-500/10 text-red-500',
    cancelled: 'bg-gray-500/10 text-gray-500',
};

const planColors: Record<string, string> = {
    basic: 'bg-gray-500/10 text-gray-500',
    professional: 'bg-purple-500/10 text-purple-500',
    enterprise: 'bg-amber-500/10 text-amber-500',
};

export default function OrganizationsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const deleteOrg = async (orgId: string, orgName: string) => {
        const ok = window.confirm(
            `Delete organization "${orgName}"?\n\nThis will remove the organization and ALL its data/users. This cannot be undone.`
        );
        if (!ok) return;

        setError(null);
        const prev = organizations;
        setOrganizations((o) => o.filter((x) => x.id !== orgId));
        const res = await deleteOrganizationAdmin({ id: orgId });
        if (res.error) {
            setError(res.error);
            setOrganizations(prev);
        }
    };

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const result = await getOrganizations();
                if (result.error) {
                    setError(result.error);
                    setOrganizations([]);
                } else {
                    setOrganizations(result.data || []);
                }
            } catch (err) {
                console.error('Error fetching organizations:', err);
                setOrganizations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrgs();
    }, []);

    const setStatus = async (orgId: string, status: 'trial' | 'active' | 'suspended' | 'cancelled') => {
        const prev = organizations;
        setOrganizations((o) => o.map((x) => (x.id === orgId ? { ...x, subscription_status: status } : x)));
        const res = await updateOrganizationAdmin({ id: orgId, subscription_status: status });
        if (res.error) {
            setError(res.error);
            setOrganizations(prev);
        }
    };

    const filteredOrgs = organizations.filter(
        (org) =>
            org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                    <p className="text-muted-foreground">
                        Manage all dealerships registered on the platform.
                    </p>
                </div>
                <Link href="/admin/onboard">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Organization
                    </Button>
                </Link>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Organizations Grid */}
            {!loading && (
                <>
                    {/* Search & Filters */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search organizations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrgs.map((org) => (
                    <Card key={org.id} className="relative">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">{org.name}</CardTitle>
                                    <CardDescription>{org.city}</CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => router.push(`/admin/organizations/${org.id}`)}>
                                            Edit Organization
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {org.subscription_status !== 'active' ? (
                                            <DropdownMenuItem onClick={() => setStatus(org.id, 'active')}>
                                                Activate
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem className="text-destructive" onClick={() => setStatus(org.id, 'suspended')}>
                                                Suspend
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => deleteOrg(org.id, org.name)}
                                        >
                                            Delete Organization
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Status Badges */}
                            <div className="flex gap-2">
                                <Badge variant="secondary" className={statusColors[org.subscription_status] || ''}>
                                    {org.subscription_status}
                                </Badge>
                                <Badge variant="secondary" className={planColors[org.subscription_plan] || ''}>
                                    {org.subscription_plan}
                                </Badge>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>{org.profiles?.[0]?.count ?? 0} users</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Car className="h-4 w-4" />
                                    <span>{org.vehicles?.[0]?.count ?? 0} vehicles</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-xs text-muted-foreground">
                                    Joined {new Date(org.created_at).toLocaleDateString()}
                                </span>
                                <Link href={`/admin/organizations/${org.id}`}>
                                    <Button variant="ghost" size="sm">
                                        View →
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

                    {filteredOrgs.length === 0 && (
                        <div className="text-center py-12">
                            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No organizations found</h3>
                            <p className="text-muted-foreground">Try adjusting your search query.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
