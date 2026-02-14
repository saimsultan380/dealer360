import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getJapanImportCaseById } from "@/lib/actions/japan-import";
import { JapanImportCaseForm } from "@/components/japan-import/import-case-form";
import { JapanImportFormConfigProvider } from "@/components/japan-import/form-config";

export default async function EditJapanImportCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getJapanImportCaseById(id);

  if (res.error || !res.data) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/japan-import">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {res.error || "Import case not found"}
        </div>
      </div>
    );
  }

  return (
    <JapanImportFormConfigProvider>
      <JapanImportCaseForm
        mode="edit"
        caseId={id}
        initialCase={res.data.importCase}
      />
    </JapanImportFormConfigProvider>
  );
}
