const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
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
const supabase = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function dumpNewest() {
  console.log('=== LATEST WEBHOOK EVENTS ===');
  const { data: webhookEvents } = await supabase
    .from('webhook_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  webhookEvents?.forEach(e => {
    console.log(`[${e.created_at}] ID: ${e.id}, Processed: ${e.processed}`);
    console.log('Payload:', JSON.stringify(e.payload, null, 2));
    console.log('---------------------------------------------');
  });

  console.log('\n=== LATEST AUTOMATION LOGS ===');
  const { data: logs } = await supabase
    .from('automation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  logs?.forEach(l => {
    console.log(`[${l.created_at}] Rule: ${l.automation_id}, User: ${l.instagram_user_id}, Msg Sent: ${l.dm_sent}, Error: ${l.error_message}`);
  });
}

dumpNewest();
