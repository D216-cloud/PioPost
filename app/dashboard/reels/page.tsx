"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Film,
  Play,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Camera,
  Clock,
  Grid3x3,
  List,
  Search,
} from "lucide-react";

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
}

type ViewMode = "grid" | "list";
type FilterType = "ALL" | "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM";

export default function ReelsPage() {
  const { data: session } = useSession();

  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [justConnected, setJustConnected] = useState(false);
  const searchParams = useSearchParams();

  // Detect just-connected redirect
  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      setJustConnected(true);
      // Remove param from URL without reload
      window.history.replaceState({}, "", window.location.pathname);
      // Auto-hide after 5s
      setTimeout(() => setJustConnected(false), 5000);
    }
  }, [searchParams]);

  // Fetch accounts
  useEffect(() => {
    fetch("/api/instagram-account")
      .then((r) => r.json())
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setAccounts(data);
          setSelectedAccount(data[0]);
        }
      })
      .catch(() => setError("Failed to load Instagram accounts."))
      .finally(() => setLoading(false));
  }, []);

  // Fetch media when account changes
  useEffect(() => {
    if (!selectedAccount) return;
    fetchMedia(selectedAccount.id);
  }, [selectedAccount]);

  const fetchMedia = async (accountId: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/instagram-posts?accountId=${encodeURIComponent(accountId)}&limit=50`);
      const { data, error: apiError } = await res.json();
      if (apiError) throw new Error(apiError);
      setMedia(data ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to fetch media.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = media.filter((m) => {
    const matchType = filter === "ALL" || m.media_type === filter;
    const matchSearch = !search || (m.caption ?? "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const reelCount = media.filter((m) => m.media_type === "VIDEO").length;
  const imageCount = media.filter((m) => m.media_type === "IMAGE").length;
  const carouselCount = media.filter((m) => m.media_type === "CAROUSEL_ALBUM").length;

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  const getThumb = (m: InstagramMedia) => m.thumbnail_url || m.media_url || "";

  const FILTERS: { label: string; value: FilterType; count: number }[] = [
    { label: "All", value: "ALL", count: media.length },
    { label: "Reels", value: "VIDEO", count: reelCount },
    { label: "Photos", value: "IMAGE", count: imageCount },
    { label: "Carousels", value: "CAROUSEL_ALBUM", count: carouselCount },
  ];

  return (
    <div className="relative mx-auto max-w-6xl px-6 md:px-8 pt-8 md:pt-24 pb-16 animate-in fade-in duration-700">
      {/* Ambient glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-violet-100/30 blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 h-80 w-80 rounded-full bg-pink-100/20 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
        <div className="space-y-3">
          <h1 className="text-[32px] md:text-[52px] font-normal tracking-tight text-slate-900 leading-none">
            Instagram <span className="text-[#a855f7] font-medium">Reels</span>
          </h1>
          <p className="text-[14.5px] md:text-[16px] text-slate-500 font-medium max-w-xl leading-relaxed">
            Browse, preview and manage all media from your connected Instagram account.
          </p>
        </div>

        {/* Account switcher + refresh */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {accounts.length > 1 && (
            <select
              value={selectedAccount?.id ?? ""}
              onChange={(e) => {
                const acc = accounts.find((a) => a.id === e.target.value);
                if (acc) setSelectedAccount(acc);
              }}
              className="h-10 rounded-full border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#a855f7]/20"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>@{a.username}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => selectedAccount && fetchMedia(selectedAccount.id, true)}
            disabled={refreshing || loading}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Connected account banner */}
      {selectedAccount && (
        <div className="bg-white rounded-[24px] border border-[#e4e4e7] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex items-center gap-4 mb-8">
          {selectedAccount.profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedAccount.profile_picture_url} alt="avatar" className="w-11 h-11 rounded-full object-cover ring-2 ring-[#a855f7]/20 flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white text-[14px] font-black flex-shrink-0">
              {selectedAccount.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-slate-900">@{selectedAccount.username}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Live</span>
              </span>
            </div>
            <p className="text-[12px] text-slate-400 mt-0.5">Showing real-time media from your Instagram account.</p>
          </div>

          {/* Stat chips */}
          <div className="hidden md:flex items-center gap-4">
            {[
              { label: "REELS", count: reelCount },
              { label: "PHOTOS", count: imageCount },
              { label: "CAROUSELS", count: carouselCount },
            ].map(({ label, count }) => (
              <div key={label} className="text-center">
                <p className="text-[20px] font-bold text-slate-900 leading-none">{loading ? "–" : count}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
            <div className="h-[1px] w-px h-10 bg-slate-100 mx-1" />
          </div>
        </div>
      )}

      {/* Just-connected success banner */}
      {justConnected && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4 mb-8 animate-in slide-in-from-top-2 duration-500">
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-emerald-800">Instagram connected successfully! 🎉</p>
            <p className="text-[12px] text-emerald-600 font-medium">Your account is live. Media is loading below.</p>
          </div>
          <button onClick={() => setJustConnected(false)} className="text-emerald-400 hover:text-emerald-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Not connected */}
      {!loading && !selectedAccount && (
        <div className="bg-white rounded-[24px] border border-[#e4e4e7] p-16 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
            <Camera size={28} className="text-slate-300" />
          </div>
          <div>
            <h3 className="text-[18px] font-bold text-slate-900 mb-1">No Instagram Account Connected</h3>
            <p className="text-[13.5px] text-slate-500 max-w-xs mx-auto">Connect your Instagram account to view and manage your media here.</p>
          </div>
          <a href="/instagram/connect" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e84c9f] via-[#b656e3] to-[#5a60f6] text-white text-[13.5px] font-bold rounded-full shadow-[0_8px_20px_-4px_rgba(182,86,227,0.25)] transition-all hover:scale-[1.01]">
            Connect Instagram
          </a>
        </div>
      )}

      {selectedAccount && (
        <>
          {/* Toolbar: search + filter tabs + view toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-[#e4e4e7] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-1.5 rounded-full text-[12.5px] font-bold transition-all ${
                    filter === f.value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {f.label}
                  {!loading && <span className={`ml-1.5 text-[10px] ${filter === f.value ? "opacity-70" : "opacity-40"}`}>({f.count})</span>}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search captions..."
                  className="h-9 pl-8 pr-4 rounded-full border border-[#e4e4e7] bg-white text-[12.5px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#a855f7]/20 w-44"
                />
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-0.5 p-1 bg-white border border-[#e4e4e7] rounded-full">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700"}`}
                >
                  <Grid3x3 size={13} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700"}`}
                >
                  <List size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-3 text-red-600 mb-6">
              <AlertCircle size={18} className="flex-shrink-0" />
              <p className="text-[13px] font-semibold">{error}</p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !error && (
            <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-3"}>
              {Array.from({ length: 8 }).map((_, i) => (
                viewMode === "grid" ? (
                  <div key={i} className="aspect-[9/16] rounded-2xl bg-slate-100 animate-pulse" />
                ) : (
                  <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                )
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="bg-white rounded-[24px] border border-[#e4e4e7] p-16 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                <Film size={24} className="text-slate-300" />
              </div>
              <p className="text-[15px] font-bold text-slate-500">
                {search ? `No results for "${search}"` : "No media found for this filter."}
              </p>
            </div>
          )}

          {/* ── GRID VIEW ── */}
          {!loading && !error && filtered.length > 0 && viewMode === "grid" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((item) => {
                const thumb = getThumb(item);
                const isVideo = item.media_type === "VIDEO";
                return (
                  <div
                    key={item.id}
                    className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  >
                    {/* Thumbnail */}
                    {thumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={item.caption ?? "Instagram media"}
                        className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

                    {/* Type badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isVideo ? "bg-[#a855f7]/90 text-white" : "bg-white/20 backdrop-blur-sm text-white"
                      }`}>
                        {isVideo ? <><Film size={9} /> Reel</> : item.media_type === "CAROUSEL_ALBUM" ? "Carousel" : "Photo"}
                      </span>
                    </div>

                    {/* Play button overlay for videos */}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center border border-white/40 shadow-lg">
                          <Play size={20} className="text-white fill-white ml-1" />
                        </div>
                      </div>
                    )}

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {item.caption && (
                        <p className="text-white text-[11px] font-medium leading-tight line-clamp-2 mb-2 drop-shadow">
                          {item.caption}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Clock size={9} />
                          {formatDate(item.timestamp)}
                        </span>
                        <a
                          href={item.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all"
                        >
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── LIST VIEW ── */}
          {!loading && !error && filtered.length > 0 && viewMode === "list" && (
            <div className="space-y-3">
              {filtered.map((item) => {
                const thumb = getThumb(item);
                const isVideo = item.media_type === "VIDEO";
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#e4e4e7] rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all group flex items-center gap-4"
                  >
                    {/* Thumb */}
                    <div className="w-14 h-[calc(14px*16/9*2.5)] min-w-[56px] rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={18} className="text-slate-300" />
                        </div>
                      )}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play size={14} className="text-white fill-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isVideo ? "bg-[#faf5ff] text-[#a855f7]" : "bg-slate-50 text-slate-500"
                        }`}>
                          {isVideo ? "Reel" : item.media_type === "CAROUSEL_ALBUM" ? "Carousel" : "Photo"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock size={10} /> {formatDate(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium text-slate-700 line-clamp-2 leading-relaxed">
                        {item.caption ?? <span className="text-slate-400 italic">No caption</span>}
                      </p>
                    </div>

                    {/* Actions */}
                    <a
                      href={item.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all"
                    >
                      <ExternalLink size={14} />
                    </a>

                    {/* Bottom teal line */}
                    <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-[#2dd4bf]/25 hidden" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Mint separator like dashboard */}
          {!loading && !error && filtered.length > 0 && (
            <div className="mt-10 h-[1px] w-full bg-[#2dd4bf]/20" />
          )}

          {/* Footer count */}
          {!loading && !error && (
            <p className="text-center text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-6">
              Showing {filtered.length} of {media.length} items · @{selectedAccount.username}
            </p>
          )}
        </>
      )}
    </div>
  );
}
