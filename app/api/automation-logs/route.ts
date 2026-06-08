import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const automationId = searchParams.get('automationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // First get all rule IDs for this user
    const { data: rules } = await supabaseAdmin
      .from('automation_rules')
      .select('id')
      .eq('user_id', session.user.id);

    const ruleIds = rules?.map((rule) => rule.id) || [];

    if (ruleIds.length === 0) return NextResponse.json({ data: [] });

    let query = supabaseAdmin
      .from('automation_logs')
      .select('*')
      .in('automation_id', ruleIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (automationId) {
      query = query.eq('automation_id', automationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
