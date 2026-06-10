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
  Tag,
  Star,
  Calendar,
  BookOpen,
  Users,
  Mail,
  X,
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
    id: "welcome",
    title: "Welcome",
    label: "Friendly welcome",
    message: "Welcome! deepak here. Thanks for your comment! Let me know if you need help.",
    accent: "bg-slate-100 text-slate-600",
    icon: <MessageSquare size={16} />,
  },
  {
    id: "thanks",
    title: "Thanks",
    label: "Thank you template",
    message: "Thanks for your comment, deepak here! Glad to have you engage with our post.",
    accent: "bg-slate-100 text-slate-600",
    icon: <Sparkles size={16} />,
  },
  {
    id: "free-guide",
    title: "Free Guide",
    label: "Lead magnet",
    message: "Awesome comment, thank you! I hope this guides you well. Link is in bio.",
    accent: "bg-slate-100 text-slate-600",
    icon: <Send size={16} />,
  },
  {
    id: "discount",
    title: "Discount",
    label: "Promo code",
    message: "Here is your 10% discount code: PIO10! Enjoy shopping! 🛍️",
    accent: "bg-slate-100 text-slate-600",
    icon: <Tag size={16} />,
  },
  {
    id: "pricing",
    title: "Pricing",
    label: "Pricing follow-up",
    message: "Thanks! You can check out all our plans and pricing details on our website.",
    accent: "bg-slate-100 text-slate-600",
    icon: <ArrowRight size={16} />,
  },
  {
    id: "book-call",
    title: "Book a Call",
    label: "High-intent lead",
    message: "Nice! Let's get you started. Go ahead and book a call using the link in my bio.",
    accent: "bg-slate-100 text-slate-600",
    icon: <Clock3 size={16} />,
  },
  {
    id: "limited-offer",
    title: "Limited Offer",
    label: "Urgency template",
    message: "You're in. Grab this limited-time offer using the link in my bio before it expires!",
    accent: "bg-slate-100 text-slate-600",
    icon: <WandSparkles size={16} />,
  },
  {
    id: "vip-access",
    title: "VIP Access",
    label: "Exclusive entry",
    message: "VIP Access granted! Grab your exclusive early-access link from the bio. 🌟",
    accent: "bg-slate-100 text-slate-600",
    icon: <Star size={16} />,
  },
  {
    id: "event",
    title: "Event Invite",
    label: "Registration link",
    message: "Got your comment! Find the registration link for our live event in our bio. 📅",
    accent: "bg-slate-100 text-slate-600",
    icon: <Calendar size={16} />,
  },
  {
    id: "ebook",
    title: "E-book",
    label: "Book download",
    message: "Awesome! You can download your copy of the E-book using the link in our bio. 📚",
    accent: "bg-slate-100 text-slate-600",
    icon: <BookOpen size={16} />,
  },
  {
    id: "collab",
    title: "Collaboration",
    label: "Brand partnership",
    message: "Thanks for reaching out! Let's collaborate. Drop us an email or check our bio link. 🤝",
    accent: "bg-slate-100 text-slate-600",
    icon: <Users size={16} />,
  },
  {
    id: "newsletter",
    title: "Newsletter",
    label: "Weekly updates",
    message: "Thanks! Head over to our profile bio to subscribe to our weekly updates newsletter. ✉️",
    accent: "bg-slate-100 text-slate-600",
    icon: <Mail size={16} />,
  },
];

function getMediaThumb(media: InstagramMedia) {
  return media.thumbnail_url || media.media_url || "";
}

