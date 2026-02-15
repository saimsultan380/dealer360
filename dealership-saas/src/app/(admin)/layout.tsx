import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Server-side guard: only super_admin (platform owner) may access /admin.
  // Organization/dealer admins must never see this panel.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");
  if (!isSuperAdmin) {
    redirect("/dashboard?error=admin_required");
  }

  if (!hasServiceRoleKey) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-amber-500/50 bg-amber-500/5">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Super Admin setup required</CardTitle>
            </div>
            <CardDescription>
              The Super Admin panel needs the Supabase{" "}
              <strong>service role</strong> key to manage organizations,
              analytics, and payments. Add it to your environment and restart
              the dev server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                Open your Supabase project → <strong>Settings</strong> →{" "}
                <strong>API</strong>.
              </li>
              <li>
                Copy the <strong>service_role</strong> key (secret, not the anon
                key).
              </li>
              <li>
                Add to{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">
                  .env.local
                </code>
                :
                <pre className="mt-2 rounded-md bg-muted p-3 font-mono text-xs overflow-x-auto">
                  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
                </pre>
              </li>
              <li>
                Restart the Next.js dev server (
                <code className="rounded bg-muted px-1.5 py-0.5">
                  npm run dev
                </code>
                ).
              </li>
            </ol>
            <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <KeyRound className="h-4 w-4 shrink-0" />
              Never expose the service role key in client code or commit it to
              git.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar />
      <AdminHeader />
      <main className="pt-16 md:pl-64">
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
