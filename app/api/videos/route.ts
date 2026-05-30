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

    // Only persist columns that actually exist on the videos table.
    const userRows = rows
      .filter((row) => row && typeof row === 'object')
      .map((row) => ({
        user_id: session.user.id,
        title: typeof row.title === 'string' && row.title.trim() ? row.title.trim() : 'Untitled video',
        source_url: typeof row.source_url === 'string' ? row.source_url : '',
        thumbnail_url: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : '',
        status: typeof row.status === 'string' && row.status.trim() ? row.status : 'scheduled',
        scheduled_at: typeof row.scheduled_at === 'string' && row.scheduled_at ? row.scheduled_at : new Date().toISOString(),
        platform: typeof row.platform === 'string' && row.platform.trim() ? row.platform : 'instagram',
      }));

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'No valid video rows provided' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('videos')
      .insert(userRows)
      .select();

    if (error) {
      console.error('Video creation error details:', error);
      throw error;
    }

    return NextResponse.json({ data, success: true });
  } catch (error: any) {
    console.error('Video creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create video' }, { status: 500 });
  }
}


