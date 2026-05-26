"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Film,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Plus,
  Play,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
  instagram_business_id?: string;
}

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
}

interface LogEntry {
  id: string;
  automation_id: string;
  instagram_user_id: string;
  comment_text: string;
  comment_id?: string | null;
  triggered_by_username?: string | null;
  dm_sent: boolean;
  dm_sent_at?: string | null;
  error_message?: string | null;
  created_at: string;
}

interface TemplateOption {
  id: string;
  title: string;
  label: string;
  message: string;
  accent: string;
  icon: React.ReactNode;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "thanks",
    title: "Thanks",
    label: "Thank you template",
    message: "Thanks for your comment, deepak here. I’ve sent the next step in your DM.",
    accent: "from-[#f59e0b] to-[#ef4444]",
    icon: <Sparkles size={16} />,
  },
  {
    id: "welcome",
    title: "Welcome",
    label: "Friendly welcome",
    message: "Welcome! deepak here. Check your DM for the next step right now.",
    accent: "from-[#0ea5e9] to-[#6366f1]",
    icon: <MessageSquare size={16} />,
  },
  {
    id: "free-guide",
    title: "Free Guide",
    label: "Lead magnet",
    message: "Awesome comment. I’ve sent your free guide in DM. Open it and start there.",
    accent: "from-[#10b981] to-[#14b8a6]",
    icon: <Send size={16} />,
  },
  {
    id: "pricing",
    title: "Pricing",
    label: "Pricing follow-up",
    message: "Thanks! I just sent pricing details to your DM, deepak here if you need help.",
    accent: "from-[#8b5cf6] to-[#ec4899]",
    icon: <ArrowRight size={16} />,
  },
  {
    id: "book-call",
    title: "Book a Call",
    label: "High-intent lead",
    message: "Nice! Your DM now has the booking link. Let’s get you started.",
    accent: "from-[#22c55e] to-[#84cc16]",
    icon: <Clock3 size={16} />,
  },
  {
    id: "limited-offer",
    title: "Limited Offer",
    label: "Urgency template",
    message: "You’re in. I sent the limited offer in DM, grab it before it expires.",
    accent: "from-[#fb7185] to-[#f97316]",
    icon: <WandSparkles size={16} />,
  },
];

function getMediaThumb(media: InstagramMedia) {
  return media.thumbnail_url || media.media_url || "";
}

