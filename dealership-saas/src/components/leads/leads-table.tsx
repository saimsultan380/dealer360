'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2, Eye, Phone, Mail, Calendar, User } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeadWithDetails } from '@/lib/actions/leads';
import { deleteLead } from '@/lib/actions/leads';
import { formatPhoneNumber } from '@/lib/utils/format-input';

interface LeadsTableProps {
    leads: LeadWithDetails[];
}

export function LeadsTable({ leads }: LeadsTableProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this lead?')) {
            setIsDeleting(id);
            const result = await deleteLead(id);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error || 'Failed to delete lead');
            }
            setIsDeleting(null);
        }
    };

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

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Interested Vehicle</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Follow Up</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center">
                                No leads found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        leads.map((lead) => (
                            <TableRow key={lead.id}>
                                <TableCell>
                                    <div>
                                        <div className="font-medium">{lead.customer_name}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {lead.customer_phone ? formatPhoneNumber(lead.customer_phone) : 'N/A'}
                                        </div>
                                        {lead.customer_email && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {lead.customer_email}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {lead.source ? (
                                        <Badge variant="outline">{sourceLabels[lead.source] || lead.source}</Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="secondary"
                                        className={`${statusColors[lead.status]?.bg || ''} ${statusColors[lead.status]?.text || ''}`}
                                    >
                                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={`${priorityColors[lead.priority]?.bg || ''} ${priorityColors[lead.priority]?.text || ''}`}
                                    >
                                        {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {lead.interested_vehicle ? (
                                        <div className="text-sm">
                                            {lead.interested_vehicle.make} {lead.interested_vehicle.model} {lead.interested_vehicle.year}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {lead.budget_min || lead.budget_max ? (
                                        <div className="text-sm">
                                            {lead.budget_min && lead.budget_max
                                                ? `PKR ${lead.budget_min.toLocaleString()} - ${lead.budget_max.toLocaleString()}`
                                                : lead.budget_min
                                                  ? `PKR ${lead.budget_min.toLocaleString()}+`
                                                  : `Up to PKR ${lead.budget_max?.toLocaleString()}`}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {lead.assigned_user ? (
                                        <div className="flex items-center gap-1 text-sm">
                                            <User className="h-3 w-3" />
                                            {lead.assigned_user.full_name}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">Unassigned</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {lead.next_follow_up ? (
                                        <div className="flex items-center gap-1 text-sm">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(lead.next_follow_up)}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/leads/${lead.id}`}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/leads/${lead.id}/edit`}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(lead.id)}
                                                disabled={isDeleting === lead.id}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {isDeleting === lead.id ? 'Deleting...' : 'Delete'}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
