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

async function testInsert() {
  console.log('Testing insert into webhook_events...');
  const { data: d1, error: e1 } = await supabase.from('webhook_events').insert({
    event_type: 'test_event',
    payload: { test: true },
    processed: false
  }).select();

  if (e1) {
    console.error('Error inserting into webhook_events:', e1);
  } else {
    console.log('Successfully inserted into webhook_events:', d1);
  }

  console.log('Testing insert into automation_logs...');
  const { data: d2, error: e2 } = await supabase.from('automation_logs').insert({
    automation_id: '9c792510-167f-44ba-b99a-1900e9bf69e9', // a valid rule ID
    instagram_user_id: 'test_user',
    comment_text: 'test comment',
    dm_sent: true,
    dm_sent_at: new Date().toISOString()
  }).select();

  if (e2) {
    console.error('Error inserting into automation_logs:', e2);
  } else {
    console.log('Successfully inserted into automation_logs:', d2);
  }
}

testInsert();