export function QuickRepliesStudio() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  
  // Stateful templates
  const [templates, setTemplates] = useState<TemplateOption[]>(TEMPLATE_OPTIONS);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATE_OPTIONS[1].id);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [modalStep, setModalStep] = useState<"picker" | "preview">("picker");
  
  // Custom Template Modal State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  
  const [search, setSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"all" | "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM">("all");
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [refreshingMedia, setRefreshingMedia] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [liveRuleId, setLiveRuleId] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || accounts[0] || null;
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || templates[0];
  const selectedMedia = media.find((item) => item.id === selectedMediaId) || null;

  const handleCreateCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customMessage.trim()) {
      toast.error("Title and Message are required");
      return;
    }
    const newTemplate: TemplateOption = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim(),
      label: customLabel.trim() || "Custom campaign",
      message: customMessage.trim(),
      accent: "bg-slate-100 text-slate-600",
      icon: <Sparkles size={16} />,
    };
    setTemplates((prev) => [...prev, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    setShowCustomModal(false);
    setCustomTitle("");
    setCustomLabel("");
    setCustomMessage("");
    toast.success("Custom template created");
  };

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
    setReplyMessage(selectedTemplate.message);
  }, [selectedTemplate.message]);

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
        post_id: selectedMedia.id,
        post_thumbnail: getMediaThumb(selectedMedia),
        post_thumbnail_url: getMediaThumb(selectedMedia),
        keyword_mode: "any",
        keywords: [],
        trigger_keyword: "Any comment",
        reply_message: "",
        dm_message: "",
        comment_reply_text: replyMessage || selectedTemplate.message,
        auto_reply_comment: true,
        auto_reply_text: replyMessage || selectedTemplate.message,
        dm_type: "comment_only",
        dm_button_label: "",
        dm_button_url: "",
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

  const templateGrid = templates;

  return (
    <div className="relative mx-auto max-w-7xl px-6 md:px-8 pt-8 md:pt-24 pb-20 animate-in fade-in duration-700">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-violet-100/30 blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 h-96 w-96 rounded-full bg-pink-100/20 blur-[120px]" />
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
        <div className="space-y-3">
          <h1 className="text-[32px] md:text-[52px] font-normal tracking-tight text-slate-900 leading-none">
            Auto Comment <span className="text-[#a855f7] font-medium">Reply</span>
          </h1>
          <p className="text-[14.5px] md:text-[16px] text-slate-500 font-medium max-w-xl leading-relaxed">
            Choose a template, pick a post or reel, and launch a comment auto-reply.
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

      {!loadingAccounts && !selectedAccount && (
        <div className="bg-white rounded-[24px] border border-[#e4e4e7] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
              <Sparkles size={20} className="text-[#a855f7]" />
            </div>
            <div>
              <p className="text-[14.5px] font-bold text-slate-800 leading-tight">Ready to automate comment replies?</p>
              <p className="text-[12.5px] text-slate-400 mt-1 font-medium">Pick a template and launch a live comment auto-reply for comments on one post or reel.</p>
            </div>
          </div>
          <a
            href="/api/auth/instagram/link"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e84c9f] via-[#b656e3] to-[#5a60f6] text-white text-[13.5px] font-bold rounded-full shadow-[0_8px_20px_-4px_rgba(182,86,227,0.25)] transition-all hover:scale-[1.01] shrink-0 text-center justify-center cursor-pointer"
          >
            Connect Instagram
          </a>
        </div>
      )}

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
              <p className="text-[12px] text-slate-400 mt-0.5">Pick a template and launch a live comment auto-reply for comments on one post or reel.</p>
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

      <div className="space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[18px] md:text-[22px] font-bold text-slate-900">Choose a template</h2>
              <p className="text-[13px] text-slate-500 mt-1">Pick one message. The selected reply is what users get as a direct comment reply.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-600 transition-colors"
              >
                <Plus size={13} />
                Custom Template
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMediaPicker(true);
                  setModalStep("picker");
                }}
                disabled={!selectedTemplate || !selectedAccount}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[13px] font-bold rounded-full shadow-[0_8px_20px_-4px_rgba(15,23,42,0.18)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templateGrid.map((template) => {
              const active = template.id === selectedTemplate.id;

              return (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                  }}
                  className={`text-left rounded-[24px] border p-5 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] ${
                    active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                    active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
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

      </div>

      {/* Modal - Media Picker & Automation Preview Flow */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="bg-white rounded-[28px] border border-slate-200 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 relative [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <button 
              type="button" 
              onClick={() => setShowMediaPicker(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={20} />
            </button>

            {modalStep === "picker" ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-[18px] font-bold text-slate-900">Choose one post or reel</h3>
                    <p className="text-[12px] text-slate-400 mt-0.5">Click a single post. This is the comment trigger for your template automation.</p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setMediaFilter("all")}
                      className={`px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors ${mediaFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaFilter("VIDEO")}
                      className={`px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors ${mediaFilter === "VIDEO" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}
                    >
                      Reels
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaFilter("IMAGE")}
                      className={`px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors ${mediaFilter === "IMAGE" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}
                    >
                      Photos
                    </button>
                    <button
                      type="button"
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
                    type="button"
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
                          onClick={() => {
                            setSelectedMediaId(item.id);
                            setModalStep("preview");
                          }}
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
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-[18px] font-bold text-slate-900">Automation Setup & Live Preview</h3>
                    <p className="text-[12px] text-slate-500">See exactly how the auto-reply flows when someone comments on your post.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalStep("picker")}
                      className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-600 transition-colors"
                    >
                      Back to Posts
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleStartAutomation();
                        setShowMediaPicker(false);
                      }}
                      disabled={launching || !selectedAccount || !selectedTemplate || !selectedMedia}
                      className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {launching ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Starting...
                        </>
                      ) : liveRuleId ? (
                        "Live & Active ⚡"
                      ) : (
                        "Start Automation 🚀"
                      )}
                    </button>
                  </div>
                </div>

                {selectedMedia && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                    {/* Left Column: Post Details */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                        {getMediaThumb(selectedMedia) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={getMediaThumb(selectedMedia)} alt="selected post" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            {selectedMedia.media_type === "VIDEO" ? <Film size={32} /> : <ImageIcon size={32} />}
                          </div>
                        )}
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                          {selectedMedia.media_type === "VIDEO" ? <Film size={10} /> : <ImageIcon size={10} />}
                          {selectedMedia.media_type === "VIDEO" ? "Reel" : "Post"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Caption</span>
                        <p className="text-[13px] text-slate-700 font-medium leading-relaxed line-clamp-3">
                          {selectedMedia.caption || "No caption description provided."}
                        </p>
                        <span className="block text-[11px] text-slate-400 font-medium mt-1">
                          Posted {formatDistanceToNow(new Date(selectedMedia.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Instagram Comment Thread Mockup */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      {/* Instagram Header Mockup */}
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-pulse" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Live Post Interaction Simulator</span>
                        </div>
                        <span className="text-[11px] text-[#a855f7] font-bold">Comments Feed</span>
                      </div>

                      {/* Post Owner Original Caption */}
                      <div className="p-4 border-b border-slate-100 flex items-start gap-3 text-left">
                        {selectedAccount.profile_picture_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedAccount.profile_picture_url} alt="avatar" className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">
                            {selectedAccount.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[13px] font-bold text-slate-900">@{selectedAccount.username}</span>
                            <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">Author</span>
                          </div>
                          <p className="text-[13px] text-slate-700 mt-1 font-normal leading-relaxed">
                            {selectedMedia.caption || "Check out our new update! Drop a comment below. 👇"}
                          </p>
                        </div>
                      </div>

                      {/* Comment Thread */}
                      <div className="p-4 bg-slate-50/30 flex-1 space-y-4 text-left">
                        {/* Parent Comment: User */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-[11px] text-slate-600 flex-shrink-0">
                            U
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-bold text-slate-900">instagram_user</span>
                              <span className="text-[10px] text-slate-400">12s</span>
                            </div>
                            <p className="text-[13px] text-slate-700 mt-0.5">I want this! Can you send me the details? 🔥</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-slate-400">
                              <button type="button" className="hover:text-slate-600">Reply</button>
                              <button type="button" className="hover:text-slate-600">See Translation</button>
                            </div>

                            {/* Nested Reply: Author Auto-Reply */}
                            <div className="mt-4 flex items-start gap-3 pl-4 border-l-2 border-slate-200">
                              {selectedAccount.profile_picture_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={selectedAccount.profile_picture_url} alt="avatar" className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-100 flex-shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white text-[9px] font-black flex-shrink-0">
                                  {selectedAccount.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[12px] font-bold text-slate-900">@{selectedAccount.username}</span>
                                  <span className="inline-flex items-center text-[8px] px-1.5 py-0.5 rounded-full bg-[#a855f7]/10 text-[#a855f7] font-bold">AutoReply</span>
                                  <span className="text-[10px] text-slate-400">Instant</span>
                                </div>
                                <div className="mt-2 space-y-2 relative">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-blue-600 font-medium text-[12.5px]">@instagram_user</span>
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 transition-colors shadow-xs cursor-pointer"
                                      >
                                        <BookOpen size={10} />
                                        Templates
                                      </button>
                                      
                                      {showTemplateDropdown && (
                                        <div className="absolute right-0 bottom-full mb-3 z-50 w-80 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-2.5 max-h-72 overflow-y-auto space-y-1.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full animate-in fade-in slide-in-from-bottom-2 duration-200">
                                          <div className="flex items-center gap-1.5 px-3 py-1.5 mb-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <Sparkles size={10} className="text-[#a855f7]" />
                                            Choose Template
                                          </div>
                                          {templates.map((t) => (
                                            <button
                                              key={t.id}
                                              type="button"
                                              onClick={() => {
                                                setReplyMessage(t.message);
                                                setShowTemplateDropdown(false);
                                              }}
                                              className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-violet-50/40 border border-transparent hover:border-violet-100 text-left transition-all duration-200 cursor-pointer group"
                                            >
                                              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:text-[#a855f7] group-hover:border-violet-200 text-slate-500 flex items-center justify-center shrink-0 transition-colors">
                                                {t.icon}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1.5">
                                                  <span className="text-[12.5px] font-bold text-slate-900 group-hover:text-[#a855f7] transition-colors">{t.title}</span>
                                                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 group-hover:bg-violet-100/50 group-hover:text-violet-600 px-1.5 py-0.5 rounded-md transition-colors shrink-0">
                                                    {t.label}
                                                  </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-1 font-medium line-clamp-2 leading-relaxed group-hover:text-slate-600 transition-colors">
                                                  {t.message}
                                                </p>
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    className="w-full text-[12.5px] text-slate-800 bg-white border border-slate-200 rounded-xl p-2.5 focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/10 outline-none resize-none leading-relaxed shadow-xs"
                                    rows={2}
                                    placeholder="Type auto-reply message..."
                                  />
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-slate-400">
                                  <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-wider">
                                    <CheckCircle2 size={10} className="text-emerald-500" />
                                    Replied
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal - Custom Template */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[28px] border border-slate-200 w-full max-w-md shadow-2xl p-6 relative">
            <button 
              type="button" 
              onClick={() => setShowCustomModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="space-y-1 mb-6">
              <h3 className="text-[18px] font-bold text-slate-900">Create Custom Template</h3>
              <p className="text-[12px] text-slate-400">Add a custom reply message to use for your automations.</p>
            </div>
            <form onSubmit={handleCreateCustomTemplate} className="space-y-4">
              <div>
                <label htmlFor="customTitle" className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Template Name
                </label>
                <input
                  id="customTitle"
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Autumn Sale Promotion"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none text-[13px] font-medium"
                />
              </div>
              <div>
                <label htmlFor="customLabel" className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Label / Campaign Tag
                </label>
                <input
                  id="customLabel"
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. promo, lead magnet (optional)"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none text-[13px] font-medium"
                />
              </div>
              <div>
                <label htmlFor="customMessage" className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Comment Reply Text
                </label>
                <textarea
                  id="customMessage"
                  required
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Write your comment reply message..."
                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none text-[13px] font-medium resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-[12px] font-bold text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold transition-all"
                >
                  Create & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}