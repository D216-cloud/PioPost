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
    // Check if these are Quick Replies (which are postbacks on Instagram without a URL)
    const isQuickReply = buttonsArray.every(btn => btn.type === "postback" && !btn.url);

    if (isQuickReply) {
      // Native Instagram Quick Replies
      body = {
        recipient,
        message: {
          text: message,
          quick_replies: buttonsArray.map(btn => ({
            content_type: "text",
            title: btn.title.substring(0, 20), // Instagram limits quick reply titles to 20 chars
            payload: btn.payload,
          })),
        },
        access_token: accessToken,
      };
    } else {
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
    }
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

    // Send the follow-gate message with the two buttons again
    const followGateMsg = rule.follow_gate_message || "Hey! Follow me first and I'll send you the link 🙌";
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
  console.log(`\n🖱 ═══════════════════════════════════════════════════════`);
  console.log(`🖱 [CLICK] User ${senderId} selected button: "${buttonLabel}"`);
  console.log(`🖱 ═══════════════════════════════════════════════════════`);
  
  const { data: igAccounts } = await supabaseAdmin
    .from("instagram_accounts")
    .select("id, user_id, access_token, username")
    .eq("instagram_business_id", igBusinessId.toString())
    .order("updated_at", { ascending: false })
    .limit(1);

  const igAccount = igAccounts?.[0] ?? null;
  if (!igAccount) {
    console.error("❌ [ERROR] No IG account found for button click:", igBusinessId);
    return;
  }

  let replyText = `Thanks for your interest in "${buttonLabel}"! Our team will get back to you directly soon.`;
  const labelLower = buttonLabel.toLowerCase();
  
  if (labelLower === "pricing") {
    replyText = "💰 Here is our pricing structure! We have the Starter plan for beginners, and the Pro plan for scaling creators. Check the pricing section in the sidebar to learn more!";
  } else if (labelLower === "collab") {
    replyText = "🤝 Awesome! We love partnerships. Drop us your media kit or email us at collab@reelflow.ai, and we will get back to you soon!";
  } else if (labelLower === "support") {
    replyText = "🎧 Our support team is online! Describe your issue or query, and our agent will jump into this chat in just a few minutes.";
  }

  console.log(`📤 [SEND] Sending button response for "${buttonLabel}"...`);
  const result = await sendInstagramDM({ id: senderId }, replyText, igAccount.access_token);
  if (result.success) {
    console.log(`✅ [SEND] Button response for "${buttonLabel}" sent successfully!`);
  } else {
    console.error(`❌ [SEND] Button response failed:`, result.error);
  }

  // Log the button click interaction
  const { data: welcomeSettings } = await supabaseAdmin
    .from("welcome_opener_settings")
    .select("id")
    .eq("instagram_account_id", igAccount.id)
    .limit(1);
  const rule = welcomeSettings?.[0] ?? null;

  if (rule) {
    await supabaseAdmin.from("automation_logs").insert({
      automation_id: rule.id,
      instagram_user_id: senderId,
      comment_text: `[Button Click] - ${buttonLabel}`,
      dm_sent: result.success,
      dm_sent_at: result.success ? new Date().toISOString() : null,
      error_message: result.error ?? null,
    });
  }
}

