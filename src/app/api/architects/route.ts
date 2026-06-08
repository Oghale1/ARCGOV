import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ArcGov — public list of submitted Architect projects.
// Reads architect_applications with the service role (server-side) and returns
// only the fields meant to be shown publicly on the Architects page. This is
// why submitted projects now appear in the "Featured Arc Builders" list — the
// page used to render only the static src/data/architects.json and never read
// the submissions table.
//
// Note: there is no moderation step — every submission is shown. If you want to
// approve entries first, add a `status` column to architect_applications and
// filter on it here (e.g. .eq('status', 'approved')).

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    // Don't error the page — just return an empty list.
    return NextResponse.json({ projects: [] });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin
    .from('architect_applications')
    .select('id, name, x_handle, app_link, description, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ projects: [], error: error.message }, { status: 200 });
  }

  return NextResponse.json({ projects: data ?? [] });
}
