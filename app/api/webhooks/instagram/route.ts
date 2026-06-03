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

/** Check if same commenter already got a DM from same rule within cooldown window */
async function isDuplicate(
  automationId: string,
  commenterId: string,
  cooldownHours: number
): Promise<boolean> {
  if (cooldownHours <= 0) return false;
  const since = new Date(Date.now() - cooldownHours * 60 * 60 * 1000).toISOString();
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

/** Check if the user is already following the business account */
async function checkIfUserFollows(
  commenterId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const fbUrl = `https://graph.facebook.com/v21.0/${commenterId}?fields=is_user_follow_business&access_token=${accessToken}`;
    const fbRes = await fetch(fbUrl);
    const fbData = await fbRes.json();
    console.log(`[Webhook] Follow check response (graph.facebook.com) for ${commenterId}:`, JSON.stringify(fbData));
    
    if (fbData.is_user_follow_business !== undefined) {
      return !!fbData.is_user_follow_business;
    }
    
    const igUrl = `https://graph.instagram.com/v21.0/${commenterId}?fields=is_user_follow_business&access_token=${accessToken}`;
    const igRes = await fetch(igUrl);
    const igData = await igRes.json();
    console.log(`[Webhook] Follow check response (graph.instagram.com) for ${commenterId}:`, JSON.stringify(igData));
    
    if (igData.is_user_follow_business !== undefined) {
      return !!igData.is_user_follow_business;
    }
  } catch (err) {
    console.error("[Webhook] ❌ Exception checking follow status:", err);
  }
  return false;
}

