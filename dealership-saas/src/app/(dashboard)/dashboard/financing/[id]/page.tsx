'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EMIPaymentSchedule } from '@/components/financing/emi-payment-schedule';
import { getFinancingLoanById, getEMIPayments } from '@/lib/actions/financing-loans';
import type { FinancingLoan, EMIPayment } from '@/lib/types/database';

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

export default function FinancingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const loanId = params.id as string;

  const [loan, setLoan] = useState<FinancingLoan | null>(null);
  const [payments, setPayments] = useState<EMIPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loanResult, paymentsResult] = await Promise.all([
        getFinancingLoanById(loanId),
        getEMIPayments(loanId),
      ]);

      if (loanResult.error) {
        setError(loanResult.error);
      } else {
        setLoan(loanResult.data);
      }

      if (!paymentsResult.error && paymentsResult.data) {
        setPayments(paymentsResult.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load financing details');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [loanId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Financing agreement not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const loanAmount = loan.principal_amount - (loan.down_payment || 0);
  const totalInterest = (loan.emi_amount * loan.loan_tenure_months) - loanAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{loan.bank_name || 'Financing Agreement'}</h1>
            <p className="text-muted-foreground">
              {loan.financing_type === 'finance' ? 'Vehicle Finance' : 'Vehicle Lease'} Agreement
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <Edit2 className="h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2">
        <Badge className={statusColors[loan.status]}>{loan.status}</Badge>
        <Badge className={typeColors[loan.financing_type]}>{loan.financing_type}</Badge>
      </div>

      {/* Loan Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Principal Amount</p>
              <p className="text-2xl font-bold">PKR {Number(loan.principal_amount).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Loan Amount</p>
              <p className="text-2xl font-bold">PKR {loanAmount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                After PKR {Number(loan.down_payment || 0).toLocaleString()} down payment
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Monthly EMI</p>
              <p className="text-2xl font-bold text-green-600">PKR {Number(loan.emi_amount).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{loan.loan_tenure_months} months</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Interest</p>
              <p className="text-2xl font-bold">PKR {totalInterest.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{loan.annual_interest_rate}% p.a.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Details */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Loan Period</p>
              <p className="font-medium">
                {new Date(loan.loan_start_date).toLocaleDateString('en-PK')} -{' '}
                {new Date(loan.loan_end_date).toLocaleDateString('en-PK')}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Interest Rate</p>
              <p className="font-medium">{loan.annual_interest_rate}% per annum</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Tenure</p>
              <p className="font-medium">{loan.loan_tenure_months} months</p>
            </div>
          </div>

          <div className="space-y-4">
            {loan.bank_name && (
              <div>
                <p className="text-sm text-muted-foreground">Bank/Lender</p>
                <p className="font-medium">{loan.bank_name}</p>
              </div>
            )}

            {loan.bank_reference_number && (
              <div>
                <p className="text-sm text-muted-foreground">Reference Number</p>
                <p className="font-medium">{loan.bank_reference_number}</p>
              </div>
            )}

            {loan.contact_person && (
              <div>
                <p className="text-sm text-muted-foreground">Contact Person</p>
                <p className="font-medium">
                  {loan.contact_person}
                  {loan.contact_number && ` - ${loan.contact_number}`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      {loan.terms_and_conditions && (
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{loan.terms_and_conditions}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment Schedule */}
      <EMIPaymentSchedule payments={payments} loanAmount={loanAmount} onPaymentRecorded={fetchData} />

      {/* Notes */}
      {loan.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{loan.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
