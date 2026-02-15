'use client';

import { useState } from 'react';
import Image from 'next/image';
import { DocumentWithDetails } from '@/lib/actions/documents';
import { FileText, Image as ImageIcon, File, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DocumentPreviewProps {
    doc: DocumentWithDetails;
}

export function DocumentPreview({ doc }: DocumentPreviewProps) {
    const [error, setError] = useState(false);

    const isImage = doc.mime_type?.startsWith('image/');
    const isPDF = doc.mime_type === 'application/pdf';

    const handleDownload = () => {
        const link = window.document.createElement('a');
        link.href = doc.file_url;
        link.download = doc.file_name;
        link.target = '_blank';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
                <File className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">Unable to preview this file</p>
                <Button onClick={handleDownload} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download to View
                </Button>
            </div>
        );
    }

    if (isImage) {
        return (
            <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                    src={doc.file_url}
                    alt={doc.file_name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 800px"
                    onError={() => setError(true)}
                />
            </div>
        );
    }

    if (isPDF) {
        return (
            <div className="w-full">
                <iframe
                    src={doc.file_url}
                    className="w-full h-[600px] border rounded-lg"
                    title={doc.file_name}
                    onError={() => setError(true)}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
                Preview not available for this file type
            </p>
            <p className="text-xs text-muted-foreground mb-4">
                {doc.mime_type || 'Unknown file type'}
            </p>
            <Button onClick={handleDownload} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download File
            </Button>
        </div>
    );
}
