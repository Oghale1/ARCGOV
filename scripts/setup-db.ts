// ArcGov — arcgov.vercel.app
// Database setup. This script simply runs `supabase/migrations/0001_arcgov_init.sql`
// against your Supabase project so the table/column definitions live in exactly
// ONE place (that .sql file), shared with anyone who pastes it into the
// Supabase SQL Editor by hand.
//
// Usage:  npx ts-node scripts/setup-db.ts
// Requires in .env.local:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   …and a Postgres function `exec_sql(sql_query text)` (see note at the bottom).
// If `exec_sql` is not configured, the script tells you to paste the .sql file
// into the Supabase SQL Editor instead — which always works.

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MIGRATION_PATH = path.join(__dirname, '..', 'supabase', 'migrations', '0001_arcgov_init.sql');

function manualFallback() {
  console.log('\n──────────────────────────────────────────────────────────────');
  console.log('Could not run the migration automatically (no `exec_sql` RPC).');
  console.log('Easiest fix — run it by hand (takes ~15 seconds):');
  console.log('  1. Open Supabase → SQL Editor → New query');
  console.log(`  2. Paste the contents of: ${MIGRATION_PATH}`);
  console.log('  3. Click "Run". Done.');
  console.log('──────────────────────────────────────────────────────────────\n');
}

async function setupDatabase() {
  console.log('🚀 Running ArcGov database migration...');

  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

  // Try to run the whole file in one shot via an exec_sql RPC.
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) throw error;
    console.log('✅ Migration applied successfully.');
    console.log('🏁 Database setup finished!');
    return;
  } catch (err: any) {
    console.error(`Automatic run failed: ${err?.message || err}`);
    manualFallback();
    process.exit(1);
  }
}

setupDatabase();

// ── Optional: enabling the automatic path ───────────────────────────────────
// To let this script run without manual copy-paste, add this helper ONCE in the
// Supabase SQL Editor (service-role only; never expose it to the anon key):
//
//   create or replace function exec_sql(sql_query text)
//   returns void language plpgsql security definer as $$
//   begin execute sql_query; end; $$;
