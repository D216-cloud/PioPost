import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || "piopost123verifytoken";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    // Return the challenge as plain text
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log("Incoming Webhook Event:", JSON.stringify(body, null, 2));

    // Process the event here (e.g., status updates, comments, etc.)
    // For now, we just acknowledge receipt
    
    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return new Response("Error", { status: 500 });
  }
}
