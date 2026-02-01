'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Building2, AlertCircle, Loader2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pagination } from '@/components/ui/pagination-advanced';
import { getFinancingLoans } from '@/lib/actions/financing-loans';
import type { FinancingLoan } from '@/lib/types/database';

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-700 dark:text-green-400',
  completed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  defaulted: 'bg-red-500/10 text-red-700 dark:text-red-400',
  cancelled: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

const typeColors: Record<string, string> = {
  finance: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  lease: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

export default function FinancingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loans, setLoans] = useState<FinancingLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      try {
        const result = await getFinancingLoans();
        if (result.error) {
          setError(result.error);
        } else {
          setLoans(result.data || []);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching loans:', err);
        setError(null);
      }
      setLoading(false);
    };

    fetchLoans();
  }, []);

  const filteredLoans = loans.filter(
    (loan) =>
      loan.bank_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const displayedLoans = filteredLoans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Financing & Loans</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage vehicle financing agreements and payment schedules
          </p>
        </div>
        <Link href="/dashboard/financing/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2">
            <Plus className="h-4 w-4" />
            New Financing
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && error !== 'Unauthorized' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <>
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by bank or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Loans Grid or Empty State */}
          {filteredLoans.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/25 p-12 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No financing agreements yet</h3>
              <p className="text-muted-foreground text-sm mt-1 mb-6">
                Create your first financing agreement to get started
              </p>
              <Link href="/dashboard/financing/new">
                <Button variant="default">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Financing
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayedLoans.map((loan) => (
                <Link key={loan.id} href={`/dashboard/financing/${loan.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base">
                            {loan.bank_name || 'Personal Financing'}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Ref: {loan.bank_reference_number || 'N/A'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Status Badges */}
                      <div className="flex gap-2">
                        <Badge className={statusColors[loan.status]}>
                          {loan.status}
                        </Badge>
                        <Badge className={typeColors[loan.financing_type]}>
                          {loan.financing_type}
                        </Badge>
                      </div>

                      {/* Loan Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Principal:</span>
                          <span className="font-medium">
                            PKR {Number(loan.principal_amount).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">EMI Amount:</span>
                          <span className="font-medium text-green-600">
                            PKR {Number(loan.emi_amount).toLocaleString()}/mo
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-muted-foreground">Interest:</span>
                          <span className="font-medium">{loan.annual_interest_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tenure:</span>
                          <span className="font-medium">{loan.loan_tenure_months} months</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button variant="outline" className="w-full" size="sm">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredLoans.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(items) => {
                  setItemsPerPage(items);
                  setCurrentPage(1); // Reset to first page
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
