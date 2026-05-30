"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, Loader2, CheckCircle2, Calendar as CalendarIcon, Settings as SettingsIcon } from "lucide-react";
import { YoutubeIcon as Youtube } from "@/components/icons";
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

type YoutubeProcessResponse = {
  ok: true;
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  youtubeUrl: string;
  clips?: Clip[];
} | {
  ok: false;
  error?: string;
};

export default function CreatePage() {
  // Auth & navigation
  const { data: session } = useSession();
  const router = useRouter();

  // Input
  const [ytUrl, setYtUrl] = useState("");

  // Processing state
  const [status, setStatus] = useState<"idle" | "processing" | "ready">("idle");
  const [processingMsg, setProcessingMsg] = useState("");

  // API response
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);

  // UI selections
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Scheduling state (kept from original for completeness)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState("12:00");
  const [postsPerDay, setPostsPerDay] = useState(1);
  const [isScheduling, setIsScheduling] = useState(false);

  // Helpers
  const [page, setPage] = useState(0);
  const clipsPerPage = 12; // Show 12 clips per page
  const totalPages = Math.ceil(clips.length / clipsPerPage);
  const displayedClips = clips.slice(page * clipsPerPage, (page + 1) * clipsPerPage);
  const toggleSelect = (index: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleProcess = async () => {
    if (!ytUrl.trim()) return;
    setStatus("processing");
    setProcessingMsg("Downloading & analysing video…");
    setVideoData(null);
    setClips([]);
    try {
      const res = await fetch("/api/youtube-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: ytUrl })
      });
      const json = (await res.json()) as YoutubeProcessResponse;
      if (!json.ok) throw new Error(json.error || "Failed to process");
      setVideoData(json);
      setClips(json.clips ?? []);
      setStatus("ready");
      setProcessingMsg("");
      toast.success(`Discovered ${json.clips?.length ?? 0} clips`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Processing failed");
      setStatus("idle");
      setProcessingMsg("");
    }
  };

  const handleSchedule = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to schedule");
      return;
    }
    setIsScheduling(true);
    try {
      const selectedClips = clips.filter((_, i) => selectedIds.has(i));
      if (!selectedClips.length) {
        toast.error("Select at least one reel");
        setIsScheduling(false);
        return;
      }
      const rows = selectedClips.map((clip, idx) => {
        const dayOffset = Math.floor(idx / postsPerDay);
        const hourOffset = (idx % postsPerDay) * (24 / postsPerDay);
        const scheduled = new Date(`${startDate}T${startTime}`);
        scheduled.setDate(scheduled.getDate() + dayOffset);
        scheduled.setHours(scheduled.getHours() + Math.floor(hourOffset));
        scheduled.setMinutes(scheduled.getMinutes() + Math.floor((hourOffset % 1) * 60));
        return {
          user_id: session.user.id,
          title: `${videoData?.title ?? "Video"} – Clip ${idx + 1}`,
          source_url: videoData?.youtubeUrl ?? "",
          youtube_url: videoData?.youtubeUrl ?? "",
          thumbnail_url: videoData?.thumbnail ?? "",
          caption: "",
          start_seconds: clip.start_seconds,
          end_seconds: clip.end_seconds,
          status: "scheduled",
          scheduled_at: scheduled.toISOString(),
          platform: "instagram"
        };
      });
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows)
      });
      if (!res.ok) throw new Error("Scheduling failed");
      toast.success(`Scheduled ${rows.length} reels`);
      router.push("/dashboard/videos");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Schedule error");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl px-6 md:px-8 pt-8 md:pt-24 pb-16 space-y-12 md:space-y-16 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
        <div className="space-y-3">
          <h1 className="text-[32px] md:text-[52px] font-normal tracking-tight text-slate-900 leading-none">
            Show <span className="text-[#a855f7] font-medium">Reels</span>
          </h1>
          <p className="text-[14.5px] md:text-[16px] text-slate-500 font-medium max-w-xl leading-relaxed">
            Show all reels made from your YouTube videos with AI.
          </p>
        </div>
      </div>

      {/* URL Input */}
      <section className="relative max-w-3xl group">
        <div className="absolute -inset-1 bg-linear-to-r from-[#a855f7]/20 to-[#e84c9f]/20 rounded-2xl md:rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-white rounded-2xl md:rounded-4xl p-2 md:p-3 border border-[#e4e4e7] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center gap-2 md:gap-4">
          <div className="hidden md:flex pl-6 text-slate-400"><Youtube size={24} /></div>
          <input
            value={ytUrl}
            onChange={e => setYtUrl(e.target.value)}
            placeholder="Paste YouTube video link here…"
            className="w-full md:flex-1 h-12 md:h-14 bg-transparent px-6 md:px-0 text-[15px] md:text-[16px] font-medium focus:outline-none placeholder:text-slate-300"
          />
          <button
            onClick={handleProcess}
            disabled={status === "processing" || !ytUrl}
            className="w-full md:w-auto bg-slate-900 hover:bg-black text-white h-12 md:h-14 px-10 rounded-xl md:rounded-2xl text-[15px] font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-slate-900/10 active:scale-95"
          >
            {status === "processing" ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={18} />}
            Generate
          </button>
        </div>
      </section>

      {/* Processing / Results */}
      {(status === "processing" || status === "ready") && (
        <section className="space-y-8">
          {/* Video meta */}
          {videoData && (
            <div className="flex items-center gap-6 bg-white rounded-3xl p-6 md:p-8 border border-[#e4e4e7] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <div className="relative w-40 aspect-video rounded-2xl overflow-hidden border border-slate-100">
                <Image src={videoData.thumbnail} alt="Thumbnail" fill className="object-cover" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-[20px] font-bold text-slate-900">{videoData.title}</h3>
                <p className="text-[14px] text-slate-500">{videoData.author}</p>
                <p className="text-[12px] text-slate-400">{videoData.clips?.length ?? 0} clips discovered</p>
              </div>
            </div>
          )}

          {status === "processing" && (
            <p className="flex items-center gap-2 text-[#a855f7] font-bold"><Loader2 className="animate-spin" size={14} /> {processingMsg}</p>
          )}

          {/* Reels Grid */}
          {clips.length > 0 && (
            <div>
              <h4 className="text-[18px] font-semibold mb-4">All Reels ({clips.length}) - Page {page + 1} of {totalPages}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedClips.map((clip, i) => {
                  const idx = page * clipsPerPage + i;
                  return (
                    <div key={idx} className="relative rounded-2xl overflow-hidden border border-slate-200 group hover:shadow-xl transition-shadow">
                      <Image src={clip.thumb} alt={`Clip ${idx + 1}`} fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3">
                        <span className="text-sm font-medium text-white">{clip.start} – {clip.end}</span>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button onClick={() => toast.info(`Edit not implemented for clip ${idx + 1}`)} className="p-1 bg-white/20 rounded-full hover:bg-white/40 transition" title="Edit">
                          <SettingsIcon size={16} className="text-white" />
                        </button>
                        <button onClick={() => toggleSelect(idx)} className={`p-1 rounded-full ${selectedIds.has(idx) ? "bg-[#a855f7]" : "bg-white/20"} hover:bg-white/40 transition`} title={selectedIds.has(idx) ? "Deselect" : "Select"}>
                          <CheckCircle2 size={16} className="text-white" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-4 space-x-4">
                  <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0} className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50">Previous</button>
                  <span className="text-sm">Page {page + 1} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} disabled={page >= totalPages - 1} className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50">Next</button>
                </div>
              )}
            </div>
          )}

          {/* Scheduling Controls */}
          {clips.length > 0 && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e4e4e7] shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6">
              <div className="flex items-center gap-3">
                <CalendarIcon size={20} />
                <h4 className="text-[18px] font-bold">Scheduling</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 border rounded" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setPostsPerDay(Math.max(1, postsPerDay - 1))} className="px-2 py-1 bg-slate-200 rounded">-</button>
                  <span className="font-medium">{postsPerDay} posts/day</span>
                  <button onClick={() => setPostsPerDay(postsPerDay + 1)} className="px-2 py-1 bg-slate-200 rounded">+</button>
                </div>
                <button
                  onClick={handleSchedule}
                  disabled={isScheduling}
                  className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {isScheduling ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  Schedule Reels
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
