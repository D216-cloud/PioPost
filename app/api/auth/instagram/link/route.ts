import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getInstagramRedirectUri } from "@/lib/instagram-config";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
  const REDIRECT_URI = getInstagramRedirectUri();
  
  console.log("[Instagram OAuth] Initiating Auth with Redirect URI:", REDIRECT_URI);

  // Permissions required for Instagram Login for Business
  const scope = [
    "instagram_business_basic",
    "instagram_business_content_publish",
    "instagram_business_manage_messages",
    "instagram_business_manage_comments"
  ].join(",");

  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: scope,
    state: session.user.id
  });

  const authUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
