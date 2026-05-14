import { NextResponse } from "next/server";

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
    
    // In a real scenario, you would delete the user's data here
    // For now, we return the confirmation URL as required by Meta
    const confirmationCode = `DEL-${data.user_id}-${Date.now()}`;
    const statusUrl = `${process.env.NEXTAUTH_URL}/dashboard/settings?deletion_code=${confirmationCode}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode
    });
  } catch (error) {
    console.error("Data Deletion Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
