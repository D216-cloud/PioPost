import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { fetchTranscript } from "youtube-transcript";
import { createWriteStream } from "fs";
import { createReadStream } from "fs";
import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import ytdl from "ytdl-core";
import OpenAI from "openai";

const getYoutubeVideoId = (url: string) => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

const decodeHTMLEntities = (text: string) => {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'"
  };
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, (match) => entities[match]);
};

const normalizeThumbnailUrl = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

async function downloadYoutubeAudio(videoId: string, destinationPath: string) {
  const sourceUrl = `https://www.youtube.com/watch?v=${videoId}`;
  if (!ytdl.validateURL(sourceUrl)) {
    throw new Error("The provided YouTube URL is invalid.");
  }

  await new Promise<void>((resolve, reject) => {
    const stream = ytdl(sourceUrl, {
      quality: "highestaudio",
      filter: "audioonly",
      highWaterMark: 1 << 25,
    });
    const output = createWriteStream(destinationPath);

    stream.on("error", reject);
    output.on("error", reject);
    output.on("finish", () => resolve());
    stream.pipe(output);
  });
}

async function transcribeWithOpenAI(videoId: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "piopost-transcript-"));
  const audioPath = path.join(tempDir, `${videoId}.webm`);

  try {
    await downloadYoutubeAudio(videoId, audioPath);

    const client = new OpenAI({ apiKey });
    const transcription = await client.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    const segments = Array.isArray(transcription.segments)
      ? transcription.segments.map((segment) => ({
          text: segment.text,
          start: segment.start,
          end: segment.end,
        }))
      : [];

    if (segments.length === 0 && !transcription.text) {
      return null;
    }

    return {
      text: transcription.text || segments.map((segment) => segment.text).join(" "),
      segments,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function buildFallbackResponse(videoId: string, title: string, author: string) {
  const thumbnailUrl = normalizeThumbnailUrl(videoId);
  const transcript = [
    "Transcript could not be loaded automatically for this video right now.",
    "You can still review the video card and try again when network access is available.",
  ].join(" ");

  return NextResponse.json({
    ok: true,
    videoId,
    title,
    author,
    thumbnail: thumbnailUrl,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    transcript,
    clips: [
      {
        id: "fallback-1",
        text: transcript,
        start_seconds: 0,
        end_seconds: 30,
        start: "0:00",
        end: "0:30",
        thumb: thumbnailUrl,
      },
    ],
    warning: "Transcript extraction could not reach YouTube, so a local fallback was returned.",
  });
}

function buildSegmentsFromTranscriptText(text: string) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return [];
  }

  return sentences.map((sentence, index) => ({
    text: sentence,
    start: index * 8,
    end: index * 8 + 8,
  }));
}

function buildTranscriptClips(segments: Array<{ text: string; start: number; end: number }>, thumbnailUrl: string) {
  const clips: Array<{ id: string; text: string; start_seconds: number; end_seconds: number; start: string; end: string; thumb: string }> = [];
  let currentClip: { segments: Array<{ text: string; start: number; end: number }>; duration: number } = { segments: [], duration: 0 };

  const sourceSegments = segments.length > 0 ? segments : [];

  sourceSegments.forEach((segment) => {
    const text = decodeHTMLEntities(segment.text).replace(/\s+/g, " ").trim();
    if (!text) return;

    const start = segment.start;
    const duration = Math.max(0, segment.end - segment.start);

    if (currentClip.duration + duration > 45 && currentClip.duration >= 15 && currentClip.segments.length > 0) {
      const startTime = currentClip.segments[0].start;
      const endTime = currentClip.segments[currentClip.segments.length - 1].end;

      clips.push({
        id: `clip-${clips.length}`,
        text: currentClip.segments.map((item) => item.text).join(" "),
        start_seconds: startTime,
        end_seconds: endTime,
        start: formatTime(startTime),
        end: formatTime(endTime),
        thumb: thumbnailUrl,
      });

      currentClip = { segments: [], duration: 0 };
    }

    currentClip.segments.push({ text, start, end: segment.end });
    currentClip.duration += duration;
  });

  if (currentClip.segments.length > 0 && currentClip.duration >= 5) {
    const startTime = currentClip.segments[0].start;
    const endTime = currentClip.segments[currentClip.segments.length - 1].end;

    clips.push({
      id: `clip-${clips.length}`,
      text: currentClip.segments.map((item) => item.text).join(" "),
      start_seconds: startTime,
      end_seconds: endTime,
      start: formatTime(startTime),
      end: formatTime(endTime),
      thumb: thumbnailUrl,
    });
  }

  return clips;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ ok: false, error: "YouTube URL is required" }, { status: 400 });

    const videoId = getYoutubeVideoId(url);
    if (!videoId) return NextResponse.json({ ok: false, error: "Invalid YouTube URL" }, { status: 400 });

    // Use a try-catch for metadata to ensure at least UI shows up
    let metadata: any;
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      metadata = await oembedRes.json();
    } catch (e) {
      metadata = { title: "YouTube Video", author_name: "Unknown" };
    }

    const thumbnailUrl = normalizeThumbnailUrl(videoId);

    let transcriptEntries: Array<{ text: string; duration: number; offset: number }> | null = null;
    let transcriptSegments: Array<{ text: string; start: number; end: number }> | null = null;
    try {
      transcriptEntries = await fetchTranscript(videoId);
    } catch (error) {
      console.error("Transcript fetch failed, using fallback response:", error);
    }
    
    if (!transcriptEntries) {
      try {
        const openAiTranscript = await transcribeWithOpenAI(videoId);
        if (openAiTranscript?.text) {
          transcriptSegments = openAiTranscript.segments.length > 0 ? openAiTranscript.segments : buildSegmentsFromTranscriptText(openAiTranscript.text);
        }
      } catch (error) {
        console.error("OpenAI transcription failed:", error);
      }

      if (!transcriptSegments) {
        return buildFallbackResponse(videoId, metadata.title, metadata.author_name);
      }
    }

    const transcript = transcriptEntries
      ? transcriptEntries.map((entry) => decodeHTMLEntities(entry.text).replace(/\s+/g, " ").trim()).filter(Boolean).join(" ")
      : transcriptSegments?.map((segment) => segment.text).join(" ") || "";

    const clips = transcriptEntries
      ? buildTranscriptClips(
          transcriptEntries.map((entry) => ({
            text: entry.text,
            start: entry.offset / 1000,
            end: (entry.offset + entry.duration) / 1000,
          })),
          thumbnailUrl,
        )
      : buildTranscriptClips(transcriptSegments ?? [], thumbnailUrl);

    return NextResponse.json({
      ok: true,
      videoId,
      title: metadata.title,
      author: metadata.author_name,
      thumbnail: thumbnailUrl,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      transcript,
      clips
    });

  } catch (e: any) {
    console.error("YouTube Processing Error:", e);
    const videoId = typeof e?.videoId === "string" ? e.videoId : null;
    const title = typeof e?.title === "string" ? e.title : "YouTube Video";
    const author = typeof e?.author === "string" ? e.author : "YouTube Creator";

    if (videoId) {
      return buildFallbackResponse(videoId, title, author);
    }

    return NextResponse.json({
      ok: false,
      error: e.message || "Failed to process video. YouTube might be limiting automated requests.",
    }, { status: 500 });
  }
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
