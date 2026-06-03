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

async function testApi() {
  const { data: accounts } = await supabase.from('instagram_accounts').select('*').limit(1);
  const account = accounts[0];
  const token = account.access_token;
  
  // Test target: deepak1010167 (1387361415694120)
  const targetId = '1387361415694120'; 

  console.log(`Checking graph.instagram.com for target ${targetId}...`);
  try {
    const igUrl = `https://graph.instagram.com/v21.0/${targetId}?fields=is_user_follow_business,username,name&access_token=${token}`;
    const igRes = await fetch(igUrl);
    const igData = await igRes.json();
    console.log('graph.instagram.com Response:', JSON.stringify(igData, null, 2));
  } catch (err) {
    console.error('graph.instagram.com Error:', err);
  }
}

testApi();
