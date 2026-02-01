'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Document, DocumentType, EntityType } from '@/lib/types/database';

export interface DocumentWithDetails extends Document {
    uploaded_by_user?: {
        id: string;
        full_name: string;
    } | null;
    entity?: {
        id: string;
        name?: string;
        make?: string;
        model?: string;
        year?: number;
        customer_name?: string;
    } | null;
}

export interface DocumentFormData {
    entity_type: EntityType;
    entity_id: string;
    document_type: DocumentType;
    file_name: string;
    file_url: string;
    file_size?: number;
    mime_type?: string;
}

export interface DocumentFilters {
    entity_type?: EntityType | 'all';
    document_type?: DocumentType | 'all';
    entity_id?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    uploaded_by?: string;
}

export async function getDocuments(
    filters?: DocumentFilters,
    page: number = 1,
    limit: number = 20
): Promise<{ data: DocumentWithDetails[] | null; error: string | null; metadata?: { total: number; page: number; limit: number; totalPages: number } }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: [], error: null };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: [], error: null };
        }

        let query = supabase
            .from('documents')
            .select(`
                *,
                uploaded_by_user:profiles!documents_uploaded_by_fkey(id, full_name)
            `, { count: 'exact' })
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.entity_type && filters.entity_type !== 'all') {
            query = query.eq('entity_type', filters.entity_type);
        }

        if (filters?.document_type && filters.document_type !== 'all') {
            query = query.eq('document_type', filters.document_type);
        }

        if (filters?.entity_id) {
            query = query.eq('entity_id', filters.entity_id);
        }

        if (filters?.uploaded_by) {
            query = query.eq('uploaded_by', filters.uploaded_by);
        }

        if (filters?.start_date) {
            query = query.gte('created_at', filters.start_date);
        }

        if (filters?.end_date) {
            query = query.lte('created_at', filters.end_date);
        }

        if (filters?.search) {
            const searchTerm = filters.search.toLowerCase();
            query = query.or(`file_name.ilike.%${searchTerm}%`);
        }

        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data: documents, error, count } = await query;

        if (error) {
            console.error('Error fetching documents:', error);
            return { data: null, error: error.message };
        }

        // Fetch entity details for each document
        const documentsWithEntities = await Promise.all(
            (documents || []).map(async (doc: Document) => {
                let entity = null;
                try {
                    if (doc.entity_type === 'vehicle') {
                        const { data: vehicle } = await supabase
                            .from('vehicles')
                            .select('id, make, model, year')
                            .eq('id', doc.entity_id)
                            .single();
                        if (vehicle) {
                            entity = {
                                id: vehicle.id,
                                make: vehicle.make,
                                model: vehicle.model,
                                year: vehicle.year,
                            };
                        }
                    } else if (doc.entity_type === 'deal') {
                        const { data: deal } = await supabase
                            .from('deals')
                            .select('id, customer_name')
                            .eq('id', doc.entity_id)
                            .single();
                        if (deal) {
                            entity = {
                                id: deal.id,
                                customer_name: deal.customer_name,
                            };
                        }
                    } else if (doc.entity_type === 'lead') {
                        const { data: lead } = await supabase
                            .from('leads')
                            .select('id, customer_name')
                            .eq('id', doc.entity_id)
                            .single();
                        if (lead) {
                            entity = {
                                id: lead.id,
                                customer_name: lead.customer_name,
                            };
                        }
                    }
                } catch (e) {
                    console.error('Error fetching entity:', e);
                }

                return {
                    ...doc,
                    entity,
                };
            })
        );

        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        return {
            data: documentsWithEntities as DocumentWithDetails[],
            error: null,
            metadata: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    } catch (err) {
        console.error('Error in getDocuments:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch documents.',
        };
    }
}

export async function getDocumentById(id: string): Promise<{ data: DocumentWithDetails | null; error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: null, error: 'No organization found' };
        }

        const { data: document, error } = await supabase
            .from('documents')
            .select(`
                *,
                uploaded_by_user:profiles!documents_uploaded_by_fkey(id, full_name)
            `)
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single();

        if (error) {
            console.error('Error fetching document:', error);
            return { data: null, error: error.message };
        }

        // Fetch entity details
        let entity = null;
        try {
            if (document.entity_type === 'vehicle') {
                const { data: vehicle } = await supabase
                    .from('vehicles')
                    .select('id, make, model, year')
                    .eq('id', document.entity_id)
                    .single();
                if (vehicle) {
                    entity = {
                        id: vehicle.id,
                        make: vehicle.make,
                        model: vehicle.model,
                        year: vehicle.year,
                    };
                }
            } else if (document.entity_type === 'deal') {
                const { data: deal } = await supabase
                    .from('deals')
                    .select('id, customer_name')
                    .eq('id', document.entity_id)
                    .single();
                if (deal) {
                    entity = {
                        id: deal.id,
                        customer_name: deal.customer_name,
                    };
                }
            } else if (document.entity_type === 'lead') {
                const { data: lead } = await supabase
                    .from('leads')
                    .select('id, customer_name')
                    .eq('id', document.entity_id)
                    .single();
                if (lead) {
                    entity = {
                        id: lead.id,
                        customer_name: lead.customer_name,
                    };
                }
            }
        } catch (e) {
            console.error('Error fetching entity:', e);
        }

        return {
            data: {
                ...document,
                entity,
            } as DocumentWithDetails,
            error: null,
        };
    } catch (err) {
        console.error('Error in getDocumentById:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch document.',
        };
    }
}

