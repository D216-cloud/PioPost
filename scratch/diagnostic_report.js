const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('No .env file found');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      env[match[1]] = value.trim();
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDiagnostics() {
  console.log('=== DIAGNOSTICS REPORT ===\n');

  // 1. Fetch recent webhook events
  console.log('--- LATEST 5 WEBHOOK EVENTS ---');
  try {
    const { data: events, error: err1 } = await supabase
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (err1) {
      console.error('Error fetching webhook_events:', err1.message);
    } else if (events.length === 0) {
      console.log('No webhook events found in database.');
    } else {
      events.forEach((ev, i) => {
        console.log(`\n[Event #${i+1}] ID: ${ev.id} | Created: ${ev.created_at} | Type: ${ev.event_type}`);
        console.log('Payload:', JSON.stringify(ev.payload, null, 2));
      });
    }
  } catch (err) {
    console.error('Exception fetching webhook_events:', err.message);
  }

  console.log('\n----------------------------------------\n');

  // 2. Fetch recent automation logs
  console.log('--- LATEST 5 AUTOMATION LOGS ---');
  try {
    const { data: logs, error: err2 } = await supabase
      .from('automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (err2) {
      console.error('Error fetching automation_logs:', err2.message);
    } else if (logs.length === 0) {
      console.log('No automation logs found in database.');
    } else {
      logs.forEach((log, i) => {
        console.log(`\n[Log #${i+1}] Created: ${log.created_at}`);
        console.log(`User ID: ${log.instagram_user_id}`);
        console.log(`Action: ${log.comment_text}`);
        console.log(`DM Sent: ${log.dm_sent ? 'SUCCESS ✅' : 'FAILED ❌'}`);
        if (log.error_message) {
          console.log(`Error Message: ${log.error_message}`);
        }
      });
    }
  } catch (err) {
    console.error('Exception fetching automation_logs:', err.message);
  }
}

runDiagnostics();
