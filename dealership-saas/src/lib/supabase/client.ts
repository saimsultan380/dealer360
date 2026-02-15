import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

declare global {
    var __supabase_browser_client__: BrowserSupabaseClient | undefined;
}

export function createClient() {
    if (!globalThis.__supabase_browser_client__) {
        globalThis.__supabase_browser_client__ = createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    return globalThis.__supabase_browser_client__;
}
