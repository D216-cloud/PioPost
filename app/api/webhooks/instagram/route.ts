import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return new Response(challenge, { status: 200 });
    } else {
      return new Response(null, { status: 403 });
    }
  }

  return new Response(null, { status: 400 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Instagram Webhook Received:", JSON.stringify(body, null, 2));

    if (body.object === "instagram") {
      for (const entry of body.entry) {
        const igAccountId = entry.id; // The instagram business account ID that received the webhook

        if (!entry.changes) continue;

        for (const change of entry.changes) {
          // WE ONLY CARE ABOUT COMMENTS
          if (change.field === "comments") {
            const commentValue = change.value;
            const commentId = commentValue.id;
            const commentText = commentValue.text;
            const commenterId = commentValue.from.id;
            const mediaId = commentValue.media.id;

            console.log(`[Webhook] New comment from ${commenterId} on media ${mediaId}: "${commentText}"`);

            // 1. Fetch the user's instagram account details from DB to get their access token
            const { data: igAccount, error: accError } = await supabaseAdmin
              .from('instagram_accounts')
              .select('user_id, access_token')
              .eq('instagram_business_id', igAccountId)
              .maybeSingle();

            if (accError || !igAccount) {
              console.error("[Webhook] Could not find IG account in DB for ID:", igAccountId);
              continue;
            }

            // 2. Fetch all active automation rules for this user
            const { data: rules, error: rulesError } = await supabaseAdmin
              .from('automation_rules')
              .select('*')
              .eq('user_id', igAccount.user_id)
              .eq('active', true);

            if (rulesError || !rules || rules.length === 0) {
              console.log("[Webhook] No active rules found for user:", igAccount.user_id);
              continue;
            }

            // 3. Match the comment text to the rule trigger keywords
            let matchedRule = null;
            for (const rule of rules) {
              if (rule.trigger_keyword === "Any comment") {
                matchedRule = rule;
                break;
              }

              // keywords are comma separated, e.g. "link, course, freebie"
              const keywords = rule.trigger_keyword.split(",").map((k: string) => k.trim().toLowerCase());
              const textLower = commentText.toLowerCase();

              if (keywords.some((k: string) => textLower.includes(k))) {
                matchedRule = rule;
                break;
              }
            }

            if (!matchedRule) {
              console.log("[Webhook] Comment did not match any keywords.");
              continue;
            }

            console.log(`[Webhook] Rule matched! ID: ${matchedRule.id}`);

            // 4. Auto-Reply to the public comment
            const tokenToUse = process.env.MESSENGER_ACCESS_TOKEN || igAccount.access_token;
            
            const replyRes = await fetch(`https://graph.facebook.com/v19.0/${commentId}/replies`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenToUse}`
              },
              body: JSON.stringify({
                message: "Sent you a DM! 🚀"
              })
            });
            const replyData = await replyRes.json();
            if (replyData.error) {
               console.error("[Webhook] Failed to public reply:", replyData.error);
            } else {
               console.log("[Webhook] Public reply sent!");
            }

            // 5. Send the DM to the user (Private Reply to Comment)
            const dmRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/messages`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenToUse}`
              },
              body: JSON.stringify({
                recipient: { comment_id: commentId },
                message: { text: matchedRule.reply_message }
              })
            });
            
            const dmData = await dmRes.json();
            if (dmData.error) {
              console.error("[Webhook] Failed to send DM:", dmData.error);
            } else {
              console.log("[Webhook] DM Sent Successfully to:", commenterId);
              
              // Update stats in database
              await supabaseAdmin.from('automation_rules')
                 .update({ 
                    executions: (matchedRule.executions || 0) + 1,
                    last_execution: new Date().toISOString()
                 })
                 .eq('id', matchedRule.id);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
