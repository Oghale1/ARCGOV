// ArcGov — arcgov.vercel.app
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Starting Database Setup...');

  const queries = [
    // Create Tables
    `CREATE TABLE IF NOT EXISTS validator_applications (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at timestamptz DEFAULT now(),
      institution_name text NOT NULL,
      country text NOT NULL,
      contact_email text NOT NULL UNIQUE,
      infrastructure_description text,
      quantum_status text,
      blockchain_experience text,
      message_to_arc text,
      status text DEFAULT 'pending'
    );`,
    `CREATE TABLE IF NOT EXISTS delegation_interest (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at timestamptz DEFAULT now(),
      wallet_address text NOT NULL,
      validator_id text NOT NULL,
      email text
    );`,
    `CREATE TABLE IF NOT EXISTS staking_waitlist (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at timestamptz DEFAULT now(),
      wallet_address text,
      email text NOT NULL UNIQUE
    );`,
    `CREATE TABLE IF NOT EXISTS architect_applications (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at timestamptz DEFAULT now(),
      name text NOT NULL,
      x_handle text,
      github_url text,
      building_description text NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS feedback (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at timestamptz DEFAULT now(),
      name text,
      email text,
      message text NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS notification_preferences (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at timestamptz DEFAULT now(),
      wallet_address text NOT NULL UNIQUE,
      email text,
      new_proposals boolean DEFAULT true,
      vote_deadlines boolean DEFAULT true,
      validator_updates boolean DEFAULT false,
      quantum_news boolean DEFAULT false
    );`,
    `CREATE TABLE IF NOT EXISTS quantum_subscribers (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at timestamptz DEFAULT now(),
      email text NOT NULL UNIQUE
    );`,

    // Enable RLS
    `ALTER TABLE validator_applications ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE delegation_interest ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE staking_waitlist ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE architect_applications ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE quantum_subscribers ENABLE ROW LEVEL SECURITY;`,

    // Policies - Anyone can insert
    `DROP POLICY IF EXISTS "Anyone can insert validator_applications" ON validator_applications;`,
    `CREATE POLICY "Anyone can insert validator_applications" ON validator_applications FOR INSERT TO anon WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Anyone can insert delegation_interest" ON delegation_interest;`,
    `CREATE POLICY "Anyone can insert delegation_interest" ON delegation_interest FOR INSERT TO anon WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Anyone can insert staking_waitlist" ON staking_waitlist;`,
    `CREATE POLICY "Anyone can insert staking_waitlist" ON staking_waitlist FOR INSERT TO anon WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Anyone can insert architect_applications" ON architect_applications;`,
    `CREATE POLICY "Anyone can insert architect_applications" ON architect_applications FOR INSERT TO anon WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Anyone can insert feedback" ON feedback;`,
    `CREATE POLICY "Anyone can insert feedback" ON feedback FOR INSERT TO anon WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Anyone can insert notification_preferences" ON notification_preferences;`,
    `CREATE POLICY "Anyone can insert notification_preferences" ON notification_preferences FOR INSERT TO anon WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Anyone can insert quantum_subscribers" ON quantum_subscribers;`,
    `CREATE POLICY "Anyone can insert quantum_subscribers" ON quantum_subscribers FOR INSERT TO anon WITH CHECK (true);`,

    // Policies - Auth users can read
    `DROP POLICY IF EXISTS "Auth users can read validator_applications" ON validator_applications;`,
    `CREATE POLICY "Auth users can read validator_applications" ON validator_applications FOR SELECT TO authenticated USING (true);`,
    
    `DROP POLICY IF EXISTS "Auth users can read delegation_interest" ON delegation_interest;`,
    `CREATE POLICY "Auth users can read delegation_interest" ON delegation_interest FOR SELECT TO authenticated USING (true);`,
    
    `DROP POLICY IF EXISTS "Auth users can read staking_waitlist" ON staking_waitlist;`,
    `CREATE POLICY "Auth users can read staking_waitlist" ON staking_waitlist FOR SELECT TO authenticated USING (true);`,
    
    `DROP POLICY IF EXISTS "Auth users can read architect_applications" ON architect_applications;`,
    `CREATE POLICY "Auth users can read architect_applications" ON architect_applications FOR SELECT TO authenticated USING (true);`,
    
    `DROP POLICY IF EXISTS "Auth users can read feedback" ON feedback;`,
    `CREATE POLICY "Auth users can read feedback" ON feedback FOR SELECT TO authenticated USING (true);`,
    
    `DROP POLICY IF EXISTS "Auth users can read notification_preferences" ON notification_preferences;`,
    `CREATE POLICY "Auth users can read notification_preferences" ON notification_preferences FOR SELECT TO authenticated USING (true);`,
    
    `DROP POLICY IF EXISTS "Auth users can read quantum_subscribers" ON quantum_subscribers;`,
    `CREATE POLICY "Auth users can read quantum_subscribers" ON quantum_subscribers FOR SELECT TO authenticated USING (true);`
  ];

  for (const query of queries) {
    let error;
    try {
      const result = await supabase.rpc('exec_sql', { sql_query: query });
      error = result.error;
    } catch (err: any) {
      error = { message: err.message || 'Unknown error' };
    }

    if (error) {
      // If RPC fails, we will have to explain to the user how to add the helper or run manually.
      console.error(`Error executing query: ${query.substring(0, 50)}...`);
      console.error(`Message: ${error.message}`);
    } else {
      console.log(`✅ Success: ${query.substring(0, 50)}...`);
    }
  }

  console.log('🏁 Database Setup Finished!');
}

setupDatabase();
