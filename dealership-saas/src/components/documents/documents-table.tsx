'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Download, Trash2, FileText, Image as ImageIcon, File } from 'lucide-react';
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
import { DocumentWithDetails } from '@/lib/actions/documents';
import { deleteDocument } from '@/lib/actions/documents';
import { formatDistanceToNow } from 'date-fns';

interface DocumentsTableProps {
    documents: DocumentWithDetails[];
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this document?')) {
            setIsDeleting(id);
            const { error } = await deleteDocument(id);
            if (!error) {
                router.refresh();
            } else {
                alert('Failed to delete document: ' + error);
            }
            setIsDeleting(null);
        }
    };

    const handleDownload = (url: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getFileIcon = (mimeType: string | null) => {
        if (!mimeType) return <File className="h-4 w-4" />;
        if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
        if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />;
        return <File className="h-4 w-4" />;
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const documentTypeLabels: Record<string, string> = {
        cnic_front: 'CNIC Front',
        cnic_back: 'CNIC Back',
        registration: 'Registration',
        invoice: 'Invoice',
        receipt: 'Receipt',
        other: 'Other',
    };

    const entityTypeLabels: Record<string, string> = {
        vehicle: 'Vehicle',
        deal: 'Deal',
        lead: 'Lead',
    };

    const getEntityName = (doc: DocumentWithDetails) => {
        if (doc.entity_type === 'vehicle' && doc.entity) {
            return `${doc.entity.year} ${doc.entity.make} ${doc.entity.model}`;
        }
        if ((doc.entity_type === 'deal' || doc.entity_type === 'lead') && doc.entity) {
            return doc.entity.customer_name || 'N/A';
        }
        return 'N/A';
    };

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">Type</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Document Type</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Uploaded By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                                No documents found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        documents.map((document) => (
                            <TableRow key={document.id}>
                                <TableCell>
                                    <div className="flex items-center justify-center">
                                        {getFileIcon(document.mime_type)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium max-w-[200px] truncate" title={document.file_name}>
                                        {document.file_name}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">
                                        {documentTypeLabels[document.document_type] || document.document_type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <Badge variant="outline" className="text-xs">
                                            {entityTypeLabels[document.entity_type]}
                                        </Badge>
                                        <div className="text-sm text-muted-foreground">
                                            {getEntityName(document)}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {formatFileSize(document.file_size)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {document.uploaded_by_user?.full_name || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
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
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/documents/${document.id}`}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDownload(document.file_url, document.file_name)}
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(document.id)}
                                                disabled={isDeleting === document.id}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {isDeleting === document.id ? 'Deleting...' : 'Delete'}
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
