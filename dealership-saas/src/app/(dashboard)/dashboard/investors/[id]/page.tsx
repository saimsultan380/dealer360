"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Edit,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";
import {
  getInvestorById,
  getInvestorTransactions,
  InvestorWithBalance,
} from "@/lib/actions/investors";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionForm } from "@/components/investors/transaction-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InvestmentTransaction } from "@/lib/types/database";
import { getInvestorAvatarUrl } from "@/lib/utils/avatar-url";

export default function InvestorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [investorId, setInvestorId] = useState<string | null>(null);
  const [investor, setInvestor] = useState<InvestorWithBalance | null>(null);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<
    "investment" | "withdrawal"
  >("investment");

  useEffect(() => {
    params.then((p) => {
      setInvestorId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  const fetchData = async (id: string) => {
    setLoading(true);
    setError(null);

    const [investorResult, transactionsResult] = await Promise.all([
      getInvestorById(id),
      getInvestorTransactions(id),
    ]);

    if (investorResult.error) {
      setError(investorResult.error);
    } else {
      setInvestor(investorResult.data);
    }

    if (transactionsResult.error) {
      console.error("Error fetching transactions:", transactionsResult.error);
    } else {
      setTransactions(transactionsResult.data || []);
    }

    setLoading(false);
  };

  const handleTransactionSuccess = () => {
    setTransactionDialogOpen(false);
    if (investorId) {
      fetchData(investorId);
    }
  };

  const openTransactionDialog = (type: "investment" | "withdrawal") => {
    setTransactionType(type);
    setTransactionDialogOpen(true);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (loading || !investorId) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !investor) {
    return (
      <div className="space-y-8">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/investors")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Investors
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              Error: {error || "Investor not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* Row 1: Back button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/investors")}
            className="shrink-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Row 2: Avatar + name + subtitle + Edit button (single row on mobile) */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar
              className="h-16 w-16 shrink-0"
              key={`${investor.id}-${investor.avatar_url ?? ""}`}
            >
              <AvatarImage
                src={getInvestorAvatarUrl(investor.avatar_url) ?? undefined}
                alt={investor.name}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials(investor.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {investor.name}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Investor details and transactions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/investors/${investor.id}/edit`)
              }
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-figures tabular-nums">
              PKR {investor.balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Available balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invested
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              PKR {investor.total_invested.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Withdrawn
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 font-figures tabular-nums">
              PKR {investor.total_withdrawn.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time withdrawals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investor Information */}
      <Card>
        <CardHeader>
          <CardTitle>Investor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Row 1: Phone | Email */}
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground break-words">
                  {investor.phone}
                </p>
              </div>
            </div>
            {investor.email ? (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {investor.email}
                  </p>
                </div>
              </div>
            ) : (
              <div></div>
            )}

            {/* Row 2: CNIC | Status */}
            {investor.cnic ? (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">CNIC</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {investor.cnic}
                  </p>
                </div>
              </div>
            ) : (
              <div></div>
            )}
            <div className="flex items-start gap-3">
              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <Badge
                  variant={
                    investor.status === "active"
                      ? "default"
                      : investor.status === "inactive"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {investor.status}
                </Badge>
              </div>
            </div>

            {/* Row 3: Address (spans 2 columns if present) */}
            {investor.address && (
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {investor.address}
                  </p>
                </div>
              </div>
            )}

            {/* Row 4: Notes (spans 2 columns if present) */}
            {investor.notes && (
              <div className="flex items-start gap-3 md:col-span-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                    {investor.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                {transactions.length} transaction
                {transactions.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openTransactionDialog("investment")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Investment
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openTransactionDialog("withdrawal")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Withdrawal
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium mb-1">No transactions yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Record the first investment or withdrawal
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openTransactionDialog("investment")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Investment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openTransactionDialog("withdrawal")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Withdrawal
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  const transactionDate = new Date(
                    transaction.transaction_date
                  );
                  const isToday =
                    transactionDate.toDateString() ===
                    new Date().toDateString();
                  const isYesterday =
                    transactionDate.toDateString() ===
                    new Date(Date.now() - 86400000).toDateString();

                  let dateDisplay = transactionDate.toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  );

                  if (isToday) {
                    dateDisplay = "Today";
                  } else if (isYesterday) {
                    dateDisplay = "Yesterday";
                  }

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{dateDisplay}</span>
                          <span className="text-xs text-muted-foreground">
                            {transactionDate.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.transaction_type === "investment"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {transaction.transaction_type === "investment" ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {transaction.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {transaction.transaction_type === "investment" ? (
                          <span className="text-green-600">
                            +PKR{" "}
                            {parseFloat(
                              transaction.amount.toString()
                            ).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-red-600">
                            -PKR{" "}
                            {parseFloat(
                              transaction.amount.toString()
                            ).toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{transaction.payment_method || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.status === "completed"
                              ? "default"
                              : transaction.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.transaction_reference || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      <Dialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {transactionType === "investment"
                ? "Add Investment"
                : "Add Withdrawal"}
            </DialogTitle>
            <DialogDescription>
              Record a new {transactionType} transaction for {investor.name}
            </DialogDescription>
          </DialogHeader>
          <TransactionForm
            investorId={investor.id}
            transactionType={transactionType}
            onSuccess={handleTransactionSuccess}
            onCancel={() => setTransactionDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
