const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      env[match[1]] = value.trim();
    }
  });
  return env;
}

const env = loadEnv();
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("--- LATEST AUTOMATION LOGS ---");
  const { data: logs, error: logsErr } = await supabase
    .from('automation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (logsErr) {
    console.error("Logs error:", logsErr);
  } else {
    logs.forEach(l => {
      console.log(`[${l.created_at}] AutoID: ${l.automation_id}, User: ${l.commenter_username} (${l.commenter_instagram_id})`);
      console.log(`  Comment: "${l.comment_text}" | Keyword: "${l.matched_keyword}"`);
      console.log(`  FollowPassed: ${l.follow_check_passed} | SentStatus: ${l.dm_sent_status}`);
      if (l.error_message) console.log(`  Error: ${l.error_message}`);
      console.log("-----------------------------------------");
    });
  }

  console.log("\n--- LATEST PENDING FOLLOW REQUESTS ---");
  const { data: pfr, error: pfrErr } = await supabase
    .from('pending_follow_requests')
    .select('*')
    .order('first_check_time', { ascending: false })
    .limit(10);
  
  if (pfrErr) {
    console.error("PFR error:", pfrErr);
  } else {
    pfr.forEach(p => {
      console.log(`[${p.first_check_time}] AutoID: ${p.automation_id}, CommenterID: ${p.commenter_id}, Status: ${p.status}, Reminders: ${p.reminder_sent_count}`);
    });
  }
}

run();
