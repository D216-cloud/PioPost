"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Loader2,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { YoutubeIcon as Youtube, InstagramIcon as Instagram } from "@/components/icons";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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

export default function CreatePage() {
  const { data: session } = useSession();
  const router = useRouter();

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
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [clipPage, setClipPage] = useState(0);

  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("12:00");
  const [postsPerDay, setPostsPerDay] = useState(1);
  const [isScheduling, setIsScheduling] = useState(false);

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
    async (url: string) => {
      if (!session?.user?.id) {
        toast.error("Please sign in to generate clips");
        return;
      }

      setStatus("processing");
      setProcessingMsg("Turning long video into viral reel clips…");
      setVideoData(null);
      setClips([]);
      setSelectedIds(new Set());
      setClipPage(0);

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
          clips: json.clips,
        });
        setClips(json.clips ?? []);
        setStatus("ready");
        setProcessingMsg("");
        toast.success(`Discovered ${json.clips?.length ?? 0} reel clips`);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Processing failed");
        setStatus("idle");
        setProcessingMsg("");
      }
    },
    [session?.user?.id],
  );

  const handleYoutubeConnect = useCallback(async () => {
    if (!youtubeUrl.trim()) {
      toast.error("Paste a YouTube channel or video URL first");
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
  }, [processVideoByUrl, youtubeUrl]);

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

      const rows = selectedClips.map((clip, index) => {
        const dayOffset = Math.floor(index / postsPerDay);
        const hourOffset = (index % postsPerDay) * (24 / postsPerDay);
        const scheduled = new Date(`${startDate}T${startTime}`);
        scheduled.setDate(scheduled.getDate() + dayOffset);
        scheduled.setHours(scheduled.getHours() + Math.floor(hourOffset));
        scheduled.setMinutes(scheduled.getMinutes() + Math.floor((hourOffset % 1) * 60));

        return {
          user_id: session.user.id,
          title: `${videoData?.title ?? selectedVideo?.title ?? "Video"} – Reel ${index + 1}`,
          source_url: selectedVideo?.url ?? videoData?.youtubeUrl ?? "",
          youtube_url: selectedVideo?.url ?? videoData?.youtubeUrl ?? "",
          thumbnail_url: videoData?.thumbnail ?? selectedVideo?.thumbnail ?? "",
          caption: clip.text ?? "",
          start_seconds: clip.start_seconds,
          end_seconds: clip.end_seconds,
          status: "scheduled",
          scheduled_at: scheduled.toISOString(),
          platform: "instagram",
        };
      });

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

  return (
    <div className="w-[95%] max-w-6xl mx-auto px-4 md:px-8 pt-28 pb-16 md:pb-20 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight leading-tight">
            Create Reels
          </h1>
          <p className="text-[14px] md:text-[15px] text-slate-500 font-medium max-w-2xl">
            Connect your YouTube channel, choose a source video, and schedule reels for Instagram.
          </p>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white px-5 py-4 shadow-sm space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-400">Instagram status</p>
          {instagramConnected ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white shadow-sm">
                <Instagram size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Connected</p>
                <p className="text-xs text-slate-500">@{primaryInstagramAccount?.username ?? "instagram"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-500">Connect Instagram before scheduling.</p>
          )}
        </div>
      </div>

      <section className="relative group">
        <div className="absolute -inset-1 rounded-4xl bg-linear-to-r from-sky-400/10 via-[#a855f7]/10 to-rose-400/10 blur opacity-80 transition group-hover:opacity-100" />
        <div className="relative rounded-4xl border border-slate-200/80 bg-white/95 p-5 md:p-7 shadow-[0_20px_50px_rgba(15,23,42,0.06)] space-y-5 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                <Youtube size={14} className="text-[#ef4444]" />
                YouTube Connect
              </div>
              <h2 className="text-[22px] md:text-[28px] font-black tracking-tight text-slate-900">
                {youtubeConnected ? "Channel connected" : "Connect YouTube and load the channel queue"}
              </h2>
              <p className="max-w-3xl text-[13.5px] md:text-[15px] font-medium leading-relaxed text-slate-500">
                {youtubeMessage}
              </p>
            </div>

            {youtubeConnected && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAllVideos((value) => !value)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-bold text-slate-700 transition-all hover:bg-slate-50"
                >
                  {showAllVideos ? "Hide all videos" : "All videos"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setYoutubeConnected(false);
                    setChannelInfo(null);
                    setChannelVideos([]);
                    setVideoData(null);
                    setClips([]);
                    setSelectedIds(new Set());
                    setAutomationScope("all");
                    setStatus("idle");
                    setProcessingMsg("");
                    setYoutubeMessage("Connect a channel or video URL to load the queue.");
                  }}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[12px] font-bold text-slate-600 transition-all hover:bg-slate-100"
                >
                  Change channel
                </button>
              </div>
            )}
          </div>

          {!youtubeConnected ? (
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Youtube size={18} />
                </div>
                <input
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                  placeholder="Paste a YouTube channel or video URL"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleYoutubeConnect}
                disabled={isConnectingYoutube}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-[14px] font-bold text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConnectingYoutube ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                Connect YouTube
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-4xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                  {channelInfo?.thumbnail ? (
                    <Image src={channelInfo.thumbnail} alt="Channel thumbnail" width={56} height={56} className="h-full w-full object-cover" />
                  ) : (
                    <Youtube size={24} className="text-slate-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-black text-slate-900">{channelInfo?.title ?? "Connected channel"}</p>
                  <p className="text-[12px] font-medium text-slate-500">
                    {channelInfo?.totalVideos ?? 0} videos loaded · automation starts from video {automationScope === "all" ? "1" : automationScope}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">Connected</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Queue ready</span>
              </div>
            </div>
          )}
        </div>
      </section>

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
                      <Image src={video.thumbnail} alt={video.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
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
                Generate reels for video {automationScope === "all" ? "1" : automationScope}
              </button>
            </div>

            {status === "processing" && (
              <div className="rounded-4xl border border-sky-200 bg-sky-50 p-5 md:p-6 shadow-[0_10px_35px_rgba(14,165,233,0.08)]">
                <p className="flex items-center gap-2 text-[14px] font-bold text-sky-700">
                  <Loader2 className="animate-spin" size={16} />
                  {processingMsg}
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
                <div className="relative aspect-video w-full overflow-hidden rounded-4xl border border-slate-200 bg-slate-100 md:w-56">
                  <Image src={selectedVideo.thumbnail} alt={selectedVideo.title} fill className="object-cover" />
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
                          <Image src={clip.thumb} alt={`Clip ${clipIndex + 1}`} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
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
    </div>
  );
}
