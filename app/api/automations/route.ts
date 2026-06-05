// app/api/automations/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

// GET — List all rules for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // 'active' | 'paused' | null (all)

    let query = supabaseAdmin
      .from("automation_rules")
      .select(`
        *,
        instagram_accounts (
          username,
          profile_picture_url,
          instagram_business_id
        )
      `)
      .eq("user_id", session.user.id)
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (status === "active") query = query.eq("active", true);
    if (status === "paused") query = query.eq("active", false);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — Create a new automation rule
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      instagram_account_id,
      post_id,
      post_type,
      post_thumbnail_url,
      post_caption,
      post_permalink,
      keyword_mode,
      keywords,
      dm_message,
      dm_button_label,
      dm_button_url,
      auto_reply_comment,
      comment_reply_text,
      require_follow,
      follow_gate_message,
      rule_name,
      activation_delay_days,
      dm_type,
    } = body;

    // Validate required fields
    if (!instagram_account_id || !post_id || (dm_type === "comment_only" ? !comment_reply_text : !dm_message)) {
      return NextResponse.json(
        { error: dm_type === "comment_only" ? "Comment reply text is required" : "DM message is required" },
        { status: 400 }
      );
    }

    // Verify the Instagram account belongs to this user
    const { data: account } = await supabaseAdmin
      .from("instagram_accounts")
      .select("id")
      .eq("id", instagram_account_id)
      .eq("user_id", session.user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "Instagram account not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("automation_rules")
      .insert({
        user_id: session.user.id,
        instagram_account_id,
        post_id,
        post_type: post_type || "POST",
        post_thumbnail_url,
        post_caption,
        post_permalink,
        keyword_mode: keyword_mode || "specific",
        keywords: keywords || [],
        dm_message: dm_message || "",
        dm_button_label,
        dm_button_url,
        auto_reply_comment: auto_reply_comment || false,
        comment_reply_text,
        require_follow: require_follow || false,
        follow_gate_message,
        rule_name,
        activation_delay_days: Number.isFinite(Number(activation_delay_days))
          ? Math.max(0, Math.floor(Number(activation_delay_days)))
          : 0,
        dm_type: dm_type || "message_only",
        active: true,
        deleted: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — Update a rule (toggle active, edit message, etc.)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "Rule ID required" }, { status: 400 });

    // Ensure user owns this rule
    const { data: rule } = await supabaseAdmin
      .from("automation_rules")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from("automation_rules")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — Soft delete a rule
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Rule ID required" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("automation_rules")
      .update({ deleted: true, active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
