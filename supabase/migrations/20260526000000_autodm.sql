-- 0. Clean up existing tables if they have the wrong schema (optional/dev only)
-- Drop existing tables to recreate them with the correct schema
DROP TABLE IF EXISTS automation_dm_log CASCADE;
DROP TABLE IF EXISTS automation_rules CASCADE;
DROP TABLE IF EXISTS instagram_accounts CASCADE;

-- 1. Instagram Accounts (fix instagram_business_id storage)
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  instagram_user_id TEXT NOT NULL,         -- IG personal user ID
  instagram_business_id TEXT NOT NULL,     -- IG Business/Creator account ID (used in webhooks)
  username TEXT NOT NULL,
  profile_picture_url TEXT,
  access_token TEXT NOT NULL,              -- long-lived Instagram access token
  token_expires_at TIMESTAMPTZ,
  page_id TEXT,                            -- Facebook Page ID linked to this IG account
  page_access_token TEXT,                  -- Facebook Page access token
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, instagram_business_id)
);

-- 2. Automation Rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  
  -- Post/Reel being watched
  post_id TEXT NOT NULL,                   -- IG media ID
  post_type TEXT NOT NULL DEFAULT 'POST',  -- 'POST' | 'REEL' | 'STORY'
  post_thumbnail_url TEXT,
  post_caption TEXT,
  post_permalink TEXT,
  
  -- Keyword settings
  keyword_mode TEXT NOT NULL DEFAULT 'specific', -- 'specific' | 'any'
  keywords TEXT[] DEFAULT '{}',            -- array of keywords to watch for
  
  -- DM message settings
  dm_message TEXT NOT NULL,
  dm_button_label TEXT,
  dm_button_url TEXT,
  
  -- Public comment reply settings
  auto_reply_comment BOOLEAN DEFAULT FALSE,
  comment_reply_text TEXT,
  
  -- Follow gate
  require_follow BOOLEAN DEFAULT FALSE,
  follow_gate_message TEXT,
  
  -- Rule state
  active BOOLEAN DEFAULT TRUE,
  deleted BOOLEAN DEFAULT FALSE,
  
  -- Stats (denormalized for fast dashboard)
  total_dms_sent INTEGER DEFAULT 0,
  total_comments_matched INTEGER DEFAULT 0,
  
  -- Rule name (optional, user-set)
  rule_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DM Send Log (deduplication + analytics)
CREATE TABLE IF NOT EXISTS automation_dm_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  commenter_id TEXT NOT NULL,              -- IG user ID of person who commented
  commenter_username TEXT,
  comment_id TEXT NOT NULL,
  comment_text TEXT,
  keyword_matched TEXT,
  dm_sent BOOLEAN DEFAULT FALSE,
  dm_error TEXT,
  dm_message_id TEXT,
  follow_gate_triggered BOOLEAN DEFAULT FALSE,
  public_reply_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_rules_user ON automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_account ON automation_rules(instagram_account_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_post ON automation_rules(post_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(active, deleted);
CREATE INDEX IF NOT EXISTS idx_dm_log_rule ON automation_dm_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_dm_log_commenter ON automation_dm_log(rule_id, commenter_id);
