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
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value.trim();
    }
  });
  return env;
}

const env = loadEnv();
const supabase = createClient(
  env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Querying new columns from 'automations'...");
  const { data, error } = await supabase.from('automations').select('comment_reply_text, initial_dm_message').limit(1);
  if (error) {
    console.error("Error querying columns:", error);
  } else {
    console.log("Success! Columns exist. Data:", data);
  }
}

check();
