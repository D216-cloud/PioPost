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

async function readEvents() {
  const { data, error } = await supabase
    .from('webhook_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error(error);
  } else {
    data.forEach(event => {
      console.log(`--- Event ID: ${event.id} Created At: ${event.created_at} ---`);
      console.log(JSON.stringify(event.payload, null, 2));
    });
  }
}

readEvents();
