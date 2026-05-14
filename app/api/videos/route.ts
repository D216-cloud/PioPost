import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data, error } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Videos fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('videos')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Video delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete video' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const rows = Array.isArray(body) ? body : [body];

    // Ensure all rows belong to the current user
    const userRows = rows.map(row => ({
      ...row,
      user_id: session.user.id
    }));

    const { data, error } = await supabaseAdmin
      .from('videos')
      .insert(userRows)
      .select();

    if (error) throw error;

    return NextResponse.json({ data, success: true });
  } catch (error: any) {
    console.error('Video creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create video' }, { status: 500 });
  }
}


