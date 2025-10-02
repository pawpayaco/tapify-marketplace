import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!url || !anonKey) {
  if (typeof window === 'undefined') {
    console.error('[Supabase] Missing credentials - check .env.local');
  }
}

/**
 * Browser client - uses @supabase/ssr to set cookies properly
 * This ensures SSR works correctly by setting cookies that the server can read
 */
export const supabase = typeof window !== 'undefined' && url && anonKey
  ? createBrowserClient(url, anonKey, {
      cookies: {
        get(name) {
          const value = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1];
          return value;
        },
        set(name, value, options) {
          let cookie = `${name}=${value}`;
          if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
          if (options?.path) cookie += `; path=${options.path}`;
          if (options?.domain) cookie += `; domain=${options.domain}`;
          if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
          if (options?.secure) cookie += '; secure';
          document.cookie = cookie;
        },
        remove(name, options) {
          document.cookie = `${name}=; path=${options?.path || '/'}; max-age=0`;
        },
      },
    })
  : null;

/**
 * Admin client - uses service role key, bypasses RLS
 * ONLY use this server-side in getServerSideProps or API routes
 * NEVER use in browser code
 */
export const supabaseAdmin = (url && serviceRoleKey)
  ? createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

if (typeof window === 'undefined' && !supabaseAdmin) {
  console.error('[Supabase] Admin client not created - check SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Create a server-side Supabase client that reads from cookies
 * This is for reading the user's session server-side
 * NOTE: This is deprecated - use @supabase/ssr createServerClient instead
 */
export function createServerSupabaseClient(context) {
  if (!url || !anonKey) {
    console.error('[Supabase] Missing credentials');
    return null;
  }

  const cookieString = context.req.headers.cookie || '';
  const cookies = {};
  
  cookieString.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });

  const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const authCookieName = `sb-${projectRef}-auth-token`;
  
  let accessToken = null;
  if (cookies[authCookieName]) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookies[authCookieName]));
      accessToken = parsed?.access_token;
    } catch (e) {
      console.error('[Supabase] Failed to parse auth cookie:', e.message);
    }
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`,
      } : {},
    },
  });
}
