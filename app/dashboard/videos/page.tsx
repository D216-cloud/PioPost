"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface VideoRow {
  id: string;
  title: string;
  caption?: string | null;
  thumbnail_url?: string | null;
  status: string;
  scheduled_at: string;
  source_url?: string | null;
}

interface DraftVideo {
  thumbnail: string;
  title: string;
}

const formatTimeLeft = (scheduledAt: string, now: Date) => {
  const due = new Date(scheduledAt).getTime();
  const diff = due - now.getTime();

  if (Number.isNaN(due)) {
    return "Time unavailable";
  }

  if (diff <= 0) {
    return "Ready to post";
  }

  const totalMinutes = Math.ceil(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
};

export default function VideosPage() {
  const { data: session } = useSession();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<DraftVideo | null>(null);
  const [processingDue, setProcessingDue] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);

    // Check for localStorage draft
    const savedDraft = localStorage.getItem('pinpost_latest_draft');
    if (savedDraft) {
      queueMicrotask(() => {
        setDraft(JSON.parse(savedDraft) as DraftVideo);
      });
    }

    if (!session?.user?.id) return;

    // 1. Initial Fetch
    const fetchVideos = async () => {
      try {
        const res = await fetch("/api/videos?limit=50");
        const { data } = await res.json();
        setVideos(data || []);
      } catch (err) {
        console.error("Failed to load videos:", err);
        toast.error("Failed to load videos");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();

    // 2. Realtime Subscription
    const channel = supabase
      .channel('videos-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setVideos(prev => [payload.new as VideoRow, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setVideos(prev => prev.map(v => v.id === (payload.new as VideoRow).id ? (payload.new as VideoRow) : v));
          } else if (payload.eventType === 'DELETE') {
            setVideos(prev => prev.filter(v => v.id !== (payload.old as VideoRow).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(timer);
    };
  }, [session?.user?.id]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/videos?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      
      setVideos(prev => prev.filter(v => v.id !== id));
      toast.success("Video deleted");
    } catch (err) {
      console.error("Failed to delete video:", err);
      toast.error("Failed to delete video");
    }
  };

  const handleProcessDue = async () => {
    setProcessingDue(true);
    try {
      const res = await fetch("/api/videos/process", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process due reels");
      }

      toast.success(
        data.processed > 0
          ? `Published ${data.processed} due reel${data.processed === 1 ? "" : "s"}.`
          : "No due reels were ready to publish."
      );
    } catch (err) {
      console.error("Failed to process due reels:", err);
      toast.error(err instanceof Error ? err.message : "Failed to process due reels");
    } finally {
      setProcessingDue(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "posted": return <CheckCircle2 size={14} className="text-emerald-500" />;
      case "scheduled": return <Clock size={14} className="text-[#2563EB]" />;
      case "processing": return <div className="w-3.5 h-3.5 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />;
      case "failed": return <AlertCircle size={14} className="text-rose-500" />;
      default: return <AlertCircle size={14} className="text-amber-500" />;
    }
  };

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.caption?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "posted":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "scheduled":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "processing":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "failed":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-sky-500/20 text-sky-400 border-sky-500/30";
    }
  };

  return (
    <div className="relative mx-auto max-w-7xl px-6 md:px-8 pt-8 md:pt-24 pb-20 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight">Your Videos</h1>
          <p className="text-[14px] md:text-[15px] text-slate-500 font-medium">Manage and track your AI-generated content.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleProcessDue}
            disabled={processingDue}
            className="w-full sm:w-auto h-11 px-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={processingDue ? "animate-spin" : ""} />
            <span className="text-[13px] font-bold">Run Due Publishes</span>
          </button>
          <div className="relative group w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={16} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos..."
              className="w-full md:w-64 h-11 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-[#2563EB]/5 focus:border-[#2563EB]/20 transition-all"
            />
          </div>
          <button className="w-full sm:w-auto h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <Filter size={16} />
            <span className="text-[13px] font-bold">Filter</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
        </div>
      ) : filteredVideos.length === 0 && !draft ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
          <p className="text-slate-400 font-medium">No videos found. Start by creating your first reel!</p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 pb-10">
          {/* Latest Draft from LocalStorage */}
          {draft && (
            <div className="w-full sm:w-70 aspect-9/16 bg-slate-900 rounded-[2.5rem] relative overflow-hidden shadow-2xl border-[6px] border-blue-500 shrink-0 group transition-all duration-500 hover:scale-[1.03]">
              <Image src={draft.thumbnail} alt="Latest draft thumbnail" fill sizes="(max-width: 640px) 100vw, 280px" className="object-cover opacity-50" />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/10" />
              <div className="absolute top-6 left-6">
                <div className="px-4 py-2 bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border border-blue-400">
                  LATEST DRAFT
                </div>
              </div>
              <div className="absolute bottom-10 left-8 right-8 space-y-4">
                <h3 className="text-white text-[16px] font-bold leading-tight line-clamp-2">{draft.title}</h3>
                <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider">Unscheduled</p>
                <Link href="/dashboard/create" className="block w-full py-3 bg-white text-slate-900 rounded-xl text-[12px] font-bold text-center hover:bg-slate-50 transition-all">
                  Finish Editing
                </Link>
              </div>
            </div>
          )}
          {filteredVideos.map((video) => (
            <div key={video.id} className="w-full sm:w-70 aspect-9/16 bg-slate-900 rounded-[2.5rem] relative overflow-hidden shadow-2xl border-[6px] border-white shrink-0 group transition-all duration-500 hover:scale-[1.03] hover:shadow-blue-500/10">
              <Image src={video.thumbnail_url ?? ""} alt={video.title} fill sizes="(max-width: 640px) 100vw, 280px" className="object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-700" />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/10" />
              
              {/* Status Badge */}
              <div className="absolute top-6 left-6">
                <div className={`px-4 py-2 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border shadow-xl flex items-center gap-2 ${
                  getStatusStyles(video.status)
                }`}>
                    {getStatusIcon(video.status)}
                    {video.status}
                </div>
              </div>

              {/* Actions Toggle */}
              <div className="absolute top-6 right-6">
                <button className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all shadow-xl">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Content Info */}
              <div className="absolute bottom-10 left-8 right-8 space-y-6">
                <div className="space-y-2">
                   <h3 className="text-white text-[16px] font-bold leading-tight line-clamp-2 drop-shadow-xl">{video.title}</h3>
                   <div className="flex items-center gap-3 pt-2">
                      <Clock size={12} className="text-white/40" />
                      <p className={`text-[11px] font-mono tracking-tighter ${video.status === "scheduled" ? "text-emerald-300" : "text-white/40"}`}>
                        {new Date(video.scheduled_at).toLocaleDateString()} — {new Date(video.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                   </div>
                   {video.status === "scheduled" && (
                     <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                       <Clock size={12} />
                       {formatTimeLeft(video.scheduled_at, now)}
                     </div>
                   )}
                   {video.status !== "scheduled" && video.status !== "posted" && (
                     <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/70 border border-white/10">
                       <Clock size={12} />
                       {formatTimeLeft(video.scheduled_at, now)}
                     </div>
                   )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <a 
                    href={video.source_url ?? "#"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-white/10 backdrop-blur-md rounded-xl text-[11px] font-bold text-white text-center hover:bg-white hover:text-slate-900 transition-all border border-white/10"
                  >
                    Source
                  </a>
                  <button 
                    onClick={() => handleDelete(video.id)}
                    className="p-3 bg-red-500/10 backdrop-blur-md rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
