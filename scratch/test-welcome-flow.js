const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
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

async function testWelcomeFlow() {
  console.log("=========================================");
  console.log("     WELCOME FLOW TESTING DIAGNOSTIC     ");
  console.log("=========================================\n");

  // 1. Fetch Instagram Account
  console.log("1. Fetching connected Instagram Accounts...");
  const { data: accounts, error: accError } = await supabase
    .from('instagram_accounts')
    .select('id, instagram_business_id, username, user_id');

  if (accError) {
    console.error("❌ Error fetching accounts:", accError.message);
    return;
  }

  if (!accounts || accounts.length === 0) {
    console.warn("⚠️ No connected Instagram Accounts found in DB. Make sure you connect an account first!");
    return;
  }

  console.log(`✅ Found ${accounts.length} connected account(s):`);
  accounts.forEach((acc, index) => {
    console.log(`   [${index + 1}] @${acc.username} (Business ID: ${acc.instagram_business_id})`);
  });

  // Pick the first account for simulation
  const targetAccount = accounts[0];
  console.log(`\nUsing target account: @${targetAccount.username} for simulation.`);

  // 2. Fetch Welcome Flow Settings
  console.log("\n2. Checking Welcome Flow Settings...");
  const { data: flowSettings, error: flowError } = await supabase
    .from('welcome_flow_settings')
    .select('*')
    .eq('instagram_account_id', targetAccount.id)
    .maybeSingle();

  if (flowError) {
    console.error("❌ Error fetching welcome flow settings:", flowError.message);
  } else if (!flowSettings) {
    console.warn("⚠️ No Welcome Flow Settings found for this account. Create/save settings in `/dashboard/welcome-flow` first.");
  } else {
    console.log(`   Enabled: ${flowSettings.enabled ? '✅ YES' : '❌ NO'}`);
    console.log(`   Welcome Message: "${flowSettings.welcome_message}"`);
    console.log(`   Buttons:`, JSON.stringify(flowSettings.buttons, null, 2));
  }

  // 3. Fetch Welcome Opener Settings
  console.log("\n3. Checking Welcome Opener Settings...");
  const { data: openerSettings, error: openerError } = await supabase
    .from('welcome_opener_settings')
    .select('*')
    .eq('instagram_account_id', targetAccount.id)
    .maybeSingle();

  if (openerError) {
    console.error("❌ Error fetching welcome opener settings:", openerError.message);
  } else if (!openerSettings) {
    console.warn("   No Welcome Opener Settings found.");
  } else {
    console.log(`   Active: ${openerSettings.active ? '✅ YES' : '❌ NO'}`);
  }

  // 4. Simulate a Webhook Event POST
  const port = process.env.PORT || '3000';
  const localUrl = `http://localhost:${port}/api/webhooks/instagram`;
  console.log(`\n4. Simulating a DM webhook event to local server: ${localUrl}`);

  // Create simulated webhook payload
  const simulatedSenderId = "1234567890_test_user";
  const mockPayload = {
    "object": "instagram",
    "entry": [
      {
        "id": targetAccount.instagram_business_id,
        "time": Date.now(),
        "messaging": [
          {
            "sender": {
              "id": simulatedSenderId
            },
            "recipient": {
              "id": targetAccount.instagram_business_id
            },
            "timestamp": Date.now(),
            "message": {
              "mid": "mid." + Math.random().toString(36).substring(2, 15),
              "text": "Hello, testing welcome flow!"
            }
          }
        ]
      }
    ]
  };

  console.log("Sending simulated webhook POST...");
  try {
    const response = await fetch(localUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockPayload)
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`Response Body: ${text}`);

    console.log("\nSimulated request sent. Check your local server terminal/logs to see if the message was routed successfully.");
  } catch (err) {
    console.error("❌ Failed to send request to local server. Make sure your local server is running on port 3000 (npm run dev).");
  }
}

testWelcomeFlow();
