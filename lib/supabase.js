import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Better error logging for missing credentials
if (!url || !anon) {
  console.warn('⚠️ Supabase credentials missing!');
  console.warn('Add these to .env.local:');
  console.warn('  NEXT_PUBLIC_SUPABASE_URL=https://hoaixfylzqnpkojsfnvv.supabase.co');
  console.warn('  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>');
  console.warn('Get your keys from: https://supabase.com/dashboard/project/hoaixfylzqnpkojsfnvv/settings/api');
}

// Client-side Supabase client
export const supabase = (url && anon) ? createClient(url, anon) : null;

/**
 * Create a Supabase client for server-side rendering
 * Uses @supabase/ssr to properly read session cookies
 */
export function createServerSupabaseClient(context) {
  if (!url || !anon) {
    return null;
  }

  return createServerClient(url, anon, {
    cookies: {
      get(name) {
        const cookies = context.req?.headers?.cookie || '';
        const match = cookies.match(new RegExp(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`));
        return match ? decodeURIComponent(match[2]) : null;
      },
      set(name, value, options) {
        // Server-side cookie setting (not needed for getServerSideProps)
      },
      remove(name, options) {
        // Server-side cookie removal (not needed for getServerSideProps)
      },
    },
  });
}
