import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    if (!accountId) return NextResponse.json({ error: 'Account ID required' }, { status: 400 });

    // Verify ownership
    const { data: account, error: accError } = await supabaseAdmin
      .from('instagram_accounts')
      .select('id')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (accError || !account) {
      return NextResponse.json({ error: 'Unauthorized or account not found' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('welcome_flow_settings')
      .select('*')
      .eq('instagram_account_id', accountId)
      .maybeSingle();

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
    const { instagram_account_id, enabled, welcome_message, buttons } = body;

    if (!instagram_account_id) {
      return NextResponse.json({ error: 'Instagram Account ID required' }, { status: 400 });
    }

    // Verify ownership
    const { data: account, error: accError } = await supabaseAdmin
      .from('instagram_accounts')
      .select('id')
      .eq('id', instagram_account_id)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (accError || !account) {
      return NextResponse.json({ error: 'Unauthorized or account not found' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('welcome_flow_settings')
      .upsert({
        user_id: session.user.id,
        instagram_account_id,
        enabled: enabled ?? false,
        welcome_message: welcome_message ?? 'Hi there! Welcome to our page! 👋',
        buttons: buttons ?? [],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'instagram_account_id'
      })
      .select()
      .single();

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
    const accountId = searchParams.get('accountId');
    const body = await req.json();

    if (!accountId) return NextResponse.json({ error: 'Account ID required' }, { status: 400 });

    // Verify ownership
    const { data: account, error: accError } = await supabaseAdmin
      .from('instagram_accounts')
      .select('id')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (accError || !account) {
      return NextResponse.json({ error: 'Unauthorized or account not found' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('welcome_flow_settings')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('instagram_account_id', accountId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
