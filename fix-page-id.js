/**
 * fix-page-id.js
 * Automatically sets facebook_page_id on all instagram_accounts rows.
 * Run: node fix-page-id.js
 */
const { createClient } = require('@supabase/supabase-js');
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
const supabase = createClient(
  env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Found from /me API call: Facebook Page ID = 278944941961762 (Aayra)
// Also matches MESSENGER_PAGE_ID in .env
const FACEBOOK_PAGE_ID = env.MESSENGER_PAGE_ID || '278944941961762';

async function fixAll() {
  console.log('Facebook Page ID to set:', FACEBOOK_PAGE_ID);
  console.log('');

  // 1. Fix all instagram_accounts rows (set facebook_page_id)
  console.log('=== Fixing instagram_accounts ===');
  const { data: accounts, error: fetchErr } = await supabase
    .from('instagram_accounts')
    .select('id, username, facebook_page_id');

  if (fetchErr) {
    console.error('Error fetching accounts:', fetchErr.message);
    return;
  }

  for (const acc of accounts) {
    if (acc.facebook_page_id === FACEBOOK_PAGE_ID) {
      console.log(`✅ ${acc.username} already has correct facebook_page_id`);
      continue;
    }
    const { error } = await supabase
      .from('instagram_accounts')
      .update({ facebook_page_id: FACEBOOK_PAGE_ID })
      .eq('id', acc.id);
    if (error) {
      console.error(`❌ Failed to update ${acc.username}:`, error.message);
    } else {
      console.log(`✅ Updated ${acc.username} — facebook_page_id = ${FACEBOOK_PAGE_ID}`);
    }
  }

  // 2. Fix user_id mismatch on "hay" rule
  console.log('\n=== Fixing user_id mismatch on "hay" rule ===');
  const WRONG_RULE_ID  = '283388fe-271d-48f1-9d6c-0a4d416f993d';
  const CORRECT_USER_ID = '4caad14c-4404-4bd1-b030-55620b4b1474';

  const { data: ruleCheck } = await supabase
    .from('automation_rules')
    .select('id, user_id, trigger_keyword')
    .eq('id', WRONG_RULE_ID)
    .maybeSingle();

  if (!ruleCheck) {
    console.log('Rule not found — may already be fixed or deleted.');
  } else if (ruleCheck.user_id === CORRECT_USER_ID) {
    console.log(`✅ Rule "${ruleCheck.trigger_keyword}" already has correct user_id`);
  } else {
    const { error } = await supabase
      .from('automation_rules')
      .update({ user_id: CORRECT_USER_ID })
      .eq('id', WRONG_RULE_ID);
    if (error) {
      console.error('❌ Failed to fix rule user_id:', error.message);
    } else {
      console.log(`✅ Fixed rule "${ruleCheck.trigger_keyword}" user_id → ${CORRECT_USER_ID}`);
    }
  }

  // 3. Disable RLS on system tables
  console.log('\n=== NOTE: RLS on system tables ===');
  console.log('Cannot disable RLS via JS client — run this SQL in Supabase Dashboard:');
  console.log('');
  console.log('  ALTER TABLE public.webhook_events DISABLE ROW LEVEL SECURITY;');
  console.log('  ALTER TABLE public.automation_logs DISABLE ROW LEVEL SECURITY;');

  // 4. Final verification
  console.log('\n=== Final State ===');
  const { data: finalRules } = await supabase
    .from('automation_rules')
    .select('id, name, trigger_keyword, active, user_id, instagram_account_id');
  const { data: finalAccounts } = await supabase
    .from('instagram_accounts')
    .select('id, username, facebook_page_id, user_id, instagram_business_id');

  console.log('\nInstagram Accounts:');
  for (const a of finalAccounts || []) {
    console.log(`  [${a.username}]`);
    console.log(`    user_id: ${a.user_id}`);
    console.log(`    instagram_business_id: ${a.instagram_business_id}`);
    console.log(`    facebook_page_id: ${a.facebook_page_id || '❌ MISSING'}`);
  }

  console.log('\nAutomation Rules:');
  for (const r of finalRules || []) {
    const linkedAccount = (finalAccounts || []).find(a => a.id === r.instagram_account_id);
    const userMatch = linkedAccount ? (r.user_id === linkedAccount.user_id ? '✅' : '❌ MISMATCH') : '⚠️ no account';
    console.log(`  "${r.trigger_keyword}" (${r.name}) active=${r.active} user_id_match=${userMatch}`);
  }

  console.log('\n🎉 Done! Now:');
  console.log('1. Run the RLS SQL above in Supabase Dashboard');
  console.log('2. Make sure ngrok is running: ngrok http 3000');
  console.log('3. Set webhook URL in Meta to: https://YOUR-NGROK.ngrok.io/api/webhooks/instagram');
  console.log('4. Comment on your reel and watch npm run dev terminal for logs');
}

fixAll().catch(console.error);
