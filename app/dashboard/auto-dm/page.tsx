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
  CheckCircle2,
  ChevronLeft,
  Phone,
  Video,
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
type FilterType = "ALL" | "ACTIVE_RULES";

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
    message: "Awesome! You can download your copy of the PDF guide using the link in our bio. 📚",
    icon: "📚",
    desc: "Deliver lead magnets or files"
  },
  {
    name: "Chat Invite",
    message: "Hey! Thanks for showing interest in our project. Check out the link in our bio to see how we can help you grow! 💬",
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
  const [showPresets, setShowPresets] = useState(false);
  const [autoReplyComment, setAutoReplyComment] = useState(false);
  const [commentReplyText, setCommentReplyText] = useState("Thanks for the comment! Link is in bio 📩");
  const [requireFollow, setRequireFollow] = useState(false);
  const [followGateMessage, setFollowGateMessage] = useState("Hey! Follow me first and I'll send you the link 🙌");
  const [previewTab, setPreviewTab] = useState<"dm" | "comment">("dm");
  const [simStep, setSimStep] = useState<"load-data" | "user-typing" | "user-sent" | "creator-typing" | "creator-sent">("creator-sent");
  const [dmType, setDmType] = useState<"message_only" | "comment_only">("message_only");

  const [simFollowVerified, setSimFollowVerified] = useState(false);
  const [simCheckingFollow, setSimCheckingFollow] = useState(false);

  // Reset simulator states when requireFollow setting toggles
  useEffect(() => {
    setSimFollowVerified(false);
    setSimCheckingFollow(false);
  }, [requireFollow]);



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
      setAutomationMessage(existingRule.dm_type === "comment_only" ? (existingRule.comment_reply_text || "") : (existingRule.dm_message || ""));
      setAutomationActive(existingRule.active);
      setAutomationKeywordMode(existingRule.keyword_mode || "any");
      setAutomationKeywords(existingRule.keywords || []);
      setAutoReplyComment(Boolean(existingRule.auto_reply_comment));
      setCommentReplyText(existingRule.comment_reply_text || "Thanks for the comment! Link is in bio 📩");
      setRequireFollow(Boolean(existingRule.require_follow));
      setFollowGateMessage(existingRule.follow_gate_message || "Hey! Follow me first and I'll send you the link 🙌");
      setDmType(existingRule.dm_type === "comment_only" ? "comment_only" : "message_only");
      
      const matchedPreset = AUTOMATION_PRESETS.findIndex(p => p.message === existingRule.dm_message);
      setActivePresetIndex(matchedPreset !== -1 ? matchedPreset : 0);
    } else {
      setAutomationMessage("");
      setAutomationActive(true);
      setAutomationKeywordMode("any");
      setAutomationKeywords([]);
      setAutoReplyComment(false);
      setCommentReplyText("Thanks for the comment! Link is in bio 📩");
      setRequireFollow(false);
      setFollowGateMessage("Hey! Follow me first and I'll send you the link 🙌");
      setDmType("message_only");
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

  const handleToggleRuleActive = async (rule: any) => {
    try {
      const res = await fetch("/api/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rule.id,
          active: !rule.active,
          dm_message: rule.dm_message || "",
          keyword_mode: rule.keyword_mode || "any",
          keywords: rule.keywords || [],
          auto_reply_comment: Boolean(rule.auto_reply_comment),
          comment_reply_text: rule.comment_reply_text,
          require_follow: Boolean(rule.require_follow),
          follow_gate_message: rule.follow_gate_message,
        }),
      });

      const { error } = await res.json();
      if (error) throw new Error(error);
      toast.success(`Automation ${!rule.active ? "activated" : "paused"} successfully!`);
      await fetchRules();
    } catch (e: any) {
      toast.error(e.message || "Failed to toggle automation.");
    }
  };

  const handleQuickDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this automation?")) return;
    try {
      const res = await fetch(`/api/automations?id=${ruleId}`, {
        method: "DELETE",
      });
      const { error } = await res.json();
      if (error) throw new Error(error);
      toast.success("Automation deleted successfully!");
      await fetchRules();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete automation.");
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
    const matchSearch = !search || (m.caption ?? "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
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
    { label: "All Posts", value: "ALL", count: media.length },
    { label: "Auto-DMs", value: "ACTIVE_RULES", count: rules.length },
  ];

  return (
    <div className="relative mx-auto max-w-7xl px-6 md:px-8 pt-8 md:pt-24 pb-20 animate-in fade-in duration-700">
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
              { label: "Total DMs", count: rules.length },
              { label: "Active DMs", count: rules.filter((r) => r.active).length },
              { label: "Paused DMs", count: rules.filter((r) => !r.active).length },
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-55/60 backdrop-blur-md border border-slate-200/60 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.015)]">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4.5 py-1.5 rounded-full text-[12.5px] font-extrabold transition-all duration-300 cursor-pointer ${
                    filter === f.value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-550 hover:text-slate-800 hover:bg-slate-100/50"
                  }`}
                >
                  {f.label}
                  {!loading && <span className={`ml-1.5 text-[10px] ${filter === f.value ? "opacity-90" : "opacity-45"}`}>({f.count})</span>}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 ml-auto w-full sm:w-auto justify-between sm:justify-end">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search captions..."
                  className="h-9.5 pl-9 pr-4 rounded-full border border-slate-200 bg-white text-[12.5px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all w-44 sm:w-48"
                />
              </div>

              {/* View toggle */}
              {filter === "ALL" && (
                <div className="flex items-center gap-0.5 p-1 bg-slate-55/60 border border-slate-200/60 rounded-full shrink-0">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${viewMode === "grid" ? "bg-slate-900 text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/40"}`}
                  >
                    <Grid3x3 size={13} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${viewMode === "list" ? "bg-slate-900 text-white shadow-xs" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/40"}`}
                  >
                    <List size={13} />
                  </button>
                </div>
              )}
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
                  <div key={i} className="aspect-[9/16] rounded-[24px] bg-slate-100 animate-pulse" />
                ) : (
                  <div key={i} className="h-20 rounded-[20px] bg-slate-100 animate-pulse" />
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
          {!loading && !error && filter === "ALL" && filtered.length > 0 && viewMode === "grid" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map((item) => {
                const thumb = getThumb(item);
                const isVideo = item.media_type === "VIDEO";
                return (
                  <div
                    key={item.id}
                    onClick={() => openAutomationModal(item)}
                    className="group relative aspect-[9/16] rounded-[24px] overflow-hidden bg-slate-955 border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(124,58,237,0.15)] hover:border-violet-500/40 hover:-translate-y-1 transition-all duration-500 cursor-pointer"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                    {/* Type badge */}
                    <div className="absolute top-3.5 left-3.5 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-black/45 backdrop-blur-md text-white/90 border border-white/10 shadow-sm">
                        {isVideo ? <><Film size={9} /> Reel</> : item.media_type === "CAROUSEL_ALBUM" ? "Carousel" : "Photo"}
                      </span>
                    </div>

                    {/* Top Right: Automation button / status */}
                    <div className="absolute top-3.5 right-3.5 z-10">
                      {(() => {
                        const rule = rules.find((r) => r.post_id === item.id);
                        if (rule) {
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAutomationModal(item);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm transition-all hover:scale-105 cursor-pointer ${
                                rule.active 
                                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_16px_rgba(124,58,237,0.4)]" 
                                  : "bg-slate-800/90 border border-slate-700/80 text-slate-300 backdrop-blur-md"
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
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/95 text-slate-900 border border-slate-200/85 shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all hover:scale-105 hover:bg-white cursor-pointer"
                            >
                              <Plus size={10} strokeWidth={2.5} /> Setup DM
                            </button>
                          );
                        }
                      })()}
                    </div>

                    {/* Play button overlay for videos */}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg hover:scale-105 transition-all">
                          <Play size={18} className="text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {item.caption && (
                        <p className="text-white text-[11px] font-semibold leading-relaxed line-clamp-2 mb-2.5 drop-shadow-sm font-sans">
                          {item.caption}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Clock size={10} />
                          {formatDate(item.timestamp)}
                        </span>
                        <a
                          href={item.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 hover:scale-105 transition-all shadow-sm"
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
          {!loading && !error && filter === "ALL" && filtered.length > 0 && viewMode === "list" && (
            <div className="space-y-4">
              {filtered.map((item) => {
                const thumb = getThumb(item);
                const isVideo = item.media_type === "VIDEO";
                const activeRule = rules.find((r) => r.post_id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => openAutomationModal(item)}
                    className="relative bg-white border border-slate-200/80 rounded-3xl p-4.5 shadow-[0_2px_12px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.045)] hover:-translate-y-0.5 transition-all duration-300 group flex items-center gap-4.5 cursor-pointer"
                  >
                    {/* Left status color line strip */}
                    <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full transition-all duration-300 ${
                      activeRule?.active 
                        ? "bg-gradient-to-b from-violet-600 to-fuchsia-600 shadow-[2px_0_8px_rgba(124,58,237,0.4)]" 
                        : "bg-slate-200"
                    }`} />

                    {/* Thumb */}
                    <div className="w-14 h-[calc(14px*16/9*2.5)] min-w-[56px] rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative shadow-sm border border-slate-100">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={18} className="text-slate-300" />
                        </div>
                      )}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <Play size={12} className="text-white fill-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 text-left pl-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isVideo ? "bg-[#faf5ff] text-[#a855f7]" : "bg-slate-50 text-slate-500"
                        }`}>
                          {isVideo ? "Reel" : item.media_type === "CAROUSEL_ALBUM" ? "Carousel" : "Photo"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Clock size={10} /> {formatDate(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-[13px] font-semibold text-slate-750 line-clamp-2 leading-relaxed font-sans">
                        {item.caption ?? <span className="text-slate-400 italic">No caption description</span>}
                      </p>
                    </div>

                    {/* Automation action status button */}
                    <div className="flex items-center gap-3">
                      {(() => {
                        if (activeRule) {
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAutomationModal(item);
                              }}
                              className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm hover:scale-102 cursor-pointer ${
                                activeRule.active 
                                  ? "bg-violet-50/70 border-violet-200/80 text-violet-750 hover:bg-violet-100/70" 
                                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${activeRule.active ? "bg-violet-600 animate-pulse" : "bg-slate-400"}`} />
                                {activeRule.active ? "Active" : "Paused"} · {activeRule.auto_reply_comment ? "DM + Comment" : "Auto-DM"}
                            </button>
                          );
                        } else {
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAutomationModal(item);
                              }}
                              className="flex-shrink-0 px-4 py-1.5 rounded-full border border-violet-200 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 hover:from-violet-600/15 hover:to-fuchsia-600/15 text-violet-700 text-[11px] font-black uppercase tracking-wider transition-all hover:scale-102 cursor-pointer"
                            >
                              <Plus size={11} strokeWidth={2.5} /> Setup DM
                            </button>
                          );
                        }
                      })()}

                      {/* External permalink */}
                      <a
                        href={item.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0 w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-55 transition-all shadow-2xs hover:scale-105"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── AUTO-DM RULES LIST VIEW ── */}
          {!loading && !error && filter === "ACTIVE_RULES" && (
            <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-xs mt-6">
              {(() => {
                const filteredRules = rules.filter(rule => {
                  const ruleMedia = media.find((m) => m.id === rule.post_id);
                  const caption = ruleMedia ? ruleMedia.caption : (rule.post_caption || "");
                  return !search || caption.toLowerCase().includes(search.toLowerCase());
                });

                if (filteredRules.length === 0) {
                  return (
                    <div className="p-16 flex flex-col items-center gap-4 text-center">
                      <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                        <Zap size={24} className="text-slate-350" />
                      </div>
                      <p className="text-[15px] font-bold text-slate-500">
                        {search ? `No active automations for "${search}"` : "No active Auto-DM rules yet."}
                      </p>
                      <p className="text-[13px] text-slate-400 max-w-xs leading-relaxed font-medium">
                        Select a post from the "All Posts" tab to configure your first automated trigger.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[650px]">

                      <tbody className="divide-y divide-slate-100 text-[13px] font-semibold text-slate-705">
                        {filteredRules.map((rule) => {
                          const ruleMedia = media.find((m) => m.id === rule.post_id);
                          const thumb = ruleMedia ? getThumb(ruleMedia) : (rule.post_thumbnail_url || "");
                          const caption = ruleMedia ? ruleMedia.caption : (rule.post_caption || "");
                          const dateString = ruleMedia ? formatDate(ruleMedia.timestamp) : (rule.created_at ? formatDate(rule.created_at) : "N/A");
                          
                          return (
                            <tr key={rule.id} className="hover:bg-slate-55/30 transition-colors">
                              {/* Image column */}
                              <td className="py-4 px-6 shrink-0">
                                <div 
                                  onClick={() => ruleMedia && openAutomationModal(ruleMedia)}
                                  className="w-16 h-24 rounded-xl overflow-hidden bg-slate-100 relative shadow-xs border border-slate-200/50 cursor-pointer hover:scale-105 transition-transform duration-300"
                                >
                                  {thumb ? (
                                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Film size={16} className="text-slate-300" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              
                              {/* Title/caption column */}
                              <td className="py-4 px-6 max-w-sm">
                                <div className="space-y-1">
                                  <p 
                                    onClick={() => ruleMedia && openAutomationModal(ruleMedia)}
                                    className="font-bold text-slate-800 line-clamp-2 leading-relaxed cursor-pointer hover:text-violet-600 transition-colors"
                                  >
                                    {caption || <span className="text-slate-400 italic font-medium">No caption description</span>}
                                  </p>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-violet-50 text-violet-600 border border-violet-100">
                                    {rule.auto_reply_comment ? "DM + Comment" : "Auto-DM Only"}
                                  </span>
                                </div>
                              </td>
                              
                              {/* Date column */}
                              <td className="py-4 px-6 text-slate-400 font-extrabold uppercase tracking-wider text-[10.5px]">
                                {dateString}
                              </td>
                              
                              {/* Status On/Off Toggle column */}
                              <td className="py-4 px-6 text-center">
                                <div className="inline-flex items-center justify-center gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRuleActive(rule)}
                                    className={`w-9.5 h-5 rounded-full relative transition-all duration-300 flex-shrink-0 cursor-pointer ${
                                      rule.active 
                                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-[0_2px_6px_rgba(124,58,237,0.25)]" 
                                        : "bg-slate-200"
                                    }`}
                                  >
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-all duration-300 ${
                                      rule.active ? "left-[18px]" : "left-0.5"
                                    }`} />
                                  </button>
                                  <span className={`text-[10px] font-black uppercase tracking-wider w-8 text-left ${rule.active ? "text-violet-600 animate-pulse" : "text-slate-400"}`}>
                                    {rule.active ? "ON" : "OFF"}
                                  </span>
                                </div>
                              </td>
                              
                              {/* Actions column */}
                              <td className="py-4 px-6 text-right">
                                <div className="flex justify-end items-center gap-2">
                                  <button
                                    onClick={() => ruleMedia && openAutomationModal(ruleMedia)}
                                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-55 transition-all hover:scale-105 cursor-pointer shadow-3xs"
                                    title="Edit Automation Settings"
                                  >
                                    <Settings size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleQuickDeleteRule(rule.id)}
                                    className="w-8 h-8 rounded-full border border-red-100 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 transition-all hover:scale-105 cursor-pointer shadow-3xs"
                                    title="Delete Automation"
                                  >
                                    <X size={13} strokeWidth={2.5} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Mint separator like dashboard */}
          {!loading && !error && filter === "ALL" && filtered.length > 0 && (
            <div className="mt-10 h-[1px] w-full bg-[#2dd4bf]/20" />
          )}

          {/* Footer count */}
          {!loading && !error && filter === "ALL" && (
            <p className="text-center text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-6">
              Showing {filtered.length} of {media.length} items · @{selectedAccount.username}
            </p>
          )}

          {!loading && !error && filter === "ACTIVE_RULES" && (
            <p className="text-center text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-6">
              Showing {rules.length} automations · @{selectedAccount.username}
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
              className="absolute inset-0 bg-slate-955/40 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-slate-100 bg-white shadow-2xl p-6 md:p-8 z-10 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {/* Premium background glows */}
              <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-[32px]">
                <div className="absolute -top-10 -right-10 h-72 w-72 rounded-full bg-violet-100/30 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-72 w-72 rounded-full bg-pink-105/20 blur-3xl" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 bg-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shadow-sm shadow-violet-100/50">
                    <Sparkles size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-[18px] md:text-[20px] tracking-tight">Automation Setup & Live Preview</h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Configure your trigger rules and preview responses instantly.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAutomationModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-705 transition-all cursor-pointer hover:scale-105"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Form Settings */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* 1. Account Header Card (Redesigned & Height Increased) */}
                  <div className="p-6 bg-linear-to-br from-violet-50/10 via-white to-slate-50/50 backdrop-blur-md border border-slate-200/80 rounded-3xl flex items-center justify-between gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.04)] transition-all duration-300">
                    <div className="flex items-center gap-4.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-sm">
                          <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={selectedAccount.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAccount.username}`} 
                              alt="IG Avatar" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-6.5 h-6.5 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-105">
                          <Instagram size={12} className="text-[#ee2a7b]" />
                        </div>
                      </div>
                      
                      <div className="flex flex-col min-w-0 gap-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[16px] font-black text-slate-850 truncate leading-none">@{selectedAccount.username}</h4>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.75 bg-emerald-50 rounded-full border border-emerald-100 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-505 animate-pulse" />
                            <span className="text-[8.5px] font-black text-emerald-600 uppercase tracking-wider leading-none">Connected</span>
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-450 font-bold leading-none">Instagram Business Account</p>
                      </div>
                    </div>
                    
                    {/* Status toggle inside card */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-450">
                        {automationActive ? "Active" : "Paused"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAutomationActive(!automationActive)}
                        className={`w-11 h-6 rounded-full relative transition-all duration-300 flex-shrink-0 cursor-pointer ${
                          automationActive 
                            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-[0_2px_8px_rgba(124,58,237,0.25)]" 
                            : "bg-slate-200"
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                          automationActive ? "left-[21px]" : "left-0.5"
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* 2. Choose Template Preset */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Choose Template Preset</label>
                      {activePresetIndex > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-[10px] font-black uppercase tracking-wider">
                          Preset loaded
                        </span>
                      )}
                    </div>
                    
                    {/* Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setShowPresets(!showPresets)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-2xl transition-all cursor-pointer shadow-xs"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{AUTOMATION_PRESETS[activePresetIndex].icon}</span>
                        <span className="text-[12.5px] font-bold text-slate-750">
                          {AUTOMATION_PRESETS[activePresetIndex].name}
                        </span>
                      </span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${showPresets ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {showPresets && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                            {AUTOMATION_PRESETS.map((preset, idx) => {
                              const active = activePresetIndex === idx;
                              return (
                                <button
                                  key={preset.name}
                                  type="button"
                                  onClick={() => {
                                    setActivePresetIndex(idx);
                                    if (idx > 0) {
                                      setAutomationMessage(preset.message);
                                    }
                                    setShowPresets(false);
                                  }}
                                  className={`p-3 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between cursor-pointer group ${
                                    active
                                      ? "border-violet-600 bg-violet-50/40 shadow-[0_4px_20px_-4px_rgba(168,85,247,0.12)] text-slate-900"
                                      : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/30"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-base p-1.5 rounded-xl transition-colors duration-355 ${
                                        active ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200/60"
                                      }`}>{preset.icon}</span>
                                      <span className="text-[12px] font-extrabold truncate leading-none">{preset.name.replace(" Preset", "")}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 line-clamp-2 leading-relaxed font-semibold">{preset.desc}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 3. Trigger Setting */}
                  <div className="space-y-3.5 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-extrabold text-slate-805">Trigger on Any Comment</p>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Send Auto-DM to any comment or restrict by keywords</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutomationKeywordMode(automationKeywordMode === "any" ? "specific" : "any")}
                        className={`w-10 h-5.5 rounded-full relative transition-all duration-300 flex-shrink-0 cursor-pointer ${
                          automationKeywordMode === "any" 
                            ? "bg-slate-900 shadow-sm" 
                            : "bg-slate-200"
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-md transition-all duration-300 ${
                          automationKeywordMode === "any" ? "right-0.5" : "left-0.5"
                        }`} />
                      </button>
                    </div>

                    {automationKeywordMode === "specific" && (
                      <div className="pt-4 border-t border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Keywords to Watch</label>
                        <div className="flex gap-2">
                          <input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                            placeholder="e.g. YES, LINK, GETIT"
                            className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={addKeyword}
                            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[12.5px] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                          >
                            <Plus size={15} strokeWidth={2.5} />
                          </button>
                        </div>

                        {automationKeywords.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {automationKeywords.map((kw) => (
                              <span
                                key={kw}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-650 font-bold text-[11.5px] shadow-2xs"
                              >
                                {kw}
                                <button
                                  type="button"
                                  onClick={() => removeKeyword(kw)}
                                  className="text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                                >
                                  <X size={11} strokeWidth={2.5} />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10.5px] text-amber-600 font-semibold italic">Please add at least one keyword to trigger the DM.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 4. Custom DM Message */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Custom DM Message</label>
                    <textarea
                      value={automationMessage}
                      onChange={(e) => {
                        setAutomationMessage(e.target.value);
                        setActivePresetIndex(0);
                      }}
                      placeholder="Hey! Thanks for commenting. Here is the link you requested... 🚀"
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-[13px] font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 leading-relaxed shadow-sm transition-all"
                    />
                    <div className="flex items-center gap-1.5 p-3 rounded-xl bg-violet-50/50 border border-violet-100/50 text-violet-650 text-[10.5px] font-bold leading-normal">
                      <Sparkles size={14} className="shrink-0" />
                      <span>
                        💡 Tip: Keep it short, conversational, and direct. You can use <code className="bg-violet-100/50 px-1 py-0.5 rounded text-[10px] font-bold text-violet-700">{`{first_name}`}</code> and <code className="bg-violet-100/50 px-1 py-0.5 rounded text-[10px] font-bold text-violet-700">{`{link}`}</code>.
                      </span>
                    </div>
                  </div>

                  {/* 5. Comment Reply */}
                  <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[13px] font-extrabold text-slate-800">Reply in comments too</p>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Show a public comment reply when the automation triggers.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoReplyComment(!autoReplyComment)}
                        className={`w-10 h-5.5 rounded-full relative transition-all duration-300 flex-shrink-0 cursor-pointer ${
                          autoReplyComment
                            ? "bg-slate-900"
                            : "bg-slate-200"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-md transition-all duration-300 ${
                            autoReplyComment ? "right-0.5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>

                    {autoReplyComment ? (
                      <div className="space-y-3.5 pt-3.5 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-300">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Comment Reply Text</label>
                        <textarea
                          value={commentReplyText}
                          onChange={(e) => setCommentReplyText(e.target.value)}
                          placeholder="Thanks! You can find the link in my bio 📩"
                          rows={3}
                          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4.5 text-[13px] font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 leading-relaxed shadow-sm transition-all"
                        />
                        <p className="text-[10px] text-slate-400 leading-tight font-semibold">
                          This reply will post publicly in the comment thread alongside the DM.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-slate-400 font-semibold italic pt-2 border-t border-slate-100/50">Comment reply is off. Turn it on to reply publicly and send the DM together.</p>
                    )}
                  </div>

                  {/* 6. Ask to Follow First (Follow Gate) */}
                  <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[13px] font-extrabold text-slate-800">Ask to follow first</p>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Require the user to follow you to get the DM link.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRequireFollow(!requireFollow)}
                        className={`w-10 h-5.5 rounded-full relative transition-all duration-300 flex-shrink-0 cursor-pointer ${
                          requireFollow
                            ? "bg-slate-900"
                            : "bg-slate-200"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-md transition-all duration-300 ${
                            requireFollow ? "right-0.5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>

                    {requireFollow ? (
                      <div className="space-y-3.5 pt-3.5 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-300">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Follow Gate Message</label>
                        <textarea
                          value={followGateMessage}
                          onChange={(e) => setFollowGateMessage(e.target.value)}
                          placeholder="Hey! Follow me first and I'll send you the link 🙌"
                          rows={3}
                          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4.5 text-[13px] font-medium text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 leading-relaxed shadow-sm transition-all"
                        />
                        <p className="text-[10px] text-slate-400 leading-tight font-semibold">
                          This message will be sent first, requesting a follow before delivering the main content.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-slate-400 font-semibold italic pt-2 border-t border-slate-100/50">Follow gate is off. Anyone commenting will receive the main DM immediately.</p>
                    )}
                  </div>

                </div>

                {/* Right Column: Preview & Target Post */}
                <div className="lg:col-span-5 space-y-4 flex flex-col items-center justify-start">
                  
                  {/* Selected Reel Preview Card (Redesigned & Height Increased) */}
                  <div className="w-full p-5 bg-linear-to-br from-violet-50/30 via-white to-fuchsia-50/20 border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex gap-4.5 items-start text-left shrink-0 hover:shadow-[0_8px_24px_rgba(124,58,237,0.08)] transition-all duration-300">
                    <div className="relative w-26 h-36 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200/60 shadow-sm group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getThumb(selectedItemForAutomation)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                      <span className="absolute bottom-0 inset-x-0 bg-slate-950/70 py-1.5 text-center text-[8.5px] font-black uppercase text-white tracking-widest leading-none">
                        {selectedItemForAutomation.media_type === "VIDEO" ? "REEL" : "POST"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-between h-36 py-0.5">
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-5.5 h-5.5 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={selectedAccount.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAccount.username}`} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <span className="text-[12px] font-extrabold text-slate-800">@{selectedAccount.username}</span>
                        </div>
                        <p className="line-clamp-4 text-[13px] leading-relaxed text-slate-655 font-semibold">
                          {selectedItemForAutomation.caption || <span className="italic text-slate-400 font-medium">No caption text available.</span>}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[10.5px] text-slate-450 font-bold flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {formatDate(selectedItemForAutomation.timestamp)}
                        </span>
                        <a
                          href={selectedItemForAutomation.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-black text-violet-600 hover:text-violet-755 hover:underline transition-colors"
                        >
                          View on IG <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Segmented Control Selector */}
                  <div className="flex p-1 bg-slate-150/60 rounded-full w-full max-w-[280px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] border border-slate-200/40 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewTab("dm")}
                      className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 cursor-pointer ${
                        previewTab === "dm"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-450 hover:text-slate-700"
                      }`}
                    >
                      💬 Direct Message
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab("comment")}
                      className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 cursor-pointer ${
                        previewTab === "comment"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-450 hover:text-slate-700"
                      }`}
                    >
                      📝 Post Comments
                    </button>
                  </div>

                  {/* iPhone Simulator Wrapper */}
                  <div className="w-full max-w-[340px] aspect-[9/19.5] bg-slate-900 rounded-[50px] p-3 shadow-2xl relative border-4 border-slate-800 shrink-0">
                    
                    {/* iPhone camera island */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-20 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800 ml-10" />
                    </div>

                    {/* iPhone screen area */}
                    <div className="w-full h-full bg-white rounded-[40px] overflow-hidden flex flex-col relative select-none">
                      
                      {/* Glassmorphic Pause Overlay (No Layout shifts) */}
                      {!automationActive && (
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[3px] z-40 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-4 shadow-xl">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                          </div>
                          <span className="text-[14px] font-black uppercase tracking-wider text-white drop-shadow-sm">Automation Paused</span>
                          <p className="text-[11px] text-white/80 font-semibold mt-2 max-w-[200px] leading-relaxed">
                            Turn the toggle ON at the left card to see the live typing & message simulator.
                          </p>
                        </div>
                      )}

                      {previewTab === "dm" ? (
                        /* DYNAMIC DIRECT MESSAGE STREAM */
                        <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-300">
                          {/* IG Chat Header */}
                          <div className="pt-8 pb-3 px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0 select-none">
                            <div className="flex items-center gap-2.5">
                              <ChevronLeft size={20} className="text-slate-700 cursor-pointer" />
                              
                              <div className="relative">
                                {selectedAccount.profile_picture_url ? (
                                  <img
                                    src={selectedAccount.profile_picture_url}
                                    alt="preview avatar"
                                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[11px] font-black">
                                    {selectedAccount.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                              </div>

                              <div className="text-left">
                                <div className="flex items-center gap-0.5">
                                  <p className="text-xs font-bold text-slate-800 max-w-[120px] truncate leading-tight">
                                    @{selectedAccount.username}
                                  </p>
                                  <svg className="w-2.5 h-2.5 text-blue-500 fill-current shrink-0" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                  </svg>
                                </div>
                                <span className="text-[9px] text-slate-400 font-bold block leading-none">Active now</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-slate-600">
                              <Phone size={14} />
                              <Video size={15} />
                            </div>
                          </div>

                          {/* Chat Message Scroll Pane */}
                          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50/20 flex flex-col justify-end no-scrollbar">
                            
                            {/* Real-time sync loader */}
                            {simStep === "load-data" && (
                              <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4 animate-in fade-in duration-350">
                                <div className="relative">
                                  <div className="w-10 h-10 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Instagram size={14} className="text-violet-500" />
                                  </div>
                                </div>
                                <div className="text-center space-y-1">
                                  <span className="block text-[10px] font-extrabold text-violet-505 uppercase tracking-widest font-black">PioPost AI Sync</span>
                                  <span className="block text-[8px] text-slate-400 font-bold">Simulating message stream...</span>
                                </div>
                              </div>
                            )}

                            {/* User typing state */}
                            {simStep === "user-typing" && (
                              <div className="flex flex-col items-end space-y-1 align-right animate-in fade-in duration-300">
                                <div className="flex items-center gap-1 bg-slate-100 py-1.5 px-3 rounded-2xl w-10 justify-center">
                                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                                <span className="text-[6px] text-slate-400 mr-1.5 font-bold uppercase tracking-wider">User typing...</span>
                              </div>
                            )}

                            {/* User message sent state */}
                            {(simStep === "user-sent" || simStep === "creator-typing" || simStep === "creator-sent") && (
                              <div className="flex flex-col items-end space-y-1 animate-in fade-in duration-300">
                                <div className="bg-slate-100 border border-slate-200/50 text-slate-800 text-[10.5px] py-2 px-3 rounded-2xl rounded-tr-xs max-w-[80%] leading-relaxed font-semibold">
                                  {automationKeywordMode === "specific" && automationKeywords.length > 0 
                                    ? automationKeywords[0] 
                                    : "How can I get the link?"}
                                </div>
                                <span className="text-[6.5px] text-slate-400 mr-1.5 font-bold uppercase tracking-wider">User commented</span>
                              </div>
                            )}

                            {/* Divider indicating DM trigger */}
                            {(simStep === "creator-typing" || simStep === "creator-sent") && (
                              <div className="flex items-center gap-1.5 justify-center py-1 animate-in fade-in duration-350">
                                <div className="h-px bg-slate-200 flex-1" />
                                <span className="text-[6.5px] text-slate-400 font-extrabold uppercase tracking-widest leading-none select-none">Direct Message Sent</span>
                                <div className="h-px bg-slate-200 flex-1" />
                              </div>
                            )}

                            {/* Creator typing state */}
                            {simStep === "creator-typing" && (
                              <div className="flex items-start gap-1.5 animate-in fade-in duration-300">
                                <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-105 shrink-0 ring-1 ring-slate-150">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img 
                                    src={selectedAccount.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAccount.username}`} 
                                    alt="avatar" 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div className="flex items-center gap-1 bg-slate-100 py-1.5 px-3 rounded-2xl w-10 justify-center">
                                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                              </div>
                            )}

                            {/* Creator message sent state (Main automated response + optional follow gate) */}
                            {simStep === "creator-sent" && (
                              <div className="space-y-2.5 animate-in fade-in duration-300">
                                {/* Creator Follow Gate Message */}
                                {requireFollow && (
                                  <div className="flex items-start gap-1.5 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-105 shrink-0 ring-1 ring-slate-150">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img 
                                        src={selectedAccount.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAccount.username}`} 
                                        alt="avatar" 
                                        className="w-full h-full object-cover" 
                                      />
                                    </div>
                                    <div className="flex flex-col bg-slate-105 border border-slate-200/80 text-slate-800 text-[10px] rounded-2xl rounded-tl-xs max-w-[80%] overflow-hidden shadow-xs">
                                      {/* Text block */}
                                      <div className="py-2 px-3 leading-relaxed font-medium break-words">
                                        {followGateMessage.replace(/{first_name}/g, "John") || "Hey! Follow me first and I'll send you the link 🙌"}
                                      </div>
                                      {/* Buttons block */}
                                      <div className="border-t border-slate-200/60 flex flex-col divide-y divide-slate-200/60 bg-white">
                                        <a 
                                          href={`https://instagram.com/${selectedAccount.username}`}
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="py-1.5 text-center text-blue-500 font-extrabold hover:bg-slate-50 transition-colors text-[9.5px] cursor-pointer"
                                        >
                                          Visit Profile
                                        </a>
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            if (simCheckingFollow || simFollowVerified) return;
                                            setSimCheckingFollow(true);
                                            setTimeout(() => {
                                              setSimCheckingFollow(false);
                                              setSimFollowVerified(true);
                                            }, 1200);
                                          }}
                                          disabled={simCheckingFollow || simFollowVerified}
                                          className={`py-1.5 text-center font-extrabold transition-colors text-[9.5px] cursor-pointer ${
                                            simFollowVerified 
                                              ? "text-emerald-600 bg-emerald-50/20" 
                                              : "text-blue-505 hover:bg-slate-50"
                                          }`}
                                        >
                                          {simFollowVerified ? "Verified ✓" : "I'm Following"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Simulating Check Progress */}
                                {simCheckingFollow && (
                                  <div className="flex items-start gap-1.5 animate-in slide-in-from-bottom-1 duration-200">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-105 shrink-0 ring-1 ring-slate-150">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img 
                                        src={selectedAccount.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAccount.username}`} 
                                        alt="avatar" 
                                        className="w-full h-full object-cover" 
                                      />
                                    </div>
                                    <div className="bg-slate-100 text-slate-500 text-[10px] py-1.5 px-2.5 rounded-2xl rounded-tl-xs max-w-[80%] leading-relaxed font-semibold italic flex items-center gap-1.5">
                                      <div className="w-2.5 h-2.5 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                                      Checking your follow status... ⏳
                                    </div>
                                  </div>
                                )}

                                {/* Creator Main Automated DM */}
                                {(!requireFollow || simFollowVerified) && (
                                  <div className="flex items-start gap-1.5 animate-in slide-in-from-bottom-2 duration-500">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-105 shrink-0 ring-1 ring-slate-150">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img 
                                        src={selectedAccount.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAccount.username}`} 
                                        alt="avatar" 
                                        className="w-full h-full object-cover" 
                                      />
                                    </div>
                                    <div className="bg-gradient-to-tr from-[#3b82f6] via-[#8b5cf6] to-[#ec4899] text-white text-[10.5px] py-2 px-3 rounded-2xl rounded-tl-xs max-w-[80%] leading-relaxed font-semibold shadow-xs break-words">
                                      {automationMessage
                                        ? automationMessage.replace(/{first_name}/g, "John").replace(/{link}/g, "piopost.com/get-link 🔗")
                                        : "Hey there! Thanks for your comment. Here is your link... 🚀"}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>

                          {/* Chat Footer Input */}
                          <div className="px-3 py-2 bg-white border-t border-slate-150 flex items-center justify-between shrink-0 select-none pointer-events-none">
                            <div className="h-6.5 flex-1 bg-slate-50 border border-slate-200 rounded-full px-3 flex items-center text-[10px] text-slate-400 font-semibold">
                              Message...
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* DYNAMIC INSTAGRAM COMMENTS STREAM */
                        <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-300">
                          {/* IG Comments Header */}
                          <div className="pt-8 pb-3 px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0 select-none">
                            <div className="flex items-center gap-2.5">
                              <ChevronLeft size={20} className="text-slate-705 cursor-pointer" />
                              <p className="text-xs font-bold text-slate-800 leading-tight">Comments</p>
                            </div>
                            <X size={16} className="text-slate-500 cursor-pointer" />
                          </div>

                          {/* Comments list */}
                          <div className="flex-1 p-3 overflow-y-auto space-y-3.5 bg-white flex flex-col justify-end no-scrollbar">
                            
                            {/* Real-time sync loader */}
                            {simStep === "load-data" && (
                              <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4 animate-in fade-in duration-350">
                                <div className="relative">
                                  <div className="w-10 h-10 border-3 border-[#ee2a7b]/20 border-t-[#ee2a7b] rounded-full animate-spin" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <MessageSquare size={14} className="text-[#ee2a7b]" />
                                  </div>
                                </div>
                                <div className="text-center space-y-1">
                                  <span className="block text-[10px] font-extrabold text-[#ee2a7b] uppercase tracking-widest font-black">Scanning Reel</span>
                                  <span className="block text-[8px] text-slate-400 font-bold">Listening for triggers...</span>
                                </div>
                              </div>
                            )}

                            {simStep !== "load-data" && (
                              <>
                                {/* Author caption block at top */}
                                <div className="flex items-start gap-2 text-left">
                                  <div className="w-6.5 h-6.5 rounded-full overflow-hidden bg-slate-105 shrink-0 ring-1 ring-slate-200">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                      src={selectedAccount.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAccount.username}`} 
                                      alt="avatar" 
                                      className="w-full h-full object-cover" 
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-0.5">
                                      <span className="text-[10px] font-black text-slate-900">@{selectedAccount.username}</span>
                                      <svg className="w-2.5 h-2.5 text-blue-500 fill-current shrink-0" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                      </svg>
                                    </div>
                                    <p className="text-[9.5px] text-slate-550 leading-relaxed font-semibold mt-0.5">
                                      {selectedItemForAutomation.caption || "Check out our latest update! Drop comments below."}
                                    </p>
                                  </div>
                                </div>

                                <div className="h-[1px] bg-slate-100 w-full" />
                              </>
                            )}

                            {/* User typing state */}
                            {simStep === "user-typing" && (
                              <div className="flex items-start gap-2 animate-in fade-in duration-300">
                                <div className="w-6.5 h-6.5 rounded-full bg-slate-250 border border-slate-350 flex items-center justify-center font-bold text-[9px] text-slate-400 shrink-0 select-none">
                                  U
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9.5px] font-black text-slate-900">test_user_ig</span>
                                  </div>
                                  <div className="flex items-center gap-1 bg-slate-100 py-1.5 px-3 rounded-2xl w-10 justify-center shadow-xs">
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* User comment block (Step 2 onwards) */}
                            {simStep !== "load-data" && (simStep === "user-sent" || simStep === "creator-typing" || simStep === "creator-sent") && (
                              <div className="flex items-start gap-2 animate-in fade-in duration-300 text-left">
                                <div className="w-6.5 h-6.5 rounded-full bg-slate-205 border border-slate-355 flex items-center justify-center font-bold text-[9px] text-slate-500 shrink-0">
                                  U
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-slate-900">test_user_ig</span>
                                    <span className="text-[8px] text-slate-450 font-bold">12s</span>
                                  </div>
                                  <p className="text-[10.5px] text-slate-700 leading-normal mt-0.5">
                                    {automationKeywordMode === "specific" && automationKeywords.length > 0 
                                      ? automationKeywords[0] 
                                      : "Amazing! Link please!"}
                                  </p>

                                  {/* Creator typing indicator inside comments thread */}
                                  {simStep === "creator-typing" && autoReplyComment && (
                                    <div className="mt-2.5 pl-3 border-l border-slate-200 flex items-start gap-1.5 animate-in fade-in duration-300">
                                      <div className="w-5 h-5 rounded-full bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-0.25 shrink-0">
                                        <div className="w-full h-full rounded-full border border-white overflow-hidden bg-slate-50">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img 
                                            src={selectedAccount.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAccount.username}`} 
                                            alt="avatar" 
                                            className="w-full h-full object-cover" 
                                          />
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 bg-slate-100 py-1.5 px-3 rounded-2xl w-10 justify-center shadow-xs">
                                        <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                      </div>
                                    </div>
                                  )}

                                  {/* Nested Creator Reply */}
                                  {simStep === "creator-sent" && (
                                    <>
                                      {autoReplyComment ? (
                                        <div className="mt-2.5 pl-3 border-l border-slate-200 flex items-start gap-1.5 animate-in slide-in-from-bottom-1 duration-300">
                                          <div className="w-5 h-5 rounded-full bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-0.25 shrink-0">
                                            <div className="w-full h-full rounded-full border border-white overflow-hidden bg-slate-50">
                                              {/* eslint-disable-next-line @next/next/no-img-element */}
                                              <img 
                                                src={selectedAccount.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAccount.username}`} 
                                                alt="avatar" 
                                                className="w-full h-full object-cover" 
                                              />
                                            </div>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-0.5">
                                              <span className="text-[9.5px] font-bold text-slate-900">@{selectedAccount.username}</span>
                                              <svg className="w-2.5 h-2.5 text-blue-500 fill-current shrink-0" viewBox="0 0 24 24">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                              </svg>
                                              <span className="text-[6.5px] font-extrabold uppercase bg-slate-50 text-slate-450 px-1 rounded-sm border border-slate-100 scale-90 select-none">AutoReply</span>
                                            </div>
                                            <p className="text-[9.5px] text-slate-700 leading-relaxed mt-0.5 break-words">
                                              <span className="text-blue-600 font-semibold">@test_user_ig</span> {commentReplyText ? commentReplyText.replace(/{first_name}/g, "John") : "Thanks! Check your DM 📩"}
                                            </p>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-[7.5px] text-slate-450 font-bold italic mt-2.5 animate-in fade-in duration-300">
                                          No comment reply configured. (Toggled off)
                                        </p>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>

                          {/* Comments footer input */}
                          <div className="px-3 py-2 bg-white border-t border-slate-150 flex items-center justify-between shrink-0 select-none pointer-events-none">
                            <div className="h-6.5 flex-1 bg-slate-50 border border-slate-205 rounded-full px-3 flex items-center text-[10px] text-slate-400 font-semibold">
                              Add a comment...
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 bg-white pt-6 mt-8 flex items-center justify-between">
                {(() => {
                  const existingRule = rules.find((r) => r.post_id === selectedItemForAutomation.id);
                  if (existingRule) {
                    return (
                      <button
                        type="button"
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
                    type="button"
                    onClick={() => setIsAutomationModalOpen(false)}
                    className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-[12.5px] font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAutomation}
                    disabled={savingAutomation || (automationKeywordMode === "specific" && automationKeywords.length === 0) || !automationMessage.trim()}
                    className="h-10 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-750 hover:to-fuchsia-750 text-white text-[12.5px] font-bold shadow-[0_4px_12px_rgba(124,58,237,0.25)] hover:shadow-[0_6px_16px_rgba(124,58,237,0.35)] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-102 active:scale-98"
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
