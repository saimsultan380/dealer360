import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function isAllowedNext(path: string): boolean {
  return path === '/admin' || path === '/dashboard' || path.startsWith('/dashboard/') || path.startsWith('/admin/');
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let redirectPath = nextParam ?? null;
      if (redirectPath && !isAllowedNext(redirectPath)) {
        redirectPath = null;
      }
      if (redirectPath === '/admin') {
        const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');
        if (!isSuperAdmin) redirectPath = '/dashboard';
      }
      if (!redirectPath) {
        const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');
        redirectPath = isSuperAdmin ? '/admin' : '/dashboard';
      }
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
