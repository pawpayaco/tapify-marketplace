import { supabaseAdmin } from '../lib/supabase';

/**
 * Auto-fills missing NOT NULL columns with safe defaults before insert.
 * Uses direct SQL to query pg_catalog instead of the REST API.
 */
export async function fillMissingDefaults(tableName, record) {
  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT column_name, is_nullable, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
      `,
    });

    // If your Supabase doesn’t support exec_sql RPC yet, fall back
    if (error || !data) {
      console.warn('[fillDefaults] Could not fetch schema info via RPC', error);
      return record;
    }

    const filled = { ...record };

    for (const col of data) {
      if (col.is_nullable === 'NO' && filled[col.column_name] == null) {
        switch (col.data_type) {
          case 'text':
          case 'character varying':
            filled[col.column_name] = '';
            break;
          case 'numeric':
          case 'double precision':
          case 'integer':
            filled[col.column_name] = 0;
            break;
          case 'boolean':
            filled[col.column_name] = false;
            break;
          case 'timestamp with time zone':
          case 'timestamp without time zone':
            filled[col.column_name] = new Date().toISOString();
            break;
          default:
            filled[col.column_name] = col.column_default ?? null;
        }
        console.log(`⚙️ [fillDefaults] Auto-filled missing "${col.column_name}"`);
      }
    }

    return filled;
  } catch (err) {
    console.error('[fillDefaults] Unexpected error', err);
    return record;
  }
}
