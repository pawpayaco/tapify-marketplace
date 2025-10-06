import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceUrl = process.env.SUPABASE_URL || publicUrl;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if ((!publicUrl || !anonKey) && typeof window === 'undefined') {
  console.error('[Supabase] Missing public client credentials - check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Browser client - uses @supabase/ssr to set cookies properly
 * This ensures SSR works correctly by setting cookies that the server can read
 */
export const supabase = typeof window !== 'undefined' && publicUrl && anonKey
  ? createBrowserClient(publicUrl, anonKey, {
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
export const supabaseAdmin = (serviceUrl && serviceRoleKey)
  ? createClient(serviceUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Server-side client using anon key — used strictly as a fallback when service
// role credentials are unavailable (e.g. preview deployments). This still
// respects RLS policies, so only publicly accessible data is returned.
export const supabaseServerAnon = (serviceUrl && anonKey)
  ? createClient(serviceUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

if (typeof window === 'undefined' && !supabaseAdmin) {
  console.error('[Supabase] Admin client not created - check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Create a server-side Supabase client that reads from cookies
 * This is for reading the user's session server-side
 * NOTE: This is deprecated - use @supabase/ssr createServerClient instead
 */
export function createServerSupabaseClient(context) {
  const serverUrl = publicUrl || serviceUrl;

  if (!serverUrl || !anonKey) {
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

  const projectRef = serverUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
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

  return createClient(serverUrl, anonKey, {
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