async function handleWelcomeOpenerMessage(
  senderId: string,
  messageText: string,
  igBusinessId: string
) {
  console.log(`\n📥 ═══════════════════════════════════════════════════════`);
  console.log(`📥 [WEBHOOK] Auto-Welcome DM event received`);
  console.log(`👤 [USER] Sender ID: ${senderId}`);
  console.log(`💬 [MESSAGE] Text: "${messageText}"`);
  console.log(`📥 ═══════════════════════════════════════════════════════`);

  const { data: igAccounts } = await supabaseAdmin
    .from("instagram_accounts")
    .select("id, user_id, access_token, username")
    .eq("instagram_business_id", igBusinessId.toString())
    .order("updated_at", { ascending: false })
    .limit(1);

  const igAccount = igAccounts?.[0] ?? null;
  if (!igAccount) {
    console.error(`❌ [ERROR] No Instagram account found for business ID: ${igBusinessId}`);
    return;
  }
  console.log(`🔗 [ACCOUNT] Instagram account found: @${igAccount.username}`);

  // ── STEP 1: Check if Auto-Welcome DM is active ────────────────────────
  const { data: welcomeSettings } = await supabaseAdmin
    .from("welcome_opener_settings")
    .select("*")
    .eq("instagram_account_id", igAccount.id)
    .eq("active", true)
    .limit(1);

  const rule = welcomeSettings?.[0] ?? null;
  if (!rule) {
    console.log(`⚙️ [CHECK] Auto-Welcome DM status: OFF ❌`);
    console.log(`⏹ [SKIP] Feature is disabled. No message sent.`);
    return;
  }

  console.log(`⚙️ [CHECK] Auto-Welcome DM status: ACTIVE ✅`);
  console.log(`📋 [CONFIG] Welcome message: "${(rule.welcome_message || "").substring(0, 60)}..."`);

  // ── STEP 2: Parse quick reply buttons ─────────────────────────────────
  let quickReplies: any[] = [];
  if (rule && rule.quick_replies) {
    quickReplies = Array.isArray(rule.quick_replies) ? rule.quick_replies : [];
  }
  const buttonNames = quickReplies.map((b: any) => b.label).join(" | ");
  console.log(`🧩 [BUTTONS] Quick Replies loaded: ${buttonNames || "(none)"}`);

  // ── STEP 3: Check if message matches a button label ───────────────────
  const matchedButton = quickReplies.find(
    (btn: any) => btn.label.toLowerCase() === messageText.toLowerCase()
  );

  if (matchedButton) {
    console.log(`🎯 [MATCH] Message "${messageText}" matches button "${matchedButton.label}". Routing to button handler...`);
    await handleWelcomeOpenerButtonClick(senderId, matchedButton.label, igBusinessId);
    return;
  }

  // ── STEP 4: Check for duplicate (already sent in last 24h) ────────────
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
    console.log(`🔁 [DUPLICATE] Welcome Opener already sent to user ${senderId} in last 24h. Skipping.`);
    return;
  }
  console.log(`✅ [CHECK] No duplicate found. Proceeding to send...`);

  // ── STEP 5: Fetch user profile for personalization ────────────────────
  const profile = await getInstagramUserProfile(senderId, igAccount.access_token);
  const recipientUsername = profile?.username ? `@${profile.username}` : "there";
  const recipientFirstName = profile?.name ? profile.name.split(" ")[0] : "friend";
  const recipientFullName = profile?.name || "Friend";
  console.log(`👤 [PROFILE] Resolved: username=${recipientUsername}, name=${recipientFullName}`);

  // ── STEP 6: Build personalized welcome message ────────────────────────
  let welcomeText = (rule.welcome_message || "").toString();
  welcomeText = welcomeText
    .replace(/{{username}}/g, recipientUsername)
    .replace(/{{first_name}}/g, recipientFirstName)
    .replace(/{{full_name}}/g, recipientFullName);

  if (!welcomeText) {
    console.warn(`⚠️ [SKIP] Welcome message is empty after variable substitution. Aborting.`);
    return;
  }
  console.log(`📝 [MESSAGE] Personalized welcome: "${welcomeText.substring(0, 80)}..."`);

  // ── STEP 7: Send welcome message ──────────────────────────────────────
  const buttons = quickReplies.slice(0, 3).map((btn: any) => ({
    type: "postback",
    title: btn.label,
    payload: `welcome_opener_click:${btn.label}`,
  }));

  let result;
  if (buttons.length > 0) {
    console.log(`📤 [SEND] Sending welcome text message with native quick replies in one message...`);
    result = await sendInstagramDM(
      { id: senderId },
      welcomeText,
      igAccount.access_token,
      buttons
    );
    
    if (result.success) {
      console.log(`✅ [SEND] Welcome message and quick replies sent successfully!`);
    } else {
      console.error(`❌ [SEND] Native welcome message with quick replies failed:`, result.error);
      
      // Fallback: Send plain text welcome message first, then send buttons as a separate message
      console.log(`📤 [FALLBACK] Attempting fallback: sending text portion first...`);
      const textResult = await sendInstagramDM({ id: senderId }, welcomeText, igAccount.access_token);
      result = textResult;
      
      if (textResult.success) {
        console.log(`✅ [FALLBACK] Welcome text sent. Sending quick reply buttons as follow-up...`);
        const buttonsResult = await sendInstagramDM(
          { id: senderId },
          "Choose an option below:",
          igAccount.access_token,
          buttons
        );
        if (buttonsResult.success) {
          console.log(`✅ [FALLBACK] Quick reply buttons sent successfully!`);
        } else {
          console.error(`⚠️ [FALLBACK] Failed to send quick replies:`, buttonsResult.error);
        }
      }
    }
  } else {
    console.log(`📤 [SEND] Sending welcome text (no buttons configured)...`);
    result = await sendInstagramDM({ id: senderId }, welcomeText, igAccount.access_token);
    if (result.success) {
      console.log(`✅ [SEND] Welcome text message sent successfully!`);
    } else {
      console.error(`❌ [SEND] Welcome text message failed:`, result.error);
    }
  }

  // ── STEP 9: Log result to database ────────────────────────────────────
  await supabaseAdmin.from("automation_logs").insert({
    automation_id: rule.id,
    instagram_user_id: senderId,
    comment_text: "[Welcome Opener]",
    dm_sent: result.success,
    dm_sent_at: result.success ? new Date().toISOString() : null,
    error_message: result.error ?? null,
  });

  if (result.success) {
    console.log(`📊 [LOG] Execution logged. Updating stats...`);
    await supabaseAdmin
      .from("welcome_opener_settings")
      .update({
        total_dms_sent: (rule.total_dms_sent || 0) + 1,
        executions: (rule.executions || 0) + 1,
        last_execution: new Date().toISOString(),
      })
      .eq("id", rule.id);
    console.log(`\n🏁 ═══════════════════════════════════════════════════════`);
    console.log(`🏁 [DONE] Auto-Welcome DM complete for user ${senderId}`);
    console.log(`🏁   ✔ Welcome message: SENT`);
    console.log(`🏁   ✔ Quick reply buttons: ${buttons.length > 0 ? "SENT" : "NONE"}`);
    console.log(`🏁   ✔ Total DMs sent: ${(rule.total_dms_sent || 0) + 1}`);
    console.log(`🏁 ═══════════════════════════════════════════════════════\n`);
  } else {
    console.error(`\n❌ ═══════════════════════════════════════════════════════`);
    console.error(`❌ [FAILED] Auto-Welcome DM failed for user ${senderId}`);
    console.error(`❌ Error: ${result.error}`);
    console.error(`❌ ═══════════════════════════════════════════════════════\n`);
  }
}

