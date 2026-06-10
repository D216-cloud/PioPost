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

function mapCompatibilityPayload(body: Record<string, any>) {
  const mapped = { ...body };
  if (body.instagram_media_id && !mapped.post_id) {
    mapped.post_id = body.instagram_media_id;
  }
  if (body.reply_message && !mapped.dm_message) {
    mapped.dm_message = body.reply_message;
  }
  if (body.post_thumbnail && !mapped.post_thumbnail_url) {
    mapped.post_thumbnail_url = body.post_thumbnail;
  }
  if (body.trigger_type && !mapped.post_type) {
    mapped.post_type = body.trigger_type.includes("reel") ? "REEL" : "POST";
  }
  return mapped;
}

async function insertAutomationRule(payload: Record<string, unknown>) {
  let currentPayload = payload;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from('automation_rules')
      .insert(currentPayload)
      .select()
      .single();

    if (!error) return { data, error: null };

    console.error("Supabase insert error details:", error);
    const errorMsg = error instanceof Error
      ? error.message
      : (typeof error === 'object' && error !== null && 'message' in error)
        ? String((error as any).message)
        : String(error);

    const unsupportedField = getUnsupportedFieldFromSchemaError(errorMsg);
    if (!unsupportedField || !(unsupportedField in currentPayload)) {
      return { data: null, error: new Error(errorMsg) };
    }

    console.warn(`Stripping unsupported field '${unsupportedField}' from insert payload`);
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

    const unsupportedField = getUnsupportedFieldFromSchemaError(error instanceof Error ? error.message : String(error));
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
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const insertPayload = mapCompatibilityPayload({ ...body, user_id: session.user.id });

    const { data, error } = await insertAutomationRule(insertPayload);

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
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

    const mappedBody = mapCompatibilityPayload(body);
    const { data, error } = await updateAutomationRule(id, session.user.id, mappedBody as Record<string, unknown>);

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
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
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
