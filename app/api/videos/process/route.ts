import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createReelAsset, publishInstagramReel, type InstagramAccountRecord, type ScheduledVideoRecord } from "@/lib/reel-pipeline";

export const runtime = "nodejs";

async function getAccountForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("instagram_accounts")
    .select("id, user_id, instagram_business_id, access_token, username")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as InstagramAccountRecord | null;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const cronSecret = req.headers.get("x-cron-secret");
    const hasCronAccess = !!process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET;

    if (!session?.user?.id && !hasCronAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, Math.min(20, Number(searchParams.get("limit") || "10")));
    const now = new Date().toISOString();

    let query = supabaseAdmin
      .from("videos")
      .select("*")
      .in("status", ["scheduled", "pending"])
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(limit);

    if (session?.user?.id) {
      query = query.eq("user_id", session.user.id);
    }

    const { data: dueVideos, error: fetchError } = await query;
    if (fetchError) {
      throw fetchError;
    }

    if (!dueVideos?.length) {
      return NextResponse.json({ processed: 0, failed: 0, skipped: 0, message: "No due reels to process." });
    }

    const results: Array<{ id: string; status: string; error?: string }> = [];

    for (const row of dueVideos as ScheduledVideoRecord[]) {
      const claim = await supabaseAdmin
        .from("videos")
        .update({ status: "processing" })
        .eq("id", row.id)
        .eq("status", row.status ?? "scheduled");

      if (claim.error) {
        results.push({ id: row.id, status: "skipped", error: claim.error.message });
        continue;
      }

      try {
        const account = await getAccountForUser(row.user_id);
        if (!account) {
          throw new Error("No connected Instagram account was found for this user.");
        }

        const asset = await createReelAsset(row);
        const caption = (row.caption || row.title || row.clip_text || "New reel").trim();
        const publishResult = await publishInstagramReel(account, asset.signedUrl, caption);

        const { error: updateError } = await supabaseAdmin
          .from("videos")
          .update({ status: "posted" })
          .eq("id", row.id);

        if (updateError) {
          throw updateError;
        }

        results.push({ id: row.id, status: "posted" });
        console.log("[Videos/Process] Reel published", {
          videoId: row.id,
          creationId: publishResult.creationId,
          publishedId: publishResult.publishedId,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown publish error";
        await supabaseAdmin
          .from("videos")
          .update({ status: "failed" })
          .eq("id", row.id);

        results.push({ id: row.id, status: "failed", error: message });
        console.error("[Videos/Process] Reel publish failed", { videoId: row.id, error: message });
      }
    }

    return NextResponse.json({
      processed: results.filter((item) => item.status === "posted").length,
      failed: results.filter((item) => item.status === "failed").length,
      skipped: results.filter((item) => item.status === "skipped").length,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process scheduled reels";
    console.error("[Videos/Process] Error", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
