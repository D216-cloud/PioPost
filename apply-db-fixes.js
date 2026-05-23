const fetch = require('node:http').request ? null : null;

// Use built-in https
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (match) env[match[1]] = match[2].trim();
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL).replace('https://', '');
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: supabaseUrl,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Use Supabase SQL API via /pg/ endpoint
function runSQLDirect(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    // Use the management API
    const projectRef = supabaseUrl.split('.')[0];
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const sqls = [
  // Add missing columns to automation_rules
  `ALTER TABLE public.automation_rules 
   ADD COLUMN IF NOT EXISTS instagram_account_id uuid,
   ADD COLUMN IF NOT EXISTS instagram_media_id text DEFAULT NULL,
   ADD COLUMN IF NOT EXISTS comment_scope text DEFAULT 'any',
   ADD COLUMN IF NOT EXISTS executions integer DEFAULT 0,
   ADD COLUMN IF NOT EXISTS last_execution timestamp with time zone DEFAULT NULL;`,

  // Create videos table
  `CREATE TABLE IF NOT EXISTS public.videos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'draft',
    thumbnail_url text DEFAULT '',
    source_url text DEFAULT '',
    platform text DEFAULT 'instagram',
    scheduled_at timestamp with time zone DEFAULT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
  );`,

  // Enable RLS on videos
  `ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;`,

  // Add RLS policy for videos
  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'videos' AND policyname = 'Users can CRUD own videos'
    ) THEN
      CREATE POLICY "Users can CRUD own videos"
        ON public.videos FOR ALL TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
  END $$;`
];

async function applySQL() {
  console.log('Project ref:', supabaseUrl.split('.')[0]);
  console.log('Applying SQL fixes via Supabase API...\n');

  for (const sql of sqls) {
    const preview = sql.trim().split('\n')[0].substring(0, 70);
    console.log(`Running: ${preview}...`);
    const result = await runSQLDirect(sql);
    console.log(`  Status: ${result.status}`);
    if (result.status !== 200 && result.status !== 201) {
      console.log(`  Response: ${result.body.substring(0, 300)}`);
    } else {
      console.log(`  ✅ Success`);
    }
    console.log('');
  }
}

applySQL().catch(console.error);
