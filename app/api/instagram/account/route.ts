// app/api/instagram/account/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    let query = supabaseAdmin
      .from("instagram_accounts")
      .select("id, username, profile_picture_url, instagram_business_id")
      .eq("user_id", session.user.id);

    if (accountId) {
      query = query.eq("id", accountId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: "Not connected" }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
