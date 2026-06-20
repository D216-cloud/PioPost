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
  const { data: automations, error } = await supabase.from('automations').select('*');
  if (error) {
    console.error(error);
  } else {
    console.log(`Found ${automations.length} automations:`);
    automations.forEach(a => {
      console.log(`ID: ${a.id}`);
      console.log(`- Name: "${a.name}"`);
      console.log(`- Trigger Type: ${a.trigger_type}`);
      console.log(`- Keywords: ${JSON.stringify(a.trigger_keywords)}`);
      console.log(`- Follow First: ${a.follow_first_enabled}`);
      console.log(`- Initial DM Message: "${a.initial_dm_message}"`);
      console.log(`- Main DM Message: "${a.dm_message_text}"`);
      console.log(`- Active: ${a.is_active}`);
      console.log('---------------------------------------------');
    });
  }
}

run();
