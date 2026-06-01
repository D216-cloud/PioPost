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
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(100, requestedLimit)) : 10;

    const sortVideos = (videos: any[] | null | undefined) => {
      const rows = Array.isArray(videos) ? [...videos] : [];
      return rows.sort((left, right) => {
        const leftValue = new Date(left?.created_at || left?.scheduled_at || 0).getTime();
        const rightValue = new Date(right?.created_at || right?.scheduled_at || 0).getTime();
        return rightValue - leftValue;
      });
    };

    const orderedQuery = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (orderedQuery.error) {
      console.warn('Videos fetch order fallback:', orderedQuery.error);

      const fallbackQuery = await supabaseAdmin
        .from('videos')
        .select('*')
        .eq('user_id', session.user.id)
        .limit(limit);

      if (fallbackQuery.error) {
        throw fallbackQuery.error;
      }

      return NextResponse.json({ data: sortVideos(fallbackQuery.data) });
    }

    return NextResponse.json({ data: sortVideos(orderedQuery.data) });
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
        instagram_account_id: typeof row.instagram_account_id === 'string' ? row.instagram_account_id : null,
        caption: typeof row.caption === 'string' ? row.caption : null,
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


