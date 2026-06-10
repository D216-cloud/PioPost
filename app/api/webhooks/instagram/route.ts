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

/** Check if the user is already following the business account.
 *  Returns { follows: boolean; verified: boolean }
 *  - verified=true means the API gave a definitive answer
 *  - verified=false means the API call failed or field was missing (optimistic: assume following)
 */
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

    // Field not available in API response — be optimistic, assume following
    console.warn(`[Webhook] ⚠️ is_user_follow_business field not returned by API for ${commenterId}. Assuming user is following (optimistic).`);
    return { follows: true, verified: false };
  } catch (err) {
    console.error("[Webhook] ❌ Exception checking follow status:", err);
    // On error, be optimistic — don't block the main DM
    return { follows: true, verified: false };
  }
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
    // Generic template message (since Button templates are not supported on Instagram)
    // We truncate the title to 80 characters to comply with Instagram's API limit
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

/** Process follow confirmation postback clicks and send the main DM.
 *  @param fromButtonClick - true when triggered by "I'm Following" button postback (trust the user)
 */
async function handleFollowPostback(
  senderId: string,
  ruleId: string,
  commentId: string,
  igBusinessId: string,
  fromButtonClick: boolean = false
) {
  console.log(`[FOLLOW-GATE] ▶️ handleFollowPostback STARTED: user=${senderId}, rule=${ruleId}, comment=${commentId}, fromButton=${fromButtonClick}`);
  
  try {
    // 1. Fetch the IG account from the business ID
    const { data: igAccounts } = await supabaseAdmin
      .from("instagram_accounts")
      .select("id, user_id, access_token, username")
      .eq("instagram_business_id", igBusinessId.toString())
      .order("updated_at", { ascending: false })
      .limit(1);

    const igAccount = igAccounts?.[0] ?? null;
    if (!igAccount) {
      console.error("[FOLLOW-GATE] ❌ No IG account found for business ID:", igBusinessId);
      return;
    }
    
    const tokenToUse = igAccount.access_token;

    // 2. Fetch the automation rule
    const { data: rule } = await supabaseAdmin
      .from("automation_rules")
      .select("*")
      .eq("id", ruleId)
      .limit(1)
      .single();

    if (!rule) {
      console.error("[FOLLOW-GATE] ❌ Rule not found:", ruleId);
      return;
    }

    // 3. Determine if user is following
    //    - From button click: TRUST the user (they clicked "I'm Following")
    //    - From text message: check API but be optimistic on failure
    let isFollowing = false;
    let followVerified = false;

    if (fromButtonClick) {
      // User explicitly clicked "I'm Following" — trust them
      isFollowing = true;
      followVerified = false;
      console.log(`[FOLLOW-GATE] ✅ User clicked "I'm Following" button — trusting user, skipping API check`);
    } else {
      // User typed "I'm following" — check API
      console.log(`[FOLLOW-GATE] 🔄 User typed text — checking follow via API...`);
      const followCheck = await checkIfUserFollows(senderId, tokenToUse);
      isFollowing = followCheck.follows;
      followVerified = followCheck.verified; // eslint-disable-line @typescript-eslint/no-unused-vars
      console.log(`[FOLLOW-GATE] 📊 Follow check result: user=${senderId}, follows=${followCheck.follows}, verified=${followCheck.verified}`);
    }

    if (isFollowing) {
      // Prevent duplicate message delivery (exclude follow-gate and postback verification logs)
      const { data: alreadySent } = await supabaseAdmin
        .from("automation_logs")
        .select("id")
        .eq("automation_id", rule.id)
        .eq("instagram_user_id", senderId)
        .eq("dm_sent", true)
        .not("comment_text", "ilike", "%[Follow Gate]%")
        .not("comment_text", "ilike", "%[Postback Follow Verification]%")
        .limit(1);

      if (alreadySent && alreadySent.length > 0) {
        console.log(`[FOLLOW-GATE] ⏭️ Main DM already sent to ${senderId}. Skipping duplicate.`);
        // Inform user politely
        await sendInstagramDM(
          { id: senderId },
          "You've already received the link! Let us know if you need anything else.",
          tokenToUse
        );
        return;
      }

      console.log(`[FOLLOW-GATE] 📤 User is following + no duplicate. SENDING MAIN DM to ${senderId}...`);

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
        console.log(`[FOLLOW-GATE] ✅✅✅ MAIN DM SENT SUCCESSFULLY to user: ${senderId} | rule: ${rule.id} | messageId: ${dmResult.messageId}`);
        await supabaseAdmin
          .from("automation_rules")
          .update({
            total_dms_sent: (rule.total_dms_sent || 0) + 1,
            executions: (rule.executions || 0) + 1,
            last_execution: new Date().toISOString(),
          })
          .eq("id", rule.id);
      } else {
        console.error(`[FOLLOW-GATE] ❌ MAIN DM FAILED for user ${senderId}: ${dmResult.error}`);
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

      // Send the follow-gate message with the two buttons again + text instructions
      const baseFollowGateMsg = rule.follow_gate_message || "Hey! Follow me first and I'll send you the link 🙌";
      const followGateMsg = `${baseFollowGateMsg}\n\n✅ Follow my account\n✅ Then reply "I'm following" to get your link!`;
      const profileUrl = `https://instagram.com/${igAccount.username}`;
      await sendInstagramDM(
        { id: senderId },
        followGateMsg,
        tokenToUse,
        [
          { type: "web_url", url: profileUrl, title: "Visit Profile" },
          { type: "postback", title: "I'm Following", payload: `check_follow:${ruleId}:${commentId}` }
        ]
      );
      console.log(`[FOLLOW-GATE] ⚠️ User ${senderId} is NOT following yet. Re-sending follow-gate message...`);
    }
  } catch (err) {
    console.error("[Webhook] ❌ Exception in handleFollowPostback:", err);
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

async function getInstagramUserProfile(
  userId: string,
  accessToken: string
): Promise<{ username?: string; name?: string } | null> {
  try {
    const url = `https://graph.instagram.com/v21.0/${userId}?fields=username,name&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && !data.error) {
      return data;
    }
  } catch (err) {
    console.error("[Webhook] ❌ Exception fetching user profile:", err);
  }
  return null;
}

async function handleWelcomeOpenerButtonClick(
  senderId: string,
  buttonLabel: string,
  igBusinessId: string
) {
  console.log(`[Webhook] Processing welcome opener button click for user:${senderId}, button:${buttonLabel}`);
  
  const { data: igAccounts } = await supabaseAdmin
    .from("instagram_accounts")
    .select("id, user_id, access_token, username")
    .eq("instagram_business_id", igBusinessId.toString())
    .order("updated_at", { ascending: false })
    .limit(1);

  const igAccount = igAccounts?.[0] ?? null;
  if (!igAccount) {
    console.error("[Webhook] No IG account found for business ID in welcome opener button click:", igBusinessId);
    return;
  }

  let replyText = `Thanks for your interest in "${buttonLabel}"! Our team will get back to you directly soon.`;
  const labelLower = buttonLabel.toLowerCase();
  
  if (labelLower === "pricing") {
    replyText = "💰 Here is our pricing structure! We have the Starter plan for beginners, and the Pro plan for scaling creators. Check the pricing section in the sidebar to learn more!";
  } else if (labelLower === "collab") {
    replyText = "🤝 Awesome! We love partnerships. Drop us your media kit or email us at collab@startprofile.com, and we will get back to you soon!";
  } else if (labelLower === "support") {
    replyText = "🎧 Our support team is online! Describe your issue or query, and our agent will jump into this chat in just a few minutes.";
  }

  await sendInstagramDM({ id: senderId }, replyText, igAccount.access_token);
}

async function handleWelcomeOpenerMessage(
  senderId: string,
  messageText: string,
  igBusinessId: string
) {
  const { data: igAccounts } = await supabaseAdmin
    .from("instagram_accounts")
    .select("id, user_id, access_token, username")
    .eq("instagram_business_id", igBusinessId.toString())
    .order("updated_at", { ascending: false })
    .limit(1);

  const igAccount = igAccounts?.[0] ?? null;
  if (!igAccount) return;

  const { data: rules } = await supabaseAdmin
    .from("automation_rules")
    .select("*")
    .eq("instagram_account_id", igAccount.id)
    .eq("post_id", "welcome_opener")
    .eq("active", true)
    .eq("deleted", false)
    .limit(1);

  const rule = rules?.[0] ?? null;
  if (!rule) return;

  let quickReplies: QuickReply[] = [];
  try {
    quickReplies = JSON.parse(rule.post_caption || "[]") as QuickReply[];
  } catch (e) {
    console.error("[Webhook] Failed to parse quick replies JSON:", e);
  }

  const matchedButton = quickReplies.find(
    (btn: QuickReply) => btn.label.toLowerCase() === messageText.toLowerCase()
  );

  if (matchedButton) {
    await handleWelcomeOpenerButtonClick(senderId, matchedButton.label, igBusinessId);
    return;
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentLogs } = await supabaseAdmin
    .from("automation_logs")
    .select("id")
    .eq("automation_id", rule.id)
    .eq("instagram_user_id", senderId)
    .eq("comment_text", "[Welcome Opener]")
    .gte("created_at", since24h)
    .limit(1);

  if (recentLogs && recentLogs.length > 0) {
    console.log(`[Webhook] Welcome Opener already sent to user ${senderId} in last 24h. Skipping duplicate.`);
    return;
  }

  const profile = await getInstagramUserProfile(senderId, igAccount.access_token);
  const recipientUsername = profile?.username ? `@${profile.username}` : "there";
  const recipientFirstName = profile?.name ? profile.name.split(" ")[0] : "friend";
  const recipientFullName = profile?.name || "Friend";

  let welcomeText = (rule.dm_message || "").toString();
  welcomeText = welcomeText
    .replace(/{{username}}/g, recipientUsername)
    .replace(/{{first_name}}/g, recipientFirstName)
    .replace(/{{full_name}}/g, recipientFullName);

  if (!welcomeText) return;

  const buttons = quickReplies.slice(0, 3).map((btn: QuickReply) => ({
    type: "postback",
    title: btn.label,
    payload: `welcome_opener_click:${btn.label}`,
  }));

  const result = await sendInstagramDM(
    { id: senderId },
    welcomeText,
    igAccount.access_token,
    buttons.length > 0 ? buttons : null
  );

  await supabaseAdmin.from("automation_logs").insert({
    automation_id: rule.id,
    instagram_user_id: senderId,
    comment_text: "[Welcome Opener]",
    dm_sent: result.success,
    dm_sent_at: result.success ? new Date().toISOString() : null,
    error_message: result.error ?? null,
  });

  if (result.success) {
    console.log(`[Webhook] ✅ Welcome Opener sent to user ${senderId}`);
    await supabaseAdmin
      .from("automation_rules")
      .update({
        total_dms_sent: (rule.total_dms_sent || 0) + 1,
        executions: (rule.executions || 0) + 1,
        last_execution: new Date().toISOString(),
      })
      .eq("id", rule.id);
  } else {
    console.error(`[Webhook] ❌ Welcome Opener DM failed for ${senderId}:`, result.error);
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
        // Ensure it's a DM sent to the business account
        if (!senderId || recipientId !== igBusinessId) continue;

        // Fetch IG account for rate limiting and token
        const { data: igAccounts, error: accError } = await supabaseAdmin
          .from("instagram_accounts")
          .select("id, user_id, access_token, username")
          .eq("instagram_business_id", igBusinessId.toString())
          .order("updated_at", { ascending: false })
          .limit(1);
        const igAccount = igAccounts?.[0] ?? null;
        if (accError || !igAccount) {
          console.error("[Webhook] ❌ No IG account in DB for DM handling:", igBusinessId);
          continue;
        }
        if (await isRateLimited(igAccount.id)) {
          console.warn("[Webhook] ⚠️ Rate limit hit for account (DM):", igAccount.username);
          continue;
        }

        // Handle postback (e.g. check follow status)
        if (msg.postback) {
          const payload = msg.postback.payload;
          console.log(`[FOLLOW-GATE] 📮 POSTBACK BUTTON CLICKED by user ${senderId}: payload="${payload}"`);
          if (payload && payload.startsWith("check_follow:")) {
            const parts = payload.split(":");
            const ruleId = parts[1];
            const commentId = parts[2];
            await handleFollowPostback(senderId, ruleId, commentId, igBusinessId, true);
          } else if (payload && payload.startsWith("welcome_opener_click:")) {
            const buttonLabel = payload.replace("welcome_opener_click:", "");
            await handleWelcomeOpenerButtonClick(senderId, buttonLabel, igBusinessId);
          }
          continue;
        }

        // Handle text message
        const rawMessageText = msg.message?.text;
        if (rawMessageText) {
          console.log(`[Webhook] 📩 DM received from user:${senderId}: "${rawMessageText}"`);
          
          const cleanText = rawMessageText.trim().toLowerCase();
          if (cleanText === "i am following" || cleanText === "i'm following" || cleanText === "im following" || cleanText === "following") {
            console.log(`[FOLLOW-GATE] 🔍 User ${senderId} typed "I'm following"! Searching for recent follow-gate log...`);
            
            // Query the most recent follow-gate automation log for this user (within 24h)
            const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: recentLogs, error: recentLogsErr } = await supabaseAdmin
              .from("automation_logs")
              .select("automation_id, comment_id")
              .eq("instagram_user_id", senderId)
              .like("comment_text", "[Follow Gate]%")
              .gte("created_at", since24h)
              .order("created_at", { ascending: false })
              .limit(1);
               
            if (recentLogsErr) {
              console.error(`[FOLLOW-GATE] ❌ Error searching follow-gate logs for user ${senderId}: ${recentLogsErr.message}`);
            } else if (recentLogs && recentLogs.length > 0) {
              const ruleId = recentLogs[0].automation_id;
              const commentId = recentLogs[0].comment_id;
              console.log(`[FOLLOW-GATE] ✅ Found follow-gate log: ruleId=${ruleId}, commentId=${commentId}. Now verifying follow status...`);
              
              await handleFollowPostback(senderId, ruleId, commentId, igBusinessId);
            } else {
              console.log(`[FOLLOW-GATE] ⚠️ No follow-gate log found for user ${senderId} in the last 24h. Cannot verify.`);
            }
          } else {
            // Welcome Opener DM handler
            await handleWelcomeOpenerMessage(senderId, cleanText, igBusinessId);
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

          // ── Comment Only Mode ────────────────────────────────────────────
          if (rule.dm_type === "comment_only") {
            console.log(`[Webhook] ✅ Rule "${rule.rule_name || rule.name}" matched! [Comment Only Mode]`);
            const commentReplyText = (rule.comment_reply_text || rule.auto_reply_text || rule.dm_message || rule.reply_message || "").toString().trim();
            if (commentReplyText) {
              console.log(`[Webhook] Comment Only mode. Replying to comment ${commentId} with: "${commentReplyText}"`);
              await postCommentReply(commentId, commentReplyText, tokenToUse);
              
              // Log the comment reply execution
              await supabaseAdmin.from("automation_logs").insert({
                automation_id: rule.id,
                instagram_user_id: commenterId,
                comment_text: commentText,
                comment_id: commentId,
                dm_sent: false,
                dm_sent_at: null,
                error_message: null,
              });

              // Update stats
              await supabaseAdmin
                .from("automation_rules")
                .update({
                  total_dms_sent: (rule.total_dms_sent || 0) + 1,
                  executions: (rule.executions || 0) + 1,
                  last_execution: new Date().toISOString(),
                })
                .eq("id", rule.id);
            } else {
              console.warn(`[Webhook] ⚠️ Rule "${rule.rule_name || rule.name}" is comment_only but has no reply text — skipping.`);
            }
            continue; // Skip the rest of the loop (no DM sending)
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
            const followCheck = await checkIfUserFollows(commenterId, tokenToUse);
            isFollowing = followCheck.follows;
            console.log(`[FOLLOW-GATE] 📊 Initial follow check: user=${commenterId}, follows=${followCheck.follows}, verified=${followCheck.verified}`);
          }

          if (shouldAskFollow && !isFollowing) {
            const baseFollowGateMsg = rule.follow_gate_message || "Hey! Follow me first and I'll send you the link 🙌";
            const followGateMsg = `${baseFollowGateMsg}\n\n✅ Follow my account\n✅ Then reply "I'm following" to get your link!`;
            console.log(`[Webhook] User ${commenterId} is not following. Sending follow-gate template with buttons directly to comment_id: ${commentId}...`);
            
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
              comment_text: `[Follow Gate] ${commentText}`,
              comment_id: commentId,
              dm_sent: false,  // Follow-gate only — main DM not yet sent
              dm_sent_at: null,
              error_message: dmResult.error ?? null,
            });

            if (dmResult.success) {
              console.log(`[FOLLOW-GATE] 📨 Follow-gate message SENT to user ${commenterId} on comment ${commentId}. Waiting for user to follow...`);
              // Update stats
              await supabaseAdmin
                .from("automation_rules")
                .update({
                  total_dms_sent: (rule.total_dms_sent || 0) + 1,
                  executions: (rule.executions || 0) + 1,
                  last_execution: new Date().toISOString(),
                })
                .eq("id", rule.id);
            } else {
              console.error("[Webhook] ❌ Follow-gate DM flow failed for commenter", commenterId, ":", dmResult.error);
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
          const hasButton = rule.dm_type === "message_button" || (!!rule.dm_button_label && !!rule.dm_button_url);
          
          let dmResult;
          if (hasButton) {
            console.log(`[Webhook] Rule contains a CTA button. Sending text portion of DM to comment_id: ${commentId} first...`);
            // 1. Send plain text portion to comment_id to open the window
            const initialResult = await sendInstagramDM(
              { comment_id: commentId },
              dmText,
              tokenToUse
            );
            
            dmResult = initialResult;
            
            if (initialResult.success) {
              console.log(`[Webhook] Conversation opened. Sending main CTA button to user ID: ${commenterId}...`);
              // 2. Send the button template to the user's ID
              const buttonResult = await sendInstagramDM(
                { id: commenterId },
                "Click the button below to open the link:",
                tokenToUse,
                rule.dm_button_label,
                rule.dm_button_url
              );
              if (buttonResult.success) {
                console.log(`[Webhook] ✅ Successfully sent main CTA button to user ${commenterId}`);
                dmResult = buttonResult;
              } else {
                console.error(`[Webhook] ⚠️ Failed to send CTA button to user ${commenterId}:`, buttonResult.error);
              }
            } else {
              console.error(`[Webhook] ❌ Failed to send plain text main DM to comment_id ${commentId}:`, initialResult.error);
            }
          } else {
            console.log(`[Webhook] Rule has no CTA buttons. Sending plain text DM to comment_id: ${commentId}...`);
            // Send direct plain text reply to comment
            dmResult = await sendInstagramDM(
              { comment_id: commentId },
              dmText,
              tokenToUse
            );
          }

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


    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Webhook] 💥 Unhandled error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
