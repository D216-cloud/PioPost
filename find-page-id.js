/**
 * find-page-id.js
 * Run: node find-page-id.js
 * 
 * This script calls the Graph API to find the Facebook Page ID
 * linked to your MESSENGER_ACCESS_TOKEN. You need this to set
 * facebook_page_id in your instagram_accounts table.
 */
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
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
const token = env.MESSENGER_ACCESS_TOKEN;

if (!token) {
  console.error('❌ MESSENGER_ACCESS_TOKEN not found in .env');
  process.exit(1);
}

async function findPageId() {
  console.log('Fetching Facebook Pages linked to your token...\n');
  
  // Method 1: /me/accounts — lists all pages the token has access to
  const res1 = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
  const data1 = await res1.json();
  
  if (data1.error) {
    console.error('❌ /me/accounts error:', data1.error.message);
    console.log('\nTrying /me directly...\n');
    
    // Method 2: /me — get the token owner info
    const res2 = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token}`);
    const data2 = await res2.json();
    console.log('/me response:', JSON.stringify(data2, null, 2));
    return;
  }
  
  if (!data1.data || data1.data.length === 0) {
    console.log('⚠️  No Facebook Pages found for this token.');
    console.log('This token may be an Instagram User token, not a Page token.');
    console.log('\nTrying /me for token info...');
    const res2 = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token}`);
    const data2 = await res2.json();
    console.log('/me:', JSON.stringify(data2, null, 2));
    return;
  }
  
  console.log('✅ Found Facebook Pages:\n');
  for (const page of data1.data) {
    console.log(`  Page Name: ${page.name}`);
    console.log(`  Page ID:   ${page.id}   ← use this as facebook_page_id`);
    console.log(`  Category:  ${page.category}`);
    console.log('');
  }
  
  console.log('─'.repeat(60));
  console.log('SQL to fix your instagram_accounts table:');
  console.log('─'.repeat(60));
  for (const page of data1.data) {
    console.log(`UPDATE public.instagram_accounts`);
    console.log(`SET facebook_page_id = '${page.id}'`);
    console.log(`WHERE username = 'deepakmaheta01'; -- adjust username as needed`);
    console.log('');
  }
}

findPageId().catch(console.error);
