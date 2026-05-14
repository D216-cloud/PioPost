import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return new Response(challenge, { status: 200 });
    } else {
      return new Response(null, { status: 403 });
    }
  }

  return new Response(null, { status: 400 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Instagram Webhook Received:", JSON.stringify(body, null, 2));

    // Handle different webhook events here
    // For example, if a user removes the app from Facebook settings
    if (body.object === "instagram") {
      for (const entry of body.entry) {
        // Handle changes...
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
