"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  Trash2, 
  CheckCircle2, 
  Clock,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function VideosPage() {
  const { data: session } = useSession();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    // Check for localStorage draft
    const savedDraft = localStorage.getItem('pinpost_latest_draft');
    if (savedDraft) {
      setDraft(JSON.parse(savedDraft));
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
            setVideos(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setVideos(prev => prev.map(v => v.id === payload.new.id ? payload.new : v));
          } else if (payload.eventType === 'DELETE') {
            setVideos(prev => prev.filter(v => v.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "posted": return <CheckCircle2 size={14} className="text-emerald-500" />;
      case "scheduled": return <Clock size={14} className="text-[#2563EB]" />;
      case "processing": return <div className="w-3.5 h-3.5 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />;
      default: return <AlertCircle size={14} className="text-amber-500" />;
    }
  };

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.caption?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-[95%] max-w-6xl mx-auto px-4 md:px-8 pt-28 pb-16 md:pb-20 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight">Your Videos</h1>
          <p className="text-[14px] md:text-[15px] text-slate-500 font-medium">Manage and track your AI-generated content.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
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
            <div className="w-full sm:w-[280px] aspect-[9/16] bg-slate-900 rounded-[2.5rem] relative overflow-hidden shadow-2xl border-[6px] border-blue-500 shrink-0 group transition-all duration-500 hover:scale-[1.03]">
              <img src={draft.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
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
            <div key={video.id} className="w-full sm:w-[280px] aspect-[9/16] bg-slate-900 rounded-[2.5rem] relative overflow-hidden shadow-2xl border-[6px] border-white shrink-0 group transition-all duration-500 hover:scale-[1.03] hover:shadow-blue-500/10">
              <img src={video.thumbnail_url} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
              
              {/* Status Badge */}
              <div className="absolute top-6 left-6">
                <div className={`px-4 py-2 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border shadow-xl flex items-center gap-2 ${
                  video.status === 'posted' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 
                  'bg-blue-500/20 text-blue-400 border-blue-500/30'
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
                      <p className="text-white/40 text-[11px] font-mono tracking-tighter">
                        {new Date(video.scheduled_at).toLocaleDateString()} — {new Date(video.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                   </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <a 
                    href={video.source_url} 
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
