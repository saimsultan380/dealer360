"use client";

import React, { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, useForm } from "react-hook-form";
import {
  CheckCircle2,
  Loader2,
  Search,
  XCircle,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import {
  listPaymentsAdmin,
  verifyPaymentAdmin,
  rejectPaymentAdmin,
  refundPaymentAdmin,
  getPaymentsStatsAdmin,
} from "@/lib/actions/admin-payments";

type Payment = Awaited<ReturnType<typeof listPaymentsAdmin>>["data"][number];
type PaymentsStats = Awaited<ReturnType<typeof getPaymentsStatsAdmin>>["data"];

type Props = {
  initial: Payment[];
};

const verifySchema = z.object({
  subscription_plan: z.enum(["basic", "professional", "enterprise"]).optional(),
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  notes: z.string().optional(),
});
type VerifyFormValues = z.infer<typeof verifySchema>;

function statusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "completed":
      return <Badge>Completed</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "refunded":
      return <Badge variant="outline">Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function AdminPaymentsClient(props: Props) {
  const [rows, setRows] = useState<Payment[]>(props.initial ?? []);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    "all" | "pending" | "completed" | "failed" | "refunded"
  >("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [stats, setStats] = useState<PaymentsStats | null>(null);

  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(
      verifySchema
    ) as unknown as Resolver<VerifyFormValues>,
    defaultValues: {
      subscription_plan: undefined,
      period_start: new Date().toISOString().slice(0, 10),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      notes: "",
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (!q) return true;
      const hay =
        `${r.organization_name ?? ""} ${r.organization_city ?? ""} ${r.transaction_id ?? ""} ${r.external_reference ?? ""} ${r.organization_id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  const loadStats = async () => {
    const res = await getPaymentsStatsAdmin();
    if (!res.error) {
      setStats(res.data);
    }
  };

  // Load stats on first render
  useEffect(() => {
    loadStats();
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const res = await listPaymentsAdmin({ status, query: "" });
    if (res.error) {
      setError(res.error);
    } else {
      setRows(res.data);
    }
    await loadStats();
    setLoading(false);
  };

  const handleStatusChange = async (
    next: "all" | "pending" | "completed" | "failed" | "refunded"
  ) => {
    setStatus(next);
    setLoading(true);
    setError(null);
    setSuccess(null);
    const res = await listPaymentsAdmin({ status: next, query: "" });
    if (res.error) {
      setError(res.error);
    } else {
      setRows(res.data);
    }
    await loadStats();
    setLoading(false);
  };

  const openVerify = (p: Payment) => {
    setSelected(p);
    setError(null);
    setSuccess(null);
    const start = (p.period_start ?? new Date().toISOString()).slice(0, 10);
    const end = (
      p.period_end ??
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    ).slice(0, 10);
    verifyForm.reset({
      subscription_plan:
        (p.subscription_plan as any) ??
        (p.organization_plan as any) ??
        undefined,
      period_start: start,
      period_end: end,
      notes: p.notes ?? "",
    });
    setDialogOpen(true);
  };

  const onVerify = async (values: VerifyFormValues) => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    const res = await verifyPaymentAdmin({
      payment_id: selected.id,
      subscription_plan: values.subscription_plan,
      period_start: new Date(values.period_start).toISOString(),
      period_end: new Date(values.period_end).toISOString(),
      notes: values.notes,
    });
    if (res.error) setError(res.error);
    else {
      setSuccess("Payment verified and subscription updated.");
      setTimeout(() => setSuccess(null), 2500);
      setDialogOpen(false);
      await refresh();
    }
    setLoading(false);
  };

  const onReject = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    const notes = verifyForm.getValues("notes");
    const res = await rejectPaymentAdmin({ payment_id: selected.id, notes });
    if (res.error) setError(res.error);
    else {
      setSuccess("Payment rejected.");
      setTimeout(() => setSuccess(null), 2500);
      setDialogOpen(false);
      await refresh();
    }
    setLoading(false);
  };

  const onRefund = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    const notes = verifyForm.getValues("notes");
    const res = await refundPaymentAdmin({ payment_id: selected.id, notes });
    if (res.error) setError(res.error);
    else {
      setSuccess("Payment marked as refunded.");
      setTimeout(() => setSuccess(null), 2500);
      setDialogOpen(false);
      await refresh();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Verify payments and manage subscription periods.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total completed revenue</CardDescription>
              <CardTitle className="text-2xl font-figures tabular-nums">
                PKR {stats.completed_amount.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              {stats.completed_payments} completed payments
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending payments</CardDescription>
              <CardTitle className="text-2xl font-figures tabular-nums">
                PKR {stats.pending_amount.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              {stats.pending_payments} pending payments
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active subscriptions</CardDescription>
              <CardTitle className="text-2xl font-figures tabular-nums">
                {stats.org_active.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              {stats.org_trial.toLocaleString()} in trial
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Refunded / failed</CardDescription>
              <CardTitle className="text-2xl font-figures tabular-nums">
                PKR{" "}
                {(stats.refunded_amount + stats.failed_amount).toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              {stats.refunded_payments} refunded • {stats.failed_payments}{" "}
              failed
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Filter, review, and verify payment records.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:w-[180px]">
              <Select
                value={status}
                onValueChange={(v) => handleStatusChange(v as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search org / refs / id..."
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Refs</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      No payments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(p.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="min-w-0">
                          <div className="truncate">
                            {p.organization_name ?? p.organization_id}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {p.organization_city ?? "—"} • plan:{" "}
                            {p.organization_plan ?? "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.payment_method ?? "—"}
                      </TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {p.currency ?? "PKR"}{" "}
                        {Number(p.amount ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex flex-col gap-1">
                          {p.transaction_id && (
                            <div>txn: {p.transaction_id}</div>
                          )}
                          {p.external_reference && (
                            <div>ext: {p.external_reference}</div>
                          )}
                          {!p.transaction_id && !p.external_reference && (
                            <div>—</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={
                            p.status === "pending" ? "default" : "outline"
                          }
                          onClick={() => openVerify(p)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review payment</DialogTitle>
            <DialogDescription>
              Verify, reject, or refund and keep the subscription dates
              accurate.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">
                  {selected.organization_name ?? selected.organization_id}
                </div>
                {statusBadge(selected.status)}
              </div>
              <div className="text-muted-foreground text-xs mt-1">
                {selected.currency ?? "PKR"}{" "}
                {Number(selected.amount ?? 0).toLocaleString()} •{" "}
                {selected.payment_method ?? "—"}
              </div>
            </div>
          )}

          <form
            onSubmit={verifyForm.handleSubmit(onVerify)}
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Subscription plan</Label>
                <Select
                  value={verifyForm.watch("subscription_plan")}
                  onValueChange={(v) =>
                    verifyForm.setValue("subscription_plan", v as any)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  placeholder="Optional notes"
                  {...verifyForm.register("notes")}
                />
              </div>
              <div className="space-y-2">
                <Label>Period start</Label>
                <Input type="date" {...verifyForm.register("period_start")} />
              </div>
              <div className="space-y-2">
                <Label>Period end</Label>
                <Input type="date" {...verifyForm.register("period_end")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Long notes / verification details</Label>
              <Textarea
                value={verifyForm.watch("notes") ?? ""}
                onChange={(e) => verifyForm.setValue("notes", e.target.value)}
                rows={4}
                placeholder="Add verification details, receipt info, bank reference, etc."
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:mr-auto">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onReject}
                  disabled={loading || !selected}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRefund}
                  disabled={loading || !selected}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Refund
                </Button>
              </div>
              <Button type="submit" disabled={loading || !selected}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Verify & Activate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
