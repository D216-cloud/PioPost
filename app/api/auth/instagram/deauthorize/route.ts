import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      return NextResponse.json({ error: "No signed request" }, { status: 400 });
    }

    // Decode signed request
    const [encodedSig, payload] = signedRequest.split(".");
    const data = JSON.parse(Buffer.from(payload, "base64").toString());

    const instagramBusinessId = data.user_id;

    if (instagramBusinessId) {
      // Remove the connection from our database
      await supabaseAdmin
        .from("instagram_accounts")
        .delete()
        .eq("instagram_business_id", instagramBusinessId);
        
      console.log(`User ${instagramBusinessId} deauthorized the app.`);
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Deauthorize Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
