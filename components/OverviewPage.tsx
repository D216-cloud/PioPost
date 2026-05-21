"use client";

import {
  Video,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  MoreVertical,
  Play,
  Layers,
  Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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
    { label: "Total Reels", value: stats.total, icon: Video, accent: "from-sky-500/20 to-sky-500/0", iconColor: "text-sky-700" },
    { label: "Scheduled", value: stats.scheduled, icon: Clock, accent: "from-amber-400/25 to-amber-400/0", iconColor: "text-amber-700" },
    { label: "Posted", value: stats.posted, icon: CheckCircle2, accent: "from-emerald-400/25 to-emerald-400/0", iconColor: "text-emerald-700" },
    { label: "Series", value: stats.series, icon: Layers, accent: "from-slate-500/20 to-slate-500/0", iconColor: "text-slate-700" },
  ];

  return (
    <div className="relative mx-auto max-w-6xl px-4 md:px-8 pt-28 pb-16 md:pb-20 animate-in fade-in duration-700">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-24 right-[-60px] h-72 w-72 rounded-full bg-sky-200/40 blur-[120px]" />
        <div className="absolute -bottom-24 left-[-40px] h-72 w-72 rounded-full bg-amber-200/35 blur-[120px]" />
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4 text-center md:text-left">
          <h1 className="text-[32px] md:text-[48px] font-semibold text-slate-900 tracking-tight leading-tight">
            Welcome back, <span className="display-serif text-slate-900">{session?.user?.name?.split(" ")[0] || "Deepak"}</span>.
          </h1>
          <p className="text-[15px] md:text-[17px] text-slate-500 font-medium max-w-2xl mx-auto md:mx-0">
            Your content engine is running. Track momentum, queue releases, and keep every reel on schedule.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-3">
          <Link
            href="/dashboard/create"
            className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Play size={16} />
            Create Reel
          </Link>
          <Link
            href="/dashboard/videos"
            className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View Library
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <div key={i} className="relative overflow-hidden rounded-[1.5rem] border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <div className={`absolute inset-0 bg-gradient-to-b ${card.accent}`} />
            <div className="relative flex items-center justify-between">
              <div className={`h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center ${card.iconColor}`}>
                <card.icon size={18} />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.15em]">This week</span>
            </div>
            <div className="relative mt-6 space-y-1">
              <h3 className="text-[30px] font-semibold text-slate-900 tracking-tight">
                {loading ? "--" : card.value}
              </h3>
              <p className="text-[13px] font-medium text-slate-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-[2rem] border border-slate-200/60 bg-white/90 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-[22px] font-semibold text-slate-900">Recent Content</h2>
            <p className="text-[13px] text-slate-500 mt-1">Keep an eye on the latest cuts and performance.</p>
          </div>
          <Link href="/dashboard/videos" className="text-[13px] font-bold text-slate-700 hover:text-slate-900 bg-slate-50 px-4 py-2 rounded-xl transition-all">
            View Library
          </Link>
        </div>

        {recentVideos.length === 0 ? (
          <div className="py-16 text-center space-y-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <Video size={32} />
            </div>
            <p className="text-[15px] font-semibold text-slate-500">No reels created yet.</p>
            <Link href="/dashboard/create" className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-3 rounded-2xl text-[14px] font-bold shadow-lg">
              Start Creating
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4 pt-6">
            {recentVideos.map((video) => (
              <div key={video.id} className="flex items-center gap-4 md:gap-8 p-3 md:p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                <div className="w-12 md:w-16 aspect-[9/16] rounded-xl bg-slate-900 overflow-hidden shrink-0 shadow-sm">
                  <img src={video.thumbnail_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] md:text-[16px] font-semibold text-slate-900 truncate">{video.title}</h4>
                  <p className="text-[11px] md:text-[12px] text-slate-400 font-medium mt-1 uppercase tracking-wider">
                    {new Date(video.created_at).toLocaleDateString()} — {video.status}
                  </p>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${video.status === "posted" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>
                    {video.status}
                  </span>
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
