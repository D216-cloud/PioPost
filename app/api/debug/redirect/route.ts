import { NextResponse } from "next/server";
import { getInstagramRedirectUri } from "@/lib/instagram-config";

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GENERATED_REDIRECT_URI: getInstagramRedirectUri(),
    VERCEL_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "Not set",
    INSTRUCTIONS: "Ensure 'GENERATED_REDIRECT_URI' matches exactly in Meta Dashboard -> Facebook Login -> Settings -> Valid OAuth Redirect URIs"
  });
}
