import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-muted/30">
            <AdminSidebar />
            <AdminHeader />
            <main className="pl-64 pt-16">
                <div className="container mx-auto p-6">{children}</div>
            </main>
        </div>
    );
}
