import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Shared types
interface IGButton {
  type: string;
  url?: string;
  title: string;
  payload?: string;
}

interface QuickReply {
  label: string;
}

interface DMRequestBody {
  recipient: { id: string } | { comment_id: string };
  message: Record<string, unknown>;
  access_token: string;
}

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

// Helper to safely parse JSON
function safeParseJSON(str: any) {
  if (typeof str === "object") return str;
  try {
    return JSON.parse(str || "[]");
  } catch (e) {
    return [];
  }
}

/** Check if same commenter already got a DM from same automation within cooldown window */
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
    .eq("commenter_instagram_id", commenterId)
    .eq("dm_sent_status", "sent")
    .gte("created_at", since)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/** Check if the user is already following the business account */
async function checkIfUserFollows(
  commenterId: string,
  accessToken: string
): Promise<{ follows: boolean; verified: boolean }> {
  try {
    // Only use graph.instagram.com — graph.facebook.com needs a Page token (different token type)
    // is_user_follow_business only works with instagram_manage_insights permission
    const url = `https://graph.instagram.com/v21.0/${commenterId}?fields=is_user_follow_business&access_token=${accessToken}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    console.log(`[FOLLOW-CHECK] user=${commenterId} response:`, JSON.stringify(data));

    if (data.error) {
      console.warn(`[FOLLOW-CHECK] ⚠️ API error:`, JSON.stringify(data.error));
      // If API fails (permissions issue etc.), DO NOT assume follows=true
      // Return verified=false so caller can decide
      return { follows: false, verified: false };
    }

    if (data.is_user_follow_business !== undefined) {
      console.log(`[FOLLOW-CHECK] ✅ Result: follows=${data.is_user_follow_business}`);
      return { follows: !!data.is_user_follow_business, verified: true };
    }

    // Field not returned = likely missing permission instagram_manage_insights
    console.warn(`[FOLLOW-CHECK] ⚠️ is_user_follow_business not in response. Permission missing?`);
    return { follows: false, verified: false };

  } catch (err) {
    console.error("[FOLLOW-CHECK] ❌ Exception:", err);
    return { follows: false, verified: false };
  }
}

/** Count DMs sent from this IG account in the last hour (rate limit: 200/hr) */
async function isRateLimited(igAccountDbId: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: automations } = await supabaseAdmin
    .from("automations")
    .select("id")
    .eq("instagram_account_id", igAccountDbId);

  if (!automations || automations.length === 0) return false;
  const ids = automations.map((a) => a.id);

  const { count } = await supabaseAdmin
    .from("automation_logs")
    .select("id", { count: "exact", head: true })
    .in("automation_id", ids)
    .eq("dm_sent_status", "sent")
    .gte("created_at", since);

  return (count ?? 0) >= 200;
}

/** Send a DM via Instagram Graph API */
async function sendInstagramDM(
  recipient: { id: string } | { comment_id: string },
  message: string,
  accessToken: string,
  buttonLabelOrButtons?: string | Array<IGButton> | null,
  buttonUrl?: string | null
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const url = `https://graph.instagram.com/v21.0/me/messages`;

  let buttonsArray: Array<IGButton> = [];
  if (Array.isArray(buttonLabelOrButtons)) {
    buttonsArray = buttonLabelOrButtons;
  } else if (typeof buttonLabelOrButtons === "string" && buttonUrl) {
    buttonsArray = [{ type: "web_url", url: buttonUrl, title: buttonLabelOrButtons }];
  }

  let body: DMRequestBody | null = null;

  // Use quick replies if all buttons are of postback type (avoids clunky template UI and triggers standard messages webhook)
  const useQuickReplies = buttonsArray.length > 0 && buttonsArray.every(btn => btn.type === "postback");

  if (useQuickReplies) {
    body = {
      recipient,
      message: {
        text: message,
        quick_replies: buttonsArray.map(btn => ({
          content_type: "text",
          title: btn.title,
          payload: btn.payload || ""
        }))
      },
      access_token: accessToken,
    };
  } else if (buttonsArray.length > 0) {
    const truncatedTitle = message.length > 80 ? message.substring(0, 77) + "..." : message;
    body = {
      recipient,
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              {
                title: truncatedTitle,
                buttons: buttonsArray,
              },
            ],
          },
        },
      },
      access_token: accessToken,
    };
  } else {
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
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error" };
  }
}

