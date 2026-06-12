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
    const cacheBuster = Date.now();
    const fbUrl = `https://graph.facebook.com/v21.0/${commenterId}?fields=is_user_follow_business&access_token=${accessToken}&cb=${cacheBuster}`;
    const fbRes = await fetch(fbUrl, { cache: "no-store" });
    const fbData = await fbRes.json();
    console.log(`[Webhook] Follow check response (graph.facebook.com) for ${commenterId}:`, JSON.stringify(fbData));

    if (fbData.error) {
      console.warn(`[Webhook] ⚠️ Facebook API error checking follow: ${JSON.stringify(fbData.error)}`);
    }
    
    if (fbData.is_user_follow_business !== undefined) {
      return { follows: !!fbData.is_user_follow_business, verified: true };
    }
    
    const igUrl = `https://graph.instagram.com/v21.0/${commenterId}?fields=is_user_follow_business&access_token=${accessToken}&cb=${cacheBuster}`;
    const igRes = await fetch(igUrl, { cache: "no-store" });
    const igData = await igRes.json();
    console.log(`[Webhook] Follow check response (graph.instagram.com) for ${commenterId}:`, JSON.stringify(igData));

    if (igData.error) {
      console.warn(`[Webhook] ⚠️ Instagram API error checking follow: ${JSON.stringify(igData.error)}`);
    }
    
    if (igData.is_user_follow_business !== undefined) {
      return { follows: !!igData.is_user_follow_business, verified: true };
    }

    // Be optimistic on missing fields
    console.warn(`[Webhook] ⚠️ is_user_follow_business not returned. Assuming follows=true (optimistic).`);
    return { follows: true, verified: false };
  } catch (err) {
    console.error("[Webhook] ❌ Exception checking follow status:", err);
    return { follows: true, verified: false };
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

  if (buttonsArray.length > 0) {
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
        // User follows! Send final DM payload
        let dmText = (automation.dm_message_text || "").toString().trim();
        const hasButton = !!automation.dm_button_text && !!automation.dm_button_url;

        if (!dmText) return;

        const dmResult = await sendInstagramDM(
          { id: senderId },
          dmText,
          igAccount.access_token,
          hasButton ? automation.dm_button_text : null,
          hasButton ? automation.dm_button_url : null
        );

        // Log success log
        await supabaseAdmin.from("automation_logs").insert({
          automation_id: automation.id,
          commenter_username: "[Postback Verified]",
          commenter_instagram_id: senderId,
          comment_text: "[Follow Verified Gate Success]",
          matched_keyword: null,
          follow_check_passed: true,
          dm_sent_status: dmResult.success ? "sent" : "failed",
          error_message: dmResult.error ?? null
        });

        // Update pending follow request status
        await supabaseAdmin
          .from("pending_follow_requests")
          .update({ status: "completed" })
          .eq("automation_id", automation.id)
          .eq("commenter_id", senderId);

        // Update statistics
        if (dmResult.success) {
          await supabaseAdmin
            .from("automations")
            .update({
              total_success: (automation.total_success || 0) + 1,
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
  _commentId: string,
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
      console.warn("[SEND-ACCESS] IG account not found for business ID:", igBusinessId);
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

    // 3. If email gate is enabled, transition to email gate instead of delivering payload directly
    if (automation.email_ask_enabled) {
      const token = crypto.randomUUID();
      await supabaseAdmin.from("email_pending_requests").insert({
        token: token,
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
        commenter_username: "[Access Postback]",
        commenter_instagram_id: senderId,
        comment_text: "[Email Gate Triggered via Send Access postback]",
        matched_keyword: null,
        follow_check_passed: false,
        dm_sent_status: dmRes.success ? "pending" : "failed",
        error_message: dmRes.error ?? null
      });
      return;
    }

    // 4. Normal path: deliver main DM payload
    const dmText = (automation.dm_message_text || "").toString().trim();
    if (!dmText) {
      console.warn("[SEND-ACCESS] No dm_message_text configured for automation:", automationId);
      return;
    }

    const hasUrlButton = !!automation.dm_button_url;
    // For the main payload we use dm_button_url as a web_url button (access link)
    // dm_button_text is the postback label used for the initial DM; reuse it here or fallback
    const urlBtnLabel = automation.dm_button_text || "Access Link";

    const dmResult = await sendInstagramDM(
      { id: senderId },
      dmText,
      igAccount.access_token,
      hasUrlButton ? urlBtnLabel : null,
      hasUrlButton ? automation.dm_button_url : null
    );

    console.log(`[SEND-ACCESS] Main DM sent: success=${dmResult.success}, error=${dmResult.error}`);

    // 5. Log to automation_logs
    await supabaseAdmin.from("automation_logs").insert({
      automation_id: automation.id,
      commenter_username: "[Access Postback]",
      commenter_instagram_id: senderId,
      comment_text: "[Main payload delivered via Send Access postback]",
      matched_keyword: null,
      follow_check_passed: true,
      dm_sent_status: dmResult.success ? "sent" : "failed",
      error_message: dmResult.error ?? null
    });

    // 6. Update automation statistics
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
    console.error("[Webhook] ❌ Error handling send_access postback:", err);
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

        // Handle button clicks (postbacks)
        if (msg.postback) {
          const payload = msg.postback.payload;
          console.log(`[Webhook] Postback clicked by user ${senderId}: payload="${payload}"`);
          
          if (payload && payload.startsWith("verify_follow_initial:")) {
            const parts = payload.split(":");
            const autoId = parts[1];
            const commentId = parts[2];
            await handleFollowPostback(senderId, autoId, commentId, igBusinessId, true);
          } else if (payload && payload.startsWith("check_follow:")) {
            const parts = payload.split(":");
            const autoId = parts[1];
            const commentId = parts[2];
            await handleFollowPostback(senderId, autoId, commentId, igBusinessId, false);
          } else if (payload && payload.startsWith("send_access:")) {
            // Normal (no-gate) flow: user clicked "Send Access" postback → deliver main DM
            const parts = payload.split(":");
            const autoId = parts[1];
            const commentId = parts[2] || "";
            await handleSendAccessPostback(senderId, autoId, commentId, igBusinessId);
          }
          continue;
        }

        // Handle text reply "DONE" or "following"
        const rawMessageText = msg.message?.text;
        if (rawMessageText) {
          const cleanText = rawMessageText.trim().toLowerCase();
          if (cleanText === "done" || cleanText === "following" || cleanText === "i am following" || cleanText === "i'm following") {
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
          if (keywords.length === 0) {
            isMatch = true;
          } else {
            const found = keywords.find((kw: string) => commentLower.includes(kw.toLowerCase()));
            if (found) {
              isMatch = true;
              matchedKeyword = found;
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
                // Send final payload immediately
                let dmText = (automation.dm_message_text || "").toString().trim();
                const hasButton = !!automation.dm_button_text && !!automation.dm_button_url;

                if (dmText) {
                  const dmResult = await sendInstagramDM(
                    { comment_id: commentId },
                    dmText,
                    tokenToUse,
                    hasButton ? automation.dm_button_text : null,
                    hasButton ? automation.dm_button_url : null
                  );

                  await supabaseAdmin.from("automation_logs").insert({
                    automation_id: automation.id,
                    commenter_username: commenterUsername,
                    commenter_instagram_id: commenterId,
                    comment_text: commentText,
                    matched_keyword: matchedKeyword,
                    follow_check_passed: true,
                    dm_sent_status: dmResult.success ? "sent" : "failed",
                    error_message: dmResult.error ?? null
                  });

                  if (dmResult.success) {
                    await supabaseAdmin
                      .from("automations")
                      .update({
                        total_success: (automation.total_success || 0) + 1,
                        total_triggers: (automation.total_triggers || 0) + 1
                      })
                      .eq("id", automation.id);
                  }
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

            const dmResult = await sendInstagramDM(
              { comment_id: commentId },
              initialMsg,
              tokenToUse,
              [{ type: "postback", title: accessBtnLabel, payload: `send_access:${automation.id}:${commentId}` }]
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