export function QuickRepliesStudio() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATE_OPTIONS[1].id);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"all" | "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM">("all");
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [refreshingMedia, setRefreshingMedia] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [liveRuleId, setLiveRuleId] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || accounts[0] || null;
  const selectedTemplate = TEMPLATE_OPTIONS.find((template) => template.id === selectedTemplateId) || TEMPLATE_OPTIONS[0];
  const selectedMedia = media.find((item) => item.id === selectedMediaId) || null;

  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      const matchesFilter = mediaFilter === "all" || item.media_type === mediaFilter;
      const caption = item.caption ?? "";
      const matchesSearch = !search || caption.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [media, mediaFilter, search]);

  const counts = useMemo(() => ({
    total: media.length,
    reels: media.filter((item) => item.media_type === "VIDEO").length,
    photos: media.filter((item) => item.media_type === "IMAGE").length,
    carousels: media.filter((item) => item.media_type === "CAROUSEL_ALBUM").length,
  }), [media]);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch("/api/instagram-account");
        const { data } = await res.json();
        const nextAccounts = Array.isArray(data) ? data : [];
        setAccounts(nextAccounts);
        setSelectedAccountId(nextAccounts[0]?.id ?? null);
      } catch (error) {
        console.error("Failed to load accounts:", error);
        toast.error("Failed to load connected Instagram accounts");
      } finally {
        setLoadingAccounts(false);
      }
    };

    void loadAccounts();
  }, []);

  useEffect(() => {
    if (!selectedAccountId) return;

    const loadMedia = async () => {
      setLoadingMedia(true);
      try {
        const res = await fetch(`/api/instagram-posts?accountId=${encodeURIComponent(selectedAccountId)}&limit=50`);
        const { data, error } = await res.json();
        if (error) throw new Error(error);
        setMedia(Array.isArray(data) ? data : []);
        setSelectedMediaId((current) => {
          if (current && Array.isArray(data) && data.some((item: InstagramMedia) => item.id === current)) {
            return current;
          }
          return data?.[0]?.id ?? null;
        });
      } catch (error: any) {
        console.error("Failed to load Instagram media:", error);
        toast.error(error.message || "Failed to load Instagram posts");
      } finally {
        setLoadingMedia(false);
        setRefreshingMedia(false);
      }
    };

    void loadMedia();
  }, [selectedAccountId]);

  useEffect(() => {
    if (!liveRuleId) return;

    const fetchLiveLogs = async () => {
      try {
        const res = await fetch(`/api/automation-logs?automationId=${encodeURIComponent(liveRuleId)}&limit=8`);
        const { data } = await res.json();
        setRecentLogs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load live logs:", error);
      }
    };

    void fetchLiveLogs();
    const timer = window.setInterval(() => {
      void fetchLiveLogs();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [liveRuleId]);

  const handleRefreshMedia = async () => {
    if (!selectedAccountId) return;
    setRefreshingMedia(true);
    try {
      const res = await fetch(`/api/instagram-posts?accountId=${encodeURIComponent(selectedAccountId)}&limit=50`);
      const { data, error } = await res.json();
      if (error) throw new Error(error);
      setMedia(Array.isArray(data) ? data : []);
      toast.success("Posts refreshed");
    } catch (error: any) {
      toast.error(error.message || "Failed to refresh posts");
    } finally {
      setRefreshingMedia(false);
    }
  };

  const handleStartAutomation = async () => {
    if (!selectedAccount || !selectedMedia) {
      toast.error("Pick a post before starting automation");
      return;
    }

    setLaunching(true);
    try {
      const payload = {
        platform: "instagram",
        name: `${selectedTemplate.title} — ${selectedMedia.media_type === "VIDEO" ? "Reel" : "Post"}`,
        trigger_type: selectedMedia.media_type === "VIDEO" ? "reel_comment" : "post_comment",
        comment_scope: "specific",
        instagram_media_id: selectedMedia.id,
        post_thumbnail: getMediaThumb(selectedMedia),
        keyword_mode: "any",
        keywords: [],
        trigger_keyword: "Any comment",
        reply_message: selectedTemplate.message,
        auto_reply_enabled: false,
        auto_reply_text: "",
        dm_type: "message_only",
        dm_button_label: "",
        dm_button_url: "",
        ask_follow: false,
        ask_email: false,
        instagram_account_id: selectedAccount.id,
        active: true,
        deleted: false,
      };

      const res = await fetch("/api/automation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const { data, error } = await res.json();
      if (error || !data) throw new Error(error || "Failed to create automation");

      setLiveRuleId(data.id);
      setRecentLogs([]);
      toast.success("Automation started and listening in real time");
    } catch (error: any) {
      console.error("Failed to start automation:", error);
      toast.error(error.message || "Failed to start automation");
    } finally {
      setLaunching(false);
    }
  };

  const templateGrid = TEMPLATE_OPTIONS;

  return (
    <div className="relative mx-auto max-w-7xl px-6 md:px-8 pt-8 md:pt-24 pb-20 animate-in fade-in duration-700">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-violet-100/30 blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 h-96 w-96 rounded-full bg-pink-100/20 blur-[120px]" />
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm w-fit">
            <Sparkles size={13} className="text-[#a855f7]" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Template Studio</span>
          </div>
          <h1 className="text-[34px] md:text-[56px] font-normal tracking-tight text-slate-900 leading-none">
            AutoDM <span className="text-[#a855f7] font-medium">Templates</span>
          </h1>
          <p className="text-[14.5px] md:text-[16px] text-slate-500 font-medium max-w-xl leading-relaxed">
            Choose a message template, pick the Instagram post or reel, then launch a real-time comment-to-DM automation.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {accounts.length > 1 && (
            <select
              value={selectedAccountId ?? ""}
              onChange={(event) => {
                setSelectedAccountId(event.target.value);
                setSelectedMediaId(null);
                setShowMediaPicker(false);
                setLiveRuleId(null);
                setRecentLogs([]);
              }}
              className="h-10 rounded-full border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#a855f7]/20"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  @{account.username}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => void handleRefreshMedia()}
            disabled={refreshingMedia || loadingMedia || !selectedAccount}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all disabled:opacity-50"
            title="Refresh posts"
          >
            <RefreshCw size={15} className={refreshingMedia ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {selectedAccount && (
        <div className="bg-white rounded-[24px] border border-[#e4e4e7] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {selectedAccount.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedAccount.profile_picture_url} alt="avatar" className="w-11 h-11 rounded-full object-cover ring-2 ring-[#a855f7]/20 flex-shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white text-[14px] font-black flex-shrink-0">
                {selectedAccount.username.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="max-w-60 truncate text-[15px] font-bold text-slate-900">@{selectedAccount.username}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Connected</span>
                </span>
              </div>
              <p className="text-[12px] text-slate-400 mt-0.5">Pick a template and launch a live DM automation for comments on one post or reel.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="text-center px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-16">
              <p className="text-[20px] font-bold text-slate-900 leading-none">{templateGrid.length}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Templates</p>
            </div>
            <div className="text-center px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-16">
              <p className="text-[20px] font-bold text-slate-900 leading-none">{counts.total}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Posts</p>
            </div>
            <div className="text-center px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-16">
              <p className="text-[20px] font-bold text-slate-900 leading-none">{liveRuleId ? "On" : "Off"}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Live</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-8 items-start">
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[18px] md:text-[22px] font-bold text-slate-900">Choose a template</h2>
              <p className="text-[13px] text-slate-500 mt-1">Pick one message. The selected reply is what users get in their DM.</p>
            </div>

            <button
              onClick={() => setShowMediaPicker(true)}
              disabled={!selectedTemplate || !selectedAccount}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[13px] font-bold rounded-full shadow-[0_8px_20px_-4px_rgba(15,23,42,0.18)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templateGrid.map((template) => {
              const active = template.id === selectedTemplate.id;

              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`text-left rounded-[24px] border p-5 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] ${
                    active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${template.accent} flex items-center justify-center text-white mb-4`}>
                    {template.icon}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className={`text-[15px] font-bold ${active ? "text-white" : "text-slate-900"}`}>{template.title}</h3>
                      <p className={`text-[11px] font-semibold mt-0.5 ${active ? "text-white/70" : "text-slate-400"}`}>{template.label}</p>
                    </div>
                    {active && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-white/10 text-white">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className={`text-[13px] leading-relaxed mt-4 ${active ? "text-white/85" : "text-slate-500"}`}>
                    {template.message}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-[28px] border border-slate-200 p-6 md:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">Template preview</h3>
                <p className="text-[12px] text-slate-400 mt-0.5">This is the exact message the DM will send when someone comments.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <Send size={12} />
                Real-time DM
              </span>
            </div>

            <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4 md:p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white shrink-0">
                  <MessageSquare size={16} />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-500 w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Any comment trigger
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm max-w-xl">
                    <p className="text-[13px] font-medium text-slate-700 leading-relaxed">{selectedTemplate.message}</p>
                  </div>
                  <p className="text-[11px] text-slate-400">When the selected post gets any comment, this message is sent to the commenter in DM.</p>
                </div>
              </div>
            </div>
          </div>

          {showMediaPicker && (
            <section className="bg-white rounded-[28px] border border-slate-200 p-6 md:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300" id="media-picker">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900">Choose one post or reel</h3>
                  <p className="text-[12px] text-slate-400 mt-0.5">Click a single post. This is the comment trigger for your template automation.</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setMediaFilter("all")}
                    className={`px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors ${mediaFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setMediaFilter("VIDEO")}
                    className={`px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors ${mediaFilter === "VIDEO" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}
                  >
                    Reels
                  </button>
                  <button
                    onClick={() => setMediaFilter("IMAGE")}
                    className={`px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors ${mediaFilter === "IMAGE" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}
                  >
                    Photos
                  </button>
                  <button
                    onClick={() => setMediaFilter("CAROUSEL_ALBUM")}
                    className={`px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors ${mediaFilter === "CAROUSEL_ALBUM" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}
                  >
                    Carousels
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search captions..."
                    className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none text-[13px] font-medium"
                  />
                </div>

                <button
                  onClick={() => void handleRefreshMedia()}
                  className="inline-flex items-center gap-2 px-4 h-11 rounded-2xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <RefreshCw size={14} className={refreshingMedia ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {loadingMedia ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="animate-spin text-slate-400" size={26} />
                  <p className="text-[13px] text-slate-400 font-semibold">Loading posts and reels...</p>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
                    <MessageSquare size={24} />
                  </div>
                  <h4 className="text-[15px] font-bold text-slate-800">No posts found</h4>
                  <p className="text-[12px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Try changing the filter, refreshing the feed, or connect an Instagram account with published posts.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredMedia.map((item) => {
                    const active = item.id === selectedMediaId;
                    const thumb = getMediaThumb(item);

                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedMediaId(item.id)}
                        className={`relative aspect-square rounded-[22px] overflow-hidden border-2 transition-all text-left group ${active ? "border-slate-900 scale-[0.98]" : "border-transparent hover:border-slate-300"}`}
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="post preview" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            {item.media_type === "VIDEO" ? <Film size={22} className="text-slate-400" /> : <ImageIcon size={22} className="text-slate-400" />}
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80" />

                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-white text-[9px] font-black uppercase tracking-wider backdrop-blur-sm">
                              {item.media_type === "VIDEO" ? "Reel" : item.media_type === "IMAGE" ? "Photo" : "Carousel"}
                            </span>
                            {active && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-slate-900 text-[9px] font-black uppercase tracking-wider">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-[11px] text-white/90 line-clamp-2 leading-relaxed">
                            {item.caption || "Untitled post"}
                          </p>
                        </div>

                        {active && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                              <CheckCircle2 size={20} className="text-slate-900" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </section>

        <aside className="space-y-6 sticky top-8">
          <div className="bg-slate-900 text-white rounded-[32px] p-6 md:p-7 shadow-[0_18px_40px_rgba(15,23,42,0.15)] overflow-hidden relative">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl -mr-10 -mt-10" />
            <div className="relative space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.18em] w-fit">
                <Sparkles size={12} />
                Live Launch
              </div>

              <div>
                <h3 className="text-[22px] font-bold tracking-tight">{launching ? "Starting automation..." : liveRuleId ? "Automation is live" : "Ready to start"}</h3>
                <p className="text-[13px] text-white/70 mt-1 leading-relaxed">
                  {liveRuleId
                    ? "Watch the actual webhook activity below as comments arrive and DM replies are sent in real time."
                    : "Pick a template, choose one post, then press Get Started to launch the automation."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/45">Template</p>
                  <p className="text-[14px] font-semibold mt-1">{selectedTemplate.title}</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/45">Trigger</p>
                  <p className="text-[14px] font-semibold mt-1">Any comment</p>
                </div>
              </div>

              <div className="rounded-3xl bg-white/5 border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Selected post</span>
                  {selectedMedia && (
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">{selectedMedia.media_type === "VIDEO" ? "Reel" : "Post"}</span>
                  )}
                </div>

                {selectedMedia ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 border border-white/10 shrink-0">
                      {getMediaThumb(selectedMedia) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getMediaThumb(selectedMedia)} alt="selected post" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/70">
                          {selectedMedia.media_type === "VIDEO" ? <Play size={16} /> : <ImageIcon size={16} />}
                        </div>
                      )}
                    </div>
                    <p className="text-[13px] text-white/80 leading-relaxed line-clamp-2">{selectedMedia.caption || "Untitled post"}</p>
                  </div>
                ) : (
                  <p className="text-[13px] text-white/55">Select one post before starting.</p>
                )}
              </div>

              <button
                onClick={() => void handleStartAutomation()}
                disabled={launching || !selectedAccount || !selectedTemplate || !selectedMedia}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white text-slate-900 text-[14px] font-black shadow-lg shadow-black/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {launching ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Get Started
              </button>

              <div className="flex items-center gap-2 text-[11px] text-white/55">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Real webhook, real DM delivery, live polling for logs.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-slate-200 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">Live activity stream</h3>
                <p className="text-[12px] text-slate-400 mt-0.5">Pulled from the automation logs endpoint.</p>
              </div>
              <button
                onClick={() => {
                  if (!liveRuleId) return;
                  void (async () => {
                    try {
                      const res = await fetch(`/api/automation-logs?automationId=${encodeURIComponent(liveRuleId)}&limit=8`);
                      const { data } = await res.json();
                      setRecentLogs(Array.isArray(data) ? data : []);
                    } catch (error) {
                      console.error(error);
                    }
                  })();
                }}
                disabled={!liveRuleId}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all disabled:opacity-40"
                title="Refresh live logs"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {liveRuleId ? (
              recentLogs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Clock3 size={18} />
                  </div>
                  <h4 className="text-[14px] font-bold text-slate-800">Waiting for comments</h4>
                  <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">
                    Comment anything on the selected post or reel. The webhook will DM the chosen template in real time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-bold text-slate-800">@{log.triggered_by_username || "instagram_user"}</p>
                          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{log.comment_text}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${log.dm_sent ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                          {log.dm_sent ? <CheckCircle2 size={11} /> : <MessageSquare size={11} />}
                          {log.dm_sent ? "DM Sent" : "Failed"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                        <span>{new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <MessageSquare size={18} />
                </div>
                <h4 className="text-[14px] font-bold text-slate-800">No automation launched yet</h4>
                <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">
                  Start the automation first, then this panel will show live comment and DM events.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}