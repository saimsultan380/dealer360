'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertTriangle, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { EMIPayment } from '@/lib/types/database';
import { recordEMIPayment } from '@/lib/actions/financing-loans';

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: <Clock className="h-4 w-4" />,
  },
  completed: {
    bg: 'bg-green-50 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-300',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  late: {
    bg: 'bg-orange-50 dark:bg-orange-950',
    text: 'text-orange-700 dark:text-orange-300',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  overdue: {
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-700 dark:text-red-300',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  waived: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-300',
    icon: <CheckCircle className="h-4 w-4" />,
  },
};

interface EMIPaymentScheduleProps {
  payments: EMIPayment[];
  loanAmount: number;
  onPaymentRecorded?: () => void;
}

interface PaymentFormData {
  paidAmount: number;
  paymentMethod: string;
  transactionRef: string;
}

export function EMIPaymentSchedule({ payments, loanAmount, onPaymentRecorded }: EMIPaymentScheduleProps) {
  const [selectedPayment, setSelectedPayment] = useState<EMIPayment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PaymentFormData>({
    paidAmount: 0,
    paymentMethod: 'bank_transfer',
    transactionRef: '',
  });

  const completedPayments = payments.filter((p) => p.status === 'completed').length;
  const totalPaid = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.paid_amount || 0), 0);
  const remainingBalance = loanAmount - totalPaid;

  const handleRecordPayment = async () => {
    if (!selectedPayment) return;

    setLoading(true);
    setError(null);

    try {
      const result = await recordEMIPayment(
        selectedPayment.id,
        formData.paidAmount,
        formData.paymentMethod,
        formData.transactionRef
      );

      if (result.error) {
        setError(result.error);
      } else {
        setIsDialogOpen(false);
        setSelectedPayment(null);
        setFormData({ paidAmount: 0, paymentMethod: 'bank_transfer', transactionRef: '' });
        onPaymentRecorded?.();
      }
    } catch (err) {
      setError('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <p className="text-3xl font-bold">{payments.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold text-green-600">{completedPayments}</p>
              <p className="text-xs text-muted-foreground mt-1">PKR {totalPaid.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-3xl font-bold text-orange-600">
                {(payments.length - completedPayments)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PKR {remainingBalance.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
          <CardDescription>All monthly payments and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payments scheduled</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-2 font-medium">No.</th>
                      <th className="text-left px-4 py-2 font-medium">Due Date</th>
                      <th className="text-right px-4 py-2 font-medium">Amount</th>
                      <th className="text-right px-4 py-2 font-medium">Paid</th>
                      <th className="text-left px-4 py-2 font-medium">Status</th>
                      <th className="text-center px-4 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => {
                      const statusInfo = statusColors[payment.status] || statusColors.pending;
                      const daysLate = payment.days_late || 0;

                      return (
                        <tr key={payment.id} className={`border-b ${statusInfo.bg}`}>
                          <td className="px-4 py-3">{payment.payment_number}</td>
                          <td className="px-4 py-3">
                            {new Date(payment.due_date).toLocaleDateString('en-PK', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            PKR {payment.emi_amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {payment.paid_amount > 0
                              ? `PKR ${payment.paid_amount.toLocaleString()}`
                              : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {statusInfo.icon}
                              <Badge variant="outline" className={statusInfo.text}>
                                {payment.status}
                                {daysLate > 0 && ` (${daysLate}d)`}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {payment.status === 'pending' && (
                              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedPayment(payment);
                                      setFormData({
                                        ...formData,
                                        paidAmount: payment.emi_amount,
                                      });
                                    }}
                                  >
                                    Record
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Record Payment</DialogTitle>
                                    <DialogDescription>
                                      Payment #{selectedPayment?.payment_number} - Due{' '}
                                      {selectedPayment && new Date(selectedPayment.due_date).toLocaleDateString()}
                                    </DialogDescription>
                                  </DialogHeader>

                                  {error && (
                                    <Alert variant="destructive">
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                  )}

                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>EMI Amount (PKR)</Label>
                                      <Input
                                        type="number"
                                        value={selectedPayment?.emi_amount || 0}
                                        disabled
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="paid_amount">Paid Amount (PKR) *</Label>
                                      <Input
                                        id="paid_amount"
                                        type="number"
                                        value={formData.paidAmount}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            paidAmount: parseFloat(e.target.value) || 0,
                                          })
                                        }
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="payment_method">Payment Method *</Label>
                                      <Select
                                        value={formData.paymentMethod}
                                        onValueChange={(value) =>
                                          setFormData({ ...formData, paymentMethod: value })
                                        }
                                      >
                                        <SelectTrigger id="payment_method">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="cash">Cash</SelectItem>
                                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                          <SelectItem value="cheque">Cheque</SelectItem>
                                          <SelectItem value="easypaisa">Easypaisa</SelectItem>
                                          <SelectItem value="jazzcash">JazzCash</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="transaction_ref">Transaction Reference</Label>
                                      <Input
                                        id="transaction_ref"
                                        placeholder="TRF/CHQ/REF number"
                                        value={formData.transactionRef}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            transactionRef: e.target.value,
                                          })
                                        }
                                      />
                                    </div>

                                    <Button
                                      onClick={handleRecordPayment}
                                      disabled={loading || !formData.paidAmount}
                                      className="w-full gap-2"
                                    >
                                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                      {loading ? 'Recording...' : 'Record Payment'}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
