// ArcGov — Built by Gemini — arcgov.xyz
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function notifyWaitlist() {
  console.log('🚀 Starting Waitlist Notification Script...');

  // 1. Read all emails from Supabase staking_waitlist table who haven't been notified
  const { data: users, error: fetchError } = await supabase
    .from('staking_waitlist')
    .select('*')
    .eq('notified', false);

  if (fetchError) {
    console.error('Error fetching waitlist:', fetchError);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No users to notify.');
    return;
  }

  console.log(`Found ${users.length} users to notify.`);

  for (const user of users) {
    console.log(`Notifying ${user.email}...`);

    try {
      // 2. Call the /api/notify route for each
      const response = await fetch(`${API_URL}/api/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'staking_live',
          email: user.email,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ Success for ${user.email}`);
        
        // 3. Mark notified=true in Supabase
        const { error: updateError } = await supabase
          .from('staking_waitlist')
          .update({ notified: true })
          .eq('id', user.id);

        if (updateError) {
          console.error(`Error updating notified status for ${user.email}:`, updateError);
        }
      } else {
        console.error(`❌ Failed for ${user.email}:`, result.error);
      }
    } catch (err: any) {
      console.error(`❌ Error for ${user.email}:`, err.message);
    }
  }

  console.log('🏁 Notification Script Finished!');
}

notifyWaitlist();
