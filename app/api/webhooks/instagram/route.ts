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

  console.log("[Webhook/GET] Verification attempt — mode:", mode, "token:", token);

  if (mode === "subscribe" && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    console.log("[Webhook/GET] ✅ WEBHOOK_VERIFIED");
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  console.error("[Webhook/GET] ❌ Verification FAILED — token mismatch or wrong mode");
  return new Response("Forbidden", { status: 403 });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Incoming Instagram events
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[Webhook/POST] ✅ Event received:", JSON.stringify(body, null, 2));

    // Log raw event to DB (fire-and-forget, don't block on failure)
    supabaseAdmin.from("webhook_events").insert({
      event_type: "instagram_webhook",
      payload: body,
      processed: false,
    }).then(({ error }) => {
      if (error) console.error("[Webhook] ⚠️ Could not log webhook_event to DB:", error.message);
    });

    // ── Only handle Instagram events ──────────────────────────────────────
    if (body.object !== "instagram") {
      console.log("[Webhook/POST] Skipping — object is not 'instagram':", body.object);
      return NextResponse.json({ status: "ok" });
    }

    for (const entry of body.entry ?? []) {
      const igAccountId = entry.id; // Instagram Business Account ID from Meta
      console.log("[Webhook] Processing entry for IG Business Account ID:", igAccountId);

      // ── Handle comment events ─────────────────────────────────────────
      for (const change of entry.changes ?? []) {
        if (change.field !== "comments") {
          console.log("[Webhook] Skipping change field:", change.field);
          continue;
        }

        const commentValue = change.value;
        const commentId    = commentValue.id;
        const commentText  = commentValue.text;
        const commenterId  = commentValue.from?.id;
        const mediaId      = commentValue.media?.id;

        console.log(`[Webhook] 💬 Comment: "${commentText}" from ${commenterId} on media ${mediaId}`);

        // STEP 1 — find the IG account in our DB
        const { data: igAccount, error: accError } = await supabaseAdmin
          .from("instagram_accounts")
          .select("id, user_id, access_token, facebook_page_id, username")
          .eq("instagram_business_id", igAccountId)
          .maybeSingle();

        if (accError) {
          console.error("[Webhook] ❌ DB error fetching IG account:", accError.message);
          continue;
        }
        if (!igAccount) {
          console.error("[Webhook] ❌ No IG account in DB for business ID:", igAccountId,
            "— Make sure this Instagram account is connected in the Integrations page.");
          continue;
        }
        console.log("[Webhook] ✅ Found IG account:", igAccount.username, "(user_id:", igAccount.user_id + ")");

        // STEP 2 — fetch active automation rules for this user + this IG account
        const { data: rules, error: rulesError } = await supabaseAdmin
          .from("automation_rules")
          .select("*")
          .eq("user_id", igAccount.user_id)
          .eq("instagram_account_id", igAccount.id)
          .eq("active", true);

        if (rulesError) {
          console.error("[Webhook] ❌ DB error fetching rules:", rulesError.message);
          continue;
        }
        if (!rules || rules.length === 0) {
          console.log("[Webhook] ⚠️ No active rules found for user:", igAccount.user_id,
            "and account:", igAccount.id,
            "— Create and activate a rule in the Automation page.");
          continue;
        }
        console.log("[Webhook] Found", rules.length, "active rule(s)");

        // STEP 3 — match comment text against keywords
        let matchedRule = null;
        for (const rule of rules) {
          // Skip if this rule is scoped to a specific post that doesn't match
          if (rule.comment_scope === "specific" && rule.instagram_media_id && rule.instagram_media_id !== mediaId) {
            console.log(`[Webhook] Rule "${rule.name}" skipped — scoped to ${rule.instagram_media_id}, comment on ${mediaId}`);
            continue;
          }

          if (rule.trigger_keyword === "Any comment") {
            console.log(`[Webhook] Rule "${rule.name}" matched — trigger is "Any comment"`);
            matchedRule = rule;
            break;
          }

          const keywords = rule.trigger_keyword
            .split(",")
            .map((k: string) => k.trim().toLowerCase())
            .filter(Boolean);
          const textLower = commentText?.toLowerCase() ?? "";

          const hit = keywords.find((k: string) => textLower.includes(k));
          if (hit) {
            console.log(`[Webhook] Rule "${rule.name}" matched keyword: "${hit}"`);
            matchedRule = rule;
            break;
          } else {
            console.log(`[Webhook] Rule "${rule.name}" — keywords [${keywords.join(", ")}] not in "${textLower}"`);
          }
        }

        if (!matchedRule) {
          console.log("[Webhook] ℹ️ Comment did not match any active rule keywords.");
          continue;
        }

        // Token to use for all Graph API calls
        const tokenToUse = process.env.MESSENGER_ACCESS_TOKEN || igAccount.access_token;

        // STEP 4 — Optional: public reply to the comment
        if (matchedRule.reply_message) {
          const replyRes  = await fetch(`https://graph.facebook.com/v19.0/${commentId}/replies`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenToUse}` },
            body: JSON.stringify({ message: "Sent you a DM! 🚀" }),
          });
          const replyData = await replyRes.json();
          if (replyData.error) {
            console.error("[Webhook] ⚠️ Public reply failed (non-fatal):", JSON.stringify(replyData.error));
          } else {
            console.log("[Webhook] ✅ Public comment reply sent");
          }
        }

        // STEP 5 — Send the private DM
        // 
        // The Messages API requires a Facebook Page ID as the sender.
        // facebook_page_id must be set on the instagram_accounts row.
        // If it's missing, we log a clear error and still try with igAccountId as last resort.
        //
        const pageIdToUse = igAccount.facebook_page_id || igAccountId;
        if (!igAccount.facebook_page_id) {
          console.warn(
            "[Webhook] ⚠️ facebook_page_id is NULL on instagram_accounts row!",
            "Falling back to Instagram Business ID:", igAccountId,
            "— THIS WILL LIKELY FAIL. Fix: UPDATE instagram_accounts SET facebook_page_id='YOUR_FB_PAGE_ID' WHERE id='" + igAccount.id + "';"
          );
        } else {
          console.log("[Webhook] Using Facebook Page ID:", pageIdToUse, "to send DM");
        }

        console.log("[Webhook] Sending DM to commenter:", commenterId, "via page:", pageIdToUse);
        const dmRes  = await fetch(`https://graph.facebook.com/v19.0/${pageIdToUse}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenToUse}` },
          body: JSON.stringify({
            recipient: { comment_id: commentId },
            message:   { text: matchedRule.reply_message },
          }),
        });
        const dmData = await dmRes.json();

        if (dmData.error) {
          console.error("[Webhook] ❌ DM FAILED:", JSON.stringify(dmData.error, null, 2));
          await supabaseAdmin.from("automation_logs").insert({
            automation_id:     matchedRule.id,
            instagram_user_id: commenterId,
            comment_text:      commentText,
            dm_sent:           false,
            error_message:     JSON.stringify(dmData.error),
          });
        } else {
          console.log("[Webhook] ✅ DM sent successfully to:", commenterId, "| message_id:", dmData.message_id);
          await supabaseAdmin.from("automation_logs").insert({
            automation_id:     matchedRule.id,
            instagram_user_id: commenterId,
            comment_text:      commentText,
            dm_sent:           true,
          });
          // Increment execution counter
          await supabaseAdmin
            .from("automation_rules")
            .update({
              executions:     (matchedRule.executions || 0) + 1,
              last_execution: new Date().toISOString(),
            })
            .eq("id", matchedRule.id);
        }
      }

      // ── Handle DM / messaging events ──────────────────────────────────
      for (const messaging of entry.messaging ?? []) {
        const senderId  = messaging.sender?.id;
        const messageText = messaging.message?.text;
        if (!senderId || !messageText) continue;

        console.log(`[Webhook] 📩 DM received from ${senderId}: "${messageText}"`);
        // DM automation can be added here in a future iteration
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Webhook] 💥 Unhandled error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
