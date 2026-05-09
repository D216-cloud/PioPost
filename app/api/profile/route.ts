import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('profiles').upsert({
      id: body.id,
      display_name: body.display_name,
      handle: body.handle,
      avatar_url: body.avatar_url,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    let signedAvatarUrl = data?.avatar_url || '';
    if (signedAvatarUrl && !signedAvatarUrl.startsWith('http')) {
      const { data: signedData } = await supabaseAdmin.storage
        .from('avatars')
        .createSignedUrl(signedAvatarUrl, 3600);
      signedAvatarUrl = signedData?.signedUrl || signedAvatarUrl;
    }

    return NextResponse.json({ 
      data: data ? { ...data, avatar_url: signedAvatarUrl } : null 
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch profile' }, { status: 500 });
  }
}
