import { createClient } from '@supabase/supabase-js';

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

export const supabase = (url && anon) ? createClient(url, anon) : null;
