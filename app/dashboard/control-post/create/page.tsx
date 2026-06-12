"use client";

import { useState, useEffect } from "react";
import {
  HelpCircle,
  MessageCircle,
  Send,
  AtSign,
  Heart,
  Film,
  Globe,
  Info,
  ArrowRight,
  ArrowLeft,
  Check,
  Play,
  Sparkles,
  Link as LinkIcon,
  ToggleLeft,
  Loader2,
  Bot,
  ThumbsUp,
  UserPlus,
  Clock,
  MessageSquarePlus,
  Zap,
  Shield
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreateAutomationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTrigger, setSelectedTrigger] = useState("comment");

  // Account & Media State
  const [account, setAccount] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [savingRule, setSavingRule] = useState(false);

  // Step 1: Keywords State
  const [keywords, setKeywords] = useState<string[]>(["GUIDE"]);
  const [keywordInput, setKeywordInput] = useState("");
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);

  // Step 3: Messages State
  const [commentReplyText, setCommentReplyText] = useState("Thanks for the comment! Check your DMs 📩");
  const [initialDmMessage, setInitialDmMessage] = useState(
    "Thanks for commenting! Tap below and I'll send you the access instantly 🚀"
  );
  const [dmButtonLabel, setDmButtonLabel] = useState("Send Access");
  const [dmButtonUrl, setDmButtonUrl] = useState("");
  const [mainDmMessage, setMainDmMessage] = useState("Here is your main access link! 🚀");

  // Step 3 Simulator State
  const [simStep, setSimStep] = useState<"step1" | "step2" | "step3" | "step4" | "step5">("step1");

  // Step 3: Follow Gate State (merged into Messages)
  const [requireFollow, setRequireFollow] = useState(false);
  const [followOpeningMessage, setFollowOpeningMessage] = useState(
    "Hey! I'm so glad you're here - thanks a ton for stopping by 😊\n\nTap below and I'll send you the access in just a moment ✨"
  );
  const [followOpeningBtnLabel, setFollowOpeningBtnLabel] = useState("Send me the access");
  const [followCheckMessage, setFollowCheckMessage] = useState(
    "Oops! Looks like you haven't followed me yet 👀\nIt would mean a lot if you could visit my profile and hit that follow button 😅."
  );
  const [followCheckBtn1Label, setFollowCheckBtn1Label] = useState("Visit Profile");
  const [followCheckBtn2Label, setFollowCheckBtn2Label] = useState("I'm following ✅");

  // Step 3: Email Ask Gate State
  const [emailAsk, setEmailAsk] = useState(false);
  const [emailAskMessage, setEmailAskMessage] = useState(
    "📧 Get your free guide! Click here to enter your email:\n\n{link}\n\nYour guide will be sent to your DMs instantly after you submit."
  );
  const [emailAskBtnLabel, setEmailAskBtnLabel] = useState("Send Guide to My DMs");

  // Step 4: Actions State
  const [autoLikeComment, setAutoLikeComment] = useState(true);
  const [autoFollowBack, setAutoFollowBack] = useState(false);
  const [dmDelay, setDmDelay] = useState(0);
  const [enableFollowUp, setEnableFollowUp] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [followUpDelay, setFollowUpDelay] = useState(60);

  // Keyword tag-pill helpers
  const addKeyword = (raw: string) => {
    const kw = raw.trim().replace(/,+$/, "").trim();
    if (!kw) return;
    if (keywords.length >= 3) return;
    if (keywords.map((k) => k.toLowerCase()).includes(kw.toLowerCase())) return;
    setKeywords((prev) => [...prev, kw]);
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(keywordInput);
    } else if (e.key === "Backspace" && keywordInput === "" && keywords.length > 0) {
      removeKeyword(keywords[keywords.length - 1]);
    }
  };

  useEffect(() => {
    fetch("/api/instagram/account")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not connected");
      })
      .then((data) => {
        setAccount(data);
        if (data.id) {
          setLoadingMedia(true);
          fetch(`/api/instagram-posts?accountId=${encodeURIComponent(data.id)}&limit=30`)
            .then((r) => r.json())
            .then(({ data: mediaData }) => {
              setMedia(mediaData ?? []);
            })
            .catch((err) => console.error("Failed to load media:", err))
            .finally(() => setLoadingMedia(false));
        }
      })
      .catch(() => {
        setAccount(null);
      })
      .finally(() => {
        setLoadingAccount(false);
      });
  }, []);

  const toggleMediaSelection = (id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllMedia = () => {
    if (selectedMediaIds.length === media.length) {
      setSelectedMediaIds([]);
    } else {
      setSelectedMediaIds(media.map((item) => item.id));
    }
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!account) {
        toast.error("Please connect your Instagram account first");
        return;
      }
      if (selectedMediaIds.length === 0) {
        toast.error("Please select at least one reel to monitor");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!commentReplyText.trim()) {
        toast.error("Comment reply text is required");
        return;
      }
      if (!mainDmMessage.trim()) {
        toast.error("Main DM message is required");
        return;
      }
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const saveRule = async (postId: string | null) => {
    const post = media.find((m) => m.id === postId);
    const body = {
      instagram_account_id: account.id,
      name: postId
        ? `Auto-DM: ${post?.caption ? post.caption.substring(0, 30) : postId}`
        : `Auto-Reply: All Reels & Posts`,
      trigger_type: postId ? "specific_post" : "all_posts",
      specific_post_id: postId || null,
      specific_post_thumbnail: post ? (post.thumbnail_url || post.media_url) : null,
      trigger_keywords: keywords.length > 0 ? keywords : ["GUIDE"],
      exclude_keywords: excludeKeywords,
      dm_message_text: mainDmMessage,
      // For normal (no-gate) flow: dm_button_text is the "Send Access" postback label
      dm_button_text: !requireFollow && !emailAsk ? dmButtonLabel : null,
      dm_button_url: !requireFollow && !emailAsk ? (dmButtonUrl || null) : null,
      dm_message_type: "text",
      // New 2-step DM flow fields
      comment_reply_text: commentReplyText,
      initial_dm_message: !requireFollow && !emailAsk ? initialDmMessage : null,
      
      // follow gate settings
      follow_first_enabled: requireFollow,
      follow_first_opening_message: followOpeningMessage,
      follow_first_btn_label: followOpeningBtnLabel,
      follow_check_msg: followCheckMessage,
      follow_check_btn1_label: followCheckBtn1Label,
      follow_check_btn2_label: followCheckBtn2Label,
      
      // email gate settings
      email_ask_enabled: emailAsk,
      email_ask_message: emailAskMessage,
      email_ask_btn_label: emailAskBtnLabel,

      // follow up settings
      follow_up_enabled: enableFollowUp,
      follow_up_hours: 24,
      follow_up_message: followUpMessage,

      is_active: true
    };

    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save rule");
    return data;
  };

  const handleSaveAutomation = async () => {
    setSavingRule(true);
    try {
      const isGlobal = selectedMediaIds.length === media.length;
      const promises = isGlobal
        ? [saveRule(null)]
        : selectedMediaIds.map((id) => saveRule(id));

      await Promise.all(promises);
      toast.success("Automation rule created successfully!");
      router.push("/dashboard/control-post");
    } catch (err: any) {
      toast.error(err.message || "Failed to save automation");
    } finally {
      setSavingRule(false);
    }
  };

  const triggers = [
    {
      id: "comment",
      title: "Keyword in Comment",
      description: "Trigger when someone comments with specific keywords on your posts or reels",
      icon: MessageCircle,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      popular: true,
    },
    {
      id: "dm",
      title: "Keyword in DM",
      description: "Trigger when someone sends you a DM with specific keywords",
      icon: Send,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      id: "story",
      title: "Story Mention",
      description: "Trigger when someone mentions you in their Instagram story",
      icon: AtSign,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "follower",
      title: "New Follower",
      description: "Trigger when someone follows your Instagram account",
      icon: Heart,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      id: "reel",
      title: "Reel Interaction",
      description: "Trigger when someone likes or comments on your reels",
      icon: Film,
      iconColor: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      id: "custom",
      title: "Custom Event",
      description: "Advanced trigger using webhook or custom events",
      icon: Globe,
      iconColor: "text-teal-600",
      bgColor: "bg-teal-50",
    },
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-16">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 pt-8 flex flex-col gap-8">
        
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900">Create New Automation</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Set up your DM automation in a few simple steps
            </p>
          </div>

          <button className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-650 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-50 transition-all self-start md:self-auto">
            <HelpCircle size={14} className="text-slate-400" />
            <span>How it works?</span>
          </button>
        </div>

        {/* ── Steps Progress Indicator ── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.01)]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-4">
            
            {/* Step 1 */}
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0 ${
                step > 1 ? "bg-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.25)]" : "bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
              }`}>
                {step > 1 ? <Check size={14} strokeWidth={3} /> : "1"}
              </div>
              <div className="text-left leading-tight">
                <p className={`text-xs font-extrabold uppercase tracking-wider ${
                  step > 1 ? "text-emerald-600" : "text-blue-600"
                }`}>Trigger</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Choose trigger type</p>
              </div>
            </div>
 
            <div className="hidden lg:block h-px flex-1 bg-slate-100 mx-4" />
 
            {/* Step 2 */}
            <div className={`flex items-center gap-3 ${step === 2 || step > 2 ? "" : "opacity-60"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                step === 2
                  ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
                  : step > 2
                  ? "bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.25)]"
                  : "border-2 border-slate-200 text-slate-500"
              }`}>
                {step > 2 ? <Check size={14} strokeWidth={3} /> : "2"}
              </div>
              <div className="text-left leading-tight">
                <p className={`text-xs font-bold uppercase tracking-wider ${step === 2 ? "text-blue-600" : step > 2 ? "text-emerald-600" : "text-slate-700"}`}>Your Reels</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Select reels to monitor</p>
              </div>
            </div>
 
            <div className="hidden lg:block h-px flex-1 bg-slate-100 mx-4" />
 
            {/* Step 3 */}
            <div className={`flex items-center gap-3 ${step === 3 || step > 3 ? "" : "opacity-60"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step === 3
                  ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
                  : step > 3
                  ? "bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.25)]"
                  : "border-2 border-slate-200 text-slate-500"
              }`}>
                {step > 3 ? <Check size={14} strokeWidth={3} /> : "3"}
              </div>
              <div className="text-left leading-tight">
                <p className={`text-xs font-bold uppercase tracking-wider ${step === 3 ? "text-blue-600" : step > 3 ? "text-emerald-600" : "text-slate-700"}`}>Messages & Actions</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Configure messages & actions</p>
              </div>
            </div>
 
            <div className="hidden lg:block h-px flex-1 bg-slate-100 mx-4" />
 
            {/* Step 4 */}
            <div className={`flex items-center gap-3 ${step === 4 ? "" : "opacity-60"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step === 4
                  ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
                  : "border-2 border-slate-200 text-slate-500"
              }`}>
                4
              </div>
              <div className="text-left leading-tight">
                <p className={`text-xs font-bold uppercase tracking-wider ${step === 4 ? "text-blue-600" : "text-slate-700"}`}>Review</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Review & activate</p>
              </div>
            </div>
 
          </div>
        </div>

        {/* ── STEP 1 CONTENT: CHOOSE TRIGGER ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5 text-left">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Choose Trigger</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Select what will trigger your automation</p>
            </div>

            {/* Trigger Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {triggers.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedTrigger === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedTrigger(item.id)}
                    className={`border rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.01)] relative ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/10 ring-2 ring-blue-500/10"
                        : "border-slate-100 bg-white hover:border-slate-200/80"
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-full ${item.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon size={20} className={item.iconColor} />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-relaxed">
                        {item.description}
                      </p>
                      
                      {item.popular && (
                        <span className="inline-flex items-center gap-1 mt-3 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-blue-100">
                          ★ Most Popular
                        </span>
                      )}
                    </div>

                    <div className="absolute top-5 right-5">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-blue-600" : "border-slate-200"
                      }`}>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Keyword Input — shown for comment trigger */}
            {selectedTrigger === "comment" && (
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.01)] flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Trigger Keywords</h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      Users who comment containing ANY of these keywords will trigger this automation (max 3)
                    </p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    keywords.length >= 3 ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-slate-100 text-slate-500"
                  }`}>
                    {keywords.length}/3
                  </span>
                </div>

                {/* Tag pills + input */}
                <div className="flex flex-wrap items-center gap-2 border border-slate-200 bg-slate-50/50 rounded-2xl px-3.5 py-2.5 min-h-[44px] focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:bg-white transition-all">
                  {keywords.map((kw) => (
                    <span key={kw} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="text-white/70 hover:text-white text-xs leading-none cursor-pointer"
                        aria-label={`Remove keyword ${kw}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {keywords.length < 3 && (
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.endsWith(",")) {
                          addKeyword(val.slice(0, -1));
                        } else {
                          setKeywordInput(val);
                        }
                      }}
                      onKeyDown={handleKeywordKeyDown}
                      onBlur={() => addKeyword(keywordInput)}
                      placeholder={keywords.length === 0 ? "Type keyword, press Enter" : "Add another..."}
                      className="flex-1 min-w-[120px] bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 outline-none py-0.5"
                    />
                  )}
                </div>

                <p className="text-[10px] text-slate-400 font-semibold">
                  💡 Press <kbd className="bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-[9px] font-mono">Enter</kbd> or <kbd className="bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-[9px] font-mono">,</kbd> to add a keyword. Leave empty to match all comments.
                </p>
              </div>
            )}

            {/* Info Bar */}
            <div className="bg-blue-55/60 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
              <Info size={18} className="text-blue-500 shrink-0" />
              <p className="text-xs font-semibold text-blue-800">
                {selectedTrigger === "comment"
                  ? `Automation triggers when a comment contains any of your keywords above.`
                  : "You can set advanced conditions in the next steps."}
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 2 CONTENT: SELECT REELS ── */}
        {step === 2 && (
          <div className="flex flex-col gap-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Your Reels</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Select which reels this automation rule will monitor
                </p>
              </div>

              {account && media.length > 0 && (
                <button
                  onClick={selectAllMedia}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer self-start sm:self-auto"
                >
                  {selectedMediaIds.length === media.length ? "Deselect All" : "Select All Reels"}
                </button>
              )}
            </div>

            {loadingAccount ? (
              <div className="py-16 text-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto" />
              </div>
            ) : account ? (
              /* Connected Layout */
              <div className="flex flex-col gap-5">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0">
                      {account.profile_picture_url ? (
                        <img src={account.profile_picture_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#ec4899] flex items-center justify-center text-white text-xs font-bold">M</div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Connected: @{account.username}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Media feed loaded successfully</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {selectedMediaIds.length} Selected
                  </span>
                </div>

                {loadingMedia ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="aspect-[9/16] rounded-2xl bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : media.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center">
                    <Film className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">No media reels found on this account.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {media.map((item) => {
                      const isSelected = selectedMediaIds.includes(item.id);
                      const thumb = item.thumbnail_url || item.media_url;

                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleMediaSelection(item.id)}
                          className={`group relative aspect-[9/16] rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 ${
                            isSelected
                              ? "border-blue-500 ring-4 ring-blue-500/10 shadow-lg"
                              : "border-slate-200 hover:border-slate-35"
                          }`}
                        >
                          {thumb && (
                            <img
                              src={thumb}
                              alt={item.caption || "Instagram media"}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                          {/* Selected check circle in top right */}
                          <div className="absolute top-2.5 right-2.5 z-10">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                              isSelected ? "bg-blue-600 border-blue-600 text-white" : "bg-black/35 border-white/40 text-transparent"
                            }`}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                          </div>

                          {/* Play button overlay on hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
                              <Play size={14} className="text-white fill-white ml-0.5" />
                            </div>
                          </div>

                          {/* Caption footer */}
                          {item.caption && (
                            <div className="absolute bottom-2 left-2.5 right-2.5">
                              <p className="text-[10px] text-white/90 line-clamp-2 leading-snug font-semibold text-left">
                                {item.caption}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Disconnected Layout */
              <div className="bg-white rounded-2xl border border-slate-100 p-16 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col items-center gap-6 text-center max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <Film size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Instagram Account Connected</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Connect your Instagram Business Account to fetch and select your reels for automation.
                  </p>
                </div>
                <button
                  onClick={() => (window.location.href = "/api/auth/instagram/link")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e84c9f] via-[#b656e3] to-[#5a60f6] text-white text-[13px] font-bold rounded-full shadow-[0_8px_20px_-4px_rgba(182,86,227,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  Connect Instagram Account
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3 CONTENT: CONFIGURE MESSAGES ── */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Cards Config (Left 3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <div className="mb-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles size={20} className="text-blue-600" />
                  <span>Configure Messages & Gates</span>
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Define replies, entry gates (following/email requirements), and payload messages.
                </p>
              </div>

              {/* Card 1: Comment Reply */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <MessageCircle size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 flex flex-col gap-3.5">
                  <div>
                    <h4 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Public Comment Reply</h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-relaxed">
                      We'll automatically post this reply to users who comment on your monitored reels.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={commentReplyText}
                    onChange={(e) => setCommentReplyText(e.target.value)}
                    placeholder="e.g. Thanks for the comment! Check your DMs 📩"
                    className="border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/40 focus:bg-white transition-all w-full shadow-inner"
                  />
                </div>
              </div>

              {/* Card 2: Require Follow First Gate */}
              <div className={`bg-white border rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300 ${
                requireFollow ? "border-pink-200 ring-2 ring-pink-500/5 bg-gradient-to-b from-white to-pink-50/5" : "border-slate-100"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                      requireFollow ? "bg-pink-50 border-pink-100 text-pink-600" : "bg-slate-50 border-slate-100 text-slate-400"
                    }`}>
                      <Heart size={20} className={requireFollow ? "text-pink-600" : "text-slate-400"} fill={requireFollow ? "currentColor" : "none"} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                        <span>Require Follow First</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-black uppercase tracking-wider">Follow Gate</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-relaxed">
                        Verify users follow your account before they receive the DM payload.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const nextVal = !requireFollow;
                      setRequireFollow(nextVal);
                      setSimStep("step1");
                    }}
                    className={`w-12 h-6.5 rounded-full relative transition-all duration-300 outline-none shrink-0 cursor-pointer ${
                      requireFollow ? "bg-pink-550 shadow-[0_3px_10px_rgba(236,72,153,0.3)]" : "bg-slate-200"
                    }`}
                  >
                    <span className={`w-5 h-5 bg-white rounded-full absolute top-[3px] transition-all duration-300 shadow-md ${
                      requireFollow ? "left-[25px]" : "left-[3px]"
                    }`} />
                  </button>
                </div>

                {requireFollow && (
                  <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-4 pl-1 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-pink-50/50 border border-pink-100/60 p-4 rounded-2xl text-[11px] text-pink-700 leading-relaxed font-semibold">
                      💡 <strong>Smart Gate Flow:</strong> User comments → Opener DM asking to follow → Clicking check verification checks status → If true, proceeds (or checks Email gate if enabled).
                    </div>
                    
                    {/* Opener message */}
                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30 flex flex-col gap-3.5">
                      <p className="text-[10px] font-black uppercase text-pink-600 tracking-widest">Opener DM Message</p>
                      
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-slate-500 font-bold">Opening Message Text *</span>
                        <textarea
                          value={followOpeningMessage}
                          onChange={(e) => setFollowOpeningMessage(e.target.value)}
                          rows={3}
                          className="border border-slate-200 bg-white rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-pink-500/5 focus:border-pink-500/40 transition-all resize-none w-full shadow-inner"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-slate-500 font-bold">Verification Button Label *</span>
                        <input
                          type="text"
                          value={followOpeningBtnLabel}
                          onChange={(e) => setFollowOpeningBtnLabel(e.target.value)}
                          className="border border-slate-200 bg-white rounded-2xl px-4.5 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-pink-500/5 focus:border-pink-500/40 transition-all w-full shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Follow Check Message */}
                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30 flex flex-col gap-3.5">
                      <p className="text-[10px] font-black uppercase text-pink-600 tracking-widest">Follow Check Reminder</p>
                      
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-slate-500 font-bold">Reminder Message (if not following) *</span>
                        <textarea
                          value={followCheckMessage}
                          onChange={(e) => setFollowCheckMessage(e.target.value)}
                          rows={3}
                          className="border border-slate-200 bg-white rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-pink-500/5 focus:border-pink-500/40 transition-all resize-none w-full shadow-inner"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] text-slate-550 font-bold">Button 1 Label *</span>
                          <input
                            type="text"
                            value={followCheckBtn1Label}
                            onChange={(e) => setFollowCheckBtn1Label(e.target.value)}
                            className="border border-slate-200 bg-white rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-pink-500/5 focus:border-pink-500/40 transition-all w-full shadow-inner"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] text-slate-550 font-bold">Button 2 Label *</span>
                          <input
                            type="text"
                            value={followCheckBtn2Label}
                            onChange={(e) => setFollowCheckBtn2Label(e.target.value)}
                            className="border border-slate-200 bg-white rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-pink-500/5 focus:border-pink-500/40 transition-all w-full shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Collect Email First Gate */}
              <div className={`bg-white border rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300 ${
                emailAsk ? "border-indigo-200 ring-2 ring-indigo-500/5 bg-gradient-to-b from-white to-indigo-50/5" : "border-slate-100"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                      emailAsk ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-100 text-slate-400"
                    }`}>
                      <AtSign size={20} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                        <span>Collect Email First</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-black uppercase tracking-wider">Email Gate</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-relaxed">
                        Collect lead emails via a branded landing page before delivering the guide.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const nextVal = !emailAsk;
                      setEmailAsk(nextVal);
                      setSimStep("step1");
                    }}
                    className={`w-12 h-6.5 rounded-full relative transition-all duration-300 outline-none shrink-0 cursor-pointer ${
                      emailAsk ? "bg-indigo-550 shadow-[0_3px_10px_rgba(99,102,241,0.3)]" : "bg-slate-200"
                    }`}
                  >
                    <span className={`w-5 h-5 bg-white rounded-full absolute top-[3px] transition-all duration-300 shadow-md ${
                      emailAsk ? "left-[25px]" : "left-[3px]"
                    }`} />
                  </button>
                </div>

                {emailAsk && (
                  <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-4 pl-1 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-indigo-50/50 border border-indigo-100/60 p-4 rounded-2xl text-[11px] text-indigo-700 leading-relaxed font-semibold">
                      📧 <strong>Email Gate Flow:</strong> System sends DM with a unique secure collection link → User enters email on branded page → Main payload is unlocked and sent.
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] text-slate-550 font-bold">DM Message containing Link *</span>
                      <textarea
                        value={emailAskMessage}
                        onChange={(e) => setEmailAskMessage(e.target.value)}
                        rows={3}
                        className="border border-slate-200 bg-white rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/40 transition-all resize-none w-full shadow-inner"
                        placeholder="Use {link} variable to specify where the collect-email link will be inserted"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] text-slate-550 font-bold">Button Label in DM *</span>
                      <input
                        type="text"
                        value={emailAskBtnLabel}
                        onChange={(e) => setEmailAskBtnLabel(e.target.value)}
                        className="border border-slate-200 bg-white rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/40 transition-all w-full shadow-inner"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Card 4: Initial DM Message (shown only when no gates active) */}
              {!requireFollow && !emailAsk && (
                <div className="bg-white border border-emerald-100 ring-2 ring-emerald-500/5 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Bot size={20} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 flex flex-col gap-3.5">
                    <div>
                      <h4 className="text-[13px] font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                        Initial DM Message
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-black uppercase tracking-wider">Step 1 of 2</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-relaxed">
                        This greeting DM is sent first with a button. When the user clicks the button, the main message is delivered.
                      </p>
                    </div>

                    {/* Initial DM text */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] text-slate-550 font-bold">Greeting Message Text *</span>
                      <textarea
                        value={initialDmMessage}
                        onChange={(e) => setInitialDmMessage(e.target.value)}
                        rows={3}
                        placeholder="e.g. Thanks for commenting! Tap below and I'll send you the access instantly 🚀"
                        className="border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/40 focus:bg-white transition-all resize-none w-full shadow-inner"
                      />
                    </div>

                    {/* Button config */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-slate-550 font-bold">Access Button Label *</span>
                        <input
                          type="text"
                          value={dmButtonLabel}
                          onChange={(e) => setDmButtonLabel(e.target.value)}
                          placeholder="e.g. Send Access"
                          className="border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/40 focus:bg-white transition-all w-full shadow-inner"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-slate-555 font-bold">Optional Redirect URL</span>
                        <input
                          type="text"
                          value={dmButtonUrl}
                          onChange={(e) => setDmButtonUrl(e.target.value)}
                          placeholder="Optional: e.g. https://example.com"
                          className="border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/40 focus:bg-white transition-all w-full shadow-inner"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-semibold bg-emerald-50/60 border border-emerald-100/60 rounded-xl px-3 py-2">
                      💡 When user clicks <strong>"{dmButtonLabel || "Send Access"}"</strong>, the main DM payload below is delivered instantly.
                    </p>
                  </div>
                </div>
              )}

              {/* Card 5: Main DM Message */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                  <Send size={20} className="text-purple-600" />
                </div>
                <div className="flex-1 flex flex-col gap-3.5">
                  <div>
                    <h4 className="text-[13px] font-extrabold text-slate-900 tracking-tight">
                      {requireFollow || emailAsk ? "Main DM Message (Payload)" : "DM Message Text"}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-relaxed">
                      The final message containing your links/files, delivered after they complete the step.
                    </p>
                  </div>
                  <textarea
                    value={mainDmMessage}
                    onChange={(e) => setMainDmMessage(e.target.value)}
                    placeholder="Type your main response containing details or files..."
                    rows={4}
                    className="border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/40 focus:bg-white transition-all resize-none w-full shadow-inner"
                  />
                </div>
              </div>

            </div>

            {/* Chat Simulator Preview (Right 2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interactive Live Preview</span>
                {simStep !== "step1" && (
                  <button
                    onClick={() => setSimStep("step1")}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Reset Demo
                  </button>
                )}
              </div>
              
              {/* Phone Container */}
              <div className="border border-slate-250 bg-slate-900 rounded-[32px] p-3 shadow-xl max-w-sm mx-auto w-full aspect-[9/18] flex flex-col select-none">
                <div className="w-full bg-slate-900 h-full rounded-[24px] overflow-hidden flex flex-col relative text-white text-[11px] font-sans pb-3">
                  
                  {/* Status Bar Mock */}
                  <div className="flex justify-between items-center px-6 py-2 bg-slate-900 shrink-0">
                    <span className="font-bold text-[10px]">9:41</span>
                    <div className="w-16 h-4 bg-black rounded-full shrink-0" />
                    <span className="font-bold text-[10px]">Active</span>
                  </div>

                  {/* Chat Header */}
                  <div className="border-b border-slate-800 px-4 py-2 flex items-center gap-2 bg-slate-900 shrink-0">
                    <div className="w-6 h-6 rounded-full bg-slate-750 flex items-center justify-center text-[10px] font-bold">C</div>
                    <div>
                      <p className="font-bold leading-none">Creator Account</p>
                      <p className="text-[8px] text-slate-505 mt-0.5 leading-none">Instagram</p>
                    </div>
                  </div>

                  {/* Chat Messages Body */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-950">
                    
                    {/* User comment mock */}
                    <div className="flex flex-col gap-1 items-end self-end max-w-[75%] animate-in fade-in duration-300">
                      <div className="bg-slate-850 text-white rounded-2xl rounded-tr-none px-3.5 py-2">
                        giveaway
                      </div>
                      <span className="text-[8px] text-slate-650 mr-1 font-semibold">User Comment</span>
                    </div>

                    {/* Comment Reply mock */}
                    <div className="flex flex-col gap-1 items-start self-start max-w-[75%] animate-in fade-in duration-500 delay-150">
                      <div className="bg-blue-600/10 border border-blue-900/25 text-blue-300 rounded-2xl rounded-tl-none px-3.5 py-2 italic">
                        "{commentReplyText || "Thanks for commenting!"}"
                      </div>
                      <span className="text-[8px] text-slate-650 ml-1 font-semibold">Public Reply</span>
                    </div>

                    {/* DM flows */}
                    {/* DM flows */}
                    {requireFollow && emailAsk ? (
                      /* Both gates enabled */
                      <>
                        <div className="flex flex-col gap-2 items-start self-start max-w-[85%] animate-in fade-in duration-500 delay-300">
                          <div className="bg-slate-900 border border-slate-850 text-white rounded-2xl rounded-tl-none p-3.5 flex flex-col gap-3 shadow-md w-full">
                            <p className="leading-relaxed text-slate-200 whitespace-pre-line">{followOpeningMessage}</p>
                            {simStep === "step1" ? (
                              <button
                                onClick={() => setSimStep("step2")}
                                className="w-full text-center font-bold py-2 bg-pink-650 hover:bg-pink-700 text-white rounded-xl transition-all text-[10.5px] cursor-pointer relative shadow-md shadow-pink-500/15"
                              >
                                {followOpeningBtnLabel}
                              </button>
                            ) : (
                              <div className="w-full text-center font-bold py-2 bg-slate-800 text-slate-500 rounded-xl text-[10.5px]">
                                {followOpeningBtnLabel}
                              </div>
                            )}
                          </div>
                          <span className="text-[8px] text-slate-650 ml-1 font-semibold">Initial DM Gate Request</span>
                        </div>

                        {simStep !== "step1" && (
                          <div className="flex flex-col gap-2 items-start self-start max-w-[85%] animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-850 text-white rounded-2xl rounded-tl-none p-3.5 flex flex-col gap-2.5 shadow-md w-full">
                              <p className="leading-relaxed text-slate-200 whitespace-pre-line">{followCheckMessage}</p>
                              <div className="flex flex-col gap-2 w-full">
                                <div className="w-full text-center font-bold py-1.5 border border-slate-700 text-slate-300 rounded-xl text-[10px]">
                                  {followCheckBtn1Label}
                                </div>
                                {simStep === "step2" ? (
                                  <button
                                    onClick={() => setSimStep("step3")}
                                    className="w-full text-center font-bold py-1.5 bg-pink-650 hover:bg-pink-700 text-white rounded-xl transition-all text-[10px] cursor-pointer relative"
                                  >
                                    {followCheckBtn2Label}
                                  </button>
                                ) : (
                                  <div className="w-full text-center font-bold py-1.5 bg-slate-800 text-slate-500 rounded-xl text-[10px]">
                                    {followCheckBtn2Label}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-[8px] text-slate-650 ml-1 font-semibold">Follow Gate Verification</span>
                          </div>
                        )}

                        {(simStep === "step3" || simStep === "step4" || simStep === "step5") && (
                          <div className="flex flex-col gap-2 items-start self-start max-w-[85%] animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-850 text-white rounded-2xl rounded-tl-none p-3.5 flex flex-col gap-3 shadow-md w-full">
                              <p className="leading-relaxed text-slate-200 whitespace-pre-line">
                                {emailAskMessage.replace("{link}", "[Branded collection form URL]")}
                              </p>
                              {simStep === "step3" ? (
                                <button
                                  onClick={() => setSimStep("step4")}
                                  className="w-full text-center font-bold py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-[10.5px] cursor-pointer relative shadow-md shadow-indigo-500/15"
                                >
                                  {emailAskBtnLabel}
                                </button>
                              ) : (
                                <div className="w-full text-center font-bold py-2 bg-slate-800 text-slate-500 rounded-xl text-[10.5px]">
                                  {emailAskBtnLabel}
                                </div>
                              )}
                            </div>
                            <span className="text-[8px] text-slate-650 ml-1 font-semibold">Email Collection Gate</span>
                          </div>
                        )}

                        {(simStep === "step4" || simStep === "step5") && (
                          <div className="flex flex-col gap-1 items-start self-start max-w-[75%] animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-850 text-slate-200 rounded-2xl rounded-tl-none px-3.5 py-2.5 shadow-md">
                              {mainDmMessage}
                            </div>
                            <span className="text-[8px] text-slate-650 ml-1 font-semibold">Main Payload Delivered</span>
                          </div>
                        )}
                      </>
                    ) : requireFollow ? (
                      /* Follow Gate Flow Simulator only */
                      <>
                        <div className="flex flex-col gap-2 items-start self-start max-w-[85%] animate-in fade-in duration-500 delay-300">
                          <div className="bg-slate-900 border border-slate-850 text-white rounded-2xl rounded-tl-none p-3.5 flex flex-col gap-3 shadow-md w-full">
                            <p className="leading-relaxed text-slate-200 whitespace-pre-line">{followOpeningMessage}</p>
                            
                            {simStep === "step1" ? (
                              <button
                                onClick={() => setSimStep("step2")}
                                className="w-full text-center font-bold py-2 bg-pink-650 hover:bg-pink-700 text-white rounded-xl transition-all text-[10.5px] cursor-pointer relative shadow-md shadow-pink-500/15"
                              >
                                {followOpeningBtnLabel}
                              </button>
                            ) : (
                              <div className="w-full text-center font-bold py-2 bg-slate-800 text-slate-500 rounded-xl text-[10.5px]">
                                {followOpeningBtnLabel}
                              </div>
                            )}
                          </div>
                          <span className="text-[8px] text-slate-650 ml-1 font-semibold">Initial DM Gate Request</span>
                        </div>

                        {simStep !== "step1" && (
                          <div className="flex flex-col gap-2 items-start self-start max-w-[85%] animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-850 text-white rounded-2xl rounded-tl-none p-3.5 flex flex-col gap-2.5 shadow-md w-full">
                              <p className="leading-relaxed text-slate-200 whitespace-pre-line">{followCheckMessage}</p>
                              
                              <div className="flex flex-col gap-2 w-full">
                                <div className="w-full text-center font-bold py-1.5 border border-slate-700 text-slate-300 rounded-xl text-[10px]">
                                  {followCheckBtn1Label}
                                </div>
                                
                                {simStep === "step2" ? (
                                  <button
                                    onClick={() => setSimStep("step3")}
                                    className="w-full text-center font-bold py-1.5 bg-pink-650 hover:bg-pink-700 text-white rounded-xl transition-all text-[10px] cursor-pointer relative"
                                  >
                                    {followCheckBtn2Label}
                                  </button>
                                ) : (
                                  <div className="w-full text-center font-bold py-1.5 bg-slate-800 text-slate-500 rounded-xl text-[10px]">
                                    {followCheckBtn2Label}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-[8px] text-slate-650 ml-1 font-semibold">Follow Gate Verification</span>
                          </div>
                        )}

                        {(simStep === "step3" || simStep === "step4" || simStep === "step5") && (
                          <div className="flex flex-col gap-1 items-start self-start max-w-[75%] animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-850 text-slate-200 rounded-2xl rounded-tl-none px-3.5 py-2.5 shadow-md">
                              {mainDmMessage}
                            </div>
                            <span className="text-[8px] text-slate-650 ml-1 font-semibold">Main Payload Delivered</span>
                          </div>
                        )}
                      </>
                    ) : emailAsk ? (
                      /* Email Gate Flow Simulator only */
                      <>
                        <div className="flex flex-col gap-2 items-start self-start max-w-[85%] animate-in fade-in duration-500 delay-300">
                          <div className="bg-slate-900 border border-slate-850 text-white rounded-2xl rounded-tl-none p-3.5 flex flex-col gap-3 shadow-md w-full">
                            <p className="leading-relaxed text-slate-200 whitespace-pre-line">
                              {emailAskMessage.replace("{link}", "[Branded collection form URL]")}
                            </p>
                            
                            {simStep === "step1" ? (
                              <button
                                onClick={() => setSimStep("step2")}
                                className="w-full text-center font-bold py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-[10.5px] cursor-pointer relative shadow-md shadow-indigo-500/15"
                              >
                                {emailAskBtnLabel}
                              </button>
                            ) : (
                              <div className="w-full text-center font-bold py-2 bg-slate-800 text-slate-500 rounded-xl text-[10.5px]">
                                {emailAskBtnLabel}
                              </div>
                            )}
                          </div>
                          <span className="text-[8px] text-slate-650 ml-1 font-semibold">Email Collection Gate</span>
                        </div>

                        {simStep !== "step1" && (
                          <div className="flex flex-col gap-1 items-start self-start max-w-[75%] animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-850 text-slate-200 rounded-2xl rounded-tl-none px-3.5 py-2.5 shadow-md">
                              {mainDmMessage}
                            </div>
                            <span className="text-[8px] text-slate-650 ml-1 font-semibold">Main Payload Delivered</span>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Normal Flow Simulator */
                      <>
                        <div className="flex flex-col gap-2 items-start self-start max-w-[85%] animate-in fade-in duration-500 delay-300">
                          <div className="bg-slate-900 border border-slate-850 text-white rounded-2xl rounded-tl-none p-3.5 flex flex-col gap-3 shadow-md w-full">
                            <p className="leading-relaxed text-slate-200">
                              {initialDmMessage || "Thanks for commenting! Tap below and I'll send you the access instantly 🚀"}
                            </p>
                            
                            {simStep === "step1" ? (
                              <button
                                onClick={() => setSimStep("step2")}
                                className="w-full text-center font-bold py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-[10.5px] cursor-pointer relative shadow-md shadow-blue-500/15"
                              >
                                {dmButtonLabel || "Send Access"}
                              </button>
                            ) : (
                              <div className="w-full text-center font-bold py-2 bg-slate-800 text-slate-500 rounded-xl text-[10.5px]">
                                {dmButtonLabel || "Send Access"}
                              </div>
                            )}
                          </div>
                          <span className="text-[8px] text-slate-650 ml-1 font-semibold">Initial DM Greeting</span>
                        </div>

                        {simStep !== "step1" && (
                          <div className="flex flex-col gap-1 items-start self-start max-w-[75%] animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className="bg-slate-900 border border-slate-850 text-slate-200 rounded-2xl rounded-tl-none px-3.5 py-2.5 shadow-md">
                              {mainDmMessage}
                            </div>
                            <span className="text-[8px] text-slate-650 ml-1 font-semibold">Main Payload Delivered</span>
                          </div>
                        )}
                      </>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4 CONTENT: REVIEW & SAVE ── */}
        {step === 4 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.01)] text-left max-w-2xl mx-auto flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight">Review & Activate</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Review the configuration of your new automation rule</p>
            </div>

            <div className="space-y-6 text-xs text-slate-750">
              
              {/* Step 1 Review */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100/60 text-left">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-extrabold">1</span>
                  <span className="font-extrabold text-slate-900 text-xs">Step 1: Selected Trigger</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-blue-50/60 flex items-center justify-center shrink-0 border border-blue-100/30">
                    {(() => {
                      const triggerObj = triggers.find((t) => t.id === selectedTrigger);
                      const Icon = triggerObj?.icon || MessageCircle;
                      return <Icon className="text-blue-600" size={18} />;
                    })()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {triggers.find((t) => t.id === selectedTrigger)?.title || "Keyword in Comment"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {triggers.find((t) => t.id === selectedTrigger)?.description || "Trigger when someone comments on your posts"}
                    </p>
                  </div>
                </div>

                {selectedTrigger === "comment" && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 bg-white border border-slate-100 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold mr-1 uppercase tracking-wider">Trigger Keywords:</span>
                    {keywords.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic font-semibold">Any comment (empty match)</span>
                    ) : (
                      keywords.map((kw, i) => (
                        <span key={i} className="text-[10px] font-extrabold bg-blue-50 border border-blue-100/50 text-blue-600 px-2 py-0.5 rounded-lg">
                          {kw}
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Step 2 Review */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100/60 text-left">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-extrabold">2</span>
                  <span className="font-extrabold text-slate-900 text-xs">Step 2: Monitored Reels</span>
                </div>
                
                {selectedMediaIds.length === media.length || selectedMediaIds.length === 0 ? (
                  <div className="flex items-center gap-3 bg-white border border-slate-100/80 p-3.5 rounded-xl text-left">
                    <Film className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">All Reels & Posts</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Monitoring all reels and posts on this account</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-left">
                    <p className="text-[11px] text-slate-500 font-semibold mb-2">
                      Monitoring <span className="text-slate-900 font-extrabold">{selectedMediaIds.length}</span> selected {selectedMediaIds.length === 1 ? "reel/post" : "reels/posts"}:
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-2 bg-white border border-slate-100 p-3.5 rounded-2xl max-h-40 overflow-y-auto">
                      {media.filter((m) => selectedMediaIds.includes(m.id)).map((item) => {
                        const thumb = item.thumbnail_url || item.media_url;
                        return (
                          <div key={item.id} className="relative aspect-[9/16] rounded-xl overflow-hidden border border-slate-200 shadow-sm group bg-slate-50 shrink-0">
                            {thumb && (
                              <img src={thumb} className="absolute inset-0 w-full h-full object-cover" alt="monitored reel" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            {item.caption && (
                              <div className="absolute bottom-1 left-1.5 right-1.5">
                                <p className="text-[7.5px] text-white font-semibold line-clamp-2 leading-tight">{item.caption}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3 Review */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100/60 text-left">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-extrabold">3</span>
                  <span className="font-extrabold text-slate-900 text-xs">Step 3: Messages & Gates</span>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start bg-white border border-slate-100/80 p-3.5 rounded-xl text-left">
                    <div className="flex flex-col gap-0.5 pr-2">
                      <span className="text-slate-400 font-bold">Comment Reply</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Sent publicly in the comments</span>
                    </div>
                    <span className="text-slate-800 max-w-[320px] text-right italic font-normal bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl leading-relaxed text-xs">
                      "{commentReplyText}"
                    </span>
                  </div>

                  {!requireFollow && !emailAsk && (
                    <>
                      <div className="flex justify-between items-start bg-white border border-slate-100/80 p-3.5 rounded-xl text-left">
                        <div className="flex flex-col gap-0.5 pr-2">
                          <span className="text-slate-400 font-bold">Initial DM Message</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Greeting sent with access button</span>
                        </div>
                        <span className="text-slate-800 max-w-[320px] text-right italic font-normal bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl leading-relaxed text-xs">
                          "{initialDmMessage || "Thanks for commenting! Tap below and I'll send you the access instantly 🚀"}"
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-white border border-slate-100/80 p-3.5 rounded-xl text-left">
                        <div className="flex flex-col gap-0.5 pr-2">
                          <span className="text-slate-400 font-bold">DM Button Label</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Interactive button in greeting DM</span>
                        </div>
                        <span className="text-slate-800 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl text-xs">
                          {dmButtonLabel || "Send Access"}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-start bg-white border border-slate-100/80 p-3.5 rounded-xl text-left">
                    <div className="flex flex-col gap-0.5 pr-2">
                      <span className="text-slate-400 font-bold">Main Message Payload</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Delivered in direct message</span>
                    </div>
                    <span className="text-slate-800 max-w-[320px] text-right font-medium bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl leading-relaxed whitespace-pre-wrap text-xs">
                      {mainDmMessage}
                    </span>
                  </div>

                  {/* Gates Summary */}
                  <div className="flex justify-between items-center bg-white border border-slate-100/80 p-3.5 rounded-xl text-left">
                    <div className="flex flex-col gap-0.5 pr-2">
                      <span className="text-slate-400 font-bold">Security Gates</span>
                      <span className="text-[10px] text-slate-400 font-semibold">User requirements before unlock</span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold border ${
                        requireFollow ? "bg-pink-50 text-pink-700 border-pink-100" : "bg-slate-50 text-slate-400 border-slate-100"
                      }`}>
                        {requireFollow ? "Follow Gate: Active" : "Follow Gate: Off"}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold border ${
                        emailAsk ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-slate-50 text-slate-400 border-slate-100"
                      }`}>
                        {emailAsk ? "Email Gate: Active" : "Email Gate: Off"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="h-px bg-slate-100 w-full my-1" />

            <button
              onClick={handleSaveAutomation}
              disabled={savingRule}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 transition-all disabled:opacity-50 cursor-pointer"
            >
              {savingRule ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Creating Automation...</span>
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={3} />
                  <span>Save & Activate Rule</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Footer Actions ── */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-2">
          {step < 4 && (
            <>
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 hover:text-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>{step === 1 ? "Cancel" : "Back"}</span>
              </button>
              
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <span>Next Step</span>
                <ArrowRight size={14} />
              </button>
            </>
          )}

          {step === 4 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 hover:text-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer mr-auto"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
