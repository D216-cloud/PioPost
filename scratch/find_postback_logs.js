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

async function findPostbackLogs() {
  console.log('=== SEARCHING POSTBACK VERIFICATION LOGS ===');
  const { data: logs, error } = await supabase
    .from('automation_logs')
    .select('*')
    .eq('comment_text', '[Postback Follow Verification]')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
    return;
  }

  console.log(`Found ${logs.length} verification logs:`);
  logs.forEach(l => {
    console.log(`[${l.created_at}] ID: ${l.id}`);
    console.log(`Rule ID: ${l.automation_id}`);
    console.log(`User ID: ${l.instagram_user_id}`);
    console.log(`DM Sent: ${l.dm_sent}`);
    console.log(`Error message:`, l.error_message);
    console.log('---------------------------------------------');
  });
}

findPostbackLogs();