/** Process follow gate clicks and verification */
async function handleFollowPostback(
  senderId: string,
  automationId: string,
  commentId: string,
  igBusinessId: string,
  isInitialVerify: boolean = false
) {
  console.log(`[FOLLOW-GATE] postback: user=${senderId}, auto=${automationId}, comment=${commentId}, isInitial=${isInitialVerify}`);
  
  try {
    // 1. Fetch IG account
    const { data: igAccounts } = await supabaseAdmin
      .from("instagram_accounts")
      .select("id, user_id, access_token, username")
      .eq("instagram_business_id", igBusinessId.toString())
      .order("updated_at", { ascending: false })
      .limit(1);

    const igAccount = igAccounts?.[0] ?? null;
    if (!igAccount) return;

    // 2. Fetch automation
    const { data: automation } = await supabaseAdmin
      .from("automations")
      .select("*")
      .eq("id", automationId)
      .maybeSingle();

    if (!automation) return;

    // 3. Verify follow status
    const followCheck = await checkIfUserFollows(senderId, igAccount.access_token);
    
    if (followCheck.follows) {
      if (automation.email_ask_enabled) {
        // Both gates enabled! Transition to Email Gate
        const token = crypto.randomUUID();
        await supabaseAdmin.from("email_pending_requests").insert({
          token: token,
          automation_id: automation.id,
          commenter_instagram_id: senderId,
          commenter_username: "[Postback User]",
          status: "waiting_for_email"
        });

        const collectionUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/collect-email?token=${token}`;
        let emailMsgText = automation.email_ask_message || "📧 Get your free guide! Click here to enter your email:\n\n{link}\n\nYour guide will be sent to your DMs instantly after you submit.";
        
        if (emailMsgText.includes("{link}")) {
          emailMsgText = emailMsgText.replace("{link}", collectionUrl);
        } else {
          emailMsgText = `${emailMsgText}\n\n${collectionUrl}`;
        }

        const dmRes = await sendInstagramDM(
          { id: senderId },
          emailMsgText,
          igAccount.access_token,
          automation.email_ask_btn_label || "Send Guide",
          collectionUrl
        );

        // Update pending follow request status
        await supabaseAdmin
          .from("pending_follow_requests")
          .update({ status: "completed" })
          .eq("automation_id", automation.id)
          .eq("commenter_id", senderId);

        // Log transition
        await supabaseAdmin.from("automation_logs").insert({
          automation_id: automation.id,
          commenter_username: "[Postback Verified]",
          commenter_instagram_id: senderId,
          comment_text: "[Transition to Email Gate]",
          matched_keyword: null,
          follow_check_passed: true,
          dm_sent_status: dmRes.success ? "pending" : "failed",
          error_message: dmRes.error ?? null
        });
      } else {
        // User follows! Send initial DM with "Send Access" postback button (2-step flow)
        const initialMsg = (automation.initial_dm_message || "").trim() ||
          "Thanks for commenting! Tap below and I'll send you the access instantly 🚀";
        const accessBtnLabel = (automation.dm_button_text || "").trim() || "Send Access";

        const payload = `send_access:${automation.id}:${commentId}`;
        console.log(`[DEBUG] Sending button with payload: ${payload}`);

        const dmResult = await sendInstagramDM(
          { id: senderId },
          initialMsg,
          igAccount.access_token,
          [{ type: "postback", title: accessBtnLabel, payload }]
        );

        // Log initial DM log
        await supabaseAdmin.from("automation_logs").insert({
          automation_id: automation.id,
          commenter_username: "[Postback Verified]",
          commenter_instagram_id: senderId,
          comment_text: "[Follow Gate Passed - Sent Initial DM]",
          matched_keyword: null,
          follow_check_passed: true,
          dm_sent_status: dmResult.success ? "pending" : "failed",
          error_message: dmResult.error ?? null
        });

        // Update pending follow request status
        await supabaseAdmin
          .from("pending_follow_requests")
          .update({ status: "completed" })
          .eq("automation_id", automation.id)
          .eq("commenter_id", senderId);

        // Update statistics (increment total_triggers; total_success is incremented in send_access postback)
        if (dmResult.success) {
          await supabaseAdmin
            .from("automations")
            .update({
              total_triggers: (automation.total_triggers || 0) + 1
            })
            .eq("id", automation.id);
        }
      }
    } else {
      // Still not following
      if (isInitialVerify) {
        // First click failed -> Send Follow Check Message (Oops! Looks like you haven't followed...)
        const followCheckMsg = automation.follow_check_msg || "Oops! Looks like you haven't followed me yet 👀\nIt would mean a lot if you could visit my profile and hit that follow button 😅.";
        const profileUrl = `https://instagram.com/${igAccount.username}`;

        await sendInstagramDM(
          { id: senderId },
          followCheckMsg,
          igAccount.access_token,
          [
            { type: "web_url", url: profileUrl, title: automation.follow_check_btn1_label || "Visit Profile" },
            { type: "postback", title: automation.follow_check_btn2_label || "I'm following ✅", payload: `check_follow:${automation.id}:${commentId}` }
          ]
        );
      } else {
        // Subsequent click failed -> Send a friendly warning reminder
        await sendInstagramDM(
          { id: senderId },
          `I still don't see you following @${igAccount.username}. Please hit the follow button and tap "${automation.follow_check_btn2_label || "I'm following ✅"}" again!`,
          igAccount.access_token
        );

        // Update reminder count
        await supabaseAdmin
          .from("pending_follow_requests")
          .update({ reminder_sent_count: 1 })
          .eq("automation_id", automation.id)
          .eq("commenter_id", senderId);
      }
    }
  } catch (err) {
    console.error("[Webhook] Error handling follow gate postback:", err);
  }
}

