import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not logged in. Please login to the dashboard first.' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Seed a Test Instagram Account
    const { error: igError } = await supabaseAdmin.from('instagram_accounts').upsert({
      user_id: userId,
      username: 'test_influencer_ai',
      instagram_business_id: '123456789',
      access_token: 'mock_token',
      profile_picture_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
    }, { onConflict: 'user_id' });

    if (igError) throw igError;

    // 2. Seed a few Test Videos
    const { error: videoError } = await supabaseAdmin.from('videos').insert([
      {
        user_id: userId,
        title: 'AI Viral Reel #1',
        status: 'posted',
        thumbnail_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400',
        scheduled_at: new Date().toISOString(),
        source_url: 'https://youtube.com',
        platform: 'instagram'
      },
      {
        user_id: userId,
        title: 'Scheduled Growth Hack',
        status: 'scheduled',
        thumbnail_url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        source_url: 'https://youtube.com',
        platform: 'instagram'
      }
    ]);

    if (videoError) {
      // It's okay if video insert fails (e.g. table doesn't exist yet), we still want to show the IG account
      console.warn("Video seeding failed (maybe table 'videos' is missing?):", videoError.message);
    }

    return NextResponse.json({ 
      message: "Success! Test data created for your account.",
      userId: userId,
      nextSteps: [
        "Go to http://localhost:3000/dashboard/settings to see the connected Instagram account.",
        "Go to http://localhost:3000/dashboard to see the statistics."
      ]
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
