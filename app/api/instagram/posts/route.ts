// app/api/instagram/posts/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get the user's Instagram account
    const { data: igAccount, error: acctError } = await supabaseAdmin
      .from("instagram_accounts")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (acctError || !igAccount) {
      return NextResponse.json({ error: "Instagram account not connected" }, { status: 404 });
    }

    // Fetch media from Instagram Graph API
    const mediaRes = await fetch(
      `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,caption,permalink,timestamp,like_count,comments_count&limit=30&access_token=${igAccount.access_token}`
    );
    const mediaData = await mediaRes.json();

    if (mediaData.error) {
      throw new Error(mediaData.error.message);
    }

    // Normalize the response
    const posts = (mediaData.data || []).map((item: any) => ({
      id: item.id,
      type: item.media_type, // IMAGE | VIDEO | CAROUSEL_ALBUM
      thumbnail: item.thumbnail_url || item.media_url,
      caption: item.caption || "",
      permalink: item.permalink,
      timestamp: item.timestamp,
      likes: item.like_count || 0,
      comments: item.comments_count || 0,
    }));

    return NextResponse.json({ data: posts, account: { username: igAccount.username } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
