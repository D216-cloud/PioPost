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
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
  const { data, error } = await supabase.rpc('get_tables');
  if (error) {
    // If RPC doesn't exist, try querying a list of known tables
    console.log("get_tables RPC not found, checking known tables...");
    const tables = [
      'profiles', 
      'instagram_accounts', 
      'automation_rules', 
      'automation_logs', 
      'automation_dm_log',
      'welcome_opener_settings',
      'welcome_flow_settings',
      'webhook_events'
    ];
    for (const table of tables) {
      const { error: tblError } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (tblError) {
        console.log(`❌ Table "${table}" does NOT exist or error: ${tblError.message}`);
      } else {
        console.log(`✅ Table "${table}" exists!`);
      }
    }
  } else {
    console.log("Tables:", data);
  }
}

listTables();
