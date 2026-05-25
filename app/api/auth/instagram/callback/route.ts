import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getInstagramRedirectUri } from "@/lib/instagram-config";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state"); // We passed the user.id in the state
  const REDIRECT_URI = getInstagramRedirectUri(origin);

  console.log("[Instagram OAuth] Callback received. Using Redirect URI for exchange:", REDIRECT_URI);

  if (!code || !userId) {
    console.error("[Instagram OAuth] Missing code or userId in callback:", { code, userId });
    return NextResponse.redirect(`${origin}/dashboard/settings?error=${encodeURIComponent("Missing authorization code or user session state.")}`);
  }

  if (!process.env.INSTAGRAM_CLIENT_ID || !process.env.INSTAGRAM_CLIENT_SECRET) {
    console.error("[Instagram OAuth] Missing Instagram credentials in environment variables.");
    return NextResponse.redirect(`${origin}/dashboard/settings?error=${encodeURIComponent("Server Configuration Error: Missing Instagram Client ID or Secret.")}`);
  }

  try {
    // 1. Exchange code for short-lived access token
    const tokenParams = new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code: code
    });

    console.log("[Instagram OAuth] Exchanging code for short-lived token...");
    const tokenRes = await fetch(
      `https://api.instagram.com/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenParams
      }
    );
    const tokenData = await tokenRes.json();
    
    if (tokenData.error || !tokenData.access_token) {
      console.error("[Instagram OAuth] Token Exchange Error:", {
        error: tokenData.error,
        error_message: tokenData.error_message,
        sent_redirect_uri: REDIRECT_URI
      });
      const errorMsg = tokenData.error_message || tokenData.error?.message || "Short-lived token exchange failed.";
      throw new Error(errorMsg);
    }

    const accessToken = tokenData.access_token;
    console.log("[Instagram OAuth] Successfully retrieved short-lived token.");

    // 2. Get Long-Lived Token (60 days) - Try POST first, fallback to GET if it fails
    let longLivedData: any = {};
    let finalToken = accessToken;

    try {
      console.log("[Instagram OAuth] Exchanging short-lived token for long-lived token via POST...");
      const longLivedRes = await fetch(
        `https://graph.instagram.com/access_token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "ig_exchange_token",
            client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
            access_token: accessToken,
          }),
        }
      );
      longLivedData = await longLivedRes.json();
      if (longLivedData.access_token) {
        finalToken = longLivedData.access_token;
        console.log("[Instagram OAuth] Long-lived token exchange via POST succeeded.");
      } else {
        console.warn("[Instagram OAuth] Long-lived token exchange via POST returned no token:", longLivedData);
      }
    } catch (e: any) {
      console.warn("[Instagram OAuth] POST to graph.instagram.com/access_token threw error:", e.message || e);
    }

    // Fallback to GET method if POST did not succeed
    if (!longLivedData.access_token) {
      try {
        console.log("[Instagram OAuth] Exchanging short-lived token for long-lived token via GET fallback...");
        const getParams = new URLSearchParams({
          grant_type: "ig_exchange_token",
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
          access_token: accessToken,
        });
        const getRes = await fetch(`https://graph.instagram.com/access_token?${getParams.toString()}`, {
          method: "GET"
        });
        const getData = await getRes.json();
        if (getData.access_token) {
          longLivedData = getData;
          finalToken = getData.access_token;
          console.log("[Instagram OAuth] Long-lived token exchange via GET fallback succeeded.");
        } else {
          console.error("[Instagram OAuth] GET fallback long-lived token exchange failed:", getData.error || getData);
          // If both fail, we will use the short-lived token rather than failing entirely, but log the error
          if (getData.error) {
            console.warn("[Instagram OAuth] Fallback GET error details:", getData.error);
          }
        }
      } catch (e: any) {
        console.error("[Instagram OAuth] GET fallback request threw error:", e.message || e);
      }
    }

    // 3. Get Instagram Account Details directly - Query with profile_picture_url, fallback to basic if profile_picture_url is unsupported
    console.log("[Instagram OAuth] Fetching user account profile details...");
    let userData: any = {};
    try {
      const userRes = await fetch(`https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${finalToken}`);
      userData = await userRes.json();
      if (userData.error) {
        console.warn("[Instagram OAuth] Failed to fetch profile details with profile_picture_url:", userData.error);
      }
    } catch (e: any) {
      console.warn("[Instagram OAuth] Fetch with profile_picture_url threw error:", e.message || e);
    }

    // Fallback to query without profile_picture_url
    if (userData.error || !userData.id) {
      try {
        console.log("[Instagram OAuth] Fetching user details with fallback fields (id,username)...");
        const userResFallback = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${finalToken}`);
        const fallbackData = await userResFallback.json();
        if (fallbackData.id) {
          userData = fallbackData;
        } else {
          console.error("[Instagram OAuth] Fallback user fetch failed:", fallbackData.error || fallbackData);
          throw new Error(fallbackData.error?.message || userData.error?.message || "Failed to retrieve user details from Instagram.");
        }
      } catch (e: any) {
        throw new Error(e.message || "Failed to retrieve user details from Instagram.");
      }
    }

    const igBusinessId = userData.id;
    const username = userData.username;
    const profilePictureUrl = userData.profile_picture_url || null;
    const pageId = null; // No Facebook Page ID needed for direct Instagram Login flows

    if (!igBusinessId) {
      console.error("[Instagram OAuth] Missing instagram business ID in user data:", userData);
      return NextResponse.redirect(`${origin}/dashboard/settings?error=${encodeURIComponent("No Instagram Professional/Business account was found associated with your credentials.")}`);
    }

    console.log("[Instagram OAuth] Saving account details to database for user:", userId);
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
      }, { onConflict: 'instagram_business_id' });

    if (error) {
      console.error("[Instagram OAuth] Supabase database store error:", error);
      throw error;
    }

    console.log("[Instagram OAuth] Successfully connected Instagram account @", username);
    return NextResponse.redirect(`${origin}/dashboard/settings?success=true`);
  } catch (error: any) {
    console.error("Instagram Connection Error:", error);
    return NextResponse.redirect(`${origin}/dashboard/settings?error=${encodeURIComponent(error.message || "An unknown authentication error occurred.")}`);
  }
}
