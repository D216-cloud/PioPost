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
  const { data: automations } = await supabase.from('automations').select('*').limit(1);
  if (automations && automations.length > 0) {
    const auto = automations[0];
    console.log("Automation ID:", auto.id);
    console.log("Specific Post ID:", auto.specific_post_id);
    
    const { data: accounts } = await supabase.from('instagram_accounts').select('*').eq('id', auto.instagram_account_id);
    if (accounts && accounts.length > 0) {
      console.log("Instagram Business ID:", accounts[0].instagram_business_id);
    }
  }
}

run();
