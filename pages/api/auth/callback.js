import { createServerClient } from '@supabase/ssr';

/**
 * OAuth Callback Handler
 *
 * This endpoint handles the OAuth redirect after a user authenticates with Google.
 * Supabase redirects here with a code that we exchange for a session.
 *
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Redirected to Google consent screen
 * 3. Google redirects back to this endpoint with a code
 * 4. We exchange the code for a session
 * 5. Redirect user to their destination (dashboard)
 */
export default async function handler(req, res) {
  const { code } = req.query;

  console.log('🔐 [OAuth Callback] Received callback:', {
    hasCode: !!code,
    query: req.query,
  });

  if (!code) {
    console.error('❌ [OAuth Callback] No code provided');
    return res.redirect('/login?error=no_code');
  }

  try {
    // Parse existing cookies
    const cookieHeader = req.headers.cookie || '';
    const parsedCookies = {};
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.trim().split('=');
      if (name) {
        parsedCookies[name] = rest.join('=');
      }
    });

    // Create Supabase client with cookie handlers
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return parsedCookies[name];
          },
          set(name, value, options) {
            res.setHeader('Set-Cookie', serializeCookie(name, value, options));
          },
          remove(name, options) {
            res.setHeader('Set-Cookie', serializeCookie(name, '', { ...options, maxAge: 0 }));
          },
        },
      }
    );

    console.log('📡 [OAuth Callback] Exchanging code for session...');

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('❌ [OAuth Callback] Error exchanging code:', error);
      return res.redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    console.log('✅ [OAuth Callback] Session established:', {
      userId: data.session?.user?.id,
      email: data.session?.user?.email,
    });

    // Get the redirect destination from query params or default to dashboard
    const redirectTo = req.query.redirect || '/onboard/dashboard';

    console.log('🔀 [OAuth Callback] Redirecting to:', redirectTo);

    return res.redirect(redirectTo);
  } catch (err) {
    console.error('❌ [OAuth Callback] Exception:', err);
    return res.redirect('/login?error=callback_failed');
  }
}

/**
 * Serialize a cookie with proper formatting
 */
function serializeCookie(name, value, options = {}) {
  let cookie = `${name}=${value}`;

  if (options.maxAge) {
    cookie += `; Max-Age=${options.maxAge}`;
  }

  if (options.path) {
    cookie += `; Path=${options.path}`;
  } else {
    cookie += '; Path=/';
  }

  if (options.domain) {
    cookie += `; Domain=${options.domain}`;
  }

  if (options.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  } else {
    cookie += '; SameSite=Lax';
  }

  if (options.secure) {
    cookie += '; Secure';
  }

  if (options.httpOnly) {
    cookie += '; HttpOnly';
  }

  return cookie;
}
