import { createWriteStream } from "fs";
import { readFile, mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ytdl from "ytdl-core";
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface ScheduledVideoRecord {
  id: string;
  user_id: string;
  status?: "scheduled" | "pending" | "processing" | "posted" | "failed" | string | null;
  title: string;
  source_url?: string | null;
  youtube_url?: string | null;
  caption?: string | null;
  clip_text?: string | null;
  start_seconds?: number | null;
  end_seconds?: number | null;
  thumbnail_url?: string | null;
}

export interface InstagramAccountRecord {
  id: string;
  user_id: string;
  instagram_business_id: string;
  access_token: string;
  username?: string | null;
}

const STORAGE_BUCKET = "draft-media";

function resolveSourceUrl(video: ScheduledVideoRecord) {
  return video.youtube_url || video.source_url || "";
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "reel";
}

async function downloadYoutubeSource(sourceUrl: string, destinationPath: string) {
  if (!ytdl.validateURL(sourceUrl)) {
    throw new Error("The scheduled row does not contain a valid YouTube URL.");
  }

  await new Promise<void>((resolve, reject) => {
    const stream = ytdl(sourceUrl, {
      quality: "highest",
      filter: "audioandvideo",
    });
    const output = createWriteStream(destinationPath);

    stream.on("error", reject);
    output.on("error", reject);
    output.on("finish", () => resolve());
    stream.pipe(output);
  });
}

async function renderVerticalReel(inputPath: string, outputPath: string, startSeconds: number, endSeconds: number) {
  const duration = Math.max(5, Math.min(60, endSeconds - startSeconds));

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .inputOptions(["-ss", `${Math.max(0, startSeconds).toFixed(2)}`])
      .duration(duration)
      .outputOptions([
        "-vf",
        "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1",
        "-r",
        "30",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "20",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "-shortest",
      ])
      .on("end", () => resolve())
      .on("error", reject)
      .save(outputPath);
  });
}

export async function createReelAsset(video: ScheduledVideoRecord) {
  const sourceUrl = resolveSourceUrl(video);
  if (!sourceUrl) {
    throw new Error("A source YouTube URL is required to render the reel.");
  }

  const startSeconds = Number(video.start_seconds ?? 0);
  const endSeconds = Number(video.end_seconds ?? startSeconds + 30);
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "piopost-reel-"));
  const inputPath = path.join(tempDir, `${video.id}-source.mp4`);
  const outputPath = path.join(tempDir, `${video.id}-reel.mp4`);

  try {
    await downloadYoutubeSource(sourceUrl, inputPath);
    await renderVerticalReel(inputPath, outputPath, startSeconds, endSeconds);

    const buffer = await readFile(outputPath);
    const storagePath = `reels/${video.user_id}/${sanitizeSegment(video.title)}-${video.id}-${Date.now()}.mp4`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw signedUrlError || new Error("Failed to create a signed URL for the reel asset.");
    }

    return {
      storagePath,
      signedUrl: signedUrlData.signedUrl,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function publishInstagramReel(
  account: InstagramAccountRecord,
  videoUrl: string,
  caption: string,
): Promise<{ creationId: string; publishedId: string }> {
  const createResponse = await fetch(`https://graph.facebook.com/v21.0/${account.instagram_business_id}/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      media_type: "REELS",
      share_to_feed: "true",
      video_url: videoUrl,
      caption,
      access_token: account.access_token,
    }),
  });

  const createJson = await createResponse.json();
  if (!createResponse.ok || createJson.error) {
    throw new Error(createJson.error?.message || "Failed to create Instagram reel container.");
  }

  const creationId = createJson.id as string;
  if (!creationId) {
    throw new Error("Instagram did not return a reel creation ID.");
  }

  const publishResponse = await fetch(`https://graph.facebook.com/v21.0/${account.instagram_business_id}/media_publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      creation_id: creationId,
      access_token: account.access_token,
    }),
  });

  const publishJson = await publishResponse.json();
  if (!publishResponse.ok || publishJson.error) {
    throw new Error(publishJson.error?.message || "Failed to publish the Instagram reel.");
  }

  const publishedId = publishJson.id as string;
  if (!publishedId) {
    throw new Error("Instagram did not return a published reel ID.");
  }

  return { creationId, publishedId };
}
