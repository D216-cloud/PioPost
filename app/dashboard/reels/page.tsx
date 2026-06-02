"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
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
  Plus,
  X,
  Sparkles,
  MessageSquare,
  Check,
  Zap,
  UserCheck,
  Smile,
  Trash2,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { InstagramIcon as Instagram } from "@/components/icons";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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

const AUTOMATION_PRESETS = [
  {
    name: "Custom (Empty)",
    message: "",
    icon: "✍️",
    desc: "Write your own response from scratch"
  },
  {
    name: "Send Link Preset",
    message: "Hey! Thanks for commenting. Here is the link you requested: {link} 🚀 Let me know if you need anything else!",
    icon: "🔗",
    desc: "Send a resource, product, or signup link"
  },
  {
    name: "Discount Code",
    message: "Hey there! Thanks for your comment! Here is your exclusive 10% discount code: PIO10 🎉 Use it at checkout!",
    icon: "🏷️",
    desc: "Share coupon codes or sales links"
  },
  {
    name: "Free Guide PDF",
    message: "Awesome! I've sent the complete PDF guide straight to your DMs. Check it out and let me know your thoughts! 📩",
    icon: "📚",
    desc: "Deliver lead magnets or files"
  },
  {
    name: "Chat Invite",
    message: "Hey! Thanks for showing interest in our project. Let's chat here in the DMs about how we can help you grow! 💬",
    icon: "💬",
    desc: "Start a sales conversation or consultation"
  }
];