export async function createDocument(data: DocumentFormData): Promise<{ data: Document | null; error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: null, error: 'No organization found' };
        }

        const { data: document, error } = await supabase
            .from('documents')
            .insert({
                organization_id: profile.organization_id,
                entity_type: data.entity_type,
                entity_id: data.entity_id,
                document_type: data.document_type,
                file_name: data.file_name,
                file_url: data.file_url,
                file_size: data.file_size,
                mime_type: data.mime_type,
                uploaded_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating document:', error);
            return { data: null, error: error.message };
        }

        revalidatePath('/dashboard/documents');
        return { data: document as Document, error: null };
    } catch (err) {
        console.error('Error in createDocument:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to create document.',
        };
    }
}

export async function updateDocument(
    id: string,
    data: Partial<DocumentFormData>
): Promise<{ data: Document | null; error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: null, error: 'No organization found' };
        }

        // Verify document belongs to organization
        const { data: existingDoc } = await supabase
            .from('documents')
            .select('id')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single();

        if (!existingDoc) {
            return { data: null, error: 'Document not found' };
        }

        const updateData: any = {};
        if (data.document_type) updateData.document_type = data.document_type;
        if (data.file_name) updateData.file_name = data.file_name;

        const { data: document, error } = await supabase
            .from('documents')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating document:', error);
            return { data: null, error: error.message };
        }

        revalidatePath('/dashboard/documents');
        return { data: document as Document, error: null };
    } catch (err) {
        console.error('Error in updateDocument:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to update document.',
        };
    }
}

export async function deleteDocument(id: string): Promise<{ error: string | null }> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { error: 'No organization found' };
        }

        // Get document to delete file from storage
        const { data: document } = await supabase
            .from('documents')
            .select('file_url')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single();

        if (!document) {
            return { error: 'Document not found' };
        }

        // Delete from database
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id)
            .eq('organization_id', profile.organization_id);

        if (error) {
            console.error('Error deleting document:', error);
            return { error: error.message };
        }

        // Try to delete from storage (optional - file might be shared)
        try {
            const urlParts = document.file_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = document.file_url.includes('vehicle-docs')
                ? `vehicle-docs/${fileName}`
                : document.file_url.includes('documents')
                ? `documents/${fileName}`
                : null;

            if (filePath) {
                const bucket = document.file_url.includes('vehicle-docs') ? 'vehicles' : 'documents';
                await supabase.storage.from(bucket).remove([filePath]);
            }
        } catch (storageError) {
            console.warn('Could not delete file from storage:', storageError);
            // Continue even if storage deletion fails
        }

        revalidatePath('/dashboard/documents');
        return { error: null };
    } catch (err) {
        console.error('Error in deleteDocument:', err);
        return {
            error: err instanceof Error ? err.message : 'Failed to delete document.',
        };
    }
}

export async function getDocumentStats(): Promise<{
    data: {
        total: number;
        byType: Record<DocumentType, number>;
        byEntityType: Record<EntityType, number>;
        totalSize: number;
        recentCount: number;
    } | null;
    error: string | null;
}> {
    try {
        const supabase = (await createClient()) as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return { data: null, error: 'No organization found' };
        }

        const { data: documents, error } = await supabase
            .from('documents')
            .select('document_type, entity_type, file_size, created_at')
            .eq('organization_id', profile.organization_id);

        if (error) {
            console.error('Error fetching document stats:', error);
            return { data: null, error: error.message };
        }

        const stats = {
            total: documents?.length || 0,
            byType: {
                cnic_front: 0,
                cnic_back: 0,
                registration: 0,
                invoice: 0,
                receipt: 0,
                other: 0,
            } as Record<DocumentType, number>,
            byEntityType: {
                vehicle: 0,
                deal: 0,
                lead: 0,
            } as Record<EntityType, number>,
            totalSize: 0,
            recentCount: 0,
        };

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        documents?.forEach((doc: any) => {
            if (doc.document_type) {
                stats.byType[doc.document_type as DocumentType] =
                    (stats.byType[doc.document_type as DocumentType] || 0) + 1;
            }
            if (doc.entity_type) {
                stats.byEntityType[doc.entity_type as EntityType] =
                    (stats.byEntityType[doc.entity_type as EntityType] || 0) + 1;
            }
            if (doc.file_size) {
                stats.totalSize += doc.file_size;
            }
            if (new Date(doc.created_at) >= sevenDaysAgo) {
                stats.recentCount += 1;
            }
        });

        return { data: stats, error: null };
    } catch (err) {
        console.error('Error in getDocumentStats:', err);
        return {
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch document stats.',
        };
    }
}
