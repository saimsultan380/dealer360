"use client";

import { useCallback, useEffect, useState } from "react";
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
  ShoppingCart,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Car,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  getClientById,
  getClientTransactions,
  ClientWithStats,
} from "@/lib/actions/clients";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClientTransaction } from "@/lib/types/database";
import { getClientAvatarUrl } from "@/lib/utils/avatar-url";
import { ClientDetailRealtimeListener } from "@/components/clients/client-detail-realtime-listener";

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState<string | null>(null);
  const [client, setClient] = useState<ClientWithStats | null>(null);
  const [transactions, setTransactions] = useState<ClientTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const [clientResult, transactionsResult] = await Promise.all([
      getClientById(id),
      getClientTransactions(id),
    ]);

    if (clientResult.error) {
      setError(clientResult.error);
    } else {
      setClient(clientResult.data);
    }

    if (transactionsResult.error) {
      console.error("Error fetching transactions:", transactionsResult.error);
    } else {
      setTransactions(transactionsResult.data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    params.then((p) => {
      setClientId(p.id);
      fetchData(p.id);
    });
  }, [params, fetchData]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading || !clientId) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-8">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/clients")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              Error: {error || "Client not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ClientDetailRealtimeListener
        clientId={clientId}
        organizationId={client.organization_id}
        onRefresh={() => fetchData(clientId)}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/clients")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={getClientAvatarUrl(client.avatar_url) ?? undefined}
                alt={client.name}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {client.name}
              </h1>
              <p className="text-muted-foreground">
                Client details and transaction history
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              PKR {client.total_spent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All-time purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Remaining Dues
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              PKR {client.total_dues.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Outstanding payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Purchases
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.total_purchases}</div>
            <p className="text-xs text-muted-foreground">
              Completed transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Row 1: Phone | Email */}
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground break-words">
                  {client.phone}
                </p>
              </div>
            </div>
            {client.email ? (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {client.email}
                  </p>
                </div>
              </div>
            ) : (
              <div></div>
            )}

            {/* Row 2: CNIC | Status */}
            {client.cnic ? (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">CNIC</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {client.cnic}
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
                    client.status === "active"
                      ? "default"
                      : client.status === "inactive"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {client.status}
                </Badge>
              </div>
            </div>

            {/* Row 3: Address (spans 2 columns if present) */}
            {client.address && (
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {client.address}
                  </p>
                </div>
              </div>
            )}

            {/* Row 4: Notes (spans 2 columns if present) */}
            {client.notes && (
              <div className="flex items-start gap-3 md:col-span-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                    {client.notes}
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                {transactions.length} transaction
                {transactions.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium mb-1">No transactions yet</p>
              <p className="text-xs text-muted-foreground">
                Transaction history will appear here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead>Status</TableHead>
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
                            transaction.transaction_type === "purchase"
                              ? "default"
                              : transaction.transaction_type === "payment"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {transaction.transaction_type === "purchase" ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {transaction.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.vehicle_make &&
                        transaction.vehicle_model ? (
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">
                                {transaction.vehicle_make}{" "}
                                {transaction.vehicle_model}
                              </div>
                              {transaction.vehicle_year && (
                                <div className="text-xs text-muted-foreground">
                                  {transaction.vehicle_year}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        PKR{" "}
                        {parseFloat(
                          transaction.amount.toString()
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell>{transaction.payment_method || "-"}</TableCell>
                      <TableCell className="text-right text-green-600">
                        PKR{" "}
                        {parseFloat(
                          (transaction.paid_amount || 0).toString()
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.remaining_due > 0 ? (
                          <span className="font-semibold text-amber-600">
                            PKR{" "}
                            {parseFloat(
                              transaction.remaining_due.toString()
                            ).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
