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
    const accountId = searchParams.get('accountId');

    let accountQuery = supabaseAdmin
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', session.user.id);

    if (accountId) {
      accountQuery = accountQuery.eq('id', accountId);
    }

    const { data: account, error: accountError } = await accountQuery
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Instagram account not found' }, { status: 404 });
    }

    const mediaType = searchParams.get('type'); // optional: VIDEO, IMAGE, CAROUSEL_ALBUM
    const limit = searchParams.get('limit') || '50';

    // Fetch posts using the access token
    const mediaRes = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${account.access_token}&limit=${limit}`
    );
    const mediaData = await mediaRes.json();

    if (mediaData.error) {
      console.error('[Instagram Graph API] Error fetching media:', mediaData.error);
      return NextResponse.json({ error: mediaData.error.message || 'Failed to fetch media' }, { status: 500 });
    }

    let posts = mediaData.data ?? [];

    // Filter by type if requested
    if (mediaType) {
      posts = posts.filter((p: any) => p.media_type === mediaType);
    }

    return NextResponse.json({ data: posts });
  } catch (error: any) {
    console.error('Instagram posts fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch Instagram posts' }, { status: 500 });
  }
}
