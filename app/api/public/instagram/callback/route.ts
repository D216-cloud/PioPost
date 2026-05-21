import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/settings?error=no_code", req.url));
  }

  try {
    // In a real app, exchange code for access token here
    // const tokenRes = await fetch(`https://api.instagram.com/oauth/access_token`, { ... });
    // const data = await tokenRes.json();
    
    // Mock successful connection
    const { error } = await supabase.from("instagram_accounts").upsert({
      user_id: session.user.id,
      instagram_business_id: `mock_${Date.now()}`,
      access_token: "mock_token_" + Math.random().toString(36).substring(7),
      username: "connected_user",
      profile_picture_url: null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'instagram_business_id' });

    if (error) throw error;

    return NextResponse.redirect(new URL("/dashboard/settings?success=true", req.url));
  } catch (e) {
    console.error("Instagram OAuth Error:", e);
    return NextResponse.redirect(new URL("/dashboard/settings?error=oauth_failed", req.url));
  }
}
