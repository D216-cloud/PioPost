import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

function stripUnsupportedFields(body: Record<string, unknown>) {
  const { ask_email, ...rest } = body;
  return rest;
}

function isAskEmailSchemaError(message?: string) {
  return Boolean(message && message.includes('ask_email'));
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    let query = supabaseAdmin
      .from('automation_rules')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (accountId) {
      query = query.eq('instagram_account_id', accountId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const insertPayload = { ...body, user_id: session.user.id };

    let { data, error } = await supabaseAdmin
      .from('automation_rules')
      .insert(insertPayload)
      .select()
      .single();

    if (error && isAskEmailSchemaError(error.message)) {
      const fallbackPayload = stripUnsupportedFields(insertPayload);
      ({ data, error } = await supabaseAdmin
        .from('automation_rules')
        .insert(fallbackPayload)
        .select()
        .single());
    }

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    let { data, error } = await supabaseAdmin
      .from('automation_rules')
      .update(body)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error && isAskEmailSchemaError(error.message)) {
      const fallbackBody = stripUnsupportedFields(body as Record<string, unknown>);
      ({ data, error } = await supabaseAdmin
        .from('automation_rules')
        .update(fallbackBody)
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .single());
    }

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('automation_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