function getDedupeCooldownHours(rule: Record<string, unknown>): number {
  const raw = Number(rule.dedupe_cooldown_hours ?? 24);
  if (!Number.isFinite(raw)) return 24;
  if (raw <= 0) return 0;
  return Math.floor(raw);
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
  buttonLabelOrButtons?: string | Array<any> | null,
  buttonUrl?: string | null
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const url = `https://graph.instagram.com/v21.0/me/messages`;

  let buttonsArray: Array<any> = [];
  if (Array.isArray(buttonLabelOrButtons)) {
    buttonsArray = buttonLabelOrButtons;
  } else if (typeof buttonLabelOrButtons === "string" && buttonUrl) {
    buttonsArray = [{ type: "web_url", url: buttonUrl, title: buttonLabelOrButtons }];
  }

  let body: any = null;

  if (buttonsArray.length > 0) {
    // Button template message
    body = {
      recipient,
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: message,
            buttons: buttonsArray,
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

/** Process follow confirmation postback clicks and send the main DM if follow check succeeds */
async function handleFollowPostback(
  senderId: string,
  ruleId: string,
  commentId: string,
  igBusinessId: string
) {
  console.log(`[Webhook] Processing follow postback for user:${senderId}, rule:${ruleId}, comment:${commentId}`);
  
  // 1. Fetch the IG account from the business ID
  const { data: igAccounts } = await supabaseAdmin
    .from("instagram_accounts")
    .select("id, user_id, access_token, username")
    .eq("instagram_business_id", igBusinessId.toString())
    .order("updated_at", { ascending: false })
    .limit(1);

  const igAccount = igAccounts?.[0] ?? null;
  if (!igAccount) {
    console.error("[Webhook] No IG account found for business ID in postback:", igBusinessId);
    return;
  }
  
  const tokenToUse = igAccount.access_token;

  // Send a status message first
  await sendInstagramDM(
    { id: senderId },
    "Checking your follow status... ⏳",
    tokenToUse
  );

  // 2. Fetch the automation rule
  const { data: rule } = await supabaseAdmin
    .from("automation_rules")
    .select("*")
    .eq("id", ruleId)
    .limit(1)
    .single();

  if (!rule) {
    console.error("[Webhook] Rule not found in postback:", ruleId);
    return;
  }

  // 3. Check if user follows now
  let isFollowing = await checkIfUserFollows(senderId, tokenToUse);
  console.log(`[Webhook] Postback follow check result for ${senderId}: ${isFollowing}`);

  if (!isFollowing) {
    console.log(`[Webhook] Follow check was false. Retrying in 2 seconds...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    isFollowing = await checkIfUserFollows(senderId, tokenToUse);
    console.log(`[Webhook] Postback follow check retry result for ${senderId}: ${isFollowing}`);
  }

  if (isFollowing) {
    // 4. Send the main DM message!
    let dmText = (rule.dm_message || rule.reply_message || "").toString();
    dmText = dmText
      .replace(/\n\n\[Attached Image: .*?\]/g, "")
      .replace(/\[Button: (.*?)\]\((.*?)\)/g, "$1: $2")
      .replace(/\[Follow Request: (.*?)\]/g, "$1")
      .trim();

    if (!dmText) {
      console.warn(`[Webhook] Rule "${rule.rule_name || rule.name}" has no DM message in postback.`);
      return;
    }

    if (rule.ask_email) {
      dmText = `${dmText}\n\nCould you also share your email so we can send you more details?`;
    }

    const hasButton = rule.dm_type === "message_button" || (!!rule.dm_button_label && !!rule.dm_button_url);
    const dmResult = await sendInstagramDM(
      { id: senderId },
      dmText,
      tokenToUse,
      hasButton ? rule.dm_button_label : null,
      hasButton ? rule.dm_button_url : null
    );

    // Log execution
    await supabaseAdmin.from("automation_logs").insert({
      automation_id: rule.id,
      instagram_user_id: senderId,
      comment_text: "[Postback Follow Verification]",
      comment_id: commentId,
      dm_sent: dmResult.success,
      dm_sent_at: dmResult.success ? new Date().toISOString() : null,
      error_message: dmResult.error ?? null,
    });

    if (dmResult.success) {
      console.log("[Webhook] ✅ Main DM sent successfully via postback to:", senderId);
      await supabaseAdmin
        .from("automation_rules")
        .update({
          total_dms_sent: (rule.total_dms_sent || 0) + 1,
          executions: (rule.executions || 0) + 1,
          last_execution: new Date().toISOString(),
        })
        .eq("id", rule.id);
    } else {
      console.error("[Webhook] ❌ Main DM failed via postback for commenter", senderId, ":", dmResult.error);
    }
  } else {
    // Log verification failure
    await supabaseAdmin.from("automation_logs").insert({
      automation_id: rule.id,
      instagram_user_id: senderId,
      comment_text: "[Postback Follow Verification]",
      comment_id: commentId,
      dm_sent: false,
      dm_sent_at: null,
      error_message: "Follow verification failed: User is not following the business account.",
    });

    // Send a reminder with the two buttons again
    const profileUrl = `https://instagram.com/${igAccount.username}`;
    await sendInstagramDM(
      { id: senderId },
      "Oops! It seems you are not following us yet. Please follow us first, then click \"I'm Following\" to get the link! 🙌",
      tokenToUse,
      [
        { type: "web_url", url: profileUrl, title: "Visit Profile" },
        { type: "postback", title: "I'm Following", payload: `check_follow:${ruleId}:${commentId}` }
      ]
    );
  }
}

function getActivationDelayDays(rule: Record<string, unknown>): number {
  const value = Number(rule.activation_delay_days ?? 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

function isRuleEligible(rule: Record<string, unknown>, now: Date): boolean {
  if (rule.active === false || rule.deleted === true) return false;

  const createdAt = rule.created_at ? new Date(String(rule.created_at)) : null;
  if (!createdAt || Number.isNaN(createdAt.getTime())) return true;

  const activationDelayMs = getActivationDelayDays(rule) * 24 * 60 * 60 * 1000;
  return now.getTime() >= createdAt.getTime() + activationDelayMs;
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

        if (!commentId || !commenterId) {
          console.warn("[Webhook] ⚠️ Missing comment ID or commenter ID. Skipping event.");
          continue;
        }

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

        // Fetch all rules for this account and decide which are eligible now.
        // Older rows may have null active/deleted values, so filter in code.
        const { data: rules, error: rulesError } = await supabaseAdmin
          .from("automation_rules")
          .select("*")
          .eq("user_id", igAccount.user_id)
          .eq("instagram_account_id", igAccount.id);

        if (rulesError) {
          console.error("[Webhook] ❌ Failed to fetch active rules:", rulesError.message);
          continue;
        }

        const tokenToUse = igAccount.access_token;
        const activeRules = (rules ?? []).filter((rule) => isRuleEligible(rule as Record<string, unknown>, new Date()));

        if (!rules?.length) {
          console.log("[Webhook] ℹ️ No automation rules found. Sending default DM.");
          // Send a fallback DM to the commenter
          await sendInstagramDM(
            { comment_id: commentId },
            "Thanks for your comment! We'll get back to you soon.",
            tokenToUse
          );
          continue;
        }

        if (!activeRules.length) {
          console.log("[Webhook] ℹ️ Automation rules exist, but none are eligible yet. Skipping fallback DM.");
          continue;
        }

        for (const rule of activeRules) {
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
          const dedupeCooldownHours = getDedupeCooldownHours(rule as Record<string, unknown>);
          if (await isDuplicate(rule.id, commenterId, dedupeCooldownHours)) {
            console.log(
              `[Webhook] ⏭️ Duplicate — skipping commenter ${commenterId} on rule ${rule.id} (${dedupeCooldownHours}h cooldown)`
            );
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
          let isFollowing = false;
          if (shouldAskFollow) {
            isFollowing = await checkIfUserFollows(commenterId, tokenToUse);
            console.log(`[Webhook] Follow status check for user ${commenterId}: ${isFollowing}`);
          }

          if (shouldAskFollow && !isFollowing) {
            const followGateMsg = rule.follow_gate_message || "Hey! Follow me first and I'll send you the link 🙌";
            // Send the follow-gate message first, with a button to visit profile and follow
            const profileUrl = `https://instagram.com/${igAccount.username}`;
            const dmResult = await sendInstagramDM(
              { comment_id: commentId },
              followGateMsg,
              tokenToUse,
              [
                { type: "web_url", url: profileUrl, title: "Visit Profile" },
                { type: "postback", title: "I'm Following", payload: `check_follow:${rule.id}:${commentId}` }
              ]
            );

            // ── Log result for follow gate message ───────────────────────────
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
              console.log("[Webhook] ✅ Follow-gate DM sent successfully to:", commenterId);
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
              console.error("[Webhook] ❌ Follow-gate DM failed for commenter", commenterId, ":", dmResult.error);
            }

            // Skip sending the main DM since they need to follow first
            continue;
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
        if (!senderId) continue;

        // Handle postback (e.g. check follow status)
        if (messaging.postback) {
          const payload = messaging.postback.payload;
          console.log(`[Webhook] 📮 Postback received from ${senderId}: payload="${payload}"`);
          if (payload && payload.startsWith("check_follow:")) {
            const parts = payload.split(":");
            const ruleId = parts[1];
            const commentId = parts[2];
            await handleFollowPostback(senderId, ruleId, commentId, igBusinessId);
          }
          continue;
        }

        // Handle text message
        const messageText = messaging.message?.text;
        if (messageText) {
          console.log(`[Webhook] 📩 DM received from ${senderId}: "${messageText}"`);
          // Future: DM-triggered automations
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Webhook] 💥 Unhandled error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
