/**
 * fix-hello-rule.js
 * Fixes the user_id mismatch on the "hello" automation rule.
 * Run: node fix-hello-rule.js
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

async function fix() {
  // "hello" rule is linked to instagram account 8ce69f2a (deepak_maheta_01)
  // which belongs to user 2333998c-3ef7-4705-8ba3-73238789db0e
  const HELLO_RULE_ID        = '5038484d-23e4-4f80-94c6-12eecbac7e9b';
  const CORRECT_USER_FOR_RULE = '2333998c-3ef7-4705-8ba3-73238789db0e'; // deepak_maheta_01's user_id

  const { error } = await supabase
    .from('automation_rules')
    .update({ user_id: CORRECT_USER_FOR_RULE })
    .eq('id', HELLO_RULE_ID);

  if (error) {
    console.error('❌ Failed:', error.message);
  } else {
    console.log('✅ Fixed "hello" rule — user_id →', CORRECT_USER_FOR_RULE);
  }

  // Verify all rules now match
  console.log('\n=== All Rules (final check) ===');
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('id, trigger_keyword, active, user_id, instagram_account_id');
  const { data: accounts } = await supabase
    .from('instagram_accounts')
    .select('id, username, user_id, facebook_page_id');

  for (const r of rules || []) {
    const acc = (accounts || []).find(a => a.id === r.instagram_account_id);
    const userMatch = acc ? (r.user_id === acc.user_id ? '✅ MATCH' : '❌ MISMATCH') : '⚠️ no account';
    const pageId    = acc?.facebook_page_id ? '✅ set' : '❌ missing';
    console.log(`  keyword="${r.trigger_keyword}" active=${r.active} user_id=${userMatch} page_id=${pageId} (${acc?.username ?? 'unknown'})`);
  }
}

fix().catch(console.error);