interface FlowButton {
  id: string;
  title: string;
  payload: string;
  response: string;
}

interface OpenerButton {
  id: string;
  label: string;
  iconName: string;
}

async function handleWelcomeFlowButtonClick(
  senderId: string,
  buttonPayload: string,
  igBusinessId: string
) {
  console.log(`\n🖱 ═══════════════════════════════════════════════════════`);
  console.log(`🖱 [WELCOME FLOW CLICK] User ${senderId} selected payload: "${buttonPayload}"`);
  console.log(`🖱 ═══════════════════════════════════════════════════════`);
  
  const { data: igAccounts } = await supabaseAdmin
    .from("instagram_accounts")
    .select("id, user_id, access_token, username")
    .eq("instagram_business_id", igBusinessId.toString())
    .order("updated_at", { ascending: false })
    .limit(1);

  const igAccount = igAccounts?.[0] ?? null;
  if (!igAccount) {
    console.error("❌ [ERROR] No IG account found for welcome flow click:", igBusinessId);
    return;
  }

  // Load welcome flow settings to find the button response
  const { data: welcomeSettings } = await supabaseAdmin
    .from("welcome_flow_settings")
    .select("*")
    .eq("instagram_account_id", igAccount.id)
    .limit(1);
  const rule = welcomeSettings?.[0] ?? null;

  if (!rule) {
    console.error("❌ [ERROR] No welcome flow settings found for IG account:", igAccount.id);
    return;
  }

  const buttons = (Array.isArray(rule.buttons) ? rule.buttons : []) as FlowButton[];
  const matchedButton = buttons.find((btn) => btn.payload === buttonPayload);

  if (!matchedButton) {
    console.error(`❌ [ERROR] No button found in welcome flow settings with payload: "${buttonPayload}"`);
    return;
  }

  const replyText = matchedButton.response || `Thanks for your interest in "${matchedButton.title}"!`;

  console.log(`📤 [SEND] Sending Welcome Flow button response for "${matchedButton.title}"...`);
  const result = await sendInstagramDM({ id: senderId }, replyText, igAccount.access_token);
  if (result.success) {
    console.log(`✅ [SEND] Welcome Flow button response sent successfully!`);
  } else {
    console.error(`❌ [SEND] Welcome Flow button response failed:`, result.error);
  }

  // Log the button click interaction
  await supabaseAdmin.from("automation_logs").insert({
    automation_id: rule.id,
    instagram_user_id: senderId,
    comment_text: `[Button Click] - ${matchedButton.title}`,
    dm_sent: result.success,
    dm_sent_at: result.success ? new Date().toISOString() : null,
    error_message: result.error ?? null,
  });

  if (result.success) {
    await supabaseAdmin
      .from("welcome_flow_settings")
      .update({
        total_dms_sent: (rule.total_dms_sent || 0) + 1,
      })
      .eq("id", rule.id);
  }
}

