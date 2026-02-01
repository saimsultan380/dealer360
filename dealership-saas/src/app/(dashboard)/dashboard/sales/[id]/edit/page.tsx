import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSaleById } from '@/lib/actions/sales';
import { EditSaleForm } from '@/components/sales/edit-sale-form';

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data: sale, error } = await getSaleById(id);

    if (error || !sale) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/sales/${id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Edit Sale</h1>
                    <p className="text-muted-foreground">
                        {sale.vehicles?.year} {sale.vehicles?.make} {sale.vehicles?.model}
                        {sale.vehicles?.variant && ` - ${sale.vehicles.variant}`}
                    </p>
                </div>
            </div>

            <EditSaleForm sale={sale} />
        </div>
    );
}
