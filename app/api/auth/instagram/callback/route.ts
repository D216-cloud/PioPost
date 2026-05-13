import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state"); // We passed the user.id in the state

  if (!code || !userId) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/settings?error=no_code`);
  }

  try {
    // 1. Exchange code for short-lived access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/auth/instagram/callback`)}&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    
    if (tokenData.error) throw new Error(tokenData.error.message);

    const accessToken = tokenData.access_token;

    // 2. Get Long-Lived Token (60 days)
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.INSTAGRAM_CLIENT_ID}&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&fb_exchange_token=${accessToken}`
    );
    const longLivedData = await longLivedRes.json();
    const finalToken = longLivedData.access_token;

    // 3. Find the Instagram Business Account linked to the user's pages
    const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${finalToken}`);
    const pagesData = await pagesRes.json();
    
    // For simplicity, we take the first page that has an instagram_business_account
    let igBusinessId = null;
    let pageId = null;
    let username = "Connected User";

    for (const page of pagesData.data || []) {
      const igRes = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${finalToken}`);
      const igData = await igRes.json();
      if (igData.instagram_business_account) {
        igBusinessId = igData.instagram_business_account.id;
        pageId = page.id;
        
        // Fetch IG username
        const userRes = await fetch(`https://graph.facebook.com/v18.0/${igBusinessId}?fields=username&access_token=${finalToken}`);
        const userData = await userRes.json();
        username = userData.username;
        break;
      }
    }

    if (!igBusinessId) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/settings?error=no_ig_business_account`);
    }

    // 4. Store in Supabase
    const { error } = await supabaseAdmin
      .from("instagram_accounts")
      .upsert({
        user_id: userId,
        instagram_business_id: igBusinessId,
        facebook_page_id: pageId,
        access_token: finalToken,
        username: username,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/settings?success=true`);
  } catch (error: any) {
    console.error("Instagram Connection Error:", error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }
}
