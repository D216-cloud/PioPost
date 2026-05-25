import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ─────────────────────────────────────────────────────────────────────────────
// GET — Meta webhook verification handshake
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
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
  const ids = ruleIds.map((r: any) => r.id);

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
  igBusinessId: string,
  commentId: string,
  message: string,
  accessToken: string,
  buttonLabel?: string | null,
  buttonUrl?: string | null
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const url = `https://graph.facebook.com/v21.0/${igBusinessId}/messages`;

  let body: any;

  if (buttonLabel && buttonUrl) {
    // Button template message
    body = {
      recipient: { comment_id: commentId },
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
    };
  } else {
    // Plain text message
    body = {
      recipient: { comment_id: commentId },
      message: { text: message },
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) return { success: false, error: JSON.stringify(data.error) };
    return { success: true, messageId: data.message_id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Post a public reply to a comment */
async function postCommentReply(
  commentId: string,
  replyText: string,
  accessToken: string
): Promise<void> {
  try {
    await fetch(`https://graph.facebook.com/v21.0/${commentId}/replies`, {
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

        const commentValue  = change.value;
        const commentId     = commentValue.id;
        const commentText   = commentValue.text ?? "";
        const commenterId   = commentValue.from?.id;
        const mediaId       = commentValue.media?.id;

        console.log(`[Webhook] 💬 Comment: "${commentText}" from ${commenterId} on media ${mediaId}`);

        // Find the IG account in our DB
        const { data: igAccount, error: accError } = await supabaseAdmin
          .from("instagram_accounts")
          .select("id, user_id, access_token, username")
          .eq("instagram_business_id", igBusinessId)
          .maybeSingle();

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
          .or("deleted.is.null,deleted.eq.false");

        if (rulesError || !rules?.length) {
          console.log("[Webhook] ℹ️ No active rules found.");
          continue;
        }

        const tokenToUse = process.env.MESSENGER_ACCESS_TOKEN || igAccount.access_token;

        for (const rule of rules) {
          // Scope check
          if (
            rule.comment_scope === "specific" &&
            rule.instagram_media_id &&
            rule.instagram_media_id !== mediaId
          ) {
            continue;
          }

          // Keyword match
          const keywordMode = rule.keyword_mode ?? (rule.trigger_keyword === "Any comment" ? "any" : "specific");
          let matched = false;

          if (keywordMode === "any") {
            matched = true;
          } else {
            // Use keywords array if available, fall back to trigger_keyword string
            const kwList: string[] = rule.keywords?.length
              ? rule.keywords
              : rule.trigger_keyword
                  ?.split(",")
                  .map((k: string) => k.trim().toLowerCase())
                  .filter(Boolean) ?? [];

            const textLower = commentText.toLowerCase();
            matched = kwList.some((k: string) => textLower.includes(k.toLowerCase()));
          }

          if (!matched) {
            console.log(`[Webhook] Rule "${rule.name}" — no keyword match.`);
            continue;
          }

          // Deduplication
          if (await isDuplicate(rule.id, commenterId)) {
            console.log(`[Webhook] ⏭️ Skipping duplicate for commenter ${commenterId} on rule ${rule.id}`);
            continue;
          }

          console.log(`[Webhook] ✅ Rule "${rule.name}" matched!`);

          // Optional: public comment reply
          if (rule.auto_reply_enabled && rule.auto_reply_text) {
            await postCommentReply(commentId, rule.auto_reply_text, tokenToUse);
          }

          // Build DM message
          let dmText = rule.reply_message ?? "";
          // Strip any old-format markers
          dmText = dmText
            .replace(/\n\n\[Attached Image: .*?\]/g, "")
            .replace(/\[Button: (.*?)\]\((.*?)\)/g, "$1: $2")
            .replace(/\[Follow Request: (.*?)\]/g, "$1")
            .trim();

          // Pre-DM: ask to follow
          if (rule.ask_follow) {
            dmText = `Please follow our account first! 🙏\n\n${dmText}`;
          }
          // Pre-DM: ask for email
          if (rule.ask_email) {
            dmText = `${dmText}\n\nCould you also share your email so we can send you more details?`;
          }

          // Send the DM
          const dmResult = await sendInstagramDM(
            igBusinessId,
            commentId,
            dmText,
            tokenToUse,
            rule.dm_type === "message_button" ? rule.dm_button_label : null,
            rule.dm_type === "message_button" ? rule.dm_button_url : null
          );

          // Log result
          await supabaseAdmin.from("automation_logs").insert({
            automation_id:           rule.id,
            instagram_user_id:       commenterId,
            comment_text:            commentText,
            comment_id:              commentId,
            dm_sent:                 dmResult.success,
            dm_sent_at:              dmResult.success ? new Date().toISOString() : null,
            error_message:           dmResult.error ?? null,
          });

          if (dmResult.success) {
            console.log("[Webhook] ✅ DM sent to:", commenterId);
            // Increment execution counter
            await supabaseAdmin
              .from("automation_rules")
              .update({
                executions:     (rule.executions || 0) + 1,
                last_execution: new Date().toISOString(),
              })
              .eq("id", rule.id);
          } else {
            console.error("[Webhook] ❌ DM failed:", dmResult.error);
          }
        }
      }

      // ── DM / messaging events ────────────────────────────────────────────
      for (const messaging of entry.messaging ?? []) {
        const senderId    = messaging.sender?.id;
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
