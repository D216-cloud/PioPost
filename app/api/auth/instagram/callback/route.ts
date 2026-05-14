import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getInstagramRedirectUri } from "@/lib/instagram-config";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state"); // We passed the user.id in the state
  const REDIRECT_URI = getInstagramRedirectUri();

  console.log("[Instagram OAuth] Callback received. Using Redirect URI for exchange:", REDIRECT_URI);

  if (!code || !userId) {
    console.error("[Instagram OAuth] Missing code or userId in callback:", { code, userId });
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/settings?error=no_code`);
  }

  try {
    // 1. Exchange code for short-lived access token
    const tokenParams = new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID!,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code: code
    });

    const tokenRes = await fetch(
      `https://api.instagram.com/oauth/access_token`,
      {
        method: "POST",
        body: tokenParams
      }
    );
    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      console.error("[Instagram OAuth] Token Exchange Error:", {
        error: tokenData.error,
        sent_redirect_uri: REDIRECT_URI
      });
      throw new Error(tokenData.error_message || "Token exchange failed");
    }

    const accessToken = tokenData.access_token;

    // 2. Get Long-Lived Token (60 days)
    const longLivedRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${accessToken}`
    );
    const longLivedData = await longLivedRes.json();
    const finalToken = longLivedData.access_token;

    // 3. Get Instagram Account Details directly
    const userRes = await fetch(`https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${finalToken}`);
    const userData = await userRes.json();
    
    if (userData.error) {
      console.error("[Instagram OAuth] User Info Error:", userData.error);
      throw new Error(userData.error.message);
    }

    const igBusinessId = userData.id;
    const username = userData.username;
    const profilePictureUrl = userData.profile_picture_url;
    const pageId = null; // No Facebook Page ID needed for direct Instagram Login flows

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
        profile_picture_url: profilePictureUrl,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/settings?success=true`);
  } catch (error: any) {
    console.error("Instagram Connection Error:", error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }
}
