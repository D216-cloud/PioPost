// app/api/collect-email/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface IGButton {
  type: string;
  url?: string;
  title: string;
  payload?: string;
}

// Helper to send DM via Instagram Graph API
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

  let body: any = null;

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("email_pending_requests")
      .select("*")
      .eq("token", token)
      .eq("status", "waiting_for_email")
      .maybeSingle();

    if (pendingError || !pending) {
      return NextResponse.json({ error: "Invalid or expired link", valid: false }, { status: 404 });
    }

    // Check expiration
    const expiresAt = new Date(pending.expires_at);
    if (new Date() > expiresAt) {
      return NextResponse.json({ error: "Link has expired", valid: false }, { status: 410 });
    }

    // Get creator and IG account info
    const { data: automation } = await supabaseAdmin
      .from("automations")
      .select("instagram_account_id, email_ask_message")
      .eq("id", pending.automation_id)
      .maybeSingle();

    let creatorName = "Creator";
    let profilePictureUrl = "";

    if (automation) {
      const { data: igAccount } = await supabaseAdmin
        .from("instagram_accounts")
        .select("username, profile_picture_url")
        .eq("id", automation.instagram_account_id)
        .maybeSingle();

      if (igAccount) {
        creatorName = igAccount.username;
        profilePictureUrl = igAccount.profile_picture_url || "";
      }
    }

    return NextResponse.json({
      valid: true,
      creatorName,
      profilePicture: profilePictureUrl,
      commenter: pending.commenter_username,
      message: automation?.email_ask_message
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, email } = body;

    // Validate inputs
    if (!token || !email) {
      return NextResponse.json({ error: "Token and email are required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Find pending request
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("email_pending_requests")
      .select("*")
      .eq("token", token)
      .eq("status", "waiting_for_email")
      .maybeSingle();

    if (pendingError || !pending) {
      return NextResponse.json(
        { error: "Invalid or expired email collection link" },
        { status: 404 }
      );
    }

    // Check expiration (24h)
    const expiresAt = new Date(pending.expires_at);
    if (new Date() > expiresAt) {
      await supabaseAdmin
        .from("email_pending_requests")
        .update({ status: "expired" })
        .eq("id", pending.id);
      return NextResponse.json({ error: "This link has expired" }, { status: 410 });
    }

    // Save to collected_emails
    const { error: saveError } = await supabaseAdmin
      .from("collected_emails")
      .insert({
        automation_id: pending.automation_id,
        instagram_username: pending.commenter_username,
        email: email
      });

    if (saveError) {
      console.error("Failed to save collected email:", saveError.message);
      throw saveError;
    }

    // Update pending request status
    await supabaseAdmin
      .from("email_pending_requests")
      .update({ status: "email_collected", email: email })
      .eq("id", pending.id);

    // Fetch automation and IG account to send DM payload
    const { data: automation } = await supabaseAdmin
      .from("automations")
      .select("*")
      .eq("id", pending.automation_id)
      .maybeSingle();

    if (automation) {
      const { data: igAccount } = await supabaseAdmin
        .from("instagram_accounts")
        .select("access_token")
        .eq("id", automation.instagram_account_id)
        .maybeSingle();

      if (igAccount) {
        console.log(`Sending guide payload to user ${pending.commenter_instagram_id}...`);
        
        let dmText = (automation.dm_message_text || "").toString().trim();
        const hasButton = !!automation.dm_button_text && !!automation.dm_button_url;

        if (dmText) {
          const dmResult = await sendInstagramDM(
            { id: pending.commenter_instagram_id },
            dmText,
            igAccount.access_token,
            hasButton ? automation.dm_button_text : null,
            hasButton ? automation.dm_button_url : null
          );

          // Log execution
          await supabaseAdmin.from("automation_logs").insert({
            automation_id: automation.id,
            commenter_username: pending.commenter_username,
            commenter_instagram_id: pending.commenter_instagram_id,
            comment_text: "[Email Submitted Gateway]",
            matched_keyword: null,
            follow_check_passed: true,
            email_collected: email,
            dm_sent_status: dmResult.success ? "sent" : "failed",
            error_message: dmResult.error ?? null
          });

          // Update stats
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
              .update({
                total_failed: (automation.total_failed || 0) + 1,
                total_triggers: (automation.total_triggers || 0) + 1
              })
              .eq("id", automation.id);
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Email submitted successfully! Guide is on its way to your DMs." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
