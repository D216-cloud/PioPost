const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('No .env file found at', envPath);
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

async function testWebhookQuery() {
  const igBusinessId = "17841448454313989";
  console.log("Testing query for business ID:", igBusinessId);
  
  const { data, error } = await supabase
    .from("instagram_accounts")
    .select("id, user_id, access_token, username")
    .eq("instagram_business_id", igBusinessId.toString())
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Query Result:", data);
  }
}

testWebhookQuery();
