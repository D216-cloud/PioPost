"use client";

import {
  Send,
  Mail,
  UserPlus,
  HelpCircle,
  ExternalLink,
  Play,
  ArrowUpRight,
  MoreVertical,
  Video,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface RecentVideo {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  created_at: string;
  status: string;
}

export default function OverviewPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    dmsSent: 76,
    emailsCollected: 0,
    followersGained: 57,
  });
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/videos?limit=5");
        const { data: videos } = await res.json();
        if (videos) {
          setRecentVideos(videos);
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
    {
      label: "DMs SENT",
      value: stats.dmsSent,
      icon: Send,
      hasLink: false,
    },
    {
      label: "EMAILS COLLECTED",
      value: stats.emailsCollected,
      icon: Mail,
      hasLink: true,
    },
    {
      label: "FOLLOWERS GAINED",
      value: stats.followersGained,
      icon: UserPlus,
      hasLink: false,
    },
  ];

  return (
    <div className="relative mx-auto max-w-6xl px-6 md:px-8 pt-8 md:pt-24 pb-16 md:pb-20 animate-in fade-in duration-700">
      {/* Decorative clean ambient glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-violet-100/30 blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 h-80 w-80 rounded-full bg-pink-100/20 blur-[120px]" />
      </div>

      {/* Header welcome & actions */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3 text-left">
          <h1 className="text-[32px] md:text-[52px] font-normal tracking-tight text-slate-900 leading-none">
            Welcome back, <span className="text-[#a855f7] font-medium">{session?.user?.name?.split(" ")[0] || "Deepak"}</span>.
          </h1>
          <p className="text-[14.5px] md:text-[16px] text-slate-500 font-medium max-w-xl leading-relaxed">
            Your content engine is running. Track momentum, queue releases, and keep every reel on schedule.
          </p>
        </div>
        
        {/* Sleek action items */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#e84c9f] via-[#b656e3] to-[#5a60f6] text-white text-[13.5px] font-bold rounded-full shadow-[0_8px_20px_-4px_rgba(182,86,227,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Play size={14} className="fill-white stroke-none" />
            Create Reel
          </Link>
          <Link
            href="/dashboard/videos"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[13.5px] font-bold rounded-full border border-slate-200/60 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>View Library</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => {
          const IconComponent = card.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-[20px] border border-[#e4e4e7] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[175px]"
            >
              {/* Header inside Card */}
              <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2.5">
                  <IconComponent className="w-[18px] h-[18px] text-slate-400 stroke-[1.8]" />
                  <span className="text-[11px] font-bold tracking-[0.08em] text-slate-500">
                    {card.label}
                  </span>
                  <button className="focus:outline-none hover:text-slate-600 transition-colors">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Value displaying exactly like mock */}
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-[36px] font-bold tracking-tight text-slate-900 leading-none">
                  {card.value}
                </span>
                {card.hasLink && (
                  <button className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                    <ExternalLink className="w-4 h-4 stroke-[2]" />
                  </button>
                )}
              </div>

              {/* Solid horizontal light teal accent line at bottom */}
              <div className="mt-8">
                <div className="h-[1px] w-full bg-[#2dd4bf]/25" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Content Panel */}
      <div className="mt-12 rounded-[24px] border border-[#e4e4e7] bg-white p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Recent Content</h2>
            <p className="text-[13px] text-slate-500 mt-1">Keep an eye on the latest cuts and performance.</p>
          </div>
          <Link href="/dashboard/videos" className="text-[13px] font-bold text-slate-700 hover:text-slate-900 bg-slate-50 px-4 py-2 rounded-xl transition-all">
            View Library
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#a855f7] border-t-transparent mx-auto" />
          </div>
        ) : recentVideos.length === 0 ? (
          <div className="py-16 text-center space-y-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Video size={28} />
            </div>
            <p className="text-[14.5px] font-bold text-slate-500">No reels created yet.</p>
            <Link href="/dashboard/create" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full text-[13.5px] font-bold transition-all">
              Start Creating
              <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4 pt-6">
            {recentVideos.map((video) => (
              <div key={video.id} className="flex items-center gap-4 md:gap-8 p-3 md:p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                <div className="w-12 md:w-16 aspect-[9/16] rounded-xl bg-slate-900 overflow-hidden shrink-0 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnail_url || "/assets/avatar-placeholder.png"}
                      alt={video.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
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
