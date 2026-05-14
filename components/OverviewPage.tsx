"use client";

import { 
  TrendingUp, 
  Video, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  MoreVertical,
  Play,
  Layers,
  Sparkles
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function OverviewPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    posted: 0,
    series: 0
  });
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch videos for stats and recent activity
        const res = await fetch("/api/videos?limit=100");
        const { data: videos } = await res.json();

        if (videos) {
          setStats({
            total: videos.length,
            scheduled: videos.filter((v: any) => v.status === 'scheduled').length,
            posted: videos.filter((v: any) => v.status === 'posted').length,
            series: 0 // Placeholder
          });
          setRecentVideos(videos.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session?.user?.id]);

  const cards = [
    { label: "Total Reels", value: stats.total, icon: Video, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Scheduled", value: stats.scheduled, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Posted", value: stats.posted, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Series", value: stats.series, icon: Layers, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="w-[95%] md:max-w-4xl mx-auto px-4 md:px-8 pt-28 md:py-20 space-y-12 md:space-y-16 animate-in fade-in duration-700">
      <div className="space-y-3 text-center md:text-left">
        <h1 className="text-[32px] md:text-[42px] font-bold text-slate-900 tracking-tight leading-tight">
          Hey, <span className="font-logo text-[#2563EB] text-[36px] md:text-[48px]">{session?.user?.name?.split(' ')[0] || 'Deepak'}</span>!
        </h1>
        <p className="text-[15px] md:text-[17px] text-slate-400 font-medium max-w-xl mx-auto md:mx-0">Your content pipeline is looking healthy. Here is what's happening.</p>
      </div>

      {/* ChatGPT-Style Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[
          { label: "Total Reels", value: stats.total, icon: Video, color: "text-[#2563EB]" },
          { label: "Scheduled", value: stats.scheduled, icon: Clock, color: "text-[#2563EB]" },
          { label: "Live Posts", value: stats.posted, icon: CheckCircle2, color: "text-[#2563EB]" },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-[1.5rem] p-6 md:p-8 border border-slate-200/60 shadow-sm hover:shadow-md transition-all flex flex-col gap-6 group">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${card.color}`}>
                <card.icon size={20} />
              </div>
              <ArrowUpRight size={18} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight">{card.value}</h3>
              <p className="text-[13px] md:text-[14px] font-medium text-slate-400">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-10">
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
          <h2 className="text-[22px] font-bold text-slate-900">Recent Content</h2>
          <Link href="/dashboard/videos" className="text-[13px] font-bold text-[#2563EB] hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">View Library</Link>
        </div>
        
        {recentVideos.length === 0 ? (
          <div className="py-20 text-center space-y-6">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <Video size={32} />
             </div>
             <p className="text-[15px] font-bold text-slate-400">No reels created yet.</p>
             <Link href="/dashboard/create" className="inline-block bg-[#2563EB] text-white px-8 py-3 rounded-2xl text-[14px] font-bold shadow-lg shadow-blue-500/10">Start Creating</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentVideos.map((video) => (
              <div key={video.id} className="flex items-center gap-4 md:gap-8 p-3 md:p-4 hover:bg-slate-50 rounded-2xl md:rounded-[2rem] transition-all group">
                <div className="w-12 md:w-16 aspect-[9/16] rounded-xl bg-slate-900 overflow-hidden shrink-0 shadow-sm">
                   <img src={video.thumbnail_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className="text-[15px] md:text-[16px] font-bold text-slate-900 truncate">{video.title}</h4>
                   <p className="text-[11px] md:text-[12px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{new Date(video.created_at).toLocaleDateString()} — {video.status}</p>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <span className={`w-2 h-2 rounded-full ${video.status === 'posted' ? 'bg-emerald-400' : 'bg-[#2563EB]'}`} />
                  <button className="text-slate-300 hover:text-slate-900 p-2"><MoreVertical size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
