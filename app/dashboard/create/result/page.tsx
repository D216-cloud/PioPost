"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type ResultClip = {
  id: string;
  text: string;
  start_seconds: number;
  end_seconds: number;
  start: string;
  end: string;
  thumb: string;
};

type ResultVideo = {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  youtubeUrl: string;
};

const STORAGE_VIDEO_KEY = "piopost_last_generated_video";
const STORAGE_CLIPS_KEY = "piopost_last_generated_clips";

export default function CreateResultPage() {
  const [video, setVideo] = useState<ResultVideo | null>(null);
  const [clips, setClips] = useState<ResultClip[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const rawVideo = window.localStorage.getItem(STORAGE_VIDEO_KEY);
      const rawClips = window.localStorage.getItem(STORAGE_CLIPS_KEY);

      if (rawVideo) {
        setVideo(JSON.parse(rawVideo) as ResultVideo);
      }

      if (rawClips) {
        setClips(JSON.parse(rawClips) as ResultClip[]);
      }
    } catch (error) {
      console.error("Failed to load generated result data:", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f7faf7] text-slate-900">
      <div className="relative mx-auto max-w-7xl px-6 md:px-8 pt-8 md:pt-24 pb-20 animate-in fade-in duration-700">
        <div className="absolute inset-x-0 top-0 -z-10 h-32 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_48%),radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_36%)]" />

        <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
            <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700 shadow-[0_4px_12px_rgba(16,185,129,0.06)]">
              <span className="text-[15px] font-medium tracking-tight">Viral Moments</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-slate-500">
            <div className="rounded-full border border-slate-200 bg-white px-3.5 py-2 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">{video?.title ?? "Generated reels"}</div>
            <div className="rounded-full border border-slate-200 bg-white px-3.5 py-2 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">{clips.length} clips</div>
          </div>
        </header>

        {!hydrated ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">Loading generated clips...</div>
        ) : clips.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            No clips found. Generate a video in the create flow first.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {clips.map((clip) => {
              return (
                <article
                  key={clip.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)] transition hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                >
                  <div className="relative aspect-9/16 bg-slate-100">
                    <Image src={clip.thumb} alt={clip.text} fill unoptimized className="object-cover" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/88 via-black/30 to-transparent" />
                    <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white backdrop-blur">
                      {clip.start} - {clip.end}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="mx-auto max-w-[92%] rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur-md">
                        <p className="line-clamp-2 text-[13px] font-semibold leading-relaxed text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                          {clip.text}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 px-4 py-3">
                    <p className="line-clamp-1 text-[12px] font-medium text-slate-500">{video?.author ?? "YouTube Creator"}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
