import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ─────────────────────────────────────────────────────────────────────────────
// GET — Meta webhook verification handshake
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    console.log("[Webhook/GET] ✅ WEBHOOK_VERIFIED");
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Check if same commenter already got a DM from same rule in the last 24 h */
async function isDuplicate(automationId: string, commenterId: string): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("automation_logs")
    .select("id")
    .eq("automation_id", automationId)
    .eq("instagram_user_id", commenterId)
    .eq("dm_sent", true)
    .gte("created_at", since)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/** Count DMs sent from this IG account in the last hour (rate limit: 200/hr) */
async function isRateLimited(igAccountDbId: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: ruleIds } = await supabaseAdmin
    .from("automation_rules")
    .select("id")
    .eq("instagram_account_id", igAccountDbId);

  if (!ruleIds || ruleIds.length === 0) return false;
  const ids = ruleIds.map((rule) => rule.id);

  const { count } = await supabaseAdmin
    .from("automation_logs")
    .select("id", { count: "exact", head: true })
    .in("automation_id", ids)
    .eq("dm_sent", true)
    .gte("created_at", since);

  return (count ?? 0) >= 200;
}

/** Send a DM via Instagram Graph API */
async function sendInstagramDM(
  recipient: { id: string } | { comment_id: string },
  message: string,
  accessToken: string,
  buttonLabel?: string | null,
  buttonUrl?: string | null
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const url = `https://graph.instagram.com/v21.0/me/messages`;

  let body:
    | {
      recipient: { id: string } | { comment_id: string };
      message: { text: string } | { attachment: { type: string; payload: { template_type: string; text: string; buttons: Array<{ type: string; url: string; title: string }> } } };
      access_token: string;
    }
    | null = null;

  if (buttonLabel && buttonUrl) {
    // Button template message
    body = {
      recipient,
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: message,
            buttons: [{ type: "web_url", url: buttonUrl, title: buttonLabel }],
          },
        },
      },
      access_token: accessToken,
    };
  } else {
    // Plain text message
    body = {
      recipient,
      message: { text: message },
      access_token: accessToken,
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) return { success: false, error: JSON.stringify(data.error) };
    return { success: true, messageId: data.message_id };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/** Post a public reply to a comment */
async function postCommentReply(
  commentId: string,
  replyText: string,
  accessToken: string
): Promise<void> {
  try {
    await fetch(`https://graph.instagram.com/v21.0/${commentId}/replies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ message: replyText }),
    });
  } catch (err) {
    console.error("[Webhook] ⚠️ Public reply failed:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Incoming Instagram events
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[Webhook/POST] ✅ Event received:", JSON.stringify(body, null, 2));

    // Log raw event to DB
    supabaseAdmin.from("webhook_events").insert({
      event_type: "instagram_webhook",
      payload: body,
      processed: false,
    }).then(({ error }) => {
      if (error) console.error("[Webhook] ⚠️ Could not log webhook_event:", error.message);
    });

    if (body.object !== "instagram") {
      return NextResponse.json({ status: "ok" });
    }

    for (const entry of body.entry ?? []) {
      const igBusinessId = entry.id;

      // ── Comment events ──────────────────────────────────────────────────
      for (const change of entry.changes ?? []) {
        if (change.field !== "comments") continue;

        const commentValue = change.value;
        const commentId = commentValue.id;
        const commentText = commentValue.text ?? "";
        const commenterId = commentValue.from?.id;
        const mediaId = commentValue.media?.id;

        console.log(`[Webhook] 💬 Comment: "${commentText}" from ${commenterId} on media ${mediaId}`);

        // Find the IG account in our DB
        const { data: igAccounts, error: accError } = await supabaseAdmin
          .from("instagram_accounts")
          .select("id, user_id, access_token, username")
          .eq("instagram_business_id", igBusinessId.toString())  // Convert to string
          .order("updated_at", { ascending: false })
          .limit(1);

        const igAccount = igAccounts?.[0] ?? null;
          
        if (accError || !igAccount) {
          console.error("[Webhook] ❌ No IG account in DB for business ID:", igBusinessId);
          continue;
        }

        // Skip own comments
        if (commenterId === igBusinessId) {
          console.log("[Webhook] Skipping own comment.");
          continue;
        }

        // Rate limit check
        if (await isRateLimited(igAccount.id)) {
          console.warn("[Webhook] ⚠️ Rate limit hit for account:", igAccount.username);
          continue;
        }

        // Fetch active, non-deleted rules for this account
        const { data: rules, error: rulesError } = await supabaseAdmin
          .from("automation_rules")
          .select("*")
          .eq("user_id", igAccount.user_id)
          .eq("instagram_account_id", igAccount.id)
          .eq("active", true)
          .eq("deleted", false);

        if (rulesError) {
          console.error("[Webhook] ❌ Failed to fetch active rules:", rulesError.message);
          continue;
        }

        if (!rules?.length) {
          console.log("[Webhook] ℹ️ No active rules found.");
          continue;
        }

        const tokenToUse = igAccount.access_token;

        for (const rule of rules) {
          // ── Scope check ─────────────────────────────────────────────────
          // Support both old schema (comment_scope + instagram_media_id)
          // and new schema (post_id determines "specific")
          const rulePostId = rule.post_id || rule.instagram_media_id || null;
          const isSpecificRule = !!(rulePostId);

          if (isSpecificRule && rulePostId && rulePostId !== mediaId) {
            console.log(`[Webhook] Rule "${rule.rule_name || rule.name}" — media ID mismatch (rule:${rulePostId} vs comment:${mediaId}). Skipping.`);
            continue;
          }

          // ── Keyword match ────────────────────────────────────────────────
          // Support both old schema (trigger_keyword) and new schema (keyword_mode + keywords[])
          const keywordMode = rule.keyword_mode ?? (rule.trigger_keyword === "Any comment" ? "any" : "specific");
          let matched = false;

          if (keywordMode === "any") {
            matched = true;
          } else {
            // New schema: keywords[] array; old schema: trigger_keyword CSV string
            const kwList: string[] = rule.keywords?.length
              ? rule.keywords
              : rule.trigger_keyword
                ?.split(",")
                .map((k: string) => k.trim())
                .filter(Boolean) ?? [];

            const textLower = commentText.toLowerCase();
            matched = kwList.some((k: string) => textLower.includes(k.toLowerCase()));
          }

          if (!matched) {
            console.log(`[Webhook] Rule "${rule.rule_name || rule.name}" — no keyword match in "${commentText}".`);
            continue;
          }

          // ── Deduplication ────────────────────────────────────────────────
          if (await isDuplicate(rule.id, commenterId)) {
            console.log(`[Webhook] ⏭️ Duplicate — skipping commenter ${commenterId} on rule ${rule.id}`);
            continue;
          }

          console.log(`[Webhook] ✅ Rule "${rule.rule_name || rule.name}" matched! Sending DM to ${commenterId}`);

          // ── Public comment reply ─────────────────────────────────────────
          // New schema: auto_reply_comment + comment_reply_text
          // Old schema: auto_reply_enabled + auto_reply_text
          const shouldAutoReply = rule.auto_reply_comment || rule.auto_reply_enabled;
          const replyText = rule.comment_reply_text || rule.auto_reply_text;
          if (shouldAutoReply && replyText) {
            await postCommentReply(commentId, replyText, tokenToUse);
          }

          // ── Build DM message ─────────────────────────────────────────────
          // New schema uses dm_message; old schema uses reply_message
          let dmText = (rule.dm_message || rule.reply_message || "").toString();
          dmText = dmText
            .replace(/\n\n\[Attached Image: .*?\]/g, "")
            .replace(/\[Button: (.*?)\]\((.*?)\)/g, "$1: $2")
            .replace(/\[Follow Request: (.*?)\]/g, "$1")
            .trim();

          if (!dmText) {
            console.warn(`[Webhook] ⚠️ Rule "${rule.rule_name || rule.name}" has no DM message — skipping.`);
            continue;
          }

          // ── Follow gate ──────────────────────────────────────────────────
          // New schema: require_follow + follow_gate_message
          // Old schema: ask_follow
          const shouldAskFollow = rule.require_follow || rule.ask_follow;
          if (shouldAskFollow && rule.follow_gate_message) {
            // Send the follow-gate message first, then the actual DM
            await sendInstagramDM({ comment_id: commentId }, rule.follow_gate_message, tokenToUse);
          }

          // Ask for email (old schema only)
          if (rule.ask_email) {
            dmText = `${dmText}\n\nCould you also share your email so we can send you more details?`;
          }

          // ── Send the DM ──────────────────────────────────────────────────
          // Resolve button fields (old schema: dm_button_label/dm_button_url; new: same names)
          const hasButton = rule.dm_type === "message_button";
          const dmResult = await sendInstagramDM(
            { comment_id: commentId },
            dmText,
            tokenToUse,
            hasButton ? rule.dm_button_label : null,
            hasButton ? rule.dm_button_url : null
          );

          // ── Log result ───────────────────────────────────────────────────
          await supabaseAdmin.from("automation_logs").insert({
            automation_id: rule.id,
            instagram_user_id: commenterId,
            comment_text: commentText,
            comment_id: commentId,
            dm_sent: dmResult.success,
            dm_sent_at: dmResult.success ? new Date().toISOString() : null,
            error_message: dmResult.error ?? null,
          });

          if (dmResult.success) {
            console.log("[Webhook] ✅ DM sent successfully to:", commenterId);
            // Update stats — support both executions (old) and total_dms_sent (new)
            await supabaseAdmin
              .from("automation_rules")
              .update({
                total_dms_sent: (rule.total_dms_sent || 0) + 1,
                executions: (rule.executions || 0) + 1,
                last_execution: new Date().toISOString(),
              })
              .eq("id", rule.id);
          } else {
            console.error("[Webhook] ❌ DM failed for commenter", commenterId, ":", dmResult.error);
          }
        }
      }

      // ── DM / messaging events ────────────────────────────────────────────
      for (const messaging of entry.messaging ?? []) {
        const senderId = messaging.sender?.id;
        const messageText = messaging.message?.text;
        if (!senderId || !messageText) continue;
        console.log(`[Webhook] 📩 DM received from ${senderId}: "${messageText}"`);
        // Future: DM-triggered automations
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Webhook] 💥 Unhandled error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
