const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function dumpData() {
  console.log("=== Instagram Accounts ===");
  const { data: accounts, error: accountsError } = await supabase
    .from('instagram_accounts')
    .select('*');
  
  if (accountsError) {
    console.error("Error fetching accounts:", accountsError);
  } else {
    console.log(JSON.stringify(accounts, null, 2));
  }

  console.log("\n=== Automation Rules ===");
  const { data: rules, error: rulesError } = await supabase
    .from('automation_rules')
    .select('*');
  
  if (rulesError) {
    console.error("Error fetching rules:", rulesError);
  } else {
    console.log(JSON.stringify(rules, null, 2));
  }
}

dumpData();
