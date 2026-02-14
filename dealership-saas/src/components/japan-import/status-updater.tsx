"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateJapanImportCase } from "@/lib/actions/japan-import";
import type { JapanImportStatus } from "@/lib/types/database";

const STATUSES: JapanImportStatus[] = [
  "planned",
  "purchased",
  "in_transit",
  "arrived_port",
  "customs",
  "ready_for_sale",
  "sold",
  "cancelled",
];

export function JapanImportStatusUpdater({
  caseId,
  status,
}: {
  caseId: string;
  status: JapanImportStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<JapanImportStatus>(status);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateJapanImportCase(caseId, { status: value });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={value} onValueChange={(v) => setValue(v as JapanImportStatus)}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {item.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={save}
          disabled={pending || value === status}
          className="w-full sm:w-auto"
        >
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Status
        </Button>
      </div>
      {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  );
}