async function handleWelcomeFlowMessage(
  senderId: string,
  messageText: string,
  igBusinessId: string
) {
  console.log(`\n📥 ═══════════════════════════════════════════════════════`);
  console.log(`📥 [WEBHOOK] Welcome Flow event received`);
  console.log(`👤 [USER] Sender ID: ${senderId}`);
  console.log(`💬 [MESSAGE] Text: "${messageText}"`);
  console.log(`📥 ═══════════════════════════════════════════════════════`);

  const { data: igAccounts } = await supabaseAdmin
    .from("instagram_accounts")
    .select("id, user_id, access_token, username")
    .eq("instagram_business_id", igBusinessId.toString())
    .order("updated_at", { ascending: false })
    .limit(1);

  const igAccount = igAccounts?.[0] ?? null;
  if (!igAccount) {
    console.error(`❌ [ERROR] No Instagram account found for business ID: ${igBusinessId}`);
    return;
  }
  console.log(`🔗 [ACCOUNT] Instagram account found: @${igAccount.username}`);

  // Check if Welcome Flow is enabled
  const { data: welcomeSettings } = await supabaseAdmin
    .from("welcome_flow_settings")
    .select("*")
    .eq("instagram_account_id", igAccount.id)
    .eq("enabled", true)
    .limit(1);

  const rule = welcomeSettings?.[0] ?? null;
  if (!rule) {
    console.log(`⚙️ [CHECK] Welcome Flow status: OFF ❌`);
    return;
  }

  console.log(`⚙️ [CHECK] Welcome Flow status: ACTIVE ✅`);
  console.log(`📋 [CONFIG] Welcome message: "${(rule.welcome_message || "").substring(0, 60)}..."`);

  // Check for duplicate (already sent in last 24h) to avoid loops
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentLogs } = await supabaseAdmin
    .from("automation_logs")
    .select("id")
    .eq("automation_id", rule.id)
    .eq("instagram_user_id", senderId)
    .eq("comment_text", "[Welcome Flow]")
    .gte("created_at", since24h)
    .limit(1);

  if (recentLogs && recentLogs.length > 0) {
    console.log(`🔁 [DUPLICATE] Welcome Flow already sent to user ${senderId} in last 24h. Skipping.`);
    return;
  }
  console.log(`✅ [CHECK] No duplicate found. Proceeding to send...`);

  // Fetch user profile for personalization
  const profile = await getInstagramUserProfile(senderId, igAccount.access_token);
  const recipientUsername = profile?.username ? `@${profile.username}` : "there";
  const recipientFirstName = profile?.name ? profile.name.split(" ")[0] : "friend";
  const recipientFullName = profile?.name || "Friend";

  // Build personalized welcome message
  let welcomeText = (rule.welcome_message || "").toString();
  welcomeText = welcomeText
    .replace(/{{username}}/g, recipientUsername)
    .replace(/{{first_name}}/g, recipientFirstName)
    .replace(/{{full_name}}/g, recipientFullName);

  if (!welcomeText) {
    console.warn(`⚠️ [SKIP] Welcome message is empty after variable substitution. Aborting.`);
    return;
  }

  // Parse buttons
  const dbButtons = (Array.isArray(rule.buttons) ? rule.buttons : []) as FlowButton[];
  const buttons = dbButtons.map((btn) => ({
    type: "postback",
    title: btn.title,
    payload: btn.payload,
  }));

  console.log(`📤 [SEND] Sending Welcome Flow message to ${senderId}...`);
  let result;
  if (buttons.length > 0) {
    result = await sendInstagramDM(
      { id: senderId },
      welcomeText,
      igAccount.access_token,
      buttons
    );
    if (!result.success) {
      console.log(`📤 [FALLBACK] Attempting fallback: sending text portion first...`);
      const textResult = await sendInstagramDM({ id: senderId }, welcomeText, igAccount.access_token);
      result = textResult;
      if (textResult.success) {
        console.log(`✅ [FALLBACK] Welcome text sent. Sending quick reply buttons as follow-up...`);
        const buttonsResult = await sendInstagramDM(
          { id: senderId },
          "Choose an option below:",
          igAccount.access_token,
          buttons
        );
        if (!buttonsResult.success) {
          console.error(`⚠️ [FALLBACK] Failed to send quick replies:`, buttonsResult.error);
        }
      }
    }
  } else {
    result = await sendInstagramDM({ id: senderId }, welcomeText, igAccount.access_token);
  }

  // Log result to database
  await supabaseAdmin.from("automation_logs").insert({
    automation_id: rule.id,
    instagram_user_id: senderId,
    comment_text: "[Welcome Flow]",
    dm_sent: result.success,
    dm_sent_at: result.success ? new Date().toISOString() : null,
    error_message: result.error ?? null,
  });

  if (result.success) {
    await supabaseAdmin
      .from("welcome_flow_settings")
      .update({
        total_dms_sent: (rule.total_dms_sent || 0) + 1,
        executions: (rule.executions || 0) + 1,
        last_execution: new Date().toISOString(),
      })
      .eq("id", rule.id);
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

      // ── Direct Message (DM) events ───────────────────────────────────────
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
          console.error("❌ [ERROR] No IG account in DB for DM handling:", igBusinessId);
          continue;
        }
        if (await isRateLimited(igAccount.id)) {
          console.warn("⚠️ [RATE LIMIT] 200/hr limit hit for @" + igAccount.username + ". Skipping.");
          continue;
        }

        // 1. Handle postback events
        if (msg.postback?.payload) {
          const payload = msg.postback.payload;
          console.log(`\n📮 [POSTBACK] Received from ${senderId}: payload="${payload}"`);
          if (payload.startsWith("welcome_opener_click:")) {
            const label = payload.replace("welcome_opener_click:", "");
            await handleWelcomeOpenerButtonClick(senderId, label, igBusinessId);
          } else if (payload.startsWith("welcome_flow_click:")) {
            await handleWelcomeFlowButtonClick(senderId, payload, igBusinessId);
          } else if (payload.startsWith("check_follow:")) {
            const parts = payload.split(":");
            const ruleId = parts[1];
            const commentId = parts[2];
            await handleFollowPostback(senderId, ruleId, commentId, igBusinessId);
          }
          continue;
        }

        // 2. Handle text messages
        const rawMessageText = msg.message?.text;
        if (rawMessageText) {
          console.log(`\n📩 [DM] Incoming message from user:${senderId}: "${rawMessageText}"`);
          const cleanText = rawMessageText.trim().toLowerCase();
          
          if (cleanText === "i am following" || cleanText === "i'm following" || cleanText === "im following" || cleanText === "following") {
            console.log(`[Webhook] 🔍 User ${senderId} sent follow verification text. Searching database for recent follow-gate logs...`);
            
            // Query the most recent automation log for this user to find which rule/comment is active
            const { data: recentLogs, error: recentLogsErr } = await supabaseAdmin
              .from("automation_logs")
              .select("automation_id, comment_id")
              .eq("instagram_user_id", senderId)
              .order("created_at", { ascending: false })
              .limit(1);
              
            if (recentLogsErr) {
              console.error(`[Webhook] ❌ Error searching recent logs for user ${senderId}:`, recentLogsErr.message);
            } else if (recentLogs && recentLogs.length > 0) {
              const ruleId = recentLogs[0].automation_id;
              const commentId = recentLogs[0].comment_id;
              console.log(`[Webhook] Found matching interaction in logs: ruleId=${ruleId}, commentId=${commentId}. Initiating follow status verification...`);
              
              await handleFollowPostback(senderId, ruleId, commentId, igBusinessId);
            } else {
              console.log(`[Webhook] ⚠️ No recent log found for user ${senderId} to match the follow verification request.`);
            }
          } else {
            const { data: igAccounts } = await supabaseAdmin
              .from("instagram_accounts")
              .select("id")
              .eq("instagram_business_id", igBusinessId.toString())
              .limit(1);
            
            const igAccount = igAccounts?.[0] ?? null;
            let routed = false;
            
            if (igAccount) {
              const { data: openerData } = await supabaseAdmin
                .from("welcome_opener_settings")
                .select("active, quick_replies")
                .eq("instagram_account_id", igAccount.id)
                .limit(1)
                .maybeSingle();

              const { data: flowData } = await supabaseAdmin
                .from("welcome_flow_settings")
                .select("enabled, buttons")
                .eq("instagram_account_id", igAccount.id)
                .limit(1)
                .maybeSingle();

              const openerActive = openerData?.active ?? false;
              const flowActive = flowData?.enabled ?? false;

              const openerQuickReplies = (Array.isArray(openerData?.quick_replies) ? openerData.quick_replies : []) as OpenerButton[];
              const matchedOpenerBtn = openerActive ? openerQuickReplies.find(
                (btn) => btn.label?.toLowerCase() === rawMessageText.trim().toLowerCase()
              ) : null;

              const flowButtons = (Array.isArray(flowData?.buttons) ? flowData.buttons : []) as FlowButton[];
              const matchedFlowBtn = flowActive ? flowButtons.find(
                (btn) => btn.title?.toLowerCase() === rawMessageText.trim().toLowerCase()
              ) : null;

              if (matchedOpenerBtn) {
                console.log(`🎯 [MATCH] Message "${rawMessageText}" matches Welcome Opener button. Routing to opener button handler...`);
                await handleWelcomeOpenerButtonClick(senderId, matchedOpenerBtn.label, igBusinessId);
                routed = true;
              } else if (matchedFlowBtn) {
                console.log(`🎯 [MATCH] Message "${rawMessageText}" matches Welcome Flow button. Routing to flow button handler...`);
                await handleWelcomeFlowButtonClick(senderId, matchedFlowBtn.payload, igBusinessId);
                routed = true;
              } else if (openerActive) {
                console.log(`⚙️ [ROUTE] Routing message to Welcome Opener handler...`);
                await handleWelcomeOpenerMessage(senderId, rawMessageText, igBusinessId);
                routed = true;
              } else if (flowActive) {
                console.log(`⚙️ [ROUTE] Routing message to Welcome Flow handler...`);
                await handleWelcomeFlowMessage(senderId, rawMessageText, igBusinessId);
                routed = true;
              }
            }
            
            if (!routed) {
              // Fallback
              await handleWelcomeOpenerMessage(senderId, rawMessageText, igBusinessId);
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
            isFollowing = await checkIfUserFollows(commenterId, tokenToUse);
            console.log(`[Webhook] Follow status check for user ${commenterId}: ${isFollowing}`);
          }

          if (shouldAskFollow && !isFollowing) {
            const followGateMsg = rule.follow_gate_message || "Hey! Follow me first and I'll send you the link 🙌";
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
              comment_text: commentText,
              comment_id: commentId,
              dm_sent: dmResult.success,
              dm_sent_at: dmResult.success ? new Date().toISOString() : null,
              error_message: dmResult.error ?? null,
            });

            if (dmResult.success) {
              console.log("[Webhook] ✅ Follow-gate DM flow completed successfully for commenter:", commenterId);
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

      // Messaging events are already processed in the DM events loop above
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Webhook] 💥 Unhandled error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
