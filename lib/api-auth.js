import { createServerClient } from '@supabase/ssr';
import { parse, serialize } from 'cookie';

import { supabaseAdmin } from './supabase';
import { env } from './env';

class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}

const appendSetCookie = (res, cookie) => {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookie);
    return;
  }

  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookie]);
  } else {
    res.setHeader('Set-Cookie', [existing, cookie]);
  }
};

export function createApiSupabaseClient(req, res) {
  const parsedCookies = req.headers?.cookie ? parse(req.headers.cookie) : {};

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return req.cookies?.[name] ?? parsedCookies[name];
      },
      set(name, value, options) {
        appendSetCookie(res, serialize(name, value, options));
      },
      remove(name, options) {
        appendSetCookie(
          res,
          serialize(name, '', {
            ...(options ?? {}),
            maxAge: 0,
          })
        );
      },
    },
  });

  return supabase;
}

export async function requireSession(req, res) {
  const supabase = createApiSupabaseClient(req, res);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError(401, 'Authentication required');
  }

  return { supabase, user };
}

export async function requireAdmin(req, res) {
  if (!supabaseAdmin) {
    throw new AuthError(500, 'Supabase admin client not configured');
  }

  const { supabase, user } = await requireSession(req, res);

  const { data: adminRecord, error } = await supabaseAdmin
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new AuthError(500, `Failed to verify admin status: ${error.message}`);
  }

  if (!adminRecord) {
    throw new AuthError(403, 'Admin privileges required');
  }

  return { supabase, user };
}

export { AuthError };
