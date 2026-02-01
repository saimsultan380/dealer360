import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentsTable } from '@/components/documents/documents-table';
import { DocumentUpload } from '@/components/documents/document-upload';
import { getDocuments, getDocumentStats } from '@/lib/actions/documents';
import { DocumentsFilters } from '@/components/documents/documents-filters';
import { FileText, Image as ImageIcon, Package, Users, TrendingUp } from 'lucide-react';

export default async function DocumentsPage({
    searchParams,
}: {
    searchParams: Promise<{
        entity_type?: string;
        document_type?: string;
        search?: string;
        start_date?: string;
        end_date?: string;
        page?: string;
    }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;

    const filters = {
        entity_type: (params.entity_type as any) || 'all',
        document_type: (params.document_type as any) || 'all',
        search: params.search,
        start_date: params.start_date,
        end_date: params.end_date,
    };

    const { data: documents, error, metadata } = await getDocuments(filters, page, 20);
    const { data: stats } = await getDocumentStats();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
                <p className="text-muted-foreground">
                    Manage and organize all your documents in one place
                </p>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.recentCount} uploaded this week
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(stats.totalSize / (1024 * 1024)).toFixed(1)} MB
                            </div>
                            <p className="text-xs text-muted-foreground">
                                All documents combined
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">By Type</CardTitle>
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Object.values(stats.byType).reduce((a, b) => a + b, 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {Object.entries(stats.byType)
                                    .filter(([_, count]) => count > 0)
                                    .map(([type, count]) => `${type}: ${count}`)
                                    .join(', ')}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">By Entity</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Object.values(stats.byEntityType).reduce((a, b) => a + b, 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Vehicles: {stats.byEntityType.vehicle}, Deals: {stats.byEntityType.deal}, Leads: {stats.byEntityType.lead}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Content */}
            <div className="space-y-6">
                {/* Upload Section - First Row */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Documents</CardTitle>
                        <CardDescription>Add new documents to the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DocumentUpload />
                    </CardContent>
                </Card>

                {/* Documents Table with Integrated Filters - Second Row */}
                <Card>
                    <CardHeader className="space-y-4 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle>Documents</CardTitle>
                                <CardDescription>
                                    {metadata ? `Showing ${documents?.length || 0} of ${metadata.total} documents` : 'All documents'}
                                </CardDescription>
                            </div>
                        </div>
                        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading filters...</div>}>
                            <DocumentsFilters />
                        </Suspense>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {error ? (
                            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                                Error: {error}
                            </div>
                        ) : (
                            <DocumentsTable documents={documents || []} />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
