import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
  const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/instagram/callback`;
  
  // Permissions required for Instagram Reels and Webhooks
  const scope = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
    "public_profile",
    "email"
  ].join(",");

  const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}&state=${session.user.id}`;

  return NextResponse.redirect(authUrl);
}
