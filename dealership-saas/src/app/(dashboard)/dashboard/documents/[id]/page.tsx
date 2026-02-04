import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDocumentById } from "@/lib/actions/documents";
import { ArrowLeft, FileText, Image as ImageIcon, File } from "lucide-react";
import Link from "next/link";
import { DocumentPreview } from "@/components/documents/document-preview";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { DownloadButton } from "@/components/documents/download-button";
import { formatDistanceToNow } from "date-fns";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: document, error } = await getDocumentById(id);

  if (error || !document) {
    notFound();
  }

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="h-6 w-6" />;
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-6 w-6" />;
    if (mimeType === "application/pdf") return <FileText className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const documentTypeLabels: Record<string, string> = {
    cnic_front: "CNIC Front",
    cnic_back: "CNIC Back",
    registration: "Registration",
    invoice: "Invoice",
    receipt: "Receipt",
    other: "Other",
  };

  const entityTypeLabels: Record<string, string> = {
    vehicle: "Vehicle",
    deal: "Deal",
    lead: "Lead",
  };

  const getEntityName = () => {
    if (document.entity_type === "vehicle" && document.entity) {
      return `${document.entity.year} ${document.entity.make} ${document.entity.model}`;
    }
    if (
      (document.entity_type === "deal" || document.entity_type === "lead") &&
      document.entity
    ) {
      return document.entity.customer_name || "N/A";
    }
    return "N/A";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Link href="/dashboard/documents" className="shrink-0">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Document Details
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              View and manage document information
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <DownloadButton doc={document} />
          <DeleteDocumentButton documentId={document.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Document preview and content</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentPreview doc={document} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
              <CardDescription>Document metadata and details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {getFileIcon(document.mime_type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{document.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(document.file_size)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Document Type:
                  </span>
                  <Badge variant="secondary">
                    {documentTypeLabels[document.document_type] ||
                      document.document_type}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Entity Type:
                  </span>
                  <Badge variant="outline">
                    {entityTypeLabels[document.entity_type] ||
                      document.entity_type}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Entity:</span>
                  <span className="text-sm font-medium">{getEntityName()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    MIME Type:
                  </span>
                  <span className="text-sm">{document.mime_type || "N/A"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Uploaded By:
                  </span>
                  <span className="text-sm">
                    {document.uploaded_by_user?.full_name || "Unknown"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Uploaded:
                  </span>
                  <span className="text-sm">
                    {formatDistanceToNow(new Date(document.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="text-sm">
                    {new Date(document.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {document.entity && (
            <Card>
              <CardHeader>
                <CardTitle>Related Entity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{getEntityName()}</p>
                  <Link
                    href={`/dashboard/${document.entity_type}s/${document.entity_id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View {entityTypeLabels[document.entity_type]}
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
