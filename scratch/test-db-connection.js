const { Client } = require('pg');
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
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value.trim();
    }
  });
  return env;
}

const env = loadEnv();

const passwords = [
  env.DATABASE_PASSWORD,
  'piopost123',
  'piopost',
  'postgres',
  'piopost123verifytoken'
].filter(Boolean);

async function tryConnect() {
  const host = 'db.hklayegbwnlhcaqrjvpr.supabase.co';
  const port = 5432;
  const user = 'postgres';
  const database = 'postgres';

  for (const password of passwords) {
    console.log(`Trying password: ${password.substring(0, 10)}...`);
    const client = new Client({
      host,
      port,
      user,
      password,
      database,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`✅ SUCCESS! Connected with password: ${password}`);
      
      // Let's run a test query
      const res = await client.query('SELECT version();');
      console.log('Postgres version:', res.rows[0].version);
      
      await client.end();
      return;
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
    }
  }
}

tryConnect();
