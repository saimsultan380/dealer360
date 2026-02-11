"use client";

import { useEffect, useRef, useState } from "react";
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
  ShoppingCart,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  X,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import {
  getClients,
  ClientWithStats,
  deleteClient,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { getClientAvatarUrl } from "@/lib/utils/avatar-url";
import { useAuthStore } from "@/lib/store";
import { subscribeToClientTransactions } from "@/lib/supabase/realtime";

// Circular Progress Ring Component
function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 8,
  color = "#f59e0b",
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

// Sparkline Component
function Sparkline({
  data,
  color = "#10b981",
}: {
  data: { month: string; value: number }[];
  color?: string;
}) {
  return (
    <div className="h-12 w-full opacity-70">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id={`sparkline-${color}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#sparkline-${color})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Health Score Bar Component
function HealthScoreBar({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return "#10b981"; // Emerald
    if (score >= 60) return "#3b82f6"; // Blue
    if (score >= 40) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  const color = getColor(score);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const { organization } = useAuthStore();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(false);
  const refreshTimer = useRef<any>(null);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    const result = await getClients();
    if (result.error) {
      setError(result.error);
    } else {
      setClients(result.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Realtime sync: refresh when client_transactions change
  useEffect(() => {
    if (!organization?.id) return;

    const scheduleRefresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        fetchClients();
      }, 500);
    };

    const callbacks = {
      onInsert: scheduleRefresh,
      onUpdate: scheduleRefresh,
      onDelete: scheduleRefresh,
    } as any;

    const unsubscribe = subscribeToClientTransactions(
      callbacks,
      organization.id
    );

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      unsubscribe?.();
    };
  }, [organization?.id]);

  const handleDelete = async (id: string) => {
    const result = await deleteClient(id);
    if (result.error) {
      alert(result.error);
    } else {
      fetchClients();
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateHealthScore = (client: ClientWithStats): number => {
    // Simple health score calculation based on payment history
    let score = 50; // Base score

    if (client.total_dues === 0) score += 30;
    else if (client.total_dues < client.total_spent * 0.1) score += 20;
    else if (client.total_dues < client.total_spent * 0.2) score += 10;

    if (client.total_purchases >= 5) score += 20;
    else if (client.total_purchases >= 2) score += 10;

    if (client.status === "active") score += 10;
    else if (client.status === "inactive") score -= 20;
    else if (client.status === "blacklisted") score = 0;

    return Math.min(100, Math.max(0, score));
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  let filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      client.name.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.cnic?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (activeFilters.includes("has_dues") && client.total_dues === 0)
      return false;
    if (activeFilters.includes("high_spender") && client.total_spent < 1000000)
      return false;
    if (activeFilters.includes("new_this_month")) {
      const createdDate = new Date(client.created_at);
      const now = new Date();
      const isThisMonth =
        createdDate.getMonth() === now.getMonth() &&
        createdDate.getFullYear() === now.getFullYear();
      if (!isThisMonth) return false;
    }

    return true;
  });

  const totalClients = clients.length;
  const totalDues = clients.reduce((sum, client) => sum + client.total_dues, 0);
  const totalSpent = clients.reduce(
    (sum, client) => sum + client.total_spent,
    0
  );
  const debtPercentage = totalSpent > 0 ? (totalDues / totalSpent) * 100 : 0;

  // Mock data for charts
  const monthlySpending = [
    { month: "Jan", value: 1200000 },
    { month: "Feb", value: 1500000 },
    { month: "Mar", value: 1800000 },
    { month: "Apr", value: 2000000 },
    { month: "May", value: 2200000 },
    { month: "Jun", value: totalSpent / 6 },
  ];

  const clientDistribution = [
    { name: "Luxury", value: 35, color: "#8b5cf6" },
    { name: "Economy", value: 45, color: "#3b82f6" },
    { name: "Mid-Range", value: 20, color: "#10b981" },
  ];

  const topClients = clients
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 5)
    .map((client) => ({
      name: client.name.split(" ")[0],
      value: client.total_spent,
    }));

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
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Clients
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage clients and their purchase history
          </p>
        </div>
        <div className="flex">
          <Button
            onClick={() => router.push("/dashboard/clients/new")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-auto self-start sm:self-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Clients Card */}
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2 font-figures tabular-nums">
              {totalClients}
            </div>
            <p className="text-xs text-muted-foreground">Active clients</p>
          </CardContent>
        </Card>

        {/* Total Dues Card with Circular Progress */}
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dues</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1 font-figures tabular-nums">
                  PKR {totalDues.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Outstanding payments
                </p>
              </div>
              <CircularProgress
                percentage={Math.min(100, debtPercentage)}
                size={70}
                strokeWidth={6}
                color="#f59e0b"
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Spent Card with Sparkline */}
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2 font-figures tabular-nums">
              PKR {totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              All-time purchases
            </p>
            <Sparkline data={monthlySpending} color="#10b981" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Toggle Button */}
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          onClick={() => setShowCharts(!showCharts)}
          className="gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          {showCharts ? "Hide Charts" : "Show Charts"}
          {showCharts ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Segmented Visuals Section - Hidden by default */}
      {showCharts && (
        <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Client Distribution by Vehicle Type */}
          <Card className="relative overflow-hidden transition-all duration-300 border-border/50 bg-gradient-to-br from-background via-background/80 to-muted/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Client Distribution
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Breakdown by vehicle type preference
                  </CardDescription>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={clientDistribution}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id="luxuryGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.3}
                        />
                      </linearGradient>
                      <linearGradient
                        id="economyGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#3b82f6"
                          stopOpacity={0.3}
                        />
                      </linearGradient>
                      <linearGradient
                        id="midGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#10b981"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted/30"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="currentColor"
                      fontSize={11}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "currentColor" }}
                    />
                    <YAxis
                      stroke="currentColor"
                      fontSize={11}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fill: "currentColor" }}
                      domain={[0, 60]}
                      ticks={[0, 20, 40, 60]}
                    />
                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        color: "hsl(var(--foreground))",
                      }}
                      labelStyle={{
                        color: "hsl(var(--foreground))",
                        fontWeight: 600,
                      }}
                      wrapperStyle={{
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value: number) => [`${value}%`, "Share"]}
                    />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                      activeBar={false}
                      barSize={36}
                    >
                      {clientDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.name === "Luxury"
                              ? "url(#luxuryGradient)"
                              : entry.name === "Economy"
                                ? "url(#economyGradient)"
                                : "url(#midGradient)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50">
                {clientDistribution.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {entry.name}
                    </span>
                    <span className="text-xs font-semibold">
                      {entry.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top 5 High-Value Clients */}
          <Card className="relative overflow-hidden transition-all duration-300 border-border/50 bg-gradient-to-br from-background via-background/80 to-muted/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Top 5 High-Value Clients
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Highest spending clients
                  </CardDescription>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topClients}
                    layout="vertical"
                    margin={{ top: 10, right: 32, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id="topClientsGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor="#22c55e"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="#22c55e"
                          stopOpacity={0.9}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted/30"
                    />
                    <XAxis
                      type="number"
                      stroke="currentColor"
                      fontSize={11}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        `${(value / 1000000).toFixed(1)}M`
                      }
                      tick={{ fill: "currentColor" }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="currentColor"
                      fontSize={11}
                      className="text-muted-foreground"
                      width={80}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "currentColor" }}
                    />
                    <Tooltip
                      cursor={false}
                      formatter={(value: number) => [
                        `PKR ${value.toLocaleString()}`,
                        "Total Spent",
                      ]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        color: "hsl(var(--foreground))",
                      }}
                      labelStyle={{
                        color: "hsl(var(--foreground))",
                        fontWeight: 600,
                      }}
                      wrapperStyle={{
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#topClientsGradient)"
                      radius={[0, 8, 8, 0]}
                      activeBar={false}
                      barSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {topClients.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No client spending data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Glassmorphism Search & Filter Bar */}
      <Card
        className={cn(
          "backdrop-blur-sm bg-card/50 border border-border/50",
          "shadow-lg"
        )}
      >
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name, email, phone, or CNIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 backdrop-blur-sm border-border/50"
              />
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "has_dues", label: "Has Dues", icon: AlertCircle },
                { id: "high_spender", label: "High Spender", icon: DollarSign },
                {
                  id: "new_this_month",
                  label: "New This Month",
                  icon: TrendingUp,
                },
              ].map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilters.includes(filter.id);
                return (
                  <button
                    key={filter.id}
                    onClick={() => toggleFilter(filter.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      "border",
                      isActive
                        ? "bg-primary/10 border-primary/50 text-primary"
                        : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {filter.label}
                    {isActive && <X className="h-3 w-3 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Clients Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">All Clients</CardTitle>
              <CardDescription>
                {filteredClients.length} client
                {filteredClients.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-6 text-center text-destructive">
              <p>Error: {error}</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-12 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium mb-1">No clients found</p>
              <p className="text-xs text-muted-foreground mb-4">
                {searchQuery || activeFilters.length > 0
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first client"}
              </p>
              {!searchQuery && activeFilters.length === 0 && (
                <Button onClick={() => router.push("/dashboard/clients/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="text-right">Remaining Dues</TableHead>
                    <TableHead className="text-right">Deals</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const healthScore = calculateHealthScore(client);

                    return (
                      <TableRow
                        key={client.id}
                        className="group transition-colors hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              className="h-9 w-9"
                              key={`${client.id}-${client.avatar_url ?? ""}`}
                            >
                              <AvatarImage
                                src={
                                  getClientAvatarUrl(client.avatar_url) ??
                                  undefined
                                }
                                alt={client.name}
                              />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(client.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {client.name}
                              </div>
                              {client.email && (
                                <div className="text-xs text-muted-foreground">
                                  {client.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{client.phone}</div>
                            {client.cnic && (
                              <div className="text-xs text-muted-foreground">
                                CNIC: {client.cnic}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <HealthScoreBar score={healthScore} />
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          PKR {client.total_spent.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {client.total_dues > 0 ? (
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              PKR {client.total_dues.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1 text-xs">
                            <div className="inline-flex items-center gap-1">
                              <ShoppingCart className="h-3 w-3 text-emerald-500" />
                              <span className="font-semibold text-emerald-500">
                                {client.total_purchases}
                              </span>
                              <span className="text-muted-foreground">
                                purchases
                              </span>
                            </div>
                            <div className="inline-flex items-center gap-1">
                              <ShoppingCart className="h-3 w-3 text-sky-500" />
                              <span className="font-semibold text-sky-500">
                                {client.total_sales}
                              </span>
                              <span className="text-muted-foreground">
                                sales
                              </span>
                            </div>
                            <div className="inline-flex items-center gap-1">
                              <ShoppingCart className="h-3 w-3 text-purple-500" />
                              <span className="font-semibold text-purple-500">
                                {client.total_deals}
                              </span>
                              <span className="text-muted-foreground">
                                all deals
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/clients/${client.id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/clients/${client.id}/edit`
                                  )
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => {
                                  setClientToDelete(client.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
              client and all associated transaction records.
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
              onClick={() => clientToDelete && handleDelete(clientToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
