import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET() {
  const results: any = {};
  
  try {
    const session = await getServerSession(authOptions);
    results.session = {
      active: !!session,
      userId: session?.user?.id || null,
      user: session?.user || null
    };
  } catch (e: any) {
    results.session = { error: e.message };
  }

  const tables = ['profiles', 'instagram_accounts', 'automation_rules', 'scheduled_posts', 'videos', 'draft_media'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error) {
        results[table] = { status: 'error', code: error.code, message: error.message };
      } else {
        results[table] = { status: 'ok', count: data?.length || 0 };
      }
    } catch (e: any) {
      results[table] = { status: 'exception', message: e.message };
    }
  }

  return NextResponse.json(results);
}
