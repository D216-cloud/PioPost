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

async function dumpRules() {
  const { data: rules } = await supabase.from('automation_rules').select('*');
  console.log(`Found ${rules?.length ?? 0} rules:`);
  rules?.forEach(r => {
    console.log(`ID: ${r.id}, Name: ${r.rule_name || r.name}`);
    console.log(`- Active: ${r.active}`);
    console.log(`- Require Follow: ${r.require_follow || r.ask_follow}`);
    console.log(`- Gate Message: "${r.follow_gate_message}"`);
    console.log(`- DM Message: "${r.dm_message || r.reply_message}"`);
    console.log('---------------------------------------------');
  });
}

dumpRules();
