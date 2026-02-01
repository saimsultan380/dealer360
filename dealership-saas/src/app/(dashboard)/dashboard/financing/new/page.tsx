'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FinancingForm } from '@/components/financing/financing-form';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function NewFinancingPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Financing Agreement</h1>
          <p className="text-muted-foreground">
            Set up a new vehicle financing or lease agreement
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="rounded-xl border-2 shadow p-6">
        <FinancingForm vehicles={[]} customers={[]} />
      </Card>
    </div>
  );
}
