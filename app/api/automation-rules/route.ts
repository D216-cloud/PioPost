import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

const SCHEMA_FIELD_PATTERN = /Could not find the '([^']+)' column of 'automation_rules' in the schema cache/;

function stripUnsupportedField(body: Record<string, unknown>, field: string) {
  const nextBody = { ...body };
  delete nextBody[field];
  return nextBody;
}

function getUnsupportedFieldFromSchemaError(message?: string) {
  return message?.match(SCHEMA_FIELD_PATTERN)?.[1];
}

async function insertAutomationRule(payload: Record<string, unknown>) {
  let currentPayload = payload;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from('automation_rules')
      .insert(currentPayload)
      .select()
      .single();

    if (!error) return { data, error: null };

    const unsupportedField = getUnsupportedFieldFromSchemaError(error.message);
    if (!unsupportedField || !(unsupportedField in currentPayload)) {
      return { data: null, error };
    }

    currentPayload = stripUnsupportedField(currentPayload, unsupportedField);
  }

  return {
    data: null,
    error: new Error('Failed to insert automation rule after removing unsupported schema fields'),
  };
}

async function updateAutomationRule(id: string, userId: string, payload: Record<string, unknown>) {
  let currentPayload = payload;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from('automation_rules')
      .update(currentPayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (!error) return { data, error: null };

    const unsupportedField = getUnsupportedFieldFromSchemaError(error.message);
    if (!unsupportedField || !(unsupportedField in currentPayload)) {
      return { data: null, error };
    }

    currentPayload = stripUnsupportedField(currentPayload, unsupportedField);
  }

  return {
    data: null,
    error: new Error('Failed to update automation rule after removing unsupported schema fields'),
  };
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

    const { data, error } = await insertAutomationRule(insertPayload);

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

    const { data, error } = await updateAutomationRule(id, session.user.id, body as Record<string, unknown>);

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
