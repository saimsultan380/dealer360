import { getLeadById } from '@/lib/actions/leads';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Calendar, User, Car, DollarSign, FileText, Edit } from 'lucide-react';
import Link from 'next/link';
import { formatPhoneNumber, formatCNIC } from '@/lib/utils/format-input';
import { redirect } from 'next/navigation';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data: lead, error } = await getLeadById(id);

    if (error || !lead) {
        redirect('/dashboard/leads');
    }

    const statusColors: Record<string, { bg: string; text: string }> = {
        new: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
        contacted: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400' },
        qualified: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
        negotiating: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
        won: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
        lost: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
    };

    const priorityColors: Record<string, { bg: string; text: string }> = {
        low: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400' },
        medium: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
        high: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
    };

    const sourceLabels: Record<string, string> = {
        walk_in: 'Walk In',
        phone: 'Phone',
        whatsapp: 'WhatsApp',
        website: 'Website',
        referral: 'Referral',
        facebook: 'Facebook',
        other: 'Other',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Lead Details</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage lead information
                    </p>
                </div>
                <Link href={`/dashboard/leads/${id}/edit`}>
                    <Button>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Lead
                    </Button>
                </Link>
            </div>

            {/* Customer Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">{lead.customer_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                Phone
                            </p>
                            <p className="font-medium">
                                {lead.customer_phone ? formatPhoneNumber(lead.customer_phone) : 'N/A'}
                            </p>
                        </div>
                        {lead.customer_email && (
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    Email
                                </p>
                                <p className="font-medium">{lead.customer_email}</p>
                            </div>
                        )}
                        {lead.customer_cnic && (
                            <div>
                                <p className="text-sm text-muted-foreground">CNIC</p>
                                <p className="font-medium">{formatCNIC(lead.customer_cnic)}</p>
                            </div>
                        )}
                        {lead.customer_address && (
                            <div className="sm:col-span-2">
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    Address
                                </p>
                                <p className="font-medium">{lead.customer_address}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Lead Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Lead Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge
                                variant="secondary"
                                className={`mt-1 ${statusColors[lead.status]?.bg || ''} ${statusColors[lead.status]?.text || ''}`}
                            >
                                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Priority</p>
                            <Badge
                                variant="outline"
                                className={`mt-1 ${priorityColors[lead.priority]?.bg || ''} ${priorityColors[lead.priority]?.text || ''}`}
                            >
                                {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                            </Badge>
                        </div>
                        {lead.source && (
                            <div>
                                <p className="text-sm text-muted-foreground">Source</p>
                                <p className="font-medium mt-1">{sourceLabels[lead.source] || lead.source}</p>
                            </div>
                        )}
                        {lead.assigned_user && (
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    Assigned To
                                </p>
                                <p className="font-medium mt-1">{lead.assigned_user.full_name}</p>
                            </div>
                        )}
                        {lead.next_follow_up && (
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Next Follow-up
                                </p>
                                <p className="font-medium mt-1">
                                    {new Date(lead.next_follow_up).toLocaleDateString('en-PK', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        )}
                        {lead.last_contacted_at && (
                            <div>
                                <p className="text-sm text-muted-foreground">Last Contacted</p>
                                <p className="font-medium mt-1">
                                    {new Date(lead.last_contacted_at).toLocaleDateString('en-PK', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Vehicle Interest */}
            {(lead.interested_vehicle || lead.budget_min || lead.budget_max || (lead.preferred_makes && lead.preferred_makes.length > 0)) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Interest</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {lead.interested_vehicle && (
                                <div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Car className="h-4 w-4" />
                                        Interested Vehicle
                                    </p>
                                    <Link
                                        href={`/dashboard/inventory/${lead.interested_vehicle.id}`}
                                        className="font-medium mt-1 text-primary hover:underline"
                                    >
                                        {lead.interested_vehicle.year} {lead.interested_vehicle.make}{' '}
                                        {lead.interested_vehicle.model}
                                    </Link>
                                </div>
                            )}
                            {(lead.budget_min || lead.budget_max) && (
                                <div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <DollarSign className="h-4 w-4" />
                                        Budget Range
                                    </p>
                                    <p className="font-medium mt-1">
                                        {lead.budget_min && lead.budget_max
                                            ? `PKR ${lead.budget_min.toLocaleString()} - ${lead.budget_max.toLocaleString()}`
                                            : lead.budget_min
                                              ? `PKR ${lead.budget_min.toLocaleString()}+`
                                              : `Up to PKR ${lead.budget_max?.toLocaleString()}`}
                                    </p>
                                </div>
                            )}
                            {lead.preferred_makes && lead.preferred_makes.length > 0 && (
                                <div className="sm:col-span-2">
                                    <p className="text-sm text-muted-foreground mb-2">Preferred Makes</p>
                                    <div className="flex flex-wrap gap-2">
                                        {lead.preferred_makes.map((make) => (
                                            <Badge key={make} variant="outline">
                                                {make}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Notes */}
            {lead.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* Metadata */}
            <Card>
                <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Created</p>
                            <p className="font-medium mt-1">
                                {new Date(lead.created_at).toLocaleDateString('en-PK', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Last Updated</p>
                            <p className="font-medium mt-1">
                                {new Date(lead.updated_at).toLocaleDateString('en-PK', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