/**
 * Handle "Send Access" postback click in normal (no-gate) flow.
 * The user clicked the initial DM's postback button, so we now deliver
 * the main DM payload (dm_message_text) + optional URL access button.
 */
async function handleSendAccessPostback(
  senderId: string,
  automationId: string,
  commentId: string,
  igBusinessId: string
) {
  console.log(`[SEND-ACCESS] postback: user=${senderId}, auto=${automationId}`);

  try {
    // 1. Fetch IG account
    const { data: igAccounts } = await supabaseAdmin
      .from("instagram_accounts")
      .select("id, user_id, access_token, username")
      .eq("instagram_business_id", igBusinessId.toString())
      .order("updated_at", { ascending: false })
      .limit(1);

    const igAccount = igAccounts?.[0] ?? null;
    if (!igAccount) {
      console.warn("[SEND-ACCESS] IG account not found:", igBusinessId);
      return;
    }

    // 2. Fetch automation
    const { data: automation } = await supabaseAdmin
      .from("automations")
      .select("*")
      .eq("id", automationId)
      .maybeSingle();

    if (!automation) {
      console.warn("[SEND-ACCESS] Automation not found:", automationId);
      return;
    }

    // 3. Check follow status (ONLY if follow_first_enabled is ON)
    if (automation.follow_first_enabled) {
      console.log(`[SEND-ACCESS] follow_first_enabled=true, checking follow for user=${senderId}`);
      
      const followCheck = await checkIfUserFollows(senderId, igAccount.access_token);
      console.log(`[SEND-ACCESS] Follow check result: follows=${followCheck.follows}, verified=${followCheck.verified}`);

      if (!followCheck.follows) {
        // User is NOT following — send "please follow first" DM
        console.log(`[SEND-ACCESS] User not following. Sending follow-gate message.`);

        const followMsg = automation.follow_check_msg ||
          "Oops! Looks like you haven't followed me yet 👀\nIt would mean a lot if you could visit my profile and hit that follow button 😅";

        const profileUrl = `https://instagram.com/${igAccount.username}`;

        const followDmResult = await sendInstagramDM(
          { id: senderId },
          followMsg,
          igAccount.access_token,
          [
            {
              type: "web_url",
              url: profileUrl,
              title: automation.follow_check_btn1_label || "Visit Profile"
            },
            {
              type: "postback",
              title: automation.follow_check_btn2_label || "I'm following ✅",
              // Re-use verify_follow_initial so clicking "I'm following" re-checks
              payload: `verify_follow_initial:${automation.id}:${commentId}`
            }
          ]
        );

        // Log the failed follow check
        await supabaseAdmin.from("automation_logs").insert({
          automation_id: automation.id,
          commenter_username: "[Send Access Postback]",
          commenter_instagram_id: senderId,
          comment_text: "[Follow check failed on Send Access click]",
          matched_keyword: null,
          follow_check_passed: false,
          dm_sent_status: followDmResult.success ? "pending" : "failed",
          error_message: followDmResult.error ?? null
        });

        // Save pending follow request so "I'm following" button works
        await supabaseAdmin
          .from("pending_follow_requests")
          .upsert({
            automation_id: automation.id,
            commenter_id: senderId,
            status: "waiting"
          }, { onConflict: "automation_id,commenter_id" });

        return; // Stop here — don't send main DM
      }

      console.log(`[SEND-ACCESS] ✅ User IS following. Proceeding to send main DM.`);
    } else {
      console.log(`[SEND-ACCESS] follow_first_enabled=false, skipping follow check.`);
    }

    // 4. If email gate is enabled, transition to email gate
    if (automation.email_ask_enabled) {
      const token = crypto.randomUUID();
      await supabaseAdmin.from("email_pending_requests").insert({
        token,
        automation_id: automation.id,
        commenter_instagram_id: senderId,
        commenter_username: "[Postback User]",
        status: "waiting_for_email"
      });

      const collectionUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/collect-email?token=${token}`;
      let emailMsgText = automation.email_ask_message ||
        "📧 Get your free guide! Click here to enter your email:\n\n{link}\n\nYour guide will be sent to your DMs instantly after you submit.";

      if (emailMsgText.includes("{link}")) {
        emailMsgText = emailMsgText.replace("{link}", collectionUrl);
      } else {
        emailMsgText = `${emailMsgText}\n\n${collectionUrl}`;
      }

      const dmRes = await sendInstagramDM(
        { id: senderId },
        emailMsgText,
        igAccount.access_token,
        automation.email_ask_btn_label || "Send Guide",
        collectionUrl
      );

      await supabaseAdmin.from("automation_logs").insert({
        automation_id: automation.id,
        commenter_username: "[Send Access Postback]",
        commenter_instagram_id: senderId,
        comment_text: "[Email Gate Triggered via Send Access]",
        matched_keyword: null,
        follow_check_passed: true,
        dm_sent_status: dmRes.success ? "pending" : "failed",
        error_message: dmRes.error ?? null
      });
      return;
    }

    // 5. Normal path: deliver main DM payload
    const dmText = (automation.dm_message_text || "").toString().trim();
    if (!dmText) {
      console.warn("[SEND-ACCESS] No dm_message_text set for automation:", automationId);
      return;
    }

    const hasUrlButton = !!automation.dm_button_url;
    const urlBtnLabel = automation.dm_button_text || "Access Link";

    const dmResult = await sendInstagramDM(
      { id: senderId },
      dmText,
      igAccount.access_token,
      hasUrlButton ? urlBtnLabel : null,
      hasUrlButton ? automation.dm_button_url : null
    );

    console.log(`[SEND-ACCESS] Main DM result: success=${dmResult.success}, error=${dmResult.error}`);

    // 6. Log result
    await supabaseAdmin.from("automation_logs").insert({
      automation_id: automation.id,
      commenter_username: "[Send Access Postback]",
      commenter_instagram_id: senderId,
      comment_text: "[Main DM delivered via Send Access]",
      matched_keyword: null,
      follow_check_passed: true,
      dm_sent_status: dmResult.success ? "sent" : "failed",
      error_message: dmResult.error ?? null
    });

    // 7. Update stats
    if (dmResult.success) {
      await supabaseAdmin
        .from("automations")
        .update({
          total_success: (automation.total_success || 0) + 1,
          total_triggers: (automation.total_triggers || 0) + 1
        })
        .eq("id", automation.id);
    } else {
      await supabaseAdmin
        .from("automations")
        .update({ total_failed: (automation.total_failed || 0) + 1 })
        .eq("id", automation.id);
    }

  } catch (err) {
    console.error("[SEND-ACCESS] ❌ Unhandled error:", err);
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
    console.log("🚨🚨🚨 [EMERGENCY] Raw webhook event:", JSON.stringify(body, null, 2));

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

      // ── Direct Message (DM) & Messaging events ───────────────────────────
      for (const msg of entry.messaging ?? []) {
        const senderId = msg.sender?.id;
        const recipientId = msg.recipient?.id;
        if (!senderId || recipientId !== igBusinessId) continue;

        // Fetch IG account
        const { data: igAccounts } = await supabaseAdmin
          .from("instagram_accounts")
          .select("id, user_id, access_token, username")
          .eq("instagram_business_id", igBusinessId.toString())
          .order("updated_at", { ascending: false })
          .limit(1);
        const igAccount = igAccounts?.[0] ?? null;
        if (!igAccount) continue;

        // Handle button clicks (postbacks) or Quick Replies
        const payload = msg.postback?.payload || msg.message?.quick_reply?.payload;
        if (payload) {
          console.log(`[Webhook] Postback/QuickReply clicked by user ${senderId}: payload="${payload}"`);
          
          if (payload.startsWith("verify_follow_initial:")) {
            const parts = payload.split(":");
            const autoId = parts[1];
            const commentId = parts[2];
            await handleFollowPostback(senderId, autoId, commentId, igBusinessId, true);
          } else if (payload.startsWith("check_follow:")) {
            const parts = payload.split(":");
            const autoId = parts[1];
            const commentId = parts[2];
            await handleFollowPostback(senderId, autoId, commentId, igBusinessId, false);
          } else if (payload.startsWith("send_access:")) {
            // Normal (no-gate) flow: user clicked "Send Access" → deliver main DM
            const parts = payload.split(":");
            const autoId = parts[1];
            const commentId = parts[2] || "";
            await handleSendAccessPostback(senderId, autoId, commentId, igBusinessId);
          }
          continue;
        }

        // Handle text reply "DONE", "following", or similar keywords
        const rawMessageText = msg.message?.text;
        if (rawMessageText && !msg.message?.quick_reply) {
          const cleanText = rawMessageText.trim().toLowerCase();
          
          const isFollowVerificationWord = [
            "done", "following", "i am following", "i'm following",
            "send me the access", "send me access", "send access", "get access", "access"
          ].some(word => cleanText.includes(word));

          if (isFollowVerificationWord) {
            // Find recent pending follow request for this user
            const { data: recentRequests } = await supabaseAdmin
              .from("pending_follow_requests")
              .select("automation_id, id")
              .eq("commenter_id", senderId)
              .eq("status", "waiting")
              .order("first_check_time", { ascending: false })
              .limit(1);

            if (recentRequests && recentRequests.length > 0) {
              const req = recentRequests[0];
              console.log(`[Webhook] Text verification triggered for user ${senderId} on message "${rawMessageText}"`);
              await handleFollowPostback(senderId, req.automation_id, "text_verify", igBusinessId, false);
            }
          }
        }
      }

      // ── Comment events ──────────────────────────────────────────────────
      for (const change of entry.changes ?? []) {
        if (change.field !== "comments") continue;

        const commentValue = change.value;
        const commentId = commentValue.id;
        const commentText = commentValue.text ?? "";
        const commenterId = commentValue.from?.id;
        const commenterUsername = commentValue.from?.username ?? "user";
        const mediaId = commentValue.media?.id;

        if (!commentId || !commenterId) continue;
        if (commenterId === igBusinessId) continue; // skip own comments

        // Fetch IG account details
        const { data: igAccounts } = await supabaseAdmin
          .from("instagram_accounts")
          .select("id, user_id, access_token, username")
          .eq("instagram_business_id", igBusinessId.toString())
          .order("updated_at", { ascending: false })
          .limit(1);

        const igAccount = igAccounts?.[0] ?? null;
        if (!igAccount) continue;

        if (await isRateLimited(igAccount.id)) {
          console.warn("[Webhook] Rate limited:", igAccount.username);
          continue;
        }

        // Fetch active automations
        const { data: automations } = await supabaseAdmin
          .from("automations")
          .select("*")
          .eq("instagram_account_id", igAccount.id)
          .eq("is_active", true);

        if (!automations || automations.length === 0) continue;

        const tokenToUse = igAccount.access_token;

        for (const automation of automations) {
          // 1. Post ID Scope Match
          if (automation.trigger_type === "specific_post" && automation.specific_post_id !== mediaId) {
            continue;
          }

          // 2. Keywords Match (JSON array)
          const commentLower = commentText.toLowerCase();
          const keywords = safeParseJSON(automation.trigger_keywords);
          const excludes = safeParseJSON(automation.exclude_keywords);

          // Check excludes
          const hasExclude = excludes.some((kw: string) => commentLower.includes(kw.toLowerCase()));
          if (hasExclude) continue;

          let isMatch = false;
          let matchedKeyword = "any";
          const keywordMode = automation.keyword_mode || "any";

          if (keywordMode === "any_comment") {
            isMatch = true;
            matchedKeyword = "any_comment";
          } else if (keywordMode === "exact") {
            if (keywords.length === 0) {
              isMatch = true;
            } else {
              const commentTrimmed = commentText.trim().toLowerCase();
              const found = keywords.find((kw: string) => commentTrimmed === kw.trim().toLowerCase());
              if (found) {
                isMatch = true;
                matchedKeyword = found;
              }
            }
          } else if (keywordMode === "all") {
            if (keywords.length === 0) {
              isMatch = true;
            } else {
              const allMatched = keywords.every((kw: string) => commentLower.includes(kw.toLowerCase()));
              if (allMatched) {
                isMatch = true;
                matchedKeyword = keywords.join(" & ");
              }
            }
          } else {
            // Default to 'any'
            if (keywords.length === 0) {
              isMatch = true;
            } else {
              const found = keywords.find((kw: string) => commentLower.includes(kw.toLowerCase()));
              if (found) {
                isMatch = true;
                matchedKeyword = found;
              }
            }
          }

          if (!isMatch) continue;

          // 3. Deduplication Check
          if (await isDuplicate(automation.id, commenterId, 24)) {
            console.log(`[Webhook] Duplicate comment trigger skipped: user=${commenterId}`);
            continue;
          }

          // 4. Public Comment Reply (use automation.comment_reply_text, fallback to default)
          await postCommentReply(
            commentId,
            (automation.comment_reply_text || "").trim() || "Thanks for the comment! Check your DMs 📩",
            tokenToUse
          );

          // Helper to trigger email gate
          const triggerEmailGate = async () => {
            const token = crypto.randomUUID();
            await supabaseAdmin.from("email_pending_requests").insert({
              token: token,
              automation_id: automation.id,
              commenter_instagram_id: commenterId,
              commenter_username: commenterUsername,
              status: "waiting_for_email"
            });

            const collectionUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/collect-email?token=${token}`;
            let emailMsgText = automation.email_ask_message || "📧 Get your free guide! Click here to enter your email:\n\n{link}\n\nYour guide will be sent to your DMs instantly after you submit.";
            
            if (emailMsgText.includes("{link}")) {
              emailMsgText = emailMsgText.replace("{link}", collectionUrl);
            } else {
              emailMsgText = `${emailMsgText}\n\n${collectionUrl}`;
            }

            // Send DM request with button
            const dmRes = await sendInstagramDM(
              { comment_id: commentId },
              emailMsgText,
              tokenToUse,
              automation.email_ask_btn_label || "Send Guide",
              collectionUrl
            );

            // Log trigger
            await supabaseAdmin.from("automation_logs").insert({
              automation_id: automation.id,
              commenter_username: commenterUsername,
              commenter_instagram_id: commenterId,
              comment_text: commentText,
              matched_keyword: matchedKeyword,
              follow_check_passed: automation.follow_first_enabled,
              email_collected: null,
              dm_sent_status: dmRes.success ? "pending" : "failed",
              error_message: dmRes.error ?? null
            });
          };

          // 5. Handle Gates
          if (automation.follow_first_enabled) {
            // --- Follow First Gate ---
            const followCheck = await checkIfUserFollows(commenterId, tokenToUse);
            
            if (followCheck.follows) {
              // Already following, check if email collection is also required
              if (automation.email_ask_enabled) {
                await triggerEmailGate();
              } else {
                // Already following, transition to 2-step flow (Initial DM + Send Access button)
                const initialMsg = (automation.initial_dm_message || "").trim() ||
                  "Thanks for commenting! Tap below and I'll send you the access instantly 🚀";
                const accessBtnLabel = (automation.dm_button_text || "").trim() || "Send Access";

                const payload = `send_access:${automation.id}:${commentId}`;
                console.log(`[DEBUG] Sending button with payload: ${payload}`);

                const dmResult = await sendInstagramDM(
                  { comment_id: commentId },
                  initialMsg,
                  tokenToUse,
                  [{ type: "postback", title: accessBtnLabel, payload }]
                );

                await supabaseAdmin.from("automation_logs").insert({
                  automation_id: automation.id,
                  commenter_username: commenterUsername,
                  commenter_instagram_id: commenterId,
                  comment_text: commentText,
                  matched_keyword: matchedKeyword,
                  follow_check_passed: true,
                  dm_sent_status: dmResult.success ? "pending" : "failed",
                  error_message: dmResult.error ?? null
                });

                if (dmResult.success) {
                  await supabaseAdmin
                    .from("automations")
                    .update({
                      total_triggers: (automation.total_triggers || 0) + 1
                    })
                    .eq("id", automation.id);
                }
              }
            } else {
              // Not following, send initial follow-gate DM ("a DM asking to follow you")
              const openingMsg = automation.follow_first_opening_message || "Hey! I'm so glad you're here - thanks a ton for stopping by 😊\n\nTap below and I'll send you the access in just a moment ✨";
              const btnLabel = automation.follow_first_btn_label || "Send me the access";

              // Log pending follow request
              await supabaseAdmin.from("pending_follow_requests").insert({
                automation_id: automation.id,
                commenter_id: commenterId,
                status: "waiting"
              });

              // Send the initial follow DM with a postback button
              const dmResult = await sendInstagramDM(
                { comment_id: commentId },
                openingMsg,
                tokenToUse,
                [
                  { type: "postback", title: btnLabel, payload: `verify_follow_initial:${automation.id}:${commentId}` }
                ]
              );

              // Log in logs
              await supabaseAdmin.from("automation_logs").insert({
                automation_id: automation.id,
                commenter_username: commenterUsername,
                commenter_instagram_id: commenterId,
                comment_text: `[Follow Gate Opener] ${commentText}`,
                matched_keyword: matchedKeyword,
                follow_check_passed: false,
                dm_sent_status: dmResult.success ? "pending" : "failed",
                error_message: dmResult.error ?? null
              });
            }
          } else if (automation.email_ask_enabled) {
            // --- Only Email Gate active ---
            await triggerEmailGate();
          } else {
            // --- Normal direct payload DM (2-step flow) ---
            // Step 1: Send initial DM with a "Send Access" postback button.
            // Step 2: When user clicks the button, handleSendAccessPostback() delivers the main DM.
            const initialMsg = (automation.initial_dm_message || "").trim() ||
              "Thanks for commenting! Tap below and I'll send you the access instantly 🚀";
            const accessBtnLabel = (automation.dm_button_text || "").trim() || "Send Access";

            const payload = `send_access:${automation.id}:${commentId}`;
            console.log(`[DEBUG] Sending button with payload: ${payload}`);

            const dmResult = await sendInstagramDM(
              { comment_id: commentId },
              initialMsg,
              tokenToUse,
              [{ type: "postback", title: accessBtnLabel, payload }]
            );

            // Log as "pending" — success will be counted when postback is received
            await supabaseAdmin.from("automation_logs").insert({
              automation_id: automation.id,
              commenter_username: commenterUsername,
              commenter_instagram_id: commenterId,
              comment_text: commentText,
              matched_keyword: matchedKeyword,
              follow_check_passed: true,
              dm_sent_status: dmResult.success ? "pending" : "failed",
              error_message: dmResult.error ?? null
            });

            // Update total_triggers (total_success counted in postback handler)
            await supabaseAdmin
              .from("automations")
              .update({
                total_triggers: (automation.total_triggers || 0) + 1,
                ...(dmResult.success ? {} : { total_failed: (automation.total_failed || 0) + 1 })
              })
              .eq("id", automation.id);
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Webhook] 💥 Unhandled error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
