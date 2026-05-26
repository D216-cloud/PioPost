import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getInstagramRedirectUri } from "@/lib/instagram-config";

type InstagramProfileResponse = {
  id?: string;
  username?: string;
  profile_picture_url?: string;
  error?: { message?: string };
};

type FacebookPageResponse = {
  data?: Array<{
    id: string;
    access_token?: string;
    instagram_business_account?: { id?: string };
  }>;
  error?: { message?: string };
};

type LongLivedTokenResponse = {
  access_token?: string;
  error?: { message?: string };
};

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
    let longLivedData: LongLivedTokenResponse = {};
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
    } catch (error: unknown) {
      console.warn(
        "[Instagram OAuth] POST to graph.instagram.com/access_token threw error:",
        error instanceof Error ? error.message : error
      );
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
      } catch (error: unknown) {
        console.error(
          "[Instagram OAuth] GET fallback request threw error:",
          error instanceof Error ? error.message : error
        );
      }
    }

    // 3. Resolve the linked Instagram business account ID and profile details.
    console.log("[Instagram OAuth] Fetching business account details...");
    let igBusinessId: string | null = null;
    let username: string | null = null;
    let profilePictureUrl: string | null = null;

    try {
      const userRes = await fetch(`https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${finalToken}`);
      const userData = (await userRes.json()) as InstagramProfileResponse;

      if (userData.error || !userData.id) {
        throw new Error(userData.error?.message || "Failed to get Instagram user details");
      }

      username = userData.username ?? null;
      profilePictureUrl = userData.profile_picture_url ?? null;

      try {
        const businessRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${finalToken}`);
        const businessData = (await businessRes.json()) as FacebookPageResponse;

        const firstPage = businessData.data?.[0];
        const pageAccessToken = firstPage?.access_token;
        const pageId = firstPage?.id;

        if (pageId && pageAccessToken) {
          const igBizRes = await fetch(
            `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
          );
          const igBizData = (await igBizRes.json()) as { instagram_business_account?: { id?: string }; error?: { message?: string } };

          if (igBizData.instagram_business_account?.id) {
            igBusinessId = igBizData.instagram_business_account.id;
            console.log("[Instagram OAuth] Got real Business ID:", igBusinessId);
          } else if (igBizData.error) {
            console.warn("[Instagram OAuth] Could not resolve business ID:", igBizData.error.message);
          }
        }
      } catch (error: unknown) {
        console.warn(
          "[Instagram OAuth] Could not fetch business ID, using user ID as fallback:",
          error instanceof Error ? error.message : error
        );
      }
    } catch (error: unknown) {
      console.warn(
        "[Instagram OAuth] Fetching user details failed:",
        error instanceof Error ? error.message : error
      );
    }

    // Fallback to user ID if business ID discovery failed.
    if (!igBusinessId) {
      const fallbackRes = await fetch(`https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${finalToken}`);
      const fallbackData = (await fallbackRes.json()) as InstagramProfileResponse;
      if (!fallbackData.id) {
        throw new Error(fallbackData.error?.message || "Failed to retrieve user details from Instagram.");
      }
      igBusinessId = fallbackData.id;
      username = username ?? fallbackData.username ?? null;
      profilePictureUrl = profilePictureUrl ?? fallbackData.profile_picture_url ?? null;
    }

    if (!igBusinessId) {
      try {
        console.error("[Instagram OAuth] No business ID could be resolved.");
        throw new Error("No Instagram Professional/Business account was found associated with your credentials.");
      } catch (error: unknown) {
        throw new Error(error instanceof Error ? error.message : "Failed to retrieve user details from Instagram.");
      }
    }
    const pageId = null; // No Facebook Page ID needed for direct Instagram Login flows

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
  } catch (error: unknown) {
    console.error("Instagram Connection Error:", error);
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=${encodeURIComponent(error instanceof Error ? error.message : "An unknown authentication error occurred.")}`
    );
  }
}
