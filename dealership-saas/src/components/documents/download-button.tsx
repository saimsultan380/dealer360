'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DocumentWithDetails } from '@/lib/actions/documents';

interface DownloadButtonProps {
    doc: DocumentWithDetails;
}

export function DownloadButton({ doc }: DownloadButtonProps) {
    const handleDownload = () => {
        const link = window.document.createElement('a');
        link.href = doc.file_url;
        link.download = doc.file_name;
        link.target = '_blank';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
    };

    return (
        <Button onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
        </Button>
    );
}
