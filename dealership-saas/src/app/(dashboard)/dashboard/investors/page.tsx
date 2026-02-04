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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  UserPlus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import {
  getInvestors,
  InvestorWithBalance,
  deleteInvestor,
} from "@/lib/actions/investors";
import { getInvestorAvatarUrl } from "@/lib/utils/avatar-url";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function InvestorsPage() {
  const router = useRouter();
  const [investors, setInvestors] = useState<InvestorWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [investorToDelete, setInvestorToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchInvestors();
  }, []);

  const fetchInvestors = async () => {
    setLoading(true);
    setError(null);
    const result = await getInvestors();
    if (result.error) {
      setError(result.error);
    } else {
      setInvestors(result.data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteInvestor(id);
    if (result.error) {
      alert(result.error);
    } else {
      fetchInvestors();
      setDeleteDialogOpen(false);
      setInvestorToDelete(null);
    }
  };

  const filteredInvestors = investors.filter((investor) => {
    const query = searchQuery.toLowerCase();
    return (
      investor.name.toLowerCase().includes(query) ||
      investor.phone?.toLowerCase().includes(query) ||
      investor.email?.toLowerCase().includes(query) ||
      investor.cnic?.toLowerCase().includes(query)
    );
  });

  const totalBalance = investors.reduce((sum, inv) => sum + inv.balance, 0);
  const totalInvested = investors.reduce(
    (sum, inv) => sum + inv.total_invested,
    0
  );
  const totalWithdrawn = investors.reduce(
    (sum, inv) => sum + inv.total_withdrawn,
    0
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investors</h1>
          <p className="text-muted-foreground">
            Manage investors and their investments
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/investors/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Investor
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              PKR {totalBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Current investment balance
            </p>
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
            <div className="text-2xl font-bold">
              PKR {totalInvested.toLocaleString()}
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
            <div className="text-2xl font-bold">
              PKR {totalWithdrawn.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time withdrawals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investors Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Investors</CardTitle>
              <CardDescription>
                {filteredInvestors.length} investor
                {filteredInvestors.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search investors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-6 text-center text-destructive">
              <p>Error: {error}</p>
            </div>
          ) : filteredInvestors.length === 0 ? (
            <div className="p-12 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium mb-1">No investors found</p>
              <p className="text-xs text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Get started by adding your first investor"}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push("/dashboard/investors/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Investor
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Invested</TableHead>
                  <TableHead className="text-right">Withdrawn</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvestors.map((investor) => (
                  <TableRow key={investor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          className="h-9 w-9"
                          key={`${investor.id}-${investor.avatar_url ?? ""}`}
                        >
                          <AvatarImage
                            src={
                              getInvestorAvatarUrl(investor.avatar_url) ??
                              undefined
                            }
                            alt={investor.name}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(investor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{investor.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{investor.phone}</div>
                        {investor.email && (
                          <div className="text-muted-foreground">
                            {investor.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      PKR {investor.balance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      PKR {investor.total_invested.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      PKR {investor.total_withdrawn.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(`/dashboard/investors/${investor.id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(
                              `/dashboard/investors/${investor.id}/edit`
                            )
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setInvestorToDelete(investor.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              investor and all associated transaction records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => investorToDelete && handleDelete(investorToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
