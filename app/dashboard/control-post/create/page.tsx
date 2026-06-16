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
  X,
  ChevronUp,
  ChevronDown,
  Pencil,
  CornerDownRight,
  Trash2,
  Maximize2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreateAutomationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTrigger, setSelectedTrigger] = useState("comment");
  const [commentTargetMode, setCommentTargetMode] = useState<"specific" | "any" | "next">("specific");

  const isReviewStep = selectedTrigger === "comment" ? step === 5 : step === 4;

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
  const [keywordMode, setKeywordMode] = useState<string>("any_comment");
  const [excludeKeywordInput, setExcludeKeywordInput] = useState("");
  const [autoCommentReply, setAutoCommentReply] = useState(true);
  const [showMatchModeSettings, setShowMatchModeSettings] = useState(false);
  const [showExcludeKeywordsInput, setShowExcludeKeywordsInput] = useState(false);
  const [dmType, setDmType] = useState("text_button");
  const [showButtonFields, setShowButtonFields] = useState(true);
  const [showReferralPromo, setShowReferralPromo] = useState(true);
  const [followGateCollapsed, setFollowGateCollapsed] = useState(false);
  const [retryAction, setRetryAction] = useState("send_anyway");

  // Step 3: Messages State
  const [commentReplyText, setCommentReplyText] = useState("Thanks for the comment! Check your DMs 📩");
  const [commentReplyTexts, setCommentReplyTexts] = useState<string[]>([
    "Thanks for the comment! Check your DMs 📩"
  ]);
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

  const addExcludeKeyword = (raw: string) => {
    const kw = raw.trim().replace(/,+$/, "").trim();
    if (!kw) return;
    if (excludeKeywords.length >= 3) return;
    if (excludeKeywords.map((k) => k.toLowerCase()).includes(kw.toLowerCase())) return;
    setExcludeKeywords((prev) => [...prev, kw]);
    setExcludeKeywordInput("");
  };

  const removeExcludeKeyword = (kw: string) => {
    setExcludeKeywords((prev) => prev.filter((k) => k !== kw));
  };

  useEffect(() => {
    const savedActiveId = typeof window !== "undefined" ? localStorage.getItem("active_instagram_account_id") : null;
    const url = savedActiveId ? `/api/instagram/account?accountId=${encodeURIComponent(savedActiveId)}` : "/api/instagram/account";
    fetch(url)
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
      if (commentTargetMode === "specific" && selectedMediaIds.length === 0) {
        toast.error("Please select at least one reel to monitor");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (selectedTrigger === "comment") {
        if (keywordMode !== "any_comment" && keywords.length === 0) {
          toast.error("Please add at least one trigger keyword or select 'Any comment'");
          return;
        }
        if (autoCommentReply && commentReplyTexts.filter(t => t.trim()).length === 0) {
          toast.error("At least one comment reply message is required");
          return;
        }
        setStep(4);
      } else {
        // Non-comment trigger: this is the Primary DM & Gates step
        if (!mainDmMessage.trim()) {
          toast.error("Main DM message is required");
          return;
        }
        if (dmType === "text_button" && (!dmButtonLabel.trim() || !dmButtonUrl.trim())) {
          toast.error("Button label and redirect URL are required for Text + Button type");
          return;
        }
        if (enableFollowUp && !followUpMessage.trim()) {
          toast.error("Follow-up message text is required");
          return;
        }
        setStep(4); // Review step for non-comment
      }
    } else if (step === 4 && selectedTrigger === "comment") {
      // Comment trigger: this is the Primary DM & Gates step
      if (!mainDmMessage.trim()) {
        toast.error("Main DM message is required");
        return;
      }
      if (dmType === "text_button" && (!dmButtonLabel.trim() || !dmButtonUrl.trim())) {
        toast.error("Button label and redirect URL are required for Text + Button type");
        return;
      }
      if (enableFollowUp && !followUpMessage.trim()) {
        toast.error("Follow-up message text is required");
        return;
      }
      setStep(5); // Review step for comment
    }
  };

  const handleBack = () => {
    if (isReviewStep) {
      setStep(selectedTrigger === "comment" ? 4 : 3);
    } else if (step > 1) {
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
      trigger_keywords: keywordMode === "any_comment" ? [] : (keywords.length > 0 ? keywords : []),
      exclude_keywords: keywordMode === "any_comment" ? [] : excludeKeywords,
      keyword_mode: keywordMode,
      dm_message_text: mainDmMessage,
      // For normal (no-gate) flow: dm_button_text is the "Send Access" postback label
      dm_button_text: !requireFollow && !emailAsk && dmType === "text_button" ? dmButtonLabel : null,
      dm_button_url: !requireFollow && !emailAsk && dmType === "text_button" ? (dmButtonUrl || null) : null,
      dm_message_type: dmType === "text_button" ? "text" : "text_only",
      // New 2-step DM flow fields
      comment_reply_text: autoCommentReply ? commentReplyTexts.filter(t => t.trim()).join("||") : null,
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
      const isGlobal = commentTargetMode === "any" || commentTargetMode === "next" || selectedMediaIds.length === media.length || selectedMediaIds.length === 0;
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
      title: "Comments on your Post or Reel",
      icon: MessageCircle,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      id: "dm",
      title: "Sends you a DM",
      icon: Send,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "story",
      title: "Replies to your Story",
      icon: AtSign,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "live",
      title: "Comments on your Live",
      icon: Zap,
      iconColor: "text-rose-600",
      bgColor: "bg-rose-50",
      comingSoon: true,
    },
    {
      id: "dm_post",
      title: "DMs your Post or Reel",
      icon: LinkIcon,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      comingSoon: true,
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



        {/* ── STEP 1 CONTENT: CHOOSE TRIGGER ── */}
        {step === 1 && (
          <div className="flex flex-col gap-6 text-left">
            <div className="bg-white border border-slate-150 rounded-[28px] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] max-w-lg mx-auto w-full relative animate-in fade-in duration-300">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">Trigger AutoDM when someone...</span>
                <button
                  onClick={() => router.push("/dashboard/control-post")}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {/* List */}
              <div className="flex flex-col gap-3">
                {triggers.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedTrigger === item.id;
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.comingSoon) {
                          toast.info("This trigger will be available soon!");
                          return;
                        }
                        setSelectedTrigger(item.id);
                      }}
                      className={`border rounded-[18px] p-4 flex items-center justify-between gap-4 transition-all duration-200 select-none ${
                        item.comingSoon
                          ? "opacity-50 cursor-not-allowed bg-slate-50/50 border-slate-100"
                          : "cursor-pointer"
                      } ${
                        isSelected && !item.comingSoon
                          ? "border-blue-500 bg-blue-50/10 ring-1 ring-blue-500/10"
                          : "border-slate-100 bg-white hover:border-slate-200/80 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-full ${item.bgColor} flex items-center justify-center shrink-0`}>
                          <Icon size={16} className={item.iconColor} />
                        </div>
                        <span className={`text-xs font-bold ${
                          isSelected && !item.comingSoon ? "text-blue-600 font-extrabold" : "text-slate-700"
                        }`}>
                          {item.title}
                        </span>
                      </div>
                      
                      {item.comingSoon ? (
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Soon
                        </span>
                      ) : (
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 text-transparent"
                        }`}>
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Card Footer */}
              <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">
                  {selectedTrigger === "comment" ? "Step 1 of 5" : "Step 1 of 4"}
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleBack}
                    className="px-5 py-2 border border-slate-200 hover:bg-slate-55 rounded-full text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-full text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── STEP 2 CONTENT: SELECT REELS ── */}
        {step === 2 && (
          <div className="bg-white border border-slate-150 rounded-[28px] p-0 shadow-[0_12px_40px_rgba(0,0,0,0.035)] max-w-md mx-auto w-full relative flex flex-col h-[640px] overflow-hidden animate-in fade-in duration-300">
            
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 px-6 pt-6 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Film size={16} />
                </div>
                <span className="font-extrabold text-slate-800 text-xs">When someone comments on your Post/Reel</span>
              </div>
              <button
                onClick={() => router.push("/dashboard/control-post")}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Card Body - Scrollable content area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5 scrollbar-thin">
              
              {loadingAccount ? (
                <div className="py-16 text-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto" />
                </div>
              ) : account ? (
                <>
                  {/* Profile Section */}
                  <div className="flex flex-col items-center gap-1 my-1">
                    <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600">
                      <div className="w-full h-full rounded-full bg-white p-[2px]">
                        {account.profile_picture_url ? (
                          <img src={account.profile_picture_url} className="w-full h-full rounded-full object-cover" alt="profile" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#ec4899] flex items-center justify-center text-white text-base font-bold">
                            {account.username?.[0]?.toUpperCase() || "M"}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-extrabold text-slate-800 text-xs mt-1">@{account.username}</span>
                    <button
                      onClick={() => (window.location.href = "/api/auth/instagram/link")}
                      className="text-[10px] font-bold text-blue-650 hover:underline transition-colors mt-0.5"
                    >
                      Switch account
                    </button>
                  </div>

                  {/* Comment Target Selector */}
                  <div className="flex flex-col gap-2.5">
                    <p className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wider text-slate-400 text-left">The Comment is on...</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "specific", label: "Specific Post/Reel" },
                        { id: "any", label: "Any Post/Reel" },
                        { id: "next", label: "Next Post/Reel" }
                      ].map((option) => {
                        const isSelected = commentTargetMode === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setCommentTargetMode(option.id as any);
                              if (option.id !== "specific") {
                                setSelectedMediaIds([]);
                              }
                            }}
                            className={`py-2.5 px-1.5 rounded-xl border text-[10px] font-extrabold transition-all text-center cursor-pointer select-none leading-tight ${
                              isSelected
                                ? "border-blue-500 bg-blue-50/20 text-blue-600 ring-2 ring-blue-500/10 font-black shadow-sm"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Specific Reels/Posts Grid */}
                  {commentTargetMode === "specific" && (
                    <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                      {loadingMedia ? (
                        <div className="grid grid-cols-3 gap-3">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="aspect-[9/16] rounded-2xl bg-slate-100 animate-pulse" />
                          ))}
                        </div>
                      ) : media.length === 0 ? (
                        <div className="border border-slate-100 rounded-2xl p-8 text-center bg-slate-50/40">
                          <Film className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-400">No media reels found.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          {media.map((item) => {
                            const isSelected = selectedMediaIds.includes(item.id);
                            const thumb = item.thumbnail_url || item.media_url;

                            return (
                              <div
                                key={item.id}
                                onClick={() => toggleMediaSelection(item.id)}
                                className={`group relative aspect-[9/16] rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 select-none ${
                                  isSelected
                                    ? "border-blue-500 ring-4 ring-blue-500/10 shadow-md"
                                    : "border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {thumb && (
                                  <img
                                    src={thumb}
                                    alt={item.caption || "Instagram media"}
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                                {/* Selected checkmark icon in center (from mockup) */}
                                {isSelected ? (
                                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-lg scale-100 animate-in zoom-in-50 duration-150">
                                      <Check size={16} strokeWidth={3.5} />
                                    </div>
                                  </div>
                                ) : (
                                  /* Expand icon in bottom right (from mockup) */
                                  <div className="absolute bottom-2.5 right-2.5 z-10 w-6 h-6 rounded-lg bg-white/75 backdrop-blur-sm flex items-center justify-center border border-white/20 text-slate-800 hover:bg-white transition-all shadow-sm">
                                    <Maximize2 size={11} className="stroke-[2.5]" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Any Reels Message */}
                  {commentTargetMode === "any" && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center my-2 animate-in fade-in duration-200">
                      <Film className="w-9 h-9 text-slate-400 mx-auto mb-2.5" />
                      <p className="text-xs font-black text-slate-800">Comments on Any Post/Reel</p>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-relaxed max-w-[260px] mx-auto">
                        This rule will automatically monitor and reply to comments on all current and past posts & reels.
                      </p>
                    </div>
                  )}

                  {/* Next Reels Message */}
                  {commentTargetMode === "next" && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center my-2 animate-in fade-in duration-200">
                      <Sparkles className="w-9 h-9 text-slate-400 mx-auto mb-2.5" />
                      <p className="text-xs font-black text-slate-800">Comments on Next Post/Reel</p>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-relaxed max-w-[260px] mx-auto">
                        This rule will automatically monitor and reply to comments on your next upcoming post or reel.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* Connected account fallback layout */
                <div className="py-12 flex flex-col items-center gap-4 text-center">
                  <Film className="w-10 h-10 text-slate-300" />
                  <p className="text-xs font-bold text-slate-500">Instagram account not connected</p>
                  <button
                    onClick={() => (window.location.href = "/api/auth/instagram/link")}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Connect Instagram Account
                  </button>
                </div>
              )}

            </div>

            {/* Card Footer */}
            <div className="border-t border-slate-100 pt-4 px-6 pb-6 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-bold text-slate-400">Step 2 of 5</span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleBack}
                  className="px-5 py-2 border border-slate-200 hover:bg-slate-50 rounded-full text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-full text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ── STEP 3 CONTENT: CONDITIONS (Comment Trigger Only) ── */}
        {step === 3 && selectedTrigger === "comment" && (
          <div className="bg-white border border-slate-150 rounded-[28px] p-0 shadow-[0_12px_40px_rgba(0,0,0,0.03)] max-w-md mx-auto w-full relative flex flex-col animate-in fade-in duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 px-6 pt-5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Film size={16} />
                </div>
                <span className="font-bold text-slate-800 text-xs">When someone comments on your Post/Reel</span>
              </div>
            </div>

            {/* Content Wrapper (No fixed height / scroll) */}
            <div className="px-6 py-4 flex flex-col gap-4.5 pb-6">
              
              {/* Profile Avatar */}
              <div className="flex flex-col items-center gap-2 my-2 shrink-0">
                <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-650">
                  <div className="w-full h-full rounded-full bg-white p-[2px]">
                    {account?.profile_picture_url ? (
                      <img src={account.profile_picture_url} className="w-full h-full rounded-full object-cover" alt="profile" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#ec4899] flex items-center justify-center text-white text-base font-bold">
                        {account?.username?.[0]?.toUpperCase() || "M"}
                      </div>
                    )}
                  </div>
                </div>
                <span className="font-bold text-slate-800 text-xs">@{account?.username || "deep.1792816"}</span>
              </div>

              {/* Specific Keyword / Any Comment option selector */}
              <div className="flex flex-col gap-2.5 shrink-0">
                <p className="font-extrabold text-slate-900 text-xs text-left">What kind of comment should trigger this automation?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setKeywordMode(keywordMode === "any_comment" ? "any" : keywordMode)}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      keywordMode !== "any_comment"
                        ? "border-blue-500 bg-blue-50/20 text-blue-650 ring-2 ring-blue-500/10 font-bold"
                        : "border-slate-200 bg-white text-slate-655 hover:bg-slate-50"
                    }`}
                  >
                    Specific keyword
                  </button>
                  <button
                    onClick={() => setKeywordMode("any_comment")}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      keywordMode === "any_comment"
                        ? "border-blue-500 bg-blue-50/20 text-blue-650 ring-2 ring-blue-500/10 font-bold"
                        : "border-slate-200 bg-white text-slate-655 hover:bg-slate-50"
                    }`}
                  >
                    Any comment
                  </button>
                </div>
              </div>

              {keywordMode === "any_comment" && (
                <div className="bg-[#eef2ff]/60 border border-[#e0e7ff] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200 my-1">
                  <div className="w-10 h-10 rounded-full bg-[#0084ff] flex items-center justify-center text-white shadow-md shadow-[#0084ff]/20">
                    <Check size={20} strokeWidth={3} />
                  </div>
                  <p className="text-slate-505 text-xs font-bold">The automation will trigger for all comments</p>
                </div>
              )}

              {/* Keywords list/input if not any_comment */}
              {keywordMode !== "any_comment" && (
                <div className="flex flex-col gap-2.5 animate-in fade-in duration-300 shrink-0">
                  <p className="text-xs font-bold text-slate-800 text-left">Should include any of these:</p>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addKeyword(keywordInput);
                        }
                      }}
                      placeholder="Type a keyword (min. 1 characters)"
                      className="w-full border border-slate-200 rounded-xl pl-4 pr-24 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                    />
                    <button
                      onClick={() => addKeyword(keywordInput)}
                      className="absolute right-2 bg-white border border-slate-200 hover:bg-slate-55 text-slate-855 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all shadow-sm"
                    >
                      + Add
                    </button>
                  </div>

                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {keywords.map((kw) => (
                        <span key={kw} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100/50 text-blue-600 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                          {kw}
                          <button
                            type="button"
                            onClick={() => removeKeyword(kw)}
                            className="text-blue-600/70 hover:text-blue-600 font-bold ml-1 text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed mt-1 text-left">
                    Keywords are not case-sensitive. Automations trigger only on exact keyword matches.
                  </p>
                </div>
              )}

              {/* Expandable links for advanced settings */}
              <div className="flex flex-col gap-3.5 mt-1 border-t border-slate-100/60 pt-3.5 shrink-0">
                <div className="flex items-center gap-4 text-xs font-bold text-blue-600">
                  <button
                    onClick={() => setShowExcludeKeywordsInput(!showExcludeKeywordsInput)}
                    className="hover:text-blue-805 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showExcludeKeywordsInput ? "Hide excluded keywords" : "Add excluded keywords?"}</span>
                    <HelpCircle size={12} className="text-slate-400 shrink-0" />
                  </button>

                  {keywordMode !== "any_comment" && (
                    <button
                      onClick={() => setShowMatchModeSettings(!showMatchModeSettings)}
                      className="hover:text-blue-805 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showMatchModeSettings ? "Hide advanced settings" : "Advanced match settings?"}</span>
                    </button>
                  )}
                </div>

                {/* Exclude Keywords Input */}
                {showExcludeKeywordsInput && (
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 text-left animate-in slide-in-from-top-1 duration-200">
                    <p className="text-xs font-bold text-slate-800 mb-2">Exclude Keywords:</p>
                    <div className="relative flex items-center mb-3">
                      <input
                        type="text"
                        value={excludeKeywordInput}
                        onChange={(e) => setExcludeKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addExcludeKeyword(excludeKeywordInput);
                          }
                        }}
                        placeholder="Type an exclude keyword..."
                        className="w-full border border-slate-200 bg-white rounded-xl pl-4 pr-20 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                      />
                      <button
                        onClick={() => addExcludeKeyword(excludeKeywordInput)}
                        className="absolute right-2 bg-white border border-slate-200 hover:bg-slate-55 text-slate-855 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all shadow-sm"
                      >
                        + Add
                      </button>
                    </div>
                    {excludeKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {excludeKeywords.map((kw) => (
                          <span key={kw} className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                            {kw}
                            <button
                              type="button"
                              onClick={() => removeExcludeKeyword(kw)}
                              className="text-rose-600/70 hover:text-rose-600 font-bold ml-1 text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Match Mode Settings */}
                {keywordMode !== "any_comment" && showMatchModeSettings && (
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/55 text-left animate-in slide-in-from-top-1 duration-200 flex flex-col gap-2.5">
                    <h4 className="text-xs font-bold text-slate-800">Advanced Keyword Matching Mode</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "any", label: "Contains Any", desc: "OR match" },
                        { id: "all", label: "Contains All", desc: "AND match" },
                        { id: "exact", label: "Exact Match", desc: "Equal match" },
                      ].map((mode) => {
                        const isSel = keywordMode === mode.id;
                        return (
                          <div
                            key={mode.id}
                            onClick={() => setKeywordMode(mode.id)}
                            className={`border rounded-xl p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 select-none ${
                              isSel
                                ? "border-blue-500 bg-blue-50/20 ring-2 ring-blue-500/10 text-blue-600 font-bold"
                                : "border-slate-200 bg-white hover:border-slate-250 text-slate-555"
                            }`}
                          >
                            <span className="text-[10px] font-bold leading-tight">{mode.label}</span>
                            <span className="text-[8px] text-slate-400 mt-0.5 leading-none">{mode.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-Reply Switch */}
              <div className="flex flex-col gap-3 bg-slate-50 rounded-2xl p-4.5 border border-slate-100/50 mt-1 text-left shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">Auto-Reply to comments on the post</span>
                  <button
                    onClick={() => setAutoCommentReply(!autoCommentReply)}
                    className={`w-12 h-6.5 rounded-full relative transition-all duration-300 outline-none shrink-0 cursor-pointer ${
                      autoCommentReply ? "bg-slate-900 shadow-[0_3px_10px_rgba(0,0,0,0.15)]" : "bg-slate-200"
                    }`}
                  >
                    <span className={`w-5 h-5 bg-white rounded-full absolute top-[3px] transition-all duration-300 shadow-md ${
                      autoCommentReply ? "left-[25px]" : "left-[3px]"
                    }`} />
                  </button>
                </div>

                {autoCommentReply && (
                  <div className="flex flex-col gap-3 pt-3 border-t border-slate-200/60 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-505">Public Comment Reply Messages *</label>
                      <span className="text-[10px] text-slate-400 font-bold">{commentReplyTexts.length}/5 messages</span>
                    </div>
                    
                    <div className="flex flex-col gap-2.5">
                      {commentReplyTexts.map((text, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={text}
                            onChange={(e) => {
                              const updated = [...commentReplyTexts];
                              updated[index] = e.target.value;
                              setCommentReplyTexts(updated);
                              if (index === 0) {
                                setCommentReplyText(e.target.value);
                              }
                            }}
                            placeholder="e.g. Thanks for the comment! Check your DMs 📩"
                            className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-400 transition-all flex-1 shadow-sm"
                          />
                          {commentReplyTexts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = commentReplyTexts.filter((_, i) => i !== index);
                                setCommentReplyTexts(updated);
                                if (index === 0 && updated.length > 0) {
                                  setCommentReplyText(updated[0]);
                                }
                              }}
                              className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-500 border border-rose-100 flex items-center justify-center transition-all cursor-pointer shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {commentReplyTexts.length < 5 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCommentReplyTexts([...commentReplyTexts, ""]);
                        }}
                        className="mt-1 flex items-center justify-center gap-1.5 py-2 px-3.5 bg-blue-50 hover:bg-blue-100/80 text-blue-600 border border-blue-100 rounded-xl text-xs font-bold transition-all cursor-pointer w-fit"
                      >
                        <span>+ Add more</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Card Footer */}
            <div className="border-t border-slate-100 pt-4 px-6 pb-6 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-bold text-slate-400">Step 3 of 5</span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleBack}
                  className="px-5 py-2 border border-slate-200 hover:bg-slate-55 rounded-full text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-full text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ── STEP 3/4 CONTENT: PRIMARY DM & GATES ── */}
        {((selectedTrigger === "comment" ? step === 4 : step === 3)) && (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] max-w-lg mx-auto flex flex-col gap-5 text-left relative animate-in fade-in duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Film size={16} />
                </div>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedTrigger === "comment" ? "When someone comments on your Post/Reel" : "When someone sends a message/reply"}
                </span>
              </div>
            </div>

            {/* Profile Avatar */}
            <div className="flex flex-col items-center gap-2 my-2">
              <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600">
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  {account?.profile_picture_url ? (
                    <img src={account.profile_picture_url} className="w-full h-full rounded-full object-cover" alt="profile" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#ec4899] flex items-center justify-center text-white text-xl font-bold">
                      {account?.username?.[0]?.toUpperCase() || "M"}
                    </div>
                  )}
                </div>
              </div>
              <span className="font-bold text-slate-800 text-sm">@{account?.username || "deep.1792816"}</span>
            </div>

            {/* Section 1: Before you send your primary DM, send them... */}
            <div className="flex flex-col gap-2.5">
              <p className="font-extrabold text-slate-900 text-xs">Before you send your primary DM, send them...</p>
              
              {/* Gate 1: Follow Gate */}
              <div className={`border border-slate-150 rounded-2xl bg-slate-50 flex flex-col transition-all duration-300 ${
                requireFollow ? "shadow-inner border-slate-200" : "border-slate-100"
              }`}>
                {/* Header row */}
                <div className="flex items-center justify-between p-4 cursor-pointer select-none" onClick={() => {
                  if (requireFollow) {
                    setFollowGateCollapsed(!followGateCollapsed);
                  } else {
                    setRequireFollow(true);
                    setFollowGateCollapsed(false);
                  }
                }}>
                  <div className="flex items-center gap-2">
                    {requireFollow && (
                      <span className="text-slate-500 hover:text-slate-850 p-0.5 transition-all">
                        {followGateCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-800">a DM asking to follow you</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextVal = !requireFollow;
                      setRequireFollow(nextVal);
                      if (nextVal) setFollowGateCollapsed(false);
                    }}
                    className={`w-12 h-6.5 rounded-full relative transition-all duration-300 outline-none shrink-0 cursor-pointer ${
                      requireFollow ? "bg-[#10b981] shadow-[0_3px_10px_rgba(16,185,129,0.25)]" : "bg-slate-200"
                    }`}
                  >
                    <span className={`w-5 h-5 bg-white rounded-full absolute top-[3px] transition-all duration-300 shadow-md ${
                      requireFollow ? "left-[25px]" : "left-[3px]"
                    }`} />
                  </button>
                </div>

                {/* Expanded content details with scrollbar */}
                {requireFollow && !followGateCollapsed && (
                  <div className="px-4 pb-4 border-t border-slate-200/60 pt-4 flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-2 relative text-left">
                    
                    {/* Opening Message */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-[11px] font-bold text-slate-800">Opening Message *</label>
                        <span title="The initial message sent asking the user to follow.">
                          <HelpCircle size={12} className="text-slate-400 cursor-pointer" />
                        </span>
                      </div>
                      <textarea
                        value={followOpeningMessage}
                        onChange={(e) => setFollowOpeningMessage(e.target.value)}
                        rows={3}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all resize-none shadow-sm"
                      />
                      <span className="text-[10px] font-semibold text-slate-400 text-right">
                        {followOpeningMessage.length}/1000
                      </span>
                    </div>

                    {/* Send me the access button config */}
                    <div className="relative flex items-center justify-center">
                      <input
                        type="text"
                        value={followOpeningBtnLabel}
                        onChange={(e) => setFollowOpeningBtnLabel(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl py-2 px-8 text-center text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-400 bg-white shadow-sm"
                      />
                      <Pencil size={12} className="absolute right-4 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Follow Check Message */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[11px] font-bold text-slate-800">Follow Check Message *</label>
                        <span title="The message sent when check verification fails.">
                          <HelpCircle size={12} className="text-slate-400 cursor-pointer" />
                        </span>
                      </div>
                      <textarea
                        value={followCheckMessage}
                        onChange={(e) => setFollowCheckMessage(e.target.value)}
                        rows={3}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all resize-none shadow-sm"
                      />
                      <span className="text-[10px] font-semibold text-slate-400 text-right">
                        {followCheckMessage.length}/1000
                      </span>
                    </div>

                    {/* Visit Profile button config */}
                    <div className="relative flex items-center justify-center">
                      <input
                        type="text"
                        value={followCheckBtn1Label}
                        onChange={(e) => setFollowCheckBtn1Label(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl py-2 px-8 text-center text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-400 bg-white shadow-sm"
                      />
                      <Pencil size={12} className="absolute right-4 text-slate-400 pointer-events-none" />
                    </div>

                    {/* I'm following button config */}
                    <div className="relative flex items-center justify-center">
                      <input
                        type="text"
                        value={followCheckBtn2Label}
                        onChange={(e) => setFollowCheckBtn2Label(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl py-2 px-8 text-center text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-400 bg-white shadow-sm"
                      />
                      <Pencil size={12} className="absolute right-4 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Retry Radio Options */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/50 mt-1">
                      <label className="text-[11px] font-bold text-slate-800 leading-tight">
                        Retry 3 times and if the user still hasn't followed:
                      </label>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="retryAction"
                            value="send_anyway"
                            checked={retryAction === "send_anyway"}
                            onChange={() => setRetryAction("send_anyway")}
                            className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span>Send them the DM anyway</span>
                        </label>
                        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="retryAction"
                            value="dont_send"
                            checked={retryAction === "dont_send"}
                            onChange={() => setRetryAction("dont_send")}
                            className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span>Don't send them the DM</span>
                        </label>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Gate 2: Email Gate */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-xs font-bold text-slate-800">a DM asking to share their email</span>
                <button
                  onClick={() => setEmailAsk(!emailAsk)}
                  className={`w-12 h-6.5 rounded-full relative transition-all duration-300 outline-none shrink-0 cursor-pointer ${
                    emailAsk ? "bg-slate-900 shadow-[0_3px_10px_rgba(0,0,0,0.15)]" : "bg-slate-200"
                  }`}
                >
                  <span className={`w-5 h-5 bg-white rounded-full absolute top-[3px] transition-all duration-300 shadow-md ${
                    emailAsk ? "left-[25px]" : "left-[3px]"
                  }`} />
                </button>
              </div>
            </div>

            {/* Section 2: Then send the primary DM... */}
            <div className="flex flex-col gap-3">
              <p className="font-extrabold text-slate-900 text-xs">
                {!requireFollow && !emailAsk ? "Setup your 2-step AutoDM" : "Then send the primary DM..."}
              </p>
              
              {!requireFollow && !emailAsk && (
                <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-4 flex flex-col gap-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Step 1: Greeting Message *</span>
                    <span title="This message is sent first with a button. When they click the button, the main payload below is sent.">
                      <HelpCircle size={12} className="text-slate-400 cursor-pointer" />
                    </span>
                  </div>
                  <textarea
                    value={initialDmMessage}
                    onChange={(e) => setInitialDmMessage(e.target.value)}
                    rows={2}
                    placeholder="e.g. Thanks for commenting! Tap below and I'll send you the access instantly 🚀"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-all resize-none shadow-sm"
                  />
                </div>
              )}

              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                {!requireFollow && !emailAsk 
                  ? "Step 2: Write the message containing your link or file, delivered after they click the button above." 
                  : "Write the message you want to auto-send with a button that takes them to your link or product."}
              </p>

              <div className="border border-slate-200 rounded-2xl p-4 bg-white flex flex-col gap-4">

                {/* DM Content Textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500">DM content</label>
                  <textarea
                    value={mainDmMessage}
                    onChange={(e) => setMainDmMessage(e.target.value)}
                    rows={4}
                    placeholder="Type your main response containing details or files..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-805 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all resize-none shadow-sm"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMainDmMessage((prev) => prev + " {username}");
                      }}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all shadow-sm"
                    >
                      # Add a variable
                    </button>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {mainDmMessage.length}/900
                    </span>
                  </div>
                </div>

                {/* Button Settings (dynamic UI matching mockup) */}
                {dmType === "text_only" ? (
                  /* Second Image: + Add a button container */
                  <div 
                    onClick={() => {
                      setDmType("text_button");
                      setDmButtonLabel("Click me");
                      setDmButtonUrl("");
                    }}
                    className="border-2 border-dashed border-slate-200 hover:border-slate-350 rounded-2xl py-3.5 text-center cursor-pointer hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="text-xs font-bold text-slate-700">+ Add a button</span>
                  </div>
                ) : (
                  /* Third Image: Button #1 Configuration Card */
                  <div className="flex flex-col gap-3">
                    <div className="border border-slate-200 border-dashed rounded-2xl p-4 bg-white flex flex-col gap-3 relative">
                      
                      {/* Button Card Header */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-800">Button #1</span>
                        <button
                          type="button"
                          onClick={() => {
                            setDmType("text_only");
                            setDmButtonLabel("");
                            setDmButtonUrl("");
                          }}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                          title="Delete button"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Button Label Input */}
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={dmButtonLabel}
                          maxLength={60}
                          onChange={(e) => setDmButtonLabel(e.target.value)}
                          placeholder="Button Label"
                          className="w-full border border-slate-200 rounded-xl pl-4 pr-16 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all bg-white shadow-sm"
                        />
                        <span className="absolute right-3.5 text-[9px] font-bold text-slate-400">
                          {dmButtonLabel.length}/60
                        </span>
                      </div>

                      {/* Redirect URL Input */}
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-slate-400">
                          <LinkIcon size={13} />
                        </span>
                        <input
                          type="text"
                          value={dmButtonUrl}
                          onChange={(e) => setDmButtonUrl(e.target.value)}
                          placeholder="Add link here"
                          className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-xs font-bold text-slate-808 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all bg-white shadow-sm"
                        />
                        <span className="absolute right-3.5 text-slate-400">
                          <ChevronDown size={14} />
                        </span>
                      </div>

                    </div>

                    {/* Add another button dashed block */}
                    <div 
                      className="border border-dashed border-slate-100 rounded-2xl p-2.5 text-center cursor-not-allowed opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <span className="text-[11px] font-bold text-slate-400">+ Add another button</span>
                    </div>
                  </div>
                )}

                {/* Follow-up Message Settings */}
                <div className="flex flex-col gap-3">
                  <div
                    onClick={() => setEnableFollowUp(!enableFollowUp)}
                    className={`border border-dashed rounded-xl p-3.5 flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      enableFollowUp
                        ? "border-blue-300 bg-blue-50/20 text-blue-600 font-bold"
                        : "border-slate-200 hover:border-slate-300 text-slate-500"
                    }`}
                  >
                    <span className="text-xs font-bold">
                      {enableFollowUp ? "✓ Follow-up message enabled" : "+ Add follow-up message"}
                    </span>
                  </div>

                  {enableFollowUp && (
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3.5 animate-in slide-in-from-top-1 duration-200">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500">Follow-up Message Text *</label>
                        <textarea
                          value={followUpMessage}
                          onChange={(e) => setFollowUpMessage(e.target.value)}
                          rows={3}
                          placeholder="e.g. Hey, just checking if you were able to access the guide! let me know if you have any questions."
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-400 transition-all resize-none shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500">Delay (Minutes) *</label>
                        <input
                          type="number"
                          value={followUpDelay}
                          onChange={(e) => setFollowUpDelay(parseInt(e.target.value) || 60)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-400 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Passive income promo block */}
            {showReferralPromo && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4.5 flex items-start justify-between gap-3 relative animate-in fade-in duration-300">
                <span className="text-blue-600 shrink-0 mt-0.5 font-bold text-base">₹</span>
                <div className="flex-1 text-left">
                  <p className="text-xs font-bold text-blue-900">Your AutoDMs can earn passive income for you</p>
                  <p className="text-[11px] text-blue-700/80 font-semibold mt-1 leading-relaxed">
                    Share your referral link and earn 20% recurring commission on every upgrade. You'll keep earning as long as they stay subscribed.
                  </p>
                </div>
                <button
                  onClick={() => setShowReferralPromo(false)}
                  className="text-blue-400 hover:text-blue-600 p-0.5 rounded transition-all cursor-pointer bg-transparent border-0"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Card Footer */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between mt-4 shrink-0">
              <span className="text-[11px] font-bold text-slate-400">
                {selectedTrigger === "comment" ? "Step 4 of 5" : "Step 3 of 4"}
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleBack}
                  className="px-5 py-2 border border-slate-200 hover:bg-slate-55 rounded-full text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-full text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ── STEP 6 CONTENT: REVIEW & SAVE ── */}
        {isReviewStep && (
          <div className="bg-white border border-slate-150 rounded-[28px] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] text-left max-w-md mx-auto flex flex-col w-full relative animate-in fade-in duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">Launch AutoDM</span>
              <button 
                onClick={handleBack} 
                className="text-slate-400 hover:text-slate-655 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area (No scroll system) */}
            <div className="py-4 flex flex-col gap-5">
              
              <h3 className="font-black text-slate-900 text-[15px] leading-tight mt-0.5">
                Awesome! Let's review once before we launch!
              </h3>

              <div className="flex flex-col gap-5">
                
                {/* 1. When someone... */}
                <div className="flex flex-col gap-2">
                  <span className="font-black text-slate-900 text-[10.5px] uppercase tracking-wider text-slate-400">When someone...</span>
                  
                  {selectedMediaIds.length === media.length || selectedMediaIds.length === 0 ? (
                    <div className="flex flex-col gap-1.5 pl-1">
                      <span className="font-semibold text-slate-800 text-xs">comments on any post or reel</span>
                      <div className="flex items-start gap-1.5">
                        <CornerDownRight className="text-slate-300 w-4 h-4 shrink-0 mt-0.5" />
                        <div className="bg-slate-50 border border-slate-150/70 px-4 py-2 rounded-xl font-bold text-slate-600 text-xs w-full">
                          All Posts & Reels
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5 pl-1">
                      <span className="font-semibold text-slate-800 text-xs">comments on this specific post</span>
                      <div className="flex items-start gap-1.5">
                        <CornerDownRight className="text-slate-300 w-4 h-4 shrink-0 mt-0.5" />
                        <div className="flex gap-3 bg-white border border-slate-150/80 p-3 rounded-2xl w-full shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                          {(() => {
                            const post = media.find((m) => selectedMediaIds.includes(m.id));
                            const thumb = post?.thumbnail_url || post?.media_url;
                            return (
                              <>
                                {thumb ? (
                                  <img src={thumb} className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0 shadow-sm" alt="post thumb" />
                                ) : (
                                  <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center shrink-0 text-slate-400 text-[9px] font-bold">
                                    No Image
                                  </div>
                                )}
                                <div className="flex flex-col gap-1 overflow-hidden">
                                  <span className="text-[9px] font-black text-slate-400 tracking-wider">CAPTION</span>
                                  <p className="text-[10.5px] text-slate-700 font-semibold line-clamp-3 leading-relaxed">
                                    {post?.caption || "No caption provided"}
                                  </p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. and comments... */}
                <div className="flex flex-col gap-2">
                  <span className="font-black text-slate-900 text-[10.5px] uppercase tracking-wider text-slate-400">and comments...</span>
                  <div className="flex items-start gap-1.5 pl-1">
                    <CornerDownRight className="text-slate-300 w-4 h-4 shrink-0 mt-1.5" />
                    <div className="flex flex-wrap gap-1.5">
                      {keywordMode === "any_comment" ? (
                        <span className="inline-block bg-white border border-slate-200 text-slate-705 px-4 py-2 rounded-xl text-xs font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                          Any comment
                        </span>
                      ) : (
                        keywords.map((kw, i) => (
                          <span key={i} className="inline-block bg-white border border-slate-200 text-slate-705 px-3 py-1.5 rounded-xl text-xs font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                            {kw}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. then ask them to follow you */}
                {requireFollow && (
                  <div className="flex flex-col gap-2">
                    <span className="font-black text-slate-900 text-[10.5px] uppercase tracking-wider text-slate-400">then ask them to follow you</span>
                    <div className="flex items-start gap-1.5 pl-1">
                      <CornerDownRight className="text-slate-300 w-4 h-4 shrink-0 mt-1" />
                      <div className="flex-1 flex flex-col gap-2 max-w-[85%]">
                        <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-none p-3.5 text-[11px] leading-relaxed font-semibold">
                          {followCheckMessage || "Oops! Looks like you haven't followed me yet 👀\nIt would mean a lot if you could visit my profile and hit that follow button 😅."}
                        </div>
                        <div className="bg-slate-200/60 hover:bg-slate-200 text-slate-800 font-black py-2 rounded-xl text-center text-[11px] transition-colors cursor-default">
                          {followCheckBtn1Label || "Visit Profile"}
                        </div>
                        <div className="bg-slate-200/60 hover:bg-slate-200 text-slate-800 font-black py-2 rounded-xl text-center text-[11px] transition-colors cursor-default">
                          {followCheckBtn2Label || "I'm following ✅"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. then ask them to share their email */}
                {emailAsk && (
                  <div className="flex flex-col gap-2">
                    <span className="font-black text-slate-900 text-[10.5px] uppercase tracking-wider text-slate-400">then ask them to share their email</span>
                    <div className="flex items-start gap-1.5 pl-1">
                      <CornerDownRight className="text-slate-300 w-4 h-4 shrink-0 mt-1" />
                      <div className="flex-1 flex flex-col gap-2 max-w-[85%]">
                        <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-none p-3.5 text-[11px] leading-relaxed font-semibold">
                          {emailAskMessage ? emailAskMessage.replace("{link}", "[Email Form URL]") : "Please enter your email to get access link 📩"}
                        </div>
                        <div className="bg-slate-200/60 hover:bg-slate-200 text-slate-850 font-black py-2 rounded-xl text-center text-[11px] transition-colors cursor-default">
                          {emailAskBtnLabel || "Submit Email"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. leave a reply to their comment on the post */}
                {autoCommentReply && (
                  <div className="flex flex-col gap-2">
                    <span className="font-black text-slate-900 text-[10.5px] uppercase tracking-wider text-slate-400">leave a reply to their comment on the post</span>
                    <div className="flex items-start gap-1.5 pl-1">
                      <CornerDownRight className="text-slate-300 w-4 h-4 shrink-0 mt-1" />
                      <div className="flex-1 bg-slate-55 border border-slate-150/80 p-3.5 rounded-2xl flex flex-col gap-3 w-full shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                        {/* Commenter */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-black text-slate-900 leading-none">User</span>
                            <span className="text-[11px] text-slate-700 mt-1 font-semibold">This is a comment</span>
                          </div>
                        </div>

                        {/* Creator Reply */}
                        <div className="flex items-start gap-2.5 pl-6">
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 shrink-0">
                            {account?.profile_picture_url ? (
                              <img src={account.profile_picture_url} className="w-full h-full object-cover" alt="profile" />
                            ) : (
                              <div className="w-full h-full bg-[#f43f5e] flex items-center justify-center text-white text-[9px] font-black">
                                {account?.username?.[0]?.toUpperCase() || "Y"}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-black text-slate-900 leading-none">You</span>
                            <span className="text-[11px] text-slate-755 mt-1 font-semibold leading-relaxed">
                              <span className="text-blue-500 font-bold mr-1">@{account?.username || "user"}</span>
                              {((commentReplyTexts && commentReplyTexts[0]) || commentReplyText) || "Sent you a message! Check it out!"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Once they follow, send them the following DM */}
                <div className="flex flex-col gap-2">
                  <span className="font-black text-slate-900 text-[10.5px] uppercase tracking-wider text-slate-400">
                    {requireFollow && emailAsk
                      ? "Once they follow & share email, send them the following DM"
                      : requireFollow
                      ? "Once they follow, send them the following DM"
                      : emailAsk
                      ? "Once they share email, send them the following DM"
                      : "Once they comment, send them the following DM"}
                  </span>
                  <div className="flex items-start gap-1.5 pl-1">
                    <CornerDownRight className="text-slate-300 w-4 h-4 shrink-0 mt-1" />
                    <div className="flex-1 flex flex-col gap-2 max-w-[85%]">
                      <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-none p-3.5 text-[11px] leading-relaxed font-semibold whitespace-pre-line">
                        {mainDmMessage || "Hey there!\nThanks for commenting 🙌\nHere's the link I mentioned ⬇️"}
                      </div>
                      {dmType === "text_button" && dmButtonLabel && (
                        <div className="bg-slate-200/60 hover:bg-slate-200 text-slate-800 font-black py-2 rounded-xl text-center text-[11px] transition-colors cursor-default">
                          {dmButtonLabel}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 pt-4 mt-1.5 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={handleBack}
                className="flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-6 py-2.5 rounded-full text-xs font-black transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer min-w-[80px]"
              >
                Back
              </button>
              
              <button
                onClick={handleSaveAutomation}
                disabled={savingRule}
                className="flex items-center justify-center bg-[#18181b] hover:bg-black text-white px-6 py-2.5 rounded-full text-xs font-black transition-all shadow-md disabled:opacity-50 cursor-pointer min-w-[140px]"
              >
                {savingRule ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-white mr-1.5" />
                    <span>Launching...</span>
                  </>
                ) : (
                  <span>Confirm & launch</span>
                )}
              </button>
            </div>

          </div>
        )}

        {/* ── Footer Actions ── */}
        {false && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 hover:text-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
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
          </div>
        )}

      </div>
    </div>
  );
}