export default function ReelsPage() {
  const { data: session } = useSession();

  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);
  const [media, setMedia] = useState<InstagramMedia[]>([]);

  // Automation state
  const [rules, setRules] = useState<any[]>([]);
  const [selectedItemForAutomation, setSelectedItemForAutomation] = useState<InstagramMedia | null>(null);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [automationMessage, setAutomationMessage] = useState("");
  const [automationActive, setAutomationActive] = useState(true);
  const [automationKeywordMode, setAutomationKeywordMode] = useState<"specific" | "any">("any");
  const [automationKeywords, setAutomationKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [autoReplyComment, setAutoReplyComment] = useState(false);
  const [commentReplyText, setCommentReplyText] = useState("Check your DMs! 📩");
  const [requireFollow, setRequireFollow] = useState(false);
  const [followGateMessage, setFollowGateMessage] = useState("Hey! Follow me first and I'll send you the link 🙌");
  const [savingAutomation, setSavingAutomation] = useState(false);
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
    if (searchParams?.get("connected") === "true") {
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

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/automations");
      const { data, error } = await res.json();
      if (error) throw new Error(error);
      setRules(data || []);
    } catch (e) {
      console.error("Failed to fetch automation rules:", e);
    }
  }, []);

  // Fetch media and rules when account changes
  useEffect(() => {
    if (!selectedAccount) return;
    fetchMedia(selectedAccount.id);
    fetchRules();
  }, [fetchRules, selectedAccount]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (selectedAccount) {
        void fetchRules();
      }
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && selectedAccount) {
        void fetchRules();
      }
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchRules, selectedAccount]);

  const fetchMedia = async (accountId: string, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      fetchRules();
    }
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

  const openAutomationModal = (item: InstagramMedia) => {
    const existingRule = rules.find((r) => r.post_id === item.id);
    setSelectedItemForAutomation(item);
    if (existingRule) {
      setAutomationMessage(existingRule.dm_message || "");
      setAutomationActive(existingRule.active);
      setAutomationKeywordMode(existingRule.keyword_mode || "any");
      setAutomationKeywords(existingRule.keywords || []);
      setAutoReplyComment(Boolean(existingRule.auto_reply_comment));
      setCommentReplyText(existingRule.comment_reply_text || "Check your DMs! 📩");
      setRequireFollow(Boolean(existingRule.require_follow));
      setFollowGateMessage(existingRule.follow_gate_message || "Hey! Follow me first and I'll send you the link 🙌");
      
      const matchedPreset = AUTOMATION_PRESETS.findIndex(p => p.message === existingRule.dm_message);
      setActivePresetIndex(matchedPreset !== -1 ? matchedPreset : 0);
    } else {
      setAutomationMessage("");
      setAutomationActive(true);
      setAutomationKeywordMode("any");
      setAutomationKeywords([]);
      setAutoReplyComment(false);
      setCommentReplyText("Check your DMs! 📩");
      setRequireFollow(false);
      setFollowGateMessage("Hey! Follow me first and I'll send you the link 🙌");
      setActivePresetIndex(1); // Default to the first preset (Send Link) for ease of use
      setAutomationMessage(AUTOMATION_PRESETS[1].message);
    }
    setKeywordInput("");
    setIsAutomationModalOpen(true);
  };

  const handleSaveAutomation = async () => {
    if (!selectedAccount || !selectedItemForAutomation) return;
    setSavingAutomation(true);

    const existingRule = rules.find((r) => r.post_id === selectedItemForAutomation.id);

    try {
      if (existingRule) {
        const res = await fetch("/api/automations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: existingRule.id,
            dm_message: automationMessage,
            active: automationActive,
            keyword_mode: automationKeywordMode,
            keywords: automationKeywordMode === "specific" ? automationKeywords : [],
            auto_reply_comment: autoReplyComment,
            comment_reply_text: autoReplyComment ? commentReplyText : null,
            require_follow: requireFollow,
            follow_gate_message: requireFollow ? followGateMessage : null,
          }),
        });

        const { error } = await res.json();
        if (error) throw new Error(error);
        toast.success("Automation updated successfully!");
      } else {
        const res = await fetch("/api/automations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instagram_account_id: selectedAccount.id,
            post_id: selectedItemForAutomation.id,
            post_type: "REEL",
            post_thumbnail_url: getThumb(selectedItemForAutomation),
            post_caption: selectedItemForAutomation.caption || "",
            post_permalink: selectedItemForAutomation.permalink,
            keyword_mode: automationKeywordMode,
            keywords: automationKeywordMode === "specific" ? automationKeywords : [],
            dm_message: automationMessage,
            active: automationActive,
            auto_reply_comment: autoReplyComment,
            comment_reply_text: autoReplyComment ? commentReplyText : null,
            rule_name: `Auto-DM: ${selectedItemForAutomation.caption ? selectedItemForAutomation.caption.substring(0, 20) : selectedItemForAutomation.id}`,
            require_follow: requireFollow,
            follow_gate_message: requireFollow ? followGateMessage : null,
          }),
        });

        const { error } = await res.json();
        if (error) throw new Error(error);
        toast.success("Automation created successfully!");
      }

      await fetchRules();
      setIsAutomationModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save automation.");
    } finally {
      setSavingAutomation(false);
    }
  };

  const handleDeleteAutomation = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this automation?")) return;
    setSavingAutomation(true);
    try {
      const res = await fetch(`/api/automations?id=${ruleId}`, {
        method: "DELETE",
      });
      const { error } = await res.json();
      if (error) throw new Error(error);
      toast.success("Automation deleted successfully!");
      await fetchRules();
      setIsAutomationModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete automation.");
    } finally {
      setSavingAutomation(false);
    }
  };

  const addKeyword = () => {
    const kw = keywordInput.trim().toUpperCase();
    if (kw && !automationKeywords.includes(kw)) {
      setAutomationKeywords([...automationKeywords, kw]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    setAutomationKeywords(automationKeywords.filter((k) => k !== kw));
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
          <a href="/api/auth/instagram/link" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e84c9f] via-[#b656e3] to-[#5a60f6] text-white text-[13.5px] font-bold rounded-full shadow-[0_8px_20px_-4px_rgba(182,86,227,0.25)] transition-all hover:scale-[1.01]">
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

                    {/* Top Right: Automation button / status */}
                    <div className="absolute top-3 right-3 z-10">
                      {(() => {
                        const rule = rules.find((r) => r.post_id === item.id);
                        if (rule) {
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAutomationModal(item);
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm transition-all hover:scale-105 ${
                                rule.active 
                                  ? "bg-emerald-500 text-white" 
                                  : "bg-slate-700/80 backdrop-blur-sm text-slate-350"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${rule.active ? "bg-white animate-pulse" : "bg-slate-400"}`} />
                                {rule.auto_reply_comment ? "DM + Comment" : "Auto-DM"}
                            </button>
                          );
                        } else {
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAutomationModal(item);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/95 text-slate-800 shadow-sm transition-all hover:scale-105 hover:bg-white"
                            >
                              <Plus size={9} strokeWidth={3} /> Add DM
                            </button>
                          );
                        }
                      })()}
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

                    {/* Automation action */}
                    {(() => {
                      const rule = rules.find((r) => r.post_id === item.id);
                      if (rule) {
                        return (
                          <button
                            onClick={() => openAutomationModal(item)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] ${
                              rule.active 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50" 
                                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${rule.active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                              {rule.active ? "Active" : "Paused"} {rule.auto_reply_comment ? "DM + Comment" : "Auto-DM"}
                          </button>
                        );
                      } else {
                        return (
                          <button
                            onClick={() => openAutomationModal(item)}
                            className="flex-shrink-0 px-3 py-1.5 rounded-full border border-[#a855f7]/30 bg-[#faf5ff] text-[#a855f7] text-[11px] font-bold hover:bg-[#f3e8ff] transition-all flex items-center gap-1 hover:scale-[1.02]"
                          >
                            <Plus size={11} strokeWidth={2.5} /> Setup Auto-DM
                          </button>
                        );
                      }
                    })()}

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

      {/* Auto-DM Automation Modal */}
      <AnimatePresence>
        {isAutomationModalOpen && selectedItemForAutomation && selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAutomationModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#a855f7]" />
                  <h3 className="font-semibold text-slate-900 text-[16px]">Setup Auto-DM Automation</h3>
                </div>
                <button
                  onClick={() => setIsAutomationModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 no-scrollbar">
                
                {/* 1. Account Header Card (cloned style from settings page) */}
                <div className="p-4 bg-white border border-slate-200/80 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full p-0.5 bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={selectedAccount.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAccount.username}`} 
                            alt="IG Avatar" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-50">
                        <Instagram size={11} className="text-[#ee2a7b]" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-[14px] font-bold text-slate-800 truncate">@{selectedAccount.username}</h4>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 rounded-md border border-emerald-100/50 shrink-0">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-wider">Live</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold">Instagram Business Account</p>
                    </div>
                  </div>
                  
                  {/* Status toggle inside card */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      {automationActive ? "Active" : "Paused"}
                    </span>
                    <button
                      onClick={() => setAutomationActive(!automationActive)}
                      className={`w-10 h-5.5 rounded-full relative transition-all flex-shrink-0 cursor-pointer ${
                        automationActive 
                          ? "bg-gradient-to-r from-[#ee2a7b] to-[#6228d7]" 
                          : "bg-slate-200"
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${
                        automationActive ? "right-0.5" : "left-0.5"
                      }`} />
                    </button>
                  </div>
                </div>

                {/* 2. Selected Reel Preview Card */}
                <div className="p-3 bg-white border border-slate-250/70 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex gap-3 items-start">
                  <div className="relative w-12 h-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getThumb(selectedItemForAutomation)} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-slate-950/70 py-0.5 text-center text-[7px] font-black uppercase text-white tracking-wider">
                      {selectedItemForAutomation.media_type === "VIDEO" ? "REEL" : "POST"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#a855f7]">Target Post</span>
                    <p className="line-clamp-2 text-[12px] leading-relaxed text-slate-650 font-semibold mt-0.5">
                      {selectedItemForAutomation.caption || <span className="italic text-slate-400">No caption</span>}
                    </p>
                  </div>
                </div>

                {/* 3. Choose Template Preset */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-black uppercase tracking-wider text-slate-400">Choose Template Preset</label>
                    {activePresetIndex > 0 && (
                      <span className="text-[10px] text-[#a855f7] font-bold">Preset loaded</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AUTOMATION_PRESETS.map((preset, idx) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setActivePresetIndex(idx);
                          if (idx > 0) {
                            setAutomationMessage(preset.message);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.01] ${
                          activePresetIndex === idx
                            ? "border-[#a855f7] bg-violet-50/50 text-[#a855f7]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{preset.icon}</span>
                          <span className="text-[11.5px] font-bold truncate leading-none">{preset.name.replace(" Preset", "")}</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-1 line-clamp-1 leading-tight font-medium">{preset.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Trigger Setting */}
                <div className="space-y-2.5 p-4.5 bg-white border border-slate-200 rounded-3xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12.5px] font-bold text-slate-800">Trigger on Any Comment</p>
                      <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">Send Auto-DM to any message or comment</p>
                    </div>
                    <button
                      onClick={() => setAutomationKeywordMode(automationKeywordMode === "any" ? "specific" : "any")}
                      className={`w-10 h-5.5 rounded-full relative transition-all flex-shrink-0 cursor-pointer ${
                        automationKeywordMode === "any" 
                          ? "bg-slate-900" 
                          : "bg-slate-200"
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${
                        automationKeywordMode === "any" ? "right-0.5" : "left-0.5"
                      }`} />
                    </button>
                  </div>

                  {automationKeywordMode === "specific" && (
                    <div className="pt-3 border-t border-slate-100 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                      <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-450 block">Keywords to Watch</label>
                      <div className="flex gap-2">
                        <input
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                          placeholder="e.g. YES, LINK, GETIT"
                          className="flex-1 h-9 rounded-xl border border-slate-250 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#a855f7]/20"
                        />
                        <button
                          type="button"
                          onClick={addKeyword}
                          className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[12px] flex items-center justify-center transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {automationKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {automationKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-650 font-bold text-[11px]"
                            >
                              {kw}
                              <button
                                type="button"
                                onClick={() => removeKeyword(kw)}
                                className="text-slate-400 hover:text-slate-650 transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-amber-505 font-semibold italic">Please add at least one keyword to trigger the DM.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Custom Message Input */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-black uppercase tracking-wider text-slate-400 block">Custom DM Message</label>
                  <textarea
                    value={automationMessage}
                    onChange={(e) => {
                      setAutomationMessage(e.target.value);
                      setActivePresetIndex(0);
                    }}
                    placeholder="Hey! Thanks for commenting. Here is the link you requested... 🚀"
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-slate-250 bg-white p-3.5 text-[13px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#a855f7]/20 leading-relaxed shadow-sm"
                  />
                  <p className="text-[9.5px] text-slate-400 leading-tight">
                    💡 Tip: Keep it short, conversational, and direct. You can use <code>{`{first_name}`}</code> for personalization.
                  </p>
                </div>

                {/* 6. Comment Reply */}
                <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[12.5px] font-bold text-slate-800">Reply in comments too</p>
                      <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">Show a public comment reply when the automation triggers.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoReplyComment(!autoReplyComment)}
                      className={`w-10 h-5.5 rounded-full relative transition-all flex-shrink-0 cursor-pointer ${
                        autoReplyComment
                          ? "bg-gradient-to-r from-[#ee2a7b] to-[#6228d7]"
                          : "bg-slate-200"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${
                          autoReplyComment ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {autoReplyComment ? (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                      <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-450 block">Comment Reply Text</label>
                      <textarea
                        value={commentReplyText}
                        onChange={(e) => setCommentReplyText(e.target.value)}
                        placeholder="Thanks! Check your DMs for the link 📩"
                        rows={3}
                        className="w-full resize-none rounded-2xl border border-slate-250 bg-slate-50 p-3 text-[12.5px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#a855f7]/20 leading-relaxed"
                      />
                      <p className="text-[9.5px] text-slate-400 leading-tight">
                        This reply will post publicly in the comment thread alongside the DM.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-semibold italic">Comment reply is off. Turn it on to reply publicly and send the DM together.</p>
                  )}
                </div>

                {/* 7. Ask to Follow First (Follow Gate) */}
                <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[12.5px] font-bold text-slate-800">Ask to follow first</p>
                      <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">Require the user to follow you to get the DM link.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRequireFollow(!requireFollow)}
                      className={`w-10 h-5.5 rounded-full relative transition-all flex-shrink-0 cursor-pointer ${
                        requireFollow
                          ? "bg-gradient-to-r from-[#ee2a7b] to-[#6228d7]"
                          : "bg-slate-200"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${
                          requireFollow ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {requireFollow ? (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                      <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-450 block">Follow Gate Message</label>
                      <textarea
                        value={followGateMessage}
                        onChange={(e) => setFollowGateMessage(e.target.value)}
                        placeholder="Hey! Follow me first and I'll send you the link 🙌"
                        rows={3}
                        className="w-full resize-none rounded-2xl border border-slate-250 bg-slate-50 p-3 text-[12.5px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#a855f7]/20 leading-relaxed"
                      />
                      <p className="text-[9.5px] text-slate-400 leading-tight">
                        This message will be sent first, requesting a follow before delivering the main content.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-semibold italic">Follow gate is off. Anyone commenting will receive the main DM immediately.</p>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 bg-white px-6 py-4.5 flex items-center justify-between">
                {(() => {
                  const existingRule = rules.find((r) => r.post_id === selectedItemForAutomation.id);
                  if (existingRule) {
                    return (
                      <button
                        onClick={() => handleDeleteAutomation(existingRule.id)}
                        disabled={savingAutomation}
                        className="h-10 px-4 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                        title="Delete Automation"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    );
                  }
                  return <div />;
                })()}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAutomationModalOpen(false)}
                    className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-[12.5px] font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAutomation}
                    disabled={savingAutomation || (automationKeywordMode === "specific" && automationKeywords.length === 0) || !automationMessage.trim()}
                    className="h-10 px-5 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white text-[12.5px] font-bold shadow-md shadow-purple-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingAutomation ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Automation</span>
                    )}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
