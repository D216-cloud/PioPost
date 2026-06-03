"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  FileText,
  Loader2,
  Settings as SettingsIcon,
  Sparkles,
  Upload,
  Link2,
  MessageSquare,
  Zap,
  Clock,
  Play,
  ArrowRight,
  ChevronDown,
  Check,
  Search,
} from "lucide-react";
import { YoutubeIcon as Youtube, InstagramIcon as Instagram } from "@/components/icons";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type Clip = {
  id: string;
  text: string;
  start_seconds: number;
  end_seconds: number;
  start: string;
  end: string;
  thumb: string;
};

type VideoData = {
  title: string;
  author: string;
  thumbnail: string;
  youtubeUrl: string;
  transcript?: string;
  clips?: Clip[];
};

type YoutubeProcessResponse =
  | {
      ok: true;
      videoId: string;
      title: string;
      author: string;
      thumbnail: string;
      youtubeUrl: string;
      transcript?: string;
      clips?: Clip[];
    }
  | {
      ok: false;
      error?: string;
    };

type YoutubeChannelVideo = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  publishedAt?: string;
  order: number;
};

type YoutubeChannelResponse =
  | {
      ok: true;
      channelId?: string;
      channelTitle: string;
      videos: YoutubeChannelVideo[];
    }
  | {
      ok: false;
      error?: string;
    };

type InstagramAccount = {
  id: string;
  username: string;
  profile_picture_url?: string | null;
};

const clipsPerPage = 12;

function getYoutubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function CreatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoIdParam = searchParams?.get("v") ?? null;
  const processingTimerRef = useRef<number | null>(null);
  const transcriptSectionRef = useRef<HTMLDivElement>(null);

  const videoMeta = videoIdParam
    ? {
        title: "YouTube Video",
        author: "YouTube Creator",
        thumbnail: `https://img.youtube.com/vi/${videoIdParam}/hqdefault.jpg`,
      }
    : null;

  const [activeTab, setActiveTab] = useState<"upload" | "youtube" | "other">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [showAllVideos, setShowAllVideos] = useState(true);
  const [isConnectingYoutube, setIsConnectingYoutube] = useState(false);
  const [youtubeMessage, setYoutubeMessage] = useState("Connect a channel or video URL to load the queue.");

  const [channelInfo, setChannelInfo] = useState<{
    title: string;
    channelId?: string;
    totalVideos: number;
    thumbnail?: string;
  } | null>(null);
  const [channelVideos, setChannelVideos] = useState<YoutubeChannelVideo[]>([]);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [automationScope, setAutomationScope] = useState<"1" | "2" | "3" | "all">("all");

  const [status, setStatus] = useState<"idle" | "processing" | "ready">("idle");
  const [processingMsg, setProcessingMsg] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [clipPage, setClipPage] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("12:00");
  const [postsPerDay, setPostsPerDay] = useState(1);
  const [isScheduling, setIsScheduling] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState("Auto");
  const [selectedClipLength, setSelectedClipLength] = useState("Auto (<90s)");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [clipDropdownOpen, setClipDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const langRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTranscript || !videoData?.transcript) return;

    transcriptSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showTranscript, videoData?.transcript]);

  const languageOptions = [
    { label: "Auto", native: "Detect automatically" },
    { label: "English", native: "English" },
    { label: "Hindi", native: "हिन्दी" },
    { label: "Spanish", native: "Español" },
    { label: "French", native: "Français" },
    { label: "German", native: "Deutsch" },
    { label: "Portuguese", native: "Português" },
    { label: "Arabic", native: "العربية" },
    { label: "Japanese", native: "日本語" },
    { label: "Korean", native: "한국어" },
    { label: "Chinese", native: "中文" },
    { label: "Russian", native: "Русский" },
    { label: "Italian", native: "Italiano" },
    { label: "Turkish", native: "Türkçe" },
    { label: "Indonesian", native: "Bahasa Indonesia" },
  ];

  const clipLengthOptions = [
    "Auto (<90s)",
    "<30s",
    "30s-60s",
    "60s-90s",
    "90s-3min",
    ">3min",
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
        setLangSearch("");
      }
      if (clipRef.current && !clipRef.current.contains(e.target as Node)) {
        setClipDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (processingTimerRef.current !== null) {
        window.clearInterval(processingTimerRef.current);
      }
    };
  }, []);

  const filteredLanguages = languageOptions.filter(
    (lang) =>
      lang.label.toLowerCase().includes(langSearch.toLowerCase()) ||
      lang.native.toLowerCase().includes(langSearch.toLowerCase())
  );

  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const instagramConnected = instagramAccounts.length > 0;
  const primaryInstagramAccount = instagramAccounts[0] ?? null;

  const totalClipPages = Math.max(1, Math.ceil(clips.length / clipsPerPage));
  const displayedClips = clips.slice(clipPage * clipsPerPage, (clipPage + 1) * clipsPerPage);
  const selectedVideo = channelVideos[selectedVideoIndex] ?? null;

  const loadInstagramAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/instagram-account");
      const { data } = await res.json();
      setInstagramAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load Instagram accounts:", error);
      setInstagramAccounts([]);
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadInstagramAccounts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [session?.user?.id, loadInstagramAccounts]);

  const processVideoByUrl = useCallback(
    async (url: string, options?: { openTranscriptAfter?: boolean; stayOnPage?: boolean }) => {
      if (!session?.user?.id) {
        toast.error("Please sign in to generate clips");
        return;
      }

      if (processingTimerRef.current !== null) {
        window.clearInterval(processingTimerRef.current);
        processingTimerRef.current = null;
      }

      setStatus("processing");
      setProcessingProgress(1);
      setProcessingMsg("Turning long video into viral reel clips…");
      setVideoData(null);
      setClips([]);
      setSelectedIds(new Set());
      setClipPage(0);
      setShowTranscript(false);

      processingTimerRef.current = window.setInterval(() => {
        setProcessingProgress((current) => Math.min(95, current + Math.max(1, Math.round((100 - current) * 0.08))));
      }, 180);

      try {
        const res = await fetch("/api/youtube-process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const json = (await res.json()) as YoutubeProcessResponse;
        if (!json.ok) {
          throw new Error(json.error || "Failed to process video");
        }

        setVideoData({
          title: json.title,
          author: json.author,
          thumbnail: json.thumbnail,
          youtubeUrl: json.youtubeUrl,
          transcript: json.transcript,
          clips: json.clips,
        });
        setClips(json.clips ?? []);
        if (options?.openTranscriptAfter && json.transcript) {
          setShowTranscript(true);
        }
        if (processingTimerRef.current !== null) {
          window.clearInterval(processingTimerRef.current);
          processingTimerRef.current = null;
        }
        setProcessingProgress(100);
        setStatus("ready");
        setProcessingMsg("");
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "piopost_last_generated_video",
            JSON.stringify({
              videoId: json.videoId,
              title: json.title,
              author: json.author,
              thumbnail: json.thumbnail,
              youtubeUrl: json.youtubeUrl,
              transcript: json.transcript,
            }),
          );
          window.localStorage.setItem("piopost_last_generated_clips", JSON.stringify(json.clips ?? []));
        }
        if (videoIdParam && !options?.stayOnPage) {
          router.push(`/dashboard/create/result?v=${videoIdParam}&processed=1`);
        }
        toast.success(`Discovered ${json.clips?.length ?? 0} reel clips`);
      } catch (error: unknown) {
        if (processingTimerRef.current !== null) {
          window.clearInterval(processingTimerRef.current);
          processingTimerRef.current = null;
        }
        toast.error(error instanceof Error ? error.message : "Processing failed");
        setStatus("idle");
        setProcessingMsg("");
        setProcessingProgress(0);
      }
    },
    [router, session?.user?.id, videoIdParam],
  );

  const handleYoutubeConnect = useCallback(async () => {
    if (!youtubeUrl.trim()) {
      toast.error("Paste a YouTube channel or video URL first");
      return;
    }

    const videoId = getYoutubeId(youtubeUrl);
    if (videoId) {
      router.push(`/dashboard/create?v=${videoId}`);
      return;
    }

    setIsConnectingYoutube(true);
    setYoutubeMessage("Loading channel videos…");

    try {
      const res = await fetch("/api/youtube-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      const json = (await res.json()) as YoutubeChannelResponse;
      if (!json.ok) {
        throw new Error(json.error || "Failed to load channel");
      }

      const videos = json.videos ?? [];
      if (videos.length === 0) {
        throw new Error("No videos found for this channel");
      }

      setChannelVideos(videos);
      setChannelInfo({
        title: json.channelTitle,
        channelId: json.channelId,
        totalVideos: videos.length,
        thumbnail: videos[0]?.thumbnail,
      });
      setYoutubeConnected(true);
      setShowAllVideos(true);
      setSelectedVideoIndex(0);
      setAutomationScope("all");
      setYoutubeMessage(`Connected to ${json.channelTitle}`);
      toast.success(`Loaded ${videos.length} channel videos`);

      await processVideoByUrl(videos[0].url);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "YouTube connect failed");
      setYoutubeMessage("Connect a channel or video URL to load the queue.");
    } finally {
      setIsConnectingYoutube(false);
    }
  }, [processVideoByUrl, router, youtubeUrl]);

  const selectVideo = useCallback(
    async (index: number) => {
      if (!channelVideos[index]) return;

      setSelectedVideoIndex(index);
      setAutomationScope(index === 0 ? "all" : index === 1 ? "2" : index === 2 ? "3" : automationScope);
      await processVideoByUrl(channelVideos[index].url);
    },
    [automationScope, channelVideos, processVideoByUrl],
  );

  const handleAutomationScopeChange = useCallback(
    async (scope: "1" | "2" | "3" | "all") => {
      setAutomationScope(scope);

      const nextIndex = scope === "all" ? 0 : Math.min(Number(scope) - 1, Math.max(channelVideos.length - 1, 0));
      setSelectedVideoIndex(nextIndex);

      if (channelVideos[nextIndex]) {
        await processVideoByUrl(channelVideos[nextIndex].url);
      }
    },
    [channelVideos, processVideoByUrl],
  );

  const handleSchedule = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to schedule");
      return;
    }

    if (!instagramConnected) {
      toast.error("Connect Instagram first");
      return;
    }

    setIsScheduling(true);

    try {
      const selectedClips = clips.filter((_, index) => selectedIds.has(index));
      if (!selectedClips.length) {
        toast.error("Select at least one reel");
        return;
      }

      const rows = buildVideoRows("scheduled");

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });

      if (!res.ok) {
        throw new Error("Scheduling failed");
      }

      toast.success(`Scheduled ${rows.length} reels`);
      router.push("/dashboard/videos");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Schedule error");
    } finally {
      setIsScheduling(false);
    }
  };

  const buildVideoRows = useCallback(
    (status: "scheduled" | "pending") => {
      const selectedClips = clips.filter((_, index) => selectedIds.has(index));

      return selectedClips.map((clip, index) => {
        const dayOffset = Math.floor(index / postsPerDay);
        const hourOffset = (index % postsPerDay) * (24 / postsPerDay);
        const scheduled = new Date(`${startDate}T${startTime}`);
        scheduled.setDate(scheduled.getDate() + dayOffset);
        scheduled.setHours(scheduled.getHours() + Math.floor(hourOffset));
        scheduled.setMinutes(scheduled.getMinutes() + Math.floor((hourOffset % 1) * 60));

        return {
          user_id: session?.user?.id,
          title: `${videoData?.title ?? selectedVideo?.title ?? "Video"} – Reel ${index + 1}`,
          source_url: selectedVideo?.url ?? videoData?.youtubeUrl ?? "",
          thumbnail_url: videoData?.thumbnail ?? selectedVideo?.thumbnail ?? "",
          caption: clip.text,
          status,
          scheduled_at: status === "pending" ? new Date().toISOString() : scheduled.toISOString(),
          platform: "instagram",
        };
      });
    },
    [clips, postsPerDay, selectedIds, selectedVideo?.thumbnail, selectedVideo?.title, selectedVideo?.url, session?.user?.id, startDate, startTime, videoData?.thumbnail, videoData?.title, videoData?.youtubeUrl],
  );

  const publishVideosById = useCallback(async (videoIds: string[]) => {
    for (const id of videoIds) {
      const res = await fetch(`/api/videos/process?id=${encodeURIComponent(id)}`, { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Immediate publish failed");
      }

      const failedItem = Array.isArray(json.results) ? json.results.find((item: { status?: string; error?: string }) => item.status === "failed") : null;
      if (failedItem?.error) {
        throw new Error(failedItem.error);
      }
    }
  }, []);

  const handlePostNow = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to post");
      return;
    }

    if (!instagramConnected) {
      toast.error("Connect Instagram first");
      return;
    }

    setIsScheduling(true);

    try {
      const rows = buildVideoRows("pending");
      if (!rows.length) {
        toast.error("Select at least one reel");
        return;
      }

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Posting failed");
      }

      const createdRows = Array.isArray(payload.data) ? payload.data : [];
      await publishVideosById(createdRows.map((row: { id?: string }) => row.id).filter((id: string | undefined): id is string => Boolean(id)));

      toast.success(`Posted ${createdRows.length} reel${createdRows.length === 1 ? "" : "s"} immediately`);
      router.push("/dashboard/videos");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Post now error");
    } finally {
      setIsScheduling(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const automationCards = [
    { value: "1" as const, label: "Video 1" },
    { value: "2" as const, label: "Video 2" },
    { value: "3" as const, label: "Video 3" },
    { value: "all" as const, label: "All Videos" },
  ];

  if (videoIdParam) {
    const isProcessing = status === "processing";
    const isReady = status === "ready";

    return (
      <div className="relative mx-auto max-w-7xl px-6 md:px-8 pt-8 md:pt-24 pb-20 animate-in fade-in duration-700 bg-white text-slate-900">
        <div className="absolute inset-x-0 top-0 -z-10 h-128 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.12),transparent_50%),radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent_42%)]" />

        <div className="mx-auto w-full max-w-7xl space-y-8 text-center pt-4">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-[32px] md:text-[52px] font-normal tracking-tight text-slate-900 leading-none">
              Choose what to do with this video.
            </h1>
          </div>
                By continuing, you confirm the video is your own. Using others&apos; content may violate copyright laws.
          {/* YouTube Link Badge */}
          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100/90 px-4 py-1.5 border border-slate-200/50 text-[13px] text-slate-600 font-mono shadow-xs backdrop-blur-md">
            <Link2 size={14} />
            <span>https://www.youtube.com/watch?v={videoIdParam}</span>
          </div>

          {/* Center Card */}
          <div className="flex flex-col items-center">
            {videoMeta ? (
              <div className="relative w-full max-w-[480px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-xl shadow-slate-100/50">
                {/* Thumbnail & Play button */}
                <div className="relative aspect-video w-full bg-slate-50">
                  <Image
                    src={videoMeta.thumbnail}
                    alt={videoMeta.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                    <button
                      type="button"
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/40 shadow-lg hover:scale-105 transition-transform"
                    >
                      <Play size={20} className="fill-white stroke-none ml-1" />
                    </button>
                  </div>
                  {/* Duration Badge */}
                  <span className="absolute bottom-3 right-3 rounded bg-slate-900/90 px-2 py-0.5 text-[11px] font-bold text-white tracking-wider">
                    00:21:08
                  </span>
                </div>
                {/* Title & Author Info */}
                <div className="p-4 text-left border-t border-slate-100 bg-white">
                  <h3 className="line-clamp-1 text-[15px] font-bold text-slate-900">{videoMeta.title}</h3>
                  <p className="mt-1 text-[12px] font-semibold text-slate-500">YouTube • {videoMeta.author}</p>
                </div>
              </div>
            ) : (
              <div className="h-64 w-[480px] rounded-[24px] border border-slate-200 bg-slate-50 animate-pulse flex items-center justify-center text-slate-400">
                <Loader2 className="animate-spin text-slate-400" size={24} />
              </div>
            )}
          </div>

          {/* If ready, show the clips layout! */}
          {isReady && clips.length > 0 && (
            <div className="text-left space-y-6 pt-8 max-w-4xl mx-auto border-t border-slate-200">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h4 className="text-[20px] font-bold text-slate-900">
                  Generated Clips ({clips.length})
                </h4>
                <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-[12px] font-bold text-indigo-600">
                  {selectedIds.size} Selected
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {displayedClips.map((clip, index) => {
                  const clipIndex = clipPage * clipsPerPage + index;
                  const isSelected = selectedIds.has(clipIndex);

                  return (
                    <div
                      key={clip.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onClick={() => toggleSelect(clipIndex)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleSelect(clipIndex);
                        }
                      }}
                      className={`group relative overflow-hidden rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#a855f7] ring-4 ring-[#a855f7]/10 shadow-[0_16px_35px_rgba(168,85,247,0.12)]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_16px_35px_rgba(15,23,42,0.08)]"
                      }`}
                    >
                      <div className="relative aspect-4/5 w-full bg-slate-100">
                        <Image
                          src={clip.thumb}
                          alt={`Clip ${clipIndex + 1}`}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90" />

                        {/* Top action icons */}
                        <div className="absolute right-3 top-3 flex items-center gap-2">
                          <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-black text-slate-900 shadow-sm mr-auto">
                            #{clipIndex + 1}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSelect(clipIndex);
                            }}
                            className={`rounded-full p-2 backdrop-blur-sm transition ${
                              isSelected ? "bg-[#a855f7] text-white" : "bg-white/10 text-white hover:bg-white/20"
                            }`}
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        </div>

                        {/* Text and timing */}
                        <div className="absolute bottom-3 left-3 right-3 space-y-2">
                          <p className="line-clamp-3 text-[13px] font-semibold leading-relaxed text-white/95">{clip.text}</p>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] font-bold text-white/60">
                              {clip.start} – {clip.end}
                            </span>
                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                              {isSelected ? "Selected" : "Choose"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalClipPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setClipPage((value) => Math.max(value - 1, 0))}
                    disabled={clipPage === 0}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-[13px] font-bold text-slate-500">
                    Page {clipPage + 1} of {totalClipPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setClipPage((value) => Math.min(value + 1, totalClipPages - 1))}
                    disabled={clipPage >= totalClipPages - 1}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Settings and Scheduling */}
              <div className="grid gap-6 md:grid-cols-2 pt-8 border-t border-slate-200">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <CalendarIcon size={20} className="text-[#a855f7]" />
                    <h4 className="text-[18px] font-black tracking-tight text-slate-900">Scheduling</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(event) => setStartTime(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPostsPerDay((value) => Math.max(1, value - 1))}
                        className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      >
                        -
                      </button>
                      <span className="min-w-[80px] text-center text-[13px] font-bold text-slate-950">{postsPerDay} posts/day</span>
                      <button
                        type="button"
                        onClick={() => setPostsPerDay((value) => value + 1)}
                        className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={handlePostNow}
                        disabled={isScheduling || !instagramConnected}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {isScheduling ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                        Post Now
                      </button>
                      <button
                        type="button"
                        onClick={handleSchedule}
                        disabled={isScheduling || !instagramConnected}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                      >
                        {isScheduling ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                        Schedule Reels
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`rounded-3xl border p-6 flex flex-col justify-between shadow-sm bg-white ${instagramConnected ? "border-emerald-200 bg-emerald-50/10" : "border-slate-200"}`}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white">
                        <Instagram size={18} />
                      </div>
                      <div>
                        <p className="text-[16px] font-bold text-slate-900">Instagram Connection</p>
                        <p className="text-[12px] text-slate-500">
                          {instagramConnected ? `@${primaryInstagramAccount?.username}` : "Unlock automated publication."}
                        </p>
                      </div>
                    </div>
                    {!instagramConnected && (
                      <button
                        type="button"
                        onClick={() => (window.location.href = "/api/auth/instagram/link")}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-[13px] font-bold text-white transition-all hover:opacity-90"
                      >
                        Connect Instagram
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Setup Settings & Action Button (Only if not ready and not processing) */}
          {!isReady && !isProcessing && (
            <div className="flex flex-col items-center space-y-6 pt-4">
              {/* Dropdowns */}
              <div className="flex flex-col md:flex-row items-center gap-4 justify-center">
                {/* Language Dropdown */}
                <div ref={langRef} className="relative min-w-[280px]">
                  <button
                    type="button"
                    onClick={() => { setLangDropdownOpen(!langDropdownOpen); setClipDropdownOpen(false); }}
                    className="flex w-full items-center justify-between gap-3 bg-white border border-slate-200 px-5 py-3.5 rounded-2xl shadow-xs hover:border-slate-300 transition-all"
                  >
                    <span className="text-[13.5px] font-bold text-slate-500">Language</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-bold text-slate-900">{selectedLanguage}</span>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${langDropdownOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {langDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Search Input */}
                      <div className="p-3 border-b border-slate-100">
                        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                          <Search size={14} className="text-slate-400 shrink-0" />
                          <input
                            value={langSearch}
                            onChange={(e) => setLangSearch(e.target.value)}
                            placeholder="Search language..."
                            className="w-full bg-transparent text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                            autoFocus
                          />
                        </div>
                      </div>
                      {/* Options List */}
                      <div className="max-h-[240px] overflow-y-auto py-1">
                        {filteredLanguages.map((lang) => {
                          const isActive = selectedLanguage === lang.label;
                          return (
                            <button
                              key={lang.label}
                              type="button"
                              onClick={() => {
                                setSelectedLanguage(lang.label);
                                setLangDropdownOpen(false);
                                setLangSearch("");
                              }}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? "bg-slate-50" : "hover:bg-slate-50"}`}
                            >
                              <span className="w-4 shrink-0">
                                {isActive && <Check size={14} className="text-[#a855f7]" />}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13.5px] font-semibold ${isActive ? "text-[#a855f7]" : "text-slate-900"}`}>{lang.label}</p>
                                <p className="text-[11px] text-slate-400">{lang.native}</p>
                              </div>
                            </button>
                          );
                        })}
                        {filteredLanguages.length === 0 && (
                          <p className="px-4 py-6 text-center text-[13px] text-slate-400">No languages found</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Clip Length Dropdown */}
                <div ref={clipRef} className="relative min-w-[280px]">
                  <button
                    type="button"
                    onClick={() => { setClipDropdownOpen(!clipDropdownOpen); setLangDropdownOpen(false); }}
                    className="flex w-full items-center justify-between gap-3 bg-white border border-slate-200 px-5 py-3.5 rounded-2xl shadow-xs hover:border-slate-300 transition-all"
                  >
                    <span className="text-[13.5px] font-bold text-slate-500">Clip Length</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-bold text-slate-900">{selectedClipLength}</span>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${clipDropdownOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {clipDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="py-1">
                        {clipLengthOptions.map((option) => {
                          const isActive = selectedClipLength === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setSelectedClipLength(option);
                                setClipDropdownOpen(false);
                              }}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? "bg-slate-50" : "hover:bg-slate-50"}`}
                            >
                              <span className="w-4 shrink-0">
                                {isActive && <Check size={14} className="text-[#a855f7]" />}
                              </span>
                              <span className={`text-[13.5px] font-semibold ${isActive ? "text-[#a855f7]" : "text-slate-900"}`}>{option}</span>
                            </button>
                          );
                        })}
                      </div>
                      {/* Selected value footer */}
                      <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
                        <span className="text-[12px] text-slate-400">Selected</span>
                        <span className="text-[12.5px] font-bold text-slate-900">{selectedClipLength}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const url = `https://www.youtube.com/watch?v=${videoIdParam}`;
                    void processVideoByUrl(url);
                  }}
                  className="inline-flex h-14 min-w-[320px] md:min-w-[360px] items-center justify-center rounded-full bg-[#72ff4a] hover:bg-[#63e63e] px-8 text-black font-bold text-[15px] transition-all hover:scale-[1.01] shadow-lg shadow-emerald-100/50"
                >
                  One Click to Grasp Moments Instantly
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (videoData?.transcript) {
                      setShowTranscript((value) => !value);
                      return;
                    }

                    const url = `https://www.youtube.com/watch?v=${videoIdParam}`;
                    void processVideoByUrl(url, { openTranscriptAfter: true, stayOnPage: true });
                  }}
                  className="inline-flex h-14 min-w-[240px] items-center justify-center rounded-full border border-slate-200 bg-white px-7 text-[15px] font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  {videoData?.transcript ? (showTranscript ? "Hide Transcript" : "Show Transcript") : "Load Transcript in Card"}
                </button>
              </div>

              {/* Legal Footer */}
              <p className="max-w-xl text-[12px] text-slate-500 leading-relaxed mx-auto">
                By continuing, you confirm the video is your own. Using others&apos; content may violate copyright laws.
              </p>
            </div>
          )}

          {/* Processing Loading Section */}
          {isProcessing && (
            <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 flex flex-col items-center space-y-4 shadow-xl">
              <Loader2 className="animate-spin text-[#a855f7]" size={32} />
              <p className="text-[15px] font-bold text-slate-900">{processingMsg || "Generating clips..."}</p>
              <p className="text-[12px] text-slate-500 text-center leading-relaxed">
                Our AI engine is currently scanning the video to discover the most viral and high-retention moments.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="relative mx-auto max-w-7xl px-6 md:px-8 pt-8 md:pt-24 pb-20 space-y-8 animate-in fade-in duration-700">
        <div className="absolute inset-x-0 top-0 -z-10 h-128 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.12),transparent_50%),radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent_42%)]" />

        <section className="pt-2 md:pt-4 text-center space-y-6 md:space-y-8">
          <div className="space-y-3">
            <h1 className="text-[32px] md:text-[52px] font-normal tracking-tight text-slate-900 leading-none">
              Discover, Create, <span className="text-[#a855f7] font-medium">Share</span>.
            </h1>
            <p className="text-[14.5px] md:text-[16px] text-slate-500 font-medium max-w-xl leading-relaxed mx-auto">
              Cherish Every Moment.
            </p>
          </div>

          <div className="mx-auto w-full max-w-7xl space-y-8">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 md:p-7 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
              {/* Center interactive Tab Switcher */}
              <div className="mb-6 flex justify-center">
                <div className="relative inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                  <div
                    className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.16)] transition-transform duration-300 ease-out"
                    style={{
                      transform:
                        activeTab === "youtube"
                          ? "translateX(0%)"
                          : activeTab === "upload"
                            ? "translateX(100%)"
                            : "translateX(200%)",
                    }}
                  />
                  {[
                    { id: "youtube" as const, label: "YouTube Link", color: "bg-red-500" },
                    { id: "upload" as const, label: "Upload File", color: "bg-indigo-500" },
                    { id: "other" as const, label: "Other Links", color: "bg-[#a855f7]" },
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative z-10 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-colors duration-200 ${
                          isActive ? "text-white" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-white" : tab.color} shrink-0`} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Inputs based on Tab Selection */}
              {activeTab === "youtube" && (
                <div className="mx-auto w-full max-w-2xl rounded-full border border-slate-200 bg-white p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 focus-within:border-slate-300 focus-within:shadow-[0_18px_40px_rgba(15,23,42,0.1)]">
                  <div className="flex items-center gap-3 pl-4 pr-1.5">
                    <Link2 className="text-slate-400 shrink-0 ml-1" size={18} />
                    <div className="relative flex-1 min-w-0">
                      <input
                        value={youtubeUrl}
                        onChange={(event) => setYoutubeUrl(event.target.value)}
                        placeholder="Paste a YouTube video or channel link to auto-detect viral clips..."
                        className="h-14 md:h-16 w-full bg-transparent text-[14px] md:text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            void handleYoutubeConnect();
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleYoutubeConnect}
                      disabled={isConnectingYoutube}
                      className="inline-flex h-12 md:h-14 min-w-28 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-[14px] transition-all hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 shadow-sm"
                    >
                      {isConnectingYoutube ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <span className="flex items-center gap-2">
                          Connect <ArrowRight size={15} />
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "upload" && (
                <div className="mx-auto w-full max-w-2xl rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition-all duration-300 hover:border-slate-300 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-900 ring-1 ring-slate-200">
                    <Upload size={22} className="animate-bounce" />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900">Drag & drop your video file</h3>
                  <p className="mt-1 text-[13px] font-medium text-slate-500">Supports MP4, MOV or WebM files up to 500MB</p>
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => toast.info("Local file upload is a premium feature. Try pasting a YouTube link instead!")}
                      className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-6 text-[13px] font-bold text-white transition-all hover:scale-[1.01] hover:bg-slate-800"
                    >
                      Select Local Video
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "other" && (
                <div className="mx-auto w-full max-w-2xl rounded-full border border-slate-200 bg-white p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 focus-within:border-slate-300 focus-within:shadow-[0_18px_40px_rgba(15,23,42,0.1)]">
                  <div className="flex items-center gap-3 pl-4 pr-1.5">
                    <Link2 className="text-slate-400 shrink-0 ml-1" size={18} />
                    <div className="relative flex-1 min-w-0">
                      <input
                        placeholder="Paste a link from TikTok, Vimeo, or direct MP4 URL..."
                        className="h-14 md:h-16 w-full bg-transparent text-[14px] md:text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            toast.info("Direct processing for TikTok/Vimeo is currently in beta. Please use a YouTube link!");
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => toast.info("Direct processing for TikTok/Vimeo is currently in beta. Please use a YouTube link!")}
                      className="inline-flex h-12 md:h-14 min-w-28 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-[14px] transition-all hover:scale-[1.01] hover:bg-slate-800 shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        Analyze <ArrowRight size={15} />
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {youtubeConnected && (
                <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/50 p-4 md:flex-row md:items-center md:justify-between backdrop-blur-xs">
                  <div className="flex items-center gap-4 text-left">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                      {channelInfo?.thumbnail ? (
                        <Image src={channelInfo.thumbnail} alt="Channel thumbnail" width={56} height={56} unoptimized className="h-full w-full object-cover" />
                      ) : (
                        <Youtube size={24} className="text-[#a855f7]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-black text-slate-900">{channelInfo?.title ?? "Connected channel"}</p>
                      <p className="text-[12px] font-medium text-slate-500">
                        {channelInfo?.totalVideos ?? 0} videos loaded · automation starts from video {automationScope === "all" ? "1" : automationScope}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[12px] font-bold text-slate-600">
                    <span className="rounded-full border border-[#a855f7]/20 bg-[#a855f7]/10 px-3 py-1 text-[#a855f7]">Connected</span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Queue ready</span>
                  </div>
                </div>
              )}

              {!youtubeConnected && activeTab === "youtube" && (
                <p className="mx-auto mt-4 max-w-2xl text-[13px] md:text-[14px] font-medium text-slate-400">
                  {youtubeMessage}
                </p>
              )}
            </div>

            {/* Bottom beautiful feature highlight cards */}
            <div className="grid gap-6 md:grid-cols-3 pt-4">
              {[
                {
                  title: "Auto DM Responder",
                  desc: "Instantly reply to comments and send automated direct messages to viewers.",
                  icon: MessageSquare,
                  accent: "text-blue-600",
                  path: "/dashboard/comment-triggers",
                },
                {
                  title: "Smart Reels Scheduler",
                  desc: "Queue and publish your reels at peak engagement hours automatically.",
                  icon: Clock,
                  accent: "text-fuchsia-600",
                  path: "/dashboard/schedule",
                },
                {
                  title: "Instant DM Automation",
                  desc: "Convert comments to active leads instantly with customizable replies.",
                  icon: Zap,
                  accent: "text-orange-500",
                  path: "/dashboard/quick-replies",
                },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => router.push(item.path)}
                  className="group relative flex h-full w-full min-h-[170px] flex-col items-start justify-between rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-[0_12px_34px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_16px_42px_rgba(15,23,42,0.08)] active:scale-[0.99] focus:outline-none"
                >
                  <div className="w-full flex-1">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                      <item.icon size={18} className={item.accent} />
                    </div>
                    <h3 className="text-[15px] font-bold tracking-tight text-slate-900 transition-colors group-hover:text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-sm text-[13px] font-medium leading-6 text-slate-500">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="pt-6">

      {youtubeConnected && showAllVideos && channelVideos.length > 0 && (
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-4xl border border-slate-200 bg-white p-5 md:p-7 shadow-[0_10px_35px_rgba(15,23,42,0.05)] space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-[20px] md:text-[24px] font-black tracking-tight text-slate-900">All Videos</h3>
                <p className="text-[13px] font-medium text-slate-500">Choose the source video. The visible number shows which one starts first.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-bold text-slate-600">
                {channelVideos.length} loaded
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {channelVideos.map((video, index) => {
                const isActive = index === selectedVideoIndex;

                return (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => void selectVideo(index)}
                    className={`group relative overflow-hidden rounded-4xl border text-left transition-all ${
                      isActive
                        ? "border-slate-900 ring-4 ring-slate-900/5 shadow-[0_16px_35px_rgba(15,23,42,0.12)]"
                        : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)]"
                    }`}
                  >
                    <div className="relative aspect-video bg-slate-100">
                      <Image src={video.thumbnail} alt={video.title} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="absolute left-3 top-3 flex items-center gap-2">
                        <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-black text-slate-900 shadow-sm">#{index + 1}</span>
                        {index === 0 && (
                          <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-black text-white shadow-sm">First</span>
                        )}
                      </div>

                      <div className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                        {isActive ? "Selected" : "Use"}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 space-y-1">
                        <p className="line-clamp-2 text-[14px] font-bold text-white">{video.title}</p>
                        <p className="text-[11px] font-medium text-white/70">
                          {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : "Ready to convert"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-4xl border border-slate-200 bg-white p-5 md:p-7 shadow-[0_10px_35px_rgba(15,23,42,0.05)] space-y-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-sm">
                  <SettingsIcon size={18} />
                </div>
                <div>
                  <h3 className="text-[20px] font-black tracking-tight text-slate-900">Apply Automation</h3>
                  <p className="text-[13px] font-medium text-slate-500">Pick video 1, 2, 3, or all. All begins from the first video.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {automationCards.map((card) => {
                  const active = automationScope === card.value;
                  return (
                    <button
                      key={card.value}
                      type="button"
                      onClick={() => void handleAutomationScopeChange(card.value)}
                      className={`rounded-3xl border px-4 py-3 text-left transition-all ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)]"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <p className="text-[11px] font-black uppercase tracking-[0.25em] opacity-70">Order</p>
                      <p className="mt-1 text-[15px] font-bold">{card.label}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-black uppercase tracking-[0.24em] text-slate-400">Current start</p>
                  <span className="rounded-full bg-white px-3 py-1 text-[12px] font-black text-slate-700 shadow-sm">
                    {automationScope === "all" ? "Video 1" : `Video ${automationScope}`}
                  </span>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-[14px] font-bold text-slate-900">{selectedVideo?.title ?? "No video selected"}</p>
                  <p className="text-[12px] font-medium text-slate-500">
                    Long video → reel clips → schedule on Instagram. The first video is always the starting point for All.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (selectedVideo) {
                    void processVideoByUrl(selectedVideo.url);
                  }
                }}
                disabled={!selectedVideo || status === "processing"}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-[14px] font-bold text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "processing" ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {status === "processing"
                  ? `Processing ${processingProgress}%`
                  : `Generate reels for video ${automationScope === "all" ? "1" : automationScope}`}
              </button>
            </div>

            {status === "processing" && (
              <div className="rounded-4xl border border-emerald-200 bg-emerald-50 p-5 md:p-6 shadow-[0_10px_35px_rgba(34,197,94,0.08)] space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-[14px] font-bold text-emerald-700">
                    <Loader2 className="animate-spin" size={16} />
                    {processingMsg}
                  </p>
                  <span className="rounded-full bg-white px-3 py-1 text-[12px] font-black text-emerald-700 shadow-sm">
                    {processingProgress}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-emerald-400 via-lime-400 to-emerald-500 transition-all duration-200 ease-out"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
                <p className="text-[12px] text-emerald-700/80 font-medium">
                  Scanning the video, isolating high-retention moments, and preparing the clip set.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {(status === "processing" || status === "ready") && (
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-4xl border border-slate-200 bg-white p-5 md:p-7 shadow-[0_10px_35px_rgba(15,23,42,0.05)] space-y-6">
            {selectedVideo && (
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="w-full overflow-hidden rounded-4xl border border-slate-200 bg-slate-100 md:w-56">
                  {showTranscript && videoData?.transcript ? (
                    <div className="flex min-h-[220px] flex-col justify-between rounded-4xl bg-slate-950 p-5 text-white">
                      <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-300">Transcript card</p>
                        <p className="text-[18px] font-bold leading-tight">{videoData?.title ?? selectedVideo.title}</p>
                        <p className="text-[12px] font-medium text-white/70">Showing transcript for the current YouTube video.</p>
                      </div>
                      <p className="line-clamp-7 text-[13px] leading-6 text-white/88">{videoData.transcript}</p>
                    </div>
                  ) : (
                    <div className="relative aspect-video w-full overflow-hidden rounded-4xl bg-slate-100">
                      <Image src={selectedVideo.thumbnail} alt={selectedVideo.title} fill unoptimized className="object-cover" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                    Source video #{selectedVideoIndex + 1}
                  </div>
                  <h3 className="text-[22px] font-black tracking-tight text-slate-900">{videoData?.title ?? selectedVideo.title}</h3>
                  <p className="text-[14px] font-medium text-slate-500">{videoData?.author ?? "YouTube channel"}</p>
                  <p className="text-[12px] font-medium text-slate-400">
                    {videoData?.clips?.length ?? clips.length} clips discovered and ready for selection.
                  </p>
                  {videoData?.transcript && (
                    <button
                      type="button"
                      onClick={() => setShowTranscript((value) => !value)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-white"
                    >
                      <FileText size={14} />
                      {showTranscript ? "Hide transcript" : "Show transcript"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {showTranscript && videoData?.transcript && (
              <div ref={transcriptSectionRef} className="rounded-4xl border border-slate-200 bg-slate-50 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-[0.24em] text-slate-400">Transcript for this video</p>
                    <p className="text-[13px] font-medium text-slate-500">Full transcript extracted from the current YouTube video.</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-slate-600 shadow-sm">
                    {videoData.transcript.length.toLocaleString()} chars
                  </span>
                </div>
                <div className="max-h-[280px] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="whitespace-pre-wrap text-[13px] leading-7 text-slate-600">{videoData.transcript}</p>
                </div>
              </div>
            )}

            {status === "processing" && (
              <div className="flex items-center gap-2 text-[14px] font-bold text-[#a855f7]">
                <Loader2 className="animate-spin" size={16} />
                {processingMsg}
              </div>
            )}

            {clips.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <h4 className="text-[18px] font-black tracking-tight text-slate-900">
                    Reels ({clips.length}) · Page {clipPage + 1} of {totalClipPages}
                  </h4>
                  <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                    <span>Select the clips you want to schedule.</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
                      {selectedIds.size} selected
                    </span>
                    {selectedIds.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedIds(new Set())}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-bold text-slate-700 transition-all hover:bg-slate-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {displayedClips.map((clip, index) => {
                    const clipIndex = clipPage * clipsPerPage + index;
                    const isSelected = selectedIds.has(clipIndex);

                    return (
                      <button
                        key={clip.id}
                        type="button"
                        onClick={() => toggleSelect(clipIndex)}
                        className={`group relative overflow-hidden rounded-4xl border transition-all ${
                          isSelected
                            ? "border-[#a855f7] ring-4 ring-[#a855f7]/10 shadow-[0_16px_35px_rgba(168,85,247,0.12)]"
                            : "border-slate-200 hover:border-slate-300 hover:shadow-[0_16px_35px_rgba(15,23,42,0.08)]"
                        }`}
                        title={isSelected ? "Deselect clip" : "Select clip"}
                      >
                        <div className="relative aspect-4/5 bg-slate-100">
                          <Image src={clip.thumb} alt={`Clip ${clipIndex + 1}`} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-linear-to-t from-black/82 via-black/25 to-transparent" />

                          <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-black text-slate-900 shadow-sm">
                            #{clipIndex + 1}
                          </div>

                          <div className="absolute right-3 top-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                toast.info(`Edit is not implemented for clip ${clipIndex + 1}`);
                              }}
                              className="rounded-full bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/30"
                              title="Edit"
                            >
                              <SettingsIcon size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleSelect(clipIndex);
                              }}
                              className={`rounded-full p-2 backdrop-blur transition ${
                                isSelected ? "bg-[#a855f7] text-white" : "bg-white/15 text-white hover:bg-white/30"
                              }`}
                              title={isSelected ? "Deselect" : "Select"}
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          </div>

                          <div className="absolute bottom-3 left-3 right-3 space-y-2">
                            <p className="line-clamp-3 text-[13px] font-semibold leading-relaxed text-white/95">{clip.text}</p>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[11px] font-bold text-white/70">
                                {clip.start} – {clip.end}
                              </span>
                              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                                {isSelected ? "Selected" : "Tap to choose"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {totalClipPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setClipPage((value) => Math.max(value - 1, 0))}
                      disabled={clipPage === 0}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-[13px] font-bold text-slate-500">
                      Page {clipPage + 1} of {totalClipPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setClipPage((value) => Math.min(value + 1, totalClipPages - 1))}
                      disabled={clipPage >= totalClipPages - 1}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              status === "ready" && (
                <div className="rounded-4xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <p className="text-[14px] font-medium text-slate-500">No clips were generated for this video yet.</p>
                </div>
              )
            )}
          </div>

          <div className="space-y-6">
            <div className={`rounded-4xl border p-5 md:p-7 shadow-[0_10px_35px_rgba(15,23,42,0.05)] ${instagramConnected ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"}`}>
              {instagramConnected ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-sm">
                      <Instagram size={20} />
                    </div>
                    <div>
                      <p className="text-[18px] font-black tracking-tight text-slate-900">Instagram connected</p>
                      <p className="text-[13px] font-medium text-slate-600">@{primaryInstagramAccount?.username ?? "instagram"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-3xl border border-emerald-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Status</p>
                      <p className="mt-1 text-[14px] font-bold text-emerald-700">Ready</p>
                    </div>
                    <div className="rounded-3xl border border-emerald-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Posts/day</p>
                      <p className="mt-1 text-[14px] font-bold text-slate-900">{postsPerDay}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSchedule}
                    disabled={isScheduling || clips.length === 0}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-[14px] font-bold text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isScheduling ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    Schedule & Start Posting
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-sm">
                      <Instagram size={20} />
                    </div>
                    <div>
                      <p className="text-[18px] font-black tracking-tight text-slate-900">Connect Instagram</p>
                      <p className="text-[13px] font-medium text-slate-600">Unlock scheduling and auto posting.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => (window.location.href = "/api/auth/instagram/link")}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] px-5 text-[14px] font-bold text-white shadow-[0_10px_24px_rgba(238,42,123,0.24)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Instagram size={18} />
                    Connect Instagram
                  </button>

                  <div className="flex items-center gap-3 my-1">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-300">What you get</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {[
                    "Auto DM and comment flows",
                    "Schedule reels from selected clips",
                    "Post to Instagram after approval",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-center text-[13px] font-semibold text-slate-600"
                    >
                      <span className="text-emerald-500">✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {clips.length > 0 && (
              <div className="rounded-4xl border border-slate-200 bg-white p-5 md:p-7 shadow-[0_10px_35px_rgba(15,23,42,0.05)] space-y-5">
                <div className="flex items-center gap-3">
                  <CalendarIcon size={20} />
                  <h4 className="text-[18px] font-black tracking-tight text-slate-900">Scheduling</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-[14px] font-medium focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-[14px] font-medium focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPostsPerDay((value) => Math.max(1, value - 1))}
                      className="h-9 w-9 rounded-full border border-slate-200 bg-white font-black text-slate-700 transition-all hover:bg-slate-50"
                    >
                      -
                    </button>
                    <span className="min-w-24 text-center text-[14px] font-bold text-slate-900">{postsPerDay} posts/day</span>
                    <button
                      type="button"
                      onClick={() => setPostsPerDay((value) => value + 1)}
                      className="h-9 w-9 rounded-full border border-slate-200 bg-white font-black text-slate-700 transition-all hover:bg-slate-50"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSchedule}
                    disabled={isScheduling || !instagramConnected}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-[14px] font-bold text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isScheduling ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    Schedule Reels
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
      </section>
      </div>
    </div>
  );
}
