import { Suspense } from 'react';
import DashboardClient from './dashboard-client';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-20" />}>
      <DashboardClient />
    </Suspense>
  );
}
