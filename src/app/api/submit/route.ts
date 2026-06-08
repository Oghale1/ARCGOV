import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ArcGov — server-side form ingest.
// WHY THIS EXISTS: forms used to INSERT into Supabase directly from the browser
// with the public anon key, which made every write subject to Row Level
// Security. A missing/incorrect anon INSERT policy then produced
// "new row violates row-level security policy" and the submission failed.
//
// This route accepts a form submission and writes it using the SERVICE ROLE
// key, which runs server-side only and bypasses RLS. That means:
//   • submissions work regardless of RLS policy state, and
//   • the tables can stay fully private (no public anon access needed),
//     so applicant emails are never readable with the public key.
//
// Requires SUPABASE_SERVICE_ROLE_KEY in the environment (Supabase → Project
// Settings → API → service_role secret). It must NOT be exposed to the client.

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Allowlist of accepted forms → table + the columns we permit. Anything not
// listed here is rejected, and any field not in `fields` is dropped, so the
// route can never be used to write to arbitrary tables/columns.
type FormConfig = { table: string; fields: string[]; upsertOn?: string };

const FORMS: Record<string, FormConfig> = {
  validator_application: {
    table: 'validator_applications',
    fields: ['institution_name', 'country', 'email', 'infrastructure_description', 'quantum_status', 'experience', 'message'],
  },
  staking_waitlist: {
    table: 'staking_waitlist',
    fields: ['email', 'validator_id', 'wallet_address'],
  },
  architect_application: {
    table: 'architect_applications',
    fields: ['name', 'x_handle', 'github_url', 'app_link', 'description'],
  },
  feedback: {
    table: 'feedback',
    fields: ['name', 'email', 'message'],
  },
  quantum_subscriber: {
    table: 'quantum_subscribers',
    fields: ['email'],
  },
  proposal_metadata: {
    table: 'proposal_metadata',
    fields: ['proposal_id', 'custom_start', 'custom_deadline', 'submitter_wallet'],
  },
  notification_preferences: {
    table: 'notification_preferences',
    fields: ['wallet_address', 'email', 'new_proposals', 'vote_deadlines', 'validator_updates', 'quantum_news', 'updated_at'],
    upsertOn: 'wallet_address',
  },
};

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY — set it in your environment / Vercel project.' },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const cfg = FORMS[body?.kind];
  if (!cfg) {
    return NextResponse.json({ error: `Unknown form kind: ${body?.kind}` }, { status: 400 });
  }

  // Keep only allowlisted, defined fields.
  const row: Record<string, any> = {};
  for (const f of cfg.fields) {
    if (body?.payload?.[f] !== undefined && body.payload[f] !== '') row[f] = body.payload[f];
  }

  if (Object.keys(row).length === 0) {
    return NextResponse.json({ error: 'No valid fields in submission' }, { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const query = cfg.upsertOn
    ? admin.from(cfg.table).upsert(row, { onConflict: cfg.upsertOn }).select()
    : admin.from(cfg.table).insert([row]).select();

  const { data, error } = await query;

  if (error) {
    // 42P01 = relation does not exist → the migration hasn't been run yet.
    const hint =
      error.code === '42P01'
        ? ' (table missing — run supabase/migrations/0001_arcgov_init.sql)'
        : '';
    return NextResponse.json({ error: `${error.message}${hint}`, code: error.code }, { status: 400 });
  }

  const id = data?.[0]?.id ?? null;
  const ref = id ? String(id).slice(0, 8) : null;
  return NextResponse.json({ ok: true, id, ref });
}
