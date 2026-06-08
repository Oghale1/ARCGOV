-- ArcGov — Supabase schema
-- ============================================================================
-- HOW TO RUN
--   1. Open your Supabase project → SQL Editor → New query
--   2. Paste this entire file and click "Run"
--   3. It is idempotent: safe to run more than once. It creates any missing
--      tables, adds any missing columns, and (re)applies the RLS policies.
--
-- WHY THIS FILE EXISTS
--   The app talks to Supabase from the browser using the ANON key. Every form
--   (validator application, staking waitlist, architect application, feedback,
--   quantum subscribe, proposal metadata, dashboard settings) INSERTs/SELECTs
--   here. The column names below match EXACTLY what the code sends — that was
--   the bug: the old setup script used different names (contact_email vs email,
--   blockchain_experience vs experience, …) so inserts failed even when a table
--   existed. Keep this file and the code in sync.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. validator_applications  ← src/app/validators/page.tsx ("Apply as validator")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS validator_applications (
  id                          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                  timestamptz DEFAULT now(),
  institution_name            text        NOT NULL,
  country                     text        NOT NULL,
  email                       text        NOT NULL,
  infrastructure_description  text,
  quantum_status              text,
  experience                  text,
  message                     text,
  status                      text        DEFAULT 'pending'
);
-- Repair an older table that may have shipped with different column names.
ALTER TABLE validator_applications ADD COLUMN IF NOT EXISTS email                      text;
ALTER TABLE validator_applications ADD COLUMN IF NOT EXISTS experience                 text;
ALTER TABLE validator_applications ADD COLUMN IF NOT EXISTS message                    text;
ALTER TABLE validator_applications ADD COLUMN IF NOT EXISTS infrastructure_description text;
ALTER TABLE validator_applications ADD COLUMN IF NOT EXISTS quantum_status             text;
ALTER TABLE validator_applications ADD COLUMN IF NOT EXISTS status                     text DEFAULT 'pending';

-- ---------------------------------------------------------------------------
-- 2. staking_waitlist  ← validators/[id] + staking page ("Notify me")
--    NOTE: email is intentionally NOT unique — one person can join the general
--    waitlist AND multiple per-validator waitlists. validator_id is null for
--    the general waitlist.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staking_waitlist (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now(),
  email           text        NOT NULL,
  validator_id    integer,
  wallet_address  text
);
ALTER TABLE staking_waitlist ADD COLUMN IF NOT EXISTS validator_id   integer;
ALTER TABLE staking_waitlist ADD COLUMN IF NOT EXISTS wallet_address text;
-- Drop a legacy UNIQUE constraint on email if a previous setup created one
-- (it blocked signing up for more than one validator).
DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'staking_waitlist'::regclass AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE staking_waitlist DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. architect_applications  ← src/app/architects/page.tsx
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS architect_applications (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now(),
  name         text        NOT NULL,
  x_handle     text,
  github_url   text,
  app_link     text,
  description  text        NOT NULL
);
ALTER TABLE architect_applications ADD COLUMN IF NOT EXISTS app_link    text;
ALTER TABLE architect_applications ADD COLUMN IF NOT EXISTS description text;

-- ---------------------------------------------------------------------------
-- 4. feedback  ← src/app/about/page.tsx
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  name        text,
  email       text,
  message     text        NOT NULL
);

-- ---------------------------------------------------------------------------
-- 5. quantum_subscribers  ← src/app/quantum/page.tsx
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quantum_subscribers (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  email       text        NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------------
-- 6. proposal_metadata  ← src/app/governance/* (custom voting windows)
--    Read by the home/governance/calendar pages with the ANON key, so it needs
--    a public SELECT policy (below), not just INSERT.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proposal_metadata (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now(),
  proposal_id      text        NOT NULL,
  custom_start     timestamptz,
  custom_deadline  timestamptz,
  submitter_wallet text
);
ALTER TABLE proposal_metadata ADD COLUMN IF NOT EXISTS custom_start timestamptz;

-- ---------------------------------------------------------------------------
-- 7. notification_preferences  ← src/app/my-dashboard/page.tsx
--    Upserted on wallet_address, so wallet_address must be UNIQUE.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_preferences (
  id                 uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  wallet_address     text        NOT NULL UNIQUE,
  email              text,
  new_proposals      boolean     DEFAULT true,
  vote_deadlines     boolean     DEFAULT true,
  validator_updates  boolean     DEFAULT false,
  quantum_news       boolean     DEFAULT false
);
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ---------------------------------------------------------------------------
-- 8. delegation_interest  ← read by my-dashboard (kept for forward-compat)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delegation_interest (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now(),
  wallet_address  text        NOT NULL,
  validator_id    text,
  email           text
);

-- ============================================================================
-- Row Level Security
--   Public (anon) clients may INSERT into every form table. They may SELECT
--   only the tables the UI actually reads back (proposal_metadata,
--   notification_preferences, delegation_interest). The other submissions are
--   read by admins via the service-role key, which bypasses RLS.
-- ============================================================================
ALTER TABLE validator_applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_waitlist           ENABLE ROW LEVEL SECURITY;
ALTER TABLE architect_applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE quantum_subscribers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_metadata          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegation_interest        ENABLE ROW LEVEL SECURITY;

-- --- INSERT policies (anon) --------------------------------------------------
DROP POLICY IF EXISTS "anon insert validator_applications"   ON validator_applications;
CREATE POLICY "anon insert validator_applications"   ON validator_applications   FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon insert staking_waitlist"         ON staking_waitlist;
CREATE POLICY "anon insert staking_waitlist"         ON staking_waitlist         FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon insert architect_applications"   ON architect_applications;
CREATE POLICY "anon insert architect_applications"   ON architect_applications   FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon insert feedback"                 ON feedback;
CREATE POLICY "anon insert feedback"                 ON feedback                 FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon insert quantum_subscribers"      ON quantum_subscribers;
CREATE POLICY "anon insert quantum_subscribers"      ON quantum_subscribers      FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon insert proposal_metadata"        ON proposal_metadata;
CREATE POLICY "anon insert proposal_metadata"        ON proposal_metadata        FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon insert delegation_interest"      ON delegation_interest;
CREATE POLICY "anon insert delegation_interest"      ON delegation_interest      FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon insert notification_preferences" ON notification_preferences;
CREATE POLICY "anon insert notification_preferences" ON notification_preferences FOR INSERT TO anon WITH CHECK (true);

-- --- UPDATE policy (anon) — needed for the dashboard settings upsert ---------
DROP POLICY IF EXISTS "anon update notification_preferences" ON notification_preferences;
CREATE POLICY "anon update notification_preferences" ON notification_preferences FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- --- SELECT policies (anon) — only for tables the UI reads back --------------
DROP POLICY IF EXISTS "anon read proposal_metadata"          ON proposal_metadata;
CREATE POLICY "anon read proposal_metadata"          ON proposal_metadata        FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon read notification_preferences"   ON notification_preferences;
CREATE POLICY "anon read notification_preferences"   ON notification_preferences FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon read delegation_interest"        ON delegation_interest;
CREATE POLICY "anon read delegation_interest"        ON delegation_interest      FOR SELECT TO anon USING (true);

-- Done. Forms should now submit successfully.
