'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, Loader2 } from 'lucide-react';
import { markDealAsPaid } from '@/lib/actions/deals';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DealActionsProps {
    dealId: string;
}

export function DealActions({ dealId }: DealActionsProps) {
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);
    const [paymentDate, setPaymentDate] = useState('');
    const [showDateDialog, setShowDateDialog] = useState(false);
    const router = useRouter();

    const handleMarkAsPaid = async () => {
        setIsMarkingPaid(true);
        try {
            const result = await markDealAsPaid(dealId);
            if (result.success) {
                router.push('/dashboard/deals/pending');
                router.refresh();
            }
        } catch (error) {
            console.error('Error marking deal as paid:', error);
        } finally {
            setIsMarkingPaid(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <Button
                onClick={handleMarkAsPaid}
                disabled={isMarkingPaid}
                className="flex-1"
            >
                {isMarkingPaid ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark as Paid
                    </>
                )}
            </Button>

            <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                        <Calendar className="mr-2 h-4 w-4" />
                        Set Payment Date
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Payment Date</DialogTitle>
                        <DialogDescription>
                            Set or update the payment due date for this deal.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-date">Payment Date</Label>
                            <Input
                                id="payment-date"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            // TODO: Implement update payment date
                            setShowDateDialog(false);
                        }}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
