import { z } from 'zod';

const envSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url({ message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL' }),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
    SUPABASE_URL: z.string().url({ message: 'SUPABASE_URL must be a valid URL' }),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
    PLAID_CLIENT_ID: z.string().min(1, 'PLAID_CLIENT_ID is required'),
    PLAID_SECRET: z.string().min(1, 'PLAID_SECRET is required'),
    PLAID_ENV: z
      .enum(['sandbox', 'development', 'production'], {
        errorMap: () => ({ message: 'PLAID_ENV must be sandbox, development, or production' }),
      })
      .default('sandbox'),
    DWOLLA_ENV: z.string().url({ message: 'DWOLLA_ENV must be a valid URL' }),
    DWOLLA_KEY: z.string().min(1, 'DWOLLA_KEY is required'),
    DWOLLA_SECRET: z.string().min(1, 'DWOLLA_SECRET is required'),
    DWOLLA_MASTER_FUNDING_SOURCE: z
      .string()
      .min(1, 'DWOLLA_MASTER_FUNDING_SOURCE is required'),
    SHOPIFY_WEBHOOK_SECRET: z.string().min(1, 'SHOPIFY_WEBHOOK_SECRET is required'),
    SUPABASE_WEBHOOK_SECRET: z.string().min(1, 'SUPABASE_WEBHOOK_SECRET is required'),
    NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SHOPIFY_DOMAIN: z.string().optional(),
  })
  .passthrough();

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error
    .flatten() // group by field
    .fieldErrors;

  const missing = Object.entries(formatted)
    .map(([key, messages]) => `${key}: ${messages?.join(', ') ?? 'invalid'}`)
    .join('\n');

  console.error('[env] ========================================');
  console.error('[env] ENVIRONMENT VALIDATION FAILED');
  console.error('[env] ========================================');
  console.error('[env] Missing or invalid environment variables:');
  console.error(missing);
  console.error('[env] ========================================');
  console.error('[env] Current process.env keys:', Object.keys(process.env).sort().join(', '));
  console.error('[env] ========================================');
  throw new Error('Invalid environment configuration. Check server logs for details.');
}

export const env = parsed.data;
