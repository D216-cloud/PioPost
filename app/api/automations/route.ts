// app/api/automations/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

// Helper to safely parse JSON
function safeParseJSON(str: any) {
  if (typeof str === "object") return str;
  try {
    return JSON.parse(str || "[]");
  } catch (e) {
    return [];
  }
}

// Extract column name that is missing from schema cache / relation
function getUnsupportedFieldFromError(message?: string): string | undefined {
  if (!message) return undefined;
  
  // Pattern 1: PostgREST schema cache error
  const cacheMatch = message.match(/Could not find the '([^']+)' column of 'automations' in the schema cache/);
  if (cacheMatch) return cacheMatch[1];
  
  // Pattern 2: Postgres column does not exist error
  const existMatch = message.match(/column "([^"]+)" of relation "automations" does not exist/);
  if (existMatch) return existMatch[1];

  // Pattern 3: Simple column name does not exist
  const simpleMatch = message.match(/column automations\.([^ ]+) does not exist/);
  if (simpleMatch) return simpleMatch[1];

  return undefined;
}

// GET — List all rules for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // 'active' | 'paused' | null (all)

    let query = supabaseAdmin
      .from("automations")
      .select(`
        *,
        instagram_accounts (
          username,
          profile_picture_url,
          instagram_business_id
        )
      `)
      .eq("profile_id", session.user.id)
      .order("created_at", { ascending: false });

    if (status === "active") query = query.eq("is_active", true);
    if (status === "paused") query = query.eq("is_active", false);

    const { data, error } = await query;
    if (error) throw error;

    // Map new schema to old schema keys for frontend backward compatibility
    const mappedData = (data || []).map((auto: any) => {
      const parsedKeywords = safeParseJSON(auto.trigger_keywords);
      return {
        ...auto,
        active: auto.is_active,
        rule_name: auto.name,
        trigger_keyword: parsedKeywords[0] || "",
        keywords: parsedKeywords,
        dm_message: auto.dm_message_text,
        dm_button_label: auto.dm_button_text,
        dm_button_url: auto.dm_button_url,
        require_follow: auto.follow_first_enabled,
        follow_gate_message: auto.follow_check_msg,
        total_dms_sent: auto.total_success,
        dmsSent: auto.total_success,
        comments: auto.total_triggers,
        type: auto.email_ask_enabled ? "link" : auto.follow_first_enabled ? "follower" : "giveaway"
      };
    });

    return NextResponse.json({ data: mappedData });
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
      keyword_mode,
      keywords,
      dm_message,
      dm_button_label,
      dm_button_url,
      comment_reply_text,
      require_follow,
      follow_gate_message,
      rule_name,
      dm_type,
      
      // New schema inputs
      name,
      trigger_type,
      specific_post_id,
      specific_post_thumbnail,
      trigger_keywords,
      exclude_keywords,
      dm_message_text,
      dm_button_text,
      dm_media_url,
      dm_message_type,
      
      // 2-step DM flow fields
      initial_dm_message,
      
      follow_first_enabled,
      follow_first_opening_message,
      follow_first_btn_label,
      follow_check_msg,
      follow_check_btn1_label,
      follow_check_btn2_label,
      
      email_ask_enabled,
      email_ask_message,
      email_ask_btn_label,
      
      follow_up_enabled,
      follow_up_hours,
      follow_up_message,
      is_active
    } = body;

    // Validate required fields
    if (!instagram_account_id) {
      return NextResponse.json({ error: "Instagram account is required" }, { status: 400 });
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

    // Parse keywords & limit max 3
    const finalKeywords = trigger_keywords || keywords || [];
    if (finalKeywords.length > 3) {
      return NextResponse.json({ error: "Keywords list cannot exceed 3 items" }, { status: 400 });
    }

    const insertPayload: Record<string, any> = {
      profile_id: session.user.id,
      instagram_account_id,
      name: name || rule_name || "Untitled Automation",
      trigger_type: trigger_type || (post_id || specific_post_id ? "specific_post" : "all_posts"),
      specific_post_id: specific_post_id || post_id || null,
      specific_post_thumbnail: specific_post_thumbnail || post_thumbnail_url || null,
      trigger_keywords: finalKeywords,
      exclude_keywords: exclude_keywords || [],
      dm_message_text: dm_message_text !== undefined ? dm_message_text : (dm_message || ""),
      dm_button_text: dm_button_text !== undefined ? dm_button_text : (dm_button_label || null),
      dm_button_url: dm_button_url || null,
      dm_media_url: dm_media_url || null,
      dm_message_type: dm_message_type || dm_type || "text",
      
      // 2-step DM flow fields
      comment_reply_text: comment_reply_text || null,
      initial_dm_message: initial_dm_message || null,
      keyword_mode: keyword_mode || "any",
      
      // Follow gate settings
      follow_first_enabled: follow_first_enabled !== undefined ? follow_first_enabled : (require_follow || false),
      follow_first_opening_message: follow_first_opening_message || null,
      follow_first_btn_label: follow_first_btn_label || "Send me the access",
      follow_check_msg: follow_check_msg || follow_gate_message || null,
      follow_check_btn1_label: follow_check_btn1_label || "Visit Profile",
      follow_check_btn2_label: follow_check_btn2_label || "I'm following ✅",
      
      // Email gate settings
      email_ask_enabled: email_ask_enabled || false,
      email_ask_message: email_ask_message || null,
      email_ask_btn_label: email_ask_btn_label || "Send Guide to My DMs",
      
      // Follow up settings
      follow_up_enabled: follow_up_enabled || false,
      follow_up_hours: Number.isInteger(follow_up_hours) ? follow_up_hours : 24,
      follow_up_message: follow_up_message || null,
      
      is_active: is_active !== undefined ? is_active : true
    };

    let currentPayload = { ...insertPayload };
    let data: any = null;
    let error: any = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await supabaseAdmin
        .from("automations")
        .insert(currentPayload)
        .select()
        .single();

      if (!res.error) {
        data = res.data;
        error = null;
        break;
      }

      error = res.error;
      const errorMsg = res.error.message || String(res.error);
      const unsupportedField = getUnsupportedFieldFromError(errorMsg);

      if (unsupportedField && unsupportedField in currentPayload) {
        console.warn(`[POST /api/automations] Stripping unsupported field: '${unsupportedField}'`);
        delete currentPayload[unsupportedField];
      } else {
        break;
      }
    }

    if (error) throw error;

    return NextResponse.json({ id: data.id, success: true, message: "Automation created successfully", data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — Update a rule
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "Automation ID required" }, { status: 400 });

    // Ensure user owns this automation
    const { data: auto } = await supabaseAdmin
      .from("automations")
      .select("id")
      .eq("id", id)
      .eq("profile_id", session.user.id)
      .single();

    if (!auto) return NextResponse.json({ error: "Automation not found" }, { status: 404 });

    // Map frontend compatibility keys
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.active !== undefined) dbUpdates.is_active = updates.active;
    if (updates.rule_name !== undefined) dbUpdates.name = updates.rule_name;
    if (updates.dm_message !== undefined) dbUpdates.dm_message_text = updates.dm_message;
    if (updates.dm_button_label !== undefined) dbUpdates.dm_button_text = updates.dm_button_label;
    if (updates.require_follow !== undefined) dbUpdates.follow_first_enabled = updates.require_follow;
    if (updates.follow_gate_message !== undefined) dbUpdates.follow_check_msg = updates.follow_gate_message;

    // Remove client-specific backward compatibility keys to prevent DB error
    delete dbUpdates.active;
    delete dbUpdates.rule_name;
    delete dbUpdates.dm_message;
    delete dbUpdates.dm_button_label;
    delete dbUpdates.require_follow;
    delete dbUpdates.follow_gate_message;

    let currentUpdates = { ...dbUpdates };
    let data: any = null;
    let error: any = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await supabaseAdmin
        .from("automations")
        .update(currentUpdates)
        .eq("id", id)
        .select()
        .single();

      if (!res.error) {
        data = res.data;
        error = null;
        break;
      }

      error = res.error;
      const errorMsg = res.error.message || String(res.error);
      const unsupportedField = getUnsupportedFieldFromError(errorMsg);

      if (unsupportedField && unsupportedField in currentUpdates) {
        console.warn(`[PATCH /api/automations] Stripping unsupported field: '${unsupportedField}'`);
        delete currentUpdates[unsupportedField];
      } else {
        break;
      }
    }

    if (error) throw error;

    return NextResponse.json({ data, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — Hard delete an automation
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Automation ID required" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("automations")
      .delete()
      .eq("id", id)
      .eq("profile_id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

