// app/api/auth/instagram/callback/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getInstagramRedirectUri } from "@/lib/instagram-config";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/instagram/connect?error=oauth_denied`);
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(`${origin}/login?error=not_authenticated`);
    }

    const redirectUri = getInstagramRedirectUri(origin);

    // Step 1 - Exchange code for short-lived token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID!,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
    }

    // Step 2 - Exchange for long-lived token
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${tokenData.access_token}`
    );
    const longToken = await longTokenRes.json();
    const finalToken = longToken.access_token || tokenData.access_token;

    // Fetch user details
    const userRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${finalToken}`
    );
    const userData = await userRes.json();

    if (!userData.id) throw new Error("Failed to get Instagram user info");

    // Also fetch the Business Account ID (different from user ID)
    let igBusinessId = userData.id; // fallback
    let pageId: string | null = null;
    let pageAccessToken: string | null = null;

    try {
      const bizRes = await fetch(
        `https://graph.instagram.com/me?fields=id,instagram_business_account&access_token=${finalToken}`
      );
      const bizData = await bizRes.json();

      if (bizData.instagram_business_account?.id) {
        igBusinessId = bizData.instagram_business_account.id;
        console.log("[OAuth] ✅ Got real business ID:", igBusinessId);
      } else {
        // Try Facebook Graph API
        const fbRes = await fetch(
          `https://graph.facebook.com/v21.0/me/accounts?access_token=${finalToken}`
        );
        const fbData = await fbRes.json();

        if (fbData.data?.[0]?.id) {
          pageId = fbData.data[0].id;
          pageAccessToken = fbData.data[0].access_token;

          const igBizRes = await fetch(
            `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
          );
          const igBizData = await igBizRes.json();

          if (igBizData.instagram_business_account?.id) {
            igBusinessId = igBizData.instagram_business_account.id;
            console.log("[OAuth] ✅ Got business ID via FB page:", igBusinessId);
          }
        }
      }
    } catch {
      console.warn("[OAuth] Could not fetch business ID, using user ID");
    }

    console.log("[DEBUG] Instagram returned ID:", userData.id);
    console.log("[DEBUG] Saving as instagram_business_id:", igBusinessId);

    // Step 5 - Save/update to DB
    const { error: upsertError } = await supabaseAdmin
      .from("instagram_accounts")
      .upsert({
        user_id: session.user.id,
        instagram_user_id: userData.id,
        instagram_business_id: igBusinessId,
        username: userData.username,
        profile_picture_url: userData.profile_picture_url || null,
        access_token: finalToken,
        token_expires_at: longToken.token_type
          ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        page_id: pageId,
        page_access_token: pageAccessToken,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,instagram_business_id",
      });

    if (upsertError) throw new Error(`DB upsert failed: ${upsertError.message}`);

    return NextResponse.redirect(`${origin}/dashboard/automation?connected=true`);

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.redirect(`${origin}/instagram/connect?error=${encodeURIComponent(errorMessage)}`);
  }
}
