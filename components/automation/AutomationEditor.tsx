"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Zap, MessageCircle, MessageSquare, Search, Edit2, Settings, Scissors, ChevronRight, Link as LinkIcon, FileText, CheckCircle2, Send, PlusCircle, Radio, Mail, X, User, Sparkles, Video, ArrowRight, Clock, Image as ImageIcon, Play, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";


const InstagramIcon = (props: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>);

const hideScrollbarStyle = `
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

function parseReplyMessage(message: string = "") {
  let text = message;
  let fileLink = "";
  let button: { name: string; link: string } | null = null;
  let followRequest = "";
  let attachedImage = "";

  // Extract attached image
  const imageRegex = /\n\n\[Attached Image: (.*?)\]/;
  const imageMatch = text.match(imageRegex);
  if (imageMatch) {
    attachedImage = imageMatch[1];
    text = text.replace(imageRegex, "");
  }

  // Extract follow request
  const followRegex = /\n\n\[Follow Request: (.*?)\]/;
  const followMatch = text.match(followRegex);
  if (followMatch) {
    followRequest = followMatch[1];
    text = text.replace(followRegex, "");
  }

  // Extract button
  const buttonRegex = /\n\n\[Button: (.*?)\]\((.*?)\)/;
  const buttonMatch = text.match(buttonRegex);
  if (buttonMatch) {
    button = { name: buttonMatch[1], link: buttonMatch[2] };
    text = text.replace(buttonRegex, "");
  }

  // Extract file link
  const fileLinkRegex = /\n\nHere is your file: ([^\n]+)/;
  const fileLinkMatch = text.match(fileLinkRegex);
  if (fileLinkMatch) {
    fileLink = fileLinkMatch[1];
    text = text.replace(fileLinkRegex, "");
  }

  return {
    text: text.trim(),
    fileLink: fileLink.trim(),
    button,
    followRequest: followRequest.trim(),
    attachedImage: attachedImage.trim()
  };
}

interface Rule {
  id: string;
  name: string;
  platform: string;
  trigger_keyword: string;
  reply_message: string;
  target_post_url: string;
  instagram_account_id?: string | null;
  instagram_media_id?: string | null;
  comment_scope?: "specific" | "any" | "next";
  active: boolean;
  created_at: string;
  executions?: number;
  last_execution?: string;
}

export function AutomationEditor() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const user = session?.user;
  const router = useRouter();

  const [rules, setRules] = useState<Rule[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Flow State
  const [instagramAccounts, setInstagramAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<"trigger_selection" | "connect" | "select_post" | "trigger_setup" | "action_setup" | "confirm_launch">("trigger_selection");
  const [contentTab, setContentTab] = useState<"posts" | "reels">("posts");
  const [commentType, setCommentType] = useState<"specific" | "any" | "next">("specific");
  const [triggerType, setTriggerType] = useState<"keyword" | "any">("keyword");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [quickKeyword, setQuickKeyword] = useState("");
  const [quickMessage, setQuickMessage] = useState("");
  const [autoReply, setAutoReply] = useState(false);
  const [askToFollow, setAskToFollow] = useState(false);
  const [askForEmail, setAskForEmail] = useState(false);
  const [showButtonSetup, setShowButtonSetup] = useState(false);
  const [dmType, setDmType] = useState("Text + Button");
  const [activeProvider, setActiveProvider] = useState<"instagram" | "youtube">("instagram");
  const selectedAccount = instagramAccounts.find((account) => account.id === selectedAccountId) || instagramAccounts[0] || null;
  const isIgConnected = instagramAccounts.length > 0;
  
  // YouTube to Reels Flow State
  const [currentView, setCurrentView] = useState<"dashboard" | "yt_automation">("dashboard");
  const [ytUrl, setYtUrl] = useState("");
  const [ytStep, setYtStep] = useState<"input" | "processing" | "results">("input");
  const [processingStep, setProcessingStep] = useState(0);
  const [reelResults, setReelResults] = useState<any[]>([]);
  const [scheduledReels, setScheduledReels] = useState<string[]>([]);
  const [postingReel, setPostingReel] = useState<string | null>(null);
  
  const [realPosts, setRealPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (!isIgConnected) return;

    setLoadingPosts(true);
    
    // Determine which accounts to fetch posts for
    const accountsToFetch = selectedAccountId 
      ? instagramAccounts.filter(acc => acc.id === selectedAccountId)
      : instagramAccounts;

    const fetchPromises = accountsToFetch.map(acc => 
      fetch(`/api/instagram-posts?accountId=${encodeURIComponent(acc.id)}`)
        .then(res => res.json())
        .then(data => data.data || [])
        .catch(err => {
          console.error(`Error fetching posts for ${acc.username}:`, err);
          return [];
        })
    );

    Promise.all(fetchPromises)
      .then(results => {
        const allPosts = results.flat().sort((a: any, b: any) => 
          new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        );
        setRealPosts(allPosts);
      })
      .catch(console.error)
      .finally(() => setLoadingPosts(false));
  }, [isIgConnected, selectedAccountId, instagramAccounts]);

  
  const [form, setForm] = useState({
    name: "",
    trigger_keyword: "",
    reply_message: "",
    target_post_url: "",
    instagram_media_id: "",
    comment_scope: "any" as "specific" | "any" | "next",
    link_attachment: "",
    action_type: "message" as "message" | "link" | "pdf",
    target_post_thumbnail: "",
    button_name: "",
    button_link: "",
    dm_type: "Message Only",
    follow_message: "",
    image_url: "",
  });

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const rulesUrl = selectedAccountId
        ? `/api/automation-rules?accountId=${encodeURIComponent(selectedAccountId)}`
        : "/api/automation-rules";
      const res = await fetch(rulesUrl);
      const { data } = await res.json();
      if (data) setRules(data as Rule[]);
    } catch (e) {
      console.error(e);
    } finally {
      try {
        const igRes = await fetch("/api/instagram-account");
        const { data: igData } = await igRes.json();
        const accounts = Array.isArray(igData) ? igData : [];
        setInstagramAccounts(accounts);

        if (accounts.length > 0) {
          setSelectedAccountId((prev) => {
            if (prev && accounts.some((acc: any) => acc.id === prev)) return prev;
            return accounts[0].id;
          });
        }
      } catch (e) {
        console.error("IG fetch error:", e);
      }
      setLoadingData(false);
    }
  }, [user, selectedAccountId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showForm]);

  const handleNewRuleClick = () => {
    if (!selectedAccountId && instagramAccounts.length > 0) {
      setSelectedAccountId(instagramAccounts[0].id);
    }
    setShowForm(true);
    setFormStep("trigger_selection");
  };

  const handleYtShortsClick = () => {
    setCurrentView("yt_automation");
    setYtStep("input");
    setYtUrl("");
  };

  const startYtProcessing = () => {
    if (!ytUrl.trim()) return;
    setYtStep("processing");
    setProcessingStep(0);
    
    // Animate processing steps
    const timer = setInterval(() => {
      setProcessingStep(prev => {
        if (prev >= 3) {
          clearInterval(timer);
          setTimeout(() => {
            setReelResults([
              { 
                id: "r1", 
                title: "How to Scale Fast", 
                description: "Deep dive into scaling strategies.", 
                caption: "Scaling is hard, but here is how you do it! 🚀 #business #growth #reels", 
                video_url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=711&fit=crop",
                duration: "45s"
              },
              { 
                id: "r2", 
                title: "The secret of success", 
                description: "Why most people fail at the start.", 
                caption: "Success isn't about luck, it's about consistency. 💡 #success #motivation", 
                video_url: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=711&fit=crop",
                duration: "42s"
              },
              { 
                id: "r3", 
                title: "Daily Habits", 
                description: "Small things that change everything.", 
                caption: "Change your habits, change your life. 🌟 #habits #lifestyle", 
                video_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=711&fit=crop",
                duration: "48s"
              }
            ]);
            setYtStep("results");
          }, 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
  };

  const handleTriggerSelect = (trigger: string) => {
    if (!isIgConnected) {
      setFormStep("connect");
    } else {
      setFormStep("select_post");
    }
  };

  const handleConnect = () => {
    setSaving(true);
    window.location.href = "/instagram/connect";
  };

  const handleQuickAutoDM = async () => {
    if (!selectedAccountId) {
      toast.error("Please connect an Instagram account first");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/automation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "instagram",
          name: `Auto DM: ${quickKeyword}`,
          trigger_keyword: quickKeyword,
          reply_message: quickMessage,
          target_post_url: "",
          instagram_media_id: null,
          comment_scope: "any",
          instagram_account_id: selectedAccountId,
          active: true,
        })
      });
      if (res.ok) {
        toast.success("Auto DM activated successfully!");
        setQuickKeyword("");
        setQuickMessage("");
        load();
      } else {
        toast.error("Failed to create rule");
      }
    } catch (e) {
      toast.error("Error creating Auto DM");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPost = (url: string, mediaId: string, thumbUrl: string) => {
    setForm(prev => ({ ...prev, target_post_url: url, instagram_media_id: mediaId, target_post_thumbnail: thumbUrl }));
    setFormStep("trigger_setup");
  };

  const createRule = useCallback(async () => {
    const hasContent = form.reply_message.trim() || form.link_attachment.trim() || form.image_url.trim();
    if (!user || !selectedAccountId) {
      toast.error("Please connect an Instagram account first");
      return;
    }
    if (!hasContent) {
      toast.error("Please add DM content, a link, or an image");
      return;
    }
    if (triggerType === "keyword" && keywords.length === 0) {
      toast.error("Please add at least one trigger keyword");
      return;
    }
    
    setSaving(true);
    
    const finalTrigger = triggerType === "keyword" ? keywords.join(", ") : "Any comment";
    
    const buttonStr = form.button_name ? `\n\n[Button: ${form.button_name}](${form.button_link})` : "";
    const followStr = askToFollow && form.follow_message ? `\n\n[Follow Request: ${form.follow_message}]` : "";
    const imageStr = form.image_url ? `\n\n[Attached Image: ${form.image_url}]` : "";

    const finalMessage = form.link_attachment 
      ? `${form.reply_message.trim()}\n\nHere is your file: ${form.link_attachment}${buttonStr}${followStr}${imageStr}` 
      : `${form.reply_message.trim()}${buttonStr}${followStr}${imageStr}`;

    try {
      const res = await fetch("/api/automation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "instagram",
          name: form.name.trim() || `Rule for ${commentType}`,
          trigger_keyword: finalTrigger,
          reply_message: finalMessage,
          target_post_url: form.target_post_url.trim(),
          instagram_media_id: commentType === "specific" ? form.instagram_media_id : null,
          comment_scope: commentType,
          instagram_account_id: selectedAccountId,
          active: true,
        })
      });
      
      const { data } = await res.json();

      if (!data) {
        // Fallback for UI if API fails but we want to show something (or handle error)
        toast.error("Failed to create rule");
      } else {
        await load();
      }

      setForm({
        name: "",
        trigger_keyword: "",
        reply_message: "",
        target_post_url: "",
        instagram_media_id: "",
        comment_scope: "any",
        link_attachment: "",
        action_type: "message",
        target_post_thumbnail: "",
        button_name: "",
        button_link: "",
        dm_type: "Message Only",
        follow_message: "",
        image_url: "",
      });
      setKeywords([]);
      setShowForm(false);
      toast.success("Automation rule created!");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [user, form, load, triggerType, keywords, commentType, selectedAccountId]);

  const toggleRule = useCallback(async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/automation-rules?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active })
      });
      if (res.ok) {
        setRules((r) => r.map((x) => x.id === id ? { ...x, active } : x));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    try {
      const res = await fetch(`/api/automation-rules?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setRules((r) => r.filter((x) => x.id !== id));
        toast.success("Rule deleted");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (loading || (!loading && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0096d6] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="relative mx-auto max-w-6xl px-6 md:px-8 pt-8 md:pt-24 pb-16 md:pb-20 space-y-12 md:space-y-16 animate-in fade-in duration-700">
      {/* Decorative clean ambient glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-violet-100/30 blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 h-80 w-80 rounded-full bg-pink-100/20 blur-[120px]" />
      </div>

      {/* Header welcome & actions */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3 text-left">
          <h1 className="text-[32px] md:text-[52px] font-normal tracking-tight text-slate-900 leading-none">
            Instagram <span className="text-[#a855f7] font-medium">Automation</span>
          </h1>
          <p className="text-[14.5px] md:text-[16px] text-slate-500 font-medium max-w-xl leading-relaxed">
            Automate engagement workflows, capture leads, and keep every DM reply consistent.
          </p>
        </div>
        <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-400 text-center md:text-right shrink-0">
          Workflow studio
        </div>
      </div>

        {currentView === "dashboard" ? (
        <div className="space-y-12 animate-in fade-in duration-500">


          <section className="relative">
            <div className="bg-white rounded-[24px] border border-[#e4e4e7] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4 text-left w-full md:w-auto">
                <div className="w-12 h-12 rounded-[16px] bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shadow-inner flex-shrink-0">
                  {selectedAccount?.profile_picture_url ? (
                    <img src={selectedAccount.profile_picture_url} alt="" className="w-full h-full object-cover" />
                  ) : session?.user?.image ? (
                    <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <InstagramIcon className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0">
                  {selectedAccount ? (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[16px] font-bold text-slate-900 tracking-tight">@{selectedAccount.username}</span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[15px] font-semibold text-slate-500 tracking-tight">No account connected</span>
                      <Link href="/dashboard/settings" className="text-[11px] font-bold text-sky-600 hover:text-sky-700">Connect Now</Link>
                    </div>
                  )}
                  <p className="text-[12px] text-slate-400 mt-0.5">Create and monitor DM automations for posts and reels.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
                {instagramAccounts.length > 0 && (
                  <select
                    value={selectedAccountId ?? ""}
                    onChange={(event) => setSelectedAccountId(event.target.value || null)}
                    className="h-10 rounded-full border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 w-full sm:w-auto"
                  >
                    <option value="">All Accounts</option>
                    {instagramAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        @{account.username}
                      </option>
                    ))}
                  </select>
                )}
                <button 
                  onClick={handleNewRuleClick}
                  disabled={!selectedAccount}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e84c9f] via-[#b656e3] to-[#5a60f6] text-white text-[13.5px] font-bold rounded-full shadow-[0_8px_20px_-4px_rgba(182,86,227,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  Create Rule
                </button>
              </div>
            </div>
          </section>

          {/* Quick Setup: Comment Auto DM */}
          <section className="bg-white rounded-[24px] border border-[#e4e4e7] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={20} className="text-[#a855f7]" />
                  <h2 className="text-[20px] font-bold text-slate-900">Quick Setup: Comment Auto DM</h2>
                </div>
                <p className="text-[14px] text-slate-500">
                  Instantly send a DM when a user comments on any of your posts with a specific keyword.
                </p>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Trigger keyword (e.g. 'link')" 
                    value={quickKeyword}
                    onChange={e => setQuickKeyword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] focus:border-[#a855f7] focus:outline-none"
                  />
                  <textarea 
                    placeholder="Message to send..." 
                    value={quickMessage}
                    onChange={e => setQuickMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] focus:border-[#a855f7] focus:outline-none min-h-[80px]"
                  />
                  <button 
                    onClick={handleQuickAutoDM}
                    disabled={!quickKeyword || !quickMessage || saving}
                    className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-[14px] hover:bg-slate-800 disabled:opacity-50 transition-all shadow-md"
                  >
                    Activate Auto DM
                  </button>
                </div>
              </div>
              <div className="hidden md:flex w-[300px] shrink-0 items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 p-4 relative overflow-hidden">
                 {/* Mini chat preview */}
                 <div className="w-full space-y-3 z-10">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0" />
                      <div className="bg-white p-2 rounded-xl rounded-tl-none border border-slate-100 shadow-sm text-[11px] text-slate-600">
                         {quickKeyword || "link"}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <div className="bg-gradient-to-tr from-[#ec4899] to-[#a855f7] text-white p-2 rounded-xl rounded-tr-none shadow-sm text-[11px] max-w-[80%] break-words">
                         {quickMessage || "Here is the link you requested!"}
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-semibold text-slate-900">Active Automations</h2>
              <p className="text-[13px] text-slate-500">Manage rules and monitor engagement triggers.</p>
            </div>
            <div className="text-[12px] font-semibold text-slate-400">
              {rules.length} rules
            </div>
          </div>

          {loadingData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-slate-50 rounded-[2.5rem] border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : rules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rules.map((rule) => {
                const ruleAccount = instagramAccounts.find(acc => acc.id === rule.instagram_account_id);
                const parsed = parseReplyMessage(rule.reply_message);
                const matchingPost = realPosts.find(p => p.id === rule.instagram_media_id);
                const thumbUrl = matchingPost?.thumbnail_url || matchingPost?.media_url;
                const postCaption = matchingPost?.caption || "Instagram Post";

                return (
                  <div key={rule.id} className="group relative bg-white border border-[#e4e4e7] rounded-[24px] p-5.5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-5">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1.5px] shadow-sm">
                            <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center text-slate-700">
                              <InstagramIcon size={18} />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[14px] font-bold text-slate-800 line-clamp-1">{rule.name || `Rule #${rule.id.slice(0, 4)}`}</h3>
                            {ruleAccount && (
                              <p className="text-[10.5px] font-bold text-slate-400 mt-0.5">@{ruleAccount.username}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          <button 
                            onClick={() => deleteRule(rule.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="pt-1">
                        {rule.comment_scope === "specific" ? (
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/80 hover:bg-slate-100/50 transition-colors">
                            {thumbUrl ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                <img src={thumbUrl} alt="Post preview" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500 shrink-0">
                                <InstagramIcon size={16} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[11.5px] font-bold text-slate-700 truncate">{postCaption}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Specific Content</span>
                                {rule.target_post_url && (
                                  <a 
                                    href={rule.target_post_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-[9px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5 hover:underline"
                                  >
                                    <span>View Post</span>
                                    <ChevronRight size={10} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : rule.comment_scope === "any" ? (
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/80">
                            <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-500 shrink-0">
                              <InstagramIcon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-bold text-slate-800">Any Post or Reel</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">All Account Media</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/80">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                              <PlusCircle size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-bold text-slate-800">Next Post or Reel</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Future Uploads Only</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="relative pl-6 border-l-2 border-dashed border-slate-200">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300" />
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            <MessageSquare size={10} />
                            <span>When someone comments</span>
                          </div>
                          <div className="inline-block px-3 py-1.5 bg-slate-50 text-slate-700 rounded-2xl rounded-tl-none text-[11.5px] font-bold border border-slate-200/50 max-w-full truncate">
                            {rule.trigger_keyword === "Any comment" ? (
                              <span className="italic text-slate-500">Any comment</span>
                            ) : (
                              <span>"{rule.trigger_keyword}"</span>
                            )}
                          </div>
                        </div>

                        <div className="relative pl-6 border-l-2 border-dashed border-transparent pb-1">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#0ea5e9]" />
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-[#0ea5e9] uppercase tracking-wider mb-1">
                            <Send size={10} />
                            <span>Send Auto DM</span>
                          </div>
                          
                          <div className="bg-gradient-to-br from-[#0ea5e9]/5 to-sky-500/10 border border-[#0ea5e9]/10 rounded-2xl rounded-tl-none p-3 space-y-2.5 shadow-sm">
                            {parsed.attachedImage && (
                              <div className="w-full max-h-24 rounded-lg overflow-hidden border border-[#0ea5e9]/10 bg-white">
                                <img src={parsed.attachedImage} alt="Attachment" className="w-full h-full object-cover" />
                              </div>
                            )}
                            
                            {parsed.text && (
                              <p className="text-[12px] font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">{parsed.text}</p>
                            )}

                            {parsed.fileLink && (
                              <div className="flex items-center gap-2 p-2 bg-white border border-sky-100/50 rounded-xl">
                                <FileText size={13} className="text-[#0ea5e9] shrink-0" />
                                <a 
                                  href={parsed.fileLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[10.5px] font-bold text-[#0ea5e9] hover:underline truncate flex-1"
                                >
                                  Attached Link
                                </a>
                              </div>
                            )}

                            {parsed.button && (
                              <a 
                                href={parsed.button.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="block w-full py-1.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-center text-[11px] font-bold rounded-xl shadow-sm shadow-blue-500/10 transition-all text-ellipsis overflow-hidden whitespace-nowrap"
                              >
                                {parsed.button.name}
                              </a>
                            )}

                            {parsed.followRequest && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200/30 text-[9.5px] font-bold">
                                <Plus size={11} className="shrink-0" />
                                <span className="truncate">{parsed.followRequest}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="h-[1px] w-full bg-slate-100" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Executions</span>
                            <span className="text-[13px] font-bold text-slate-800 mt-0.5">{rule.executions || 0}</span>
                          </div>
                          <div className="w-px h-5 bg-slate-100" />
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Status</span>
                            <span className={`text-[12px] font-bold mt-0.5 ${rule.active ? "text-emerald-500" : "text-slate-300"}`}>
                              {rule.active ? "Active" : "Paused"}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleRule(rule.id, rule.active)}
                          className={`w-10 h-5.5 rounded-full transition-all relative ${rule.active ? "bg-[#2dd4bf]" : "bg-slate-200"}`}
                        >
                          <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all ${rule.active ? "left-5" : "left-0.5"}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-700">
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => setCurrentView("dashboard")}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 transition-all shadow-sm group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">YouTube to Reels AI</h1>
              <p className="text-[13px] text-slate-500 font-medium uppercase tracking-widest">Full-Page Transformation Engine</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-[3rem] p-8 sm:p-12 shadow-sm min-h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-500/5 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full" />

            {ytStep === 'input' && (
              <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 z-10">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-500 mx-auto shadow-sm border border-red-100/50">
                    <Video size={40} />
                  </div>
                  <h2 className="text-[32px] font-bold text-slate-900 tracking-tight">Paste Video Link</h2>
                  <p className="text-[15px] text-slate-500 max-w-md mx-auto leading-relaxed">Our AI will download the video, find the most engaging hooks, and generate ready-to-post Reels in vertical 9:16 format.</p>
                </div>

                <div className="space-y-6">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-red-500 transition-colors">
                      <LinkIcon size={24} />
                    </div>
                    <input 
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full h-18 rounded-[2rem] border border-slate-200 bg-white pl-16 pr-6 text-[16px] font-medium placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-red-500/5 focus:border-red-500/30 transition-all shadow-sm"
                    />
                  </div>
                  <button 
                    onClick={startYtProcessing}
                    disabled={!ytUrl.trim()}
                    className="w-full h-18 group relative flex items-center justify-center gap-6 bg-slate-900 hover:bg-black text-white rounded-[2rem] text-[18px] font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-2xl disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Start AI Transformation
                    <div className="bg-white p-2 rounded-full transition-transform group-hover:translate-x-2 shadow-sm">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
                  {[
                    { icon: <Clock className="text-blue-500" />, title: "Clip Optimization", desc: "Perfect 40-50s cuts" },
                    { icon: <MessageCircle className="text-emerald-500" />, title: "Smart Captions", desc: "AI subtitle burning" },
                    { icon: <Zap className="text-amber-500" />, title: "Viral Scoring", desc: "Hook detection magic" },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                      <div className="mb-4">{item.icon}</div>
                      <h4 className="text-[14px] font-bold text-slate-900">{item.title}</h4>
                      <p className="text-[12px] text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ytStep === 'processing' && (
              <div className="w-full max-w-md space-y-12 py-12 animate-in fade-in duration-700 z-10 text-center">
                <div className="relative mx-auto w-32 h-32">
                  <div className="absolute inset-0 rounded-[3rem] border-4 border-slate-100" />
                  <div 
                    className="absolute inset-0 rounded-[3rem] border-4 border-red-500 transition-all duration-500"
                    style={{ 
                      clipPath: `inset(0 ${100 - (processingStep + 1) * 25}% 0 0)`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white shadow-xl animate-pulse">
                      {processingStep === 0 ? <LinkIcon size={32} className="animate-bounce" /> : 
                       processingStep === 1 ? <Search size={32} className="animate-pulse" /> : 
                       processingStep === 2 ? <Scissors size={32} className="animate-bounce" /> : 
                       <Sparkles size={32} className="text-amber-400" />}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-[24px] font-bold text-slate-900">
                      {processingStep === 0 ? "Downloading video source..." : 
                       processingStep === 1 ? "Analyzing transcript for hooks..." : 
                       processingStep === 2 ? "Cropping to vertical 9:16..." : 
                       "Generating AI captions & titles..."}
                    </h3>
                    <p className="text-[14px] text-slate-400 font-bold uppercase tracking-widest">Step {processingStep + 1} of 4</p>
                  </div>
                  
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-1000 ease-out"
                      style={{ width: `${(processingStep + 1) * 25}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-4 max-w-sm mx-auto">
                  {[
                    { step: 0, label: "Fetching high-quality stream", icon: <LinkIcon size={18} /> },
                    { step: 1, label: "Semantic hook identification", icon: <Search size={18} /> },
                    { step: 2, label: "Smart-cropping AI center detection", icon: <Scissors size={18} /> },
                    { step: 3, label: "Auto-captioning & visual polish", icon: <Sparkles size={18} /> },
                  ].map((item) => (
                    <div 
                      key={item.step} 
                      className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] border transition-all duration-500 ${
                        processingStep === item.step ? "bg-white border-slate-200 shadow-lg scale-105 z-20" : 
                        processingStep > item.step ? "bg-emerald-50 border-emerald-100 opacity-60" : 
                        "bg-slate-50/50 border-transparent opacity-20 grayscale"
                      }`}
                    >
                      <div className={`${processingStep > item.step ? "text-emerald-500" : processingStep === item.step ? "text-slate-900" : "text-slate-300"}`}>
                        {processingStep > item.step ? <CheckCircle2 size={20} /> : item.icon}
                      </div>
                      <span className={`text-[15px] font-bold ${processingStep === item.step ? "text-slate-900" : "text-slate-400"}`}>{item.label}</span>
                      {processingStep === item.step && (
                        <div className="ml-auto flex gap-1">
                          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ytStep === 'results' && (
              <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-[32px] font-bold text-slate-900 tracking-tight">Your AI Reels are Ready!</h2>
                    <p className="text-[16px] text-slate-500 font-medium">Found 3 high-potential viral moments from the source.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setYtStep('input')}
                      className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[15px] font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <Video size={18} /> Try Another Video
                    </button>
                    <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[15px] font-bold hover:bg-black transition-all shadow-xl hover:scale-105 active:scale-95">
                      <CheckCircle2 size={20} className="text-emerald-400" /> Schedule All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {reelResults.map((reel) => (
                    <div key={reel.id} className="group flex flex-col rounded-[2.5rem] border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all border-transparent hover:border-red-100">
                      <div className="relative aspect-[9/16] bg-slate-900 overflow-hidden">
                        <img src={reel.video_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                        
                        <div className="absolute top-4 left-4 px-4 py-1.5 bg-white/20 backdrop-blur-xl rounded-full border border-white/30">
                          <span className="text-[11px] font-bold text-white uppercase tracking-widest">{reel.duration}</span>
                        </div>
                        
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                          <div className="h-10 w-10 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 flex items-center justify-center text-white cursor-pointer hover:bg-white hover:text-red-500 transition-all shadow-lg">
                            <Play size={20} fill="currentColor" className="ml-1" />
                          </div>
                          <div className="h-10 w-10 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 flex items-center justify-center text-white cursor-pointer hover:bg-red-500 hover:border-red-500 transition-all shadow-lg">
                            <Scissors size={18} />
                          </div>
                        </div>

                        <div className="absolute bottom-6 left-6 right-6 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="px-2.5 py-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-lg uppercase tracking-tighter shadow-lg">94% VIRAL SCORE</div>
                          </div>
                          <p className="text-white text-[14px] font-bold leading-tight line-clamp-3 drop-shadow-lg">
                            {reel.caption}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 space-y-6 bg-slate-50/30">
                        <div className="space-y-4">
                          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">AI Generated Title</p>
                            <p className="text-[14px] font-bold text-slate-800 line-clamp-1">{reel.title}</p>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Description</p>
                            <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2">{reel.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          <button 
                            onClick={() => {
                              if (scheduledReels.includes(reel.id)) return;
                              setScheduledReels(prev => [...prev, reel.id]);
                            }}
                            className={`w-full h-12 rounded-2xl text-[13px] font-bold transition-all border flex items-center justify-center gap-3 shadow-sm group ${
                              scheduledReels.includes(reel.id) 
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                                : "bg-white hover:bg-red-50 text-slate-900 hover:text-red-600 border-slate-100 hover:border-red-100"
                            }`}
                          >
                            {scheduledReels.includes(reel.id) ? (
                              <><CheckCircle2 size={16} /> Scheduled</>
                            ) : (
                              <><Clock size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" /> Auto Schedule</>
                            )}
                          </button>
                          <button 
                            onClick={() => {
                              setPostingReel(reel.id);
                              setTimeout(() => setPostingReel(null), 2000);
                            }}
                            disabled={postingReel === reel.id}
                            className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-2xl text-[13px] font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70"
                          >
                            {postingReel === reel.id ? (
                              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting...</>
                            ) : (
                              <><Send size={16} /> Post Now</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-8 rounded-[3rem] bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[80px] rounded-full" />
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-2xl">
                      <MessageCircle size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[20px] font-bold tracking-tight">AI Multi-Platform Captioning</p>
                      <p className="text-[14px] text-slate-400 font-medium">Captions optimized for Instagram Reels, YouTube Shorts, and TikTok SEO.</p>
                    </div>
                  </div>
                  <button className="px-10 py-4 bg-white text-slate-900 rounded-[1.5rem] text-[15px] font-black transition-all hover:scale-105 active:scale-95 shadow-2xl relative z-10">
                    Customize AI Persona
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && currentView === 'dashboard' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 sm:p-6 overflow-hidden">
            <style>{hideScrollbarStyle}</style>
            <section className={`w-full max-w-md bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-200/80`}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50 shrink-0">
                <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
                  {formStep === "trigger_selection" ? "Trigger AutoDM when someone..." : 
                   formStep === "select_post" ? "Select the Reel to automate" : 
                   formStep === "trigger_setup" ? "Setup keyword triggers" :
                   formStep === "confirm_launch" ? "Launch AutoDM" :
                   "Create auto-DM rule"}
                </h2>
                <button 
                  onClick={() => setShowForm(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto hide-scrollbar max-h-[80vh]">
                {activeProvider === 'instagram' ? (
                  <>
                    {formStep === "trigger_selection" && (
                      <div className="space-y-2.5">
                        {[
                          { id: "comment_reel", label: "Comments on your Reels", icon: <InstagramIcon size={18} />, color: "bg-pink-50 text-pink-500" },
                          { id: "comment_post", label: "Comments on your Posts", icon: <Video size={18} />, color: "bg-blue-50 text-blue-500" },
                          { id: "dm", label: "Sends you a DM", icon: <Send size={18} />, color: "bg-emerald-50 text-emerald-500" },
                          { id: "story_reply", label: "Replies to your Story", icon: <Sparkles size={18} />, color: "bg-purple-50 text-purple-500" },
                        ].map((trigger) => (
                          <button 
                            key={trigger.id}
                            onClick={() => handleTriggerSelect(trigger.id as any)}
                            className="w-full flex items-center gap-4 p-4 sm:p-5 bg-white border border-slate-200/80 rounded-[1.5rem] hover:border-slate-300 hover:shadow-md transition-all group text-left shadow-sm"
                          >
                            <div className={`w-12 h-12 rounded-xl ${trigger.color} flex items-center justify-center transition-transform group-hover:scale-110 shrink-0`}>
                              {trigger.icon}
                            </div>
                            <span className="text-[15px] font-bold text-slate-800 tracking-tight">{trigger.label}</span>
                            <ChevronRight size={18} className="ml-auto text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}

                    {formStep === "connect" && (
                      <div className="flex flex-col items-center py-8 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 mb-6">
                          <InstagramIcon className="h-8 w-8 text-pink-500" />
                        </div>
                        <h3 className="text-[18px] font-bold text-slate-900 mb-2">Connect Instagram Page</h3>
                        <p className="text-[14px] text-slate-500 text-center mb-8 max-w-[280px]">Link your professional Instagram account to start automating comments.</p>
                        <button 
                          onClick={handleConnect}
                          disabled={saving}
                          className="w-full max-w-xs inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-[14px] font-bold text-white transition-all hover:bg-slate-800 shadow-lg disabled:opacity-70 active:scale-95"
                        >
                          {saving ? "Linking..." : "Connect Now"}
                        </button>
                      </div>
                    )}

                    {formStep === "select_post" && (
                      <div className="space-y-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-3">
                            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                              <div className="w-full h-full rounded-full bg-white p-0.5">
                                {selectedAccount?.profile_picture_url ? (
                                  <img src={selectedAccount.profile_picture_url} alt="User" className="w-full h-full rounded-full object-cover" />
                                ) : session?.user?.image ? (
                                  <img src={session.user.image} alt="User" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                    <User size={32} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <h3 className="text-[15px] font-bold text-slate-900">@{selectedAccount?.username || session?.user?.name || "connected_account"}</h3>
                            <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Connected Live</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[14px] font-bold text-slate-800">The Comment is on...</p>
                          <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-200/80 shadow-sm">
                            {["Specific Post/Reel", "Any Post/Reel", "Next Post/Reel"].map((label, idx) => {
                              const type = ["specific", "any", "next"][idx] as any;
                              return (
                                <button 
                                  key={type}
                                  onClick={() => {
                                    setCommentType(type);
                                    if (type !== "specific") {
                                      setForm(prev => ({ ...prev, instagram_media_id: "", target_post_url: "" }));
                                    }
                                  }}
                                  className={`flex-1 py-2.5 text-[12px] font-bold rounded-xl transition-all ${commentType === type ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mb-4">
                           <button onClick={() => setContentTab("posts")} className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ${contentTab === "posts" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>Posts</button>
                           <button onClick={() => setContentTab("reels")} className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ${contentTab === "reels" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>Reels</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
                          {loadingPosts ? (
                             <div className="col-span-3 flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-slate-200 border-t-[#2563EB] rounded-full animate-spin" />
                             </div>
                          ) : realPosts.length > 0 ? (
                            realPosts
                              .filter(p => contentTab === "reels" ? p.media_type === "VIDEO" : p.media_type !== "VIDEO")
                              .map((post, i) => {
                                const imageUrl = post.media_url;
                                const thumbUrl = post.thumbnail_url || imageUrl;
                                const targetUrl = post.permalink || imageUrl;
                                return (
                                  <div 
                                    key={post.id} 
                                    onClick={() => handleSelectPost(targetUrl, post.id, thumbUrl)}
                                    className={`cursor-pointer group relative rounded-xl overflow-hidden border transition-all aspect-square ${form.instagram_media_id === post.id ? "ring-2 ring-[#0ea5e9] ring-offset-2" : "border-slate-100 hover:shadow-md"}`}
                                  >
                                    <img src={thumbUrl} alt={`Content ${i}`} className="w-full h-full object-cover" />
                                  </div>
                                );
                              })
                          ) : (
                            <div className="col-span-3 text-center py-8 text-[12px] font-semibold text-slate-400">
                              No Instagram {contentTab === "reels" ? "reels" : "posts"} found.
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-4 shrink-0">
                          <span className="text-[12px] font-bold text-slate-400">Step 1 of 3</span>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setFormStep("trigger_selection")}
                              className="px-6 py-2 rounded-full border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              Back
                            </button>
                            <button 
                              onClick={() => setFormStep("trigger_setup")}
                              disabled={!form.target_post_url && commentType === "specific"}
                              className="group relative flex items-center gap-4 bg-slate-900 hover:bg-black text-white pl-6 pr-1 py-1 rounded-full text-[13px] font-bold transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-30"
                            >
                              Next Step
                              <div className="bg-white p-1 rounded-full transition-transform group-hover:translate-x-0.5 shadow-sm">
                                <ArrowRight className="h-3.5 w-3.5 text-[#0ea5e9]" />
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {formStep === "trigger_setup" && (
                      <div className="space-y-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-2">
                            <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                              <div className="w-full h-full rounded-full bg-white p-0.5">
                                {selectedAccount?.profile_picture_url ? (
                                  <img src={selectedAccount.profile_picture_url} alt="User" className="w-full h-full rounded-full object-cover" />
                                ) : session?.user?.image ? (
                                  <img src={session.user.image} alt="User" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                    <User size={24} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <h3 className="text-[14px] font-bold text-slate-900">@{selectedAccount?.username || session?.user?.name || "connected_account"}</h3>
                            <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Account Synced</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[14px] font-bold text-slate-800">What kind of comment should trigger this automation?</p>
                          <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-200/80 shadow-sm">
                            <button 
                              onClick={() => setTriggerType("keyword")}
                              className={`flex-1 py-2.5 text-[12px] font-bold rounded-xl transition-all ${triggerType === "keyword" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}
                            >
                              Specific keyword
                            </button>
                            <button 
                              onClick={() => setTriggerType("any")}
                              className={`flex-1 py-2.5 text-[12px] font-bold rounded-xl transition-all ${triggerType === "any" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}
                            >
                              Any comment
                            </button>
                          </div>
                        </div>

                        {triggerType === "keyword" && (
                          <div className="space-y-3">
                            <p className="text-[13px] font-bold text-slate-800">Should include any of these:</p>
                            <div className="relative">
                              <input 
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && keywordInput.trim()) {
                                    setKeywords([...keywords, keywordInput.trim()]);
                                    setKeywordInput("");
                                  }
                                }}
                                placeholder="Type a keyword (min. 1 characters)"
                                className="w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-20 py-3 text-[13px] text-slate-800 focus:outline-none focus:border-[#0ea5e9] transition-all"
                              />
                              <button 
                                onClick={() => {
                                  if (keywordInput.trim()) {
                                    setKeywords([...keywords, keywordInput.trim()]);
                                    setKeywordInput("");
                                  }
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                              >
                                <Plus size={14} /> Add
                              </button>
                            </div>
                            
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              Keywords are not case-sensitive. Automations trigger only on exact keyword matches.
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-4 sm:p-5 bg-white border border-slate-200/80 rounded-[1.5rem] shadow-sm">
                          <span className="text-[14px] font-bold text-slate-800">Auto-Reply to comments</span>
                          <button 
                            onClick={() => setAutoReply(!autoReply)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${autoReply ? "bg-slate-900" : "bg-slate-200"}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${autoReply ? "left-6" : "left-1"}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-4 shrink-0">
                          <span className="text-[12px] font-bold text-slate-400">Step 2 of 3</span>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setFormStep("select_post")}
                              className="px-6 py-2 rounded-full border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              Back
                            </button>
                            <button 
                              onClick={() => setFormStep("action_setup")}
                              className="group relative flex items-center gap-4 bg-slate-900 hover:bg-black text-white pl-6 pr-1 py-1 rounded-full text-[13px] font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
                            >
                              Next Step
                              <div className="bg-white p-1 rounded-full transition-transform group-hover:translate-x-0.5 shadow-sm">
                                <ArrowRight className="h-3.5 w-3.5 text-[#0ea5e9]" />
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {formStep === "action_setup" && (
                      <div className="space-y-5">
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-2">
                            <div className="w-14 h-14 rounded-full p-1 border border-slate-100 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                              <div className="w-full h-full rounded-full bg-white p-0.5">
                                {selectedAccount?.profile_picture_url ? (
                                  <img src={selectedAccount.profile_picture_url} alt="User" className="w-full h-full rounded-full object-cover" />
                                ) : session?.user?.image ? (
                                  <img src={session.user.image} alt="User" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <User size={20} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <h3 className="text-[13px] font-bold text-slate-900">@{selectedAccount?.username || session?.user?.name || "connected_account"}</h3>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[14px] font-bold text-slate-800">Before you send your primary DM, send them...</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-4 sm:p-5 bg-white border border-slate-200/80 rounded-[1.5rem] shadow-sm">
                              <span className="text-[14px] font-bold text-slate-800">Ask to follow you</span>
                              <button 
                                onClick={() => setAskToFollow(!askToFollow)}
                                className={`w-11 h-6 rounded-full transition-colors relative ${askToFollow ? "bg-slate-900" : "bg-slate-200"}`}
                              >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${askToFollow ? "left-6" : "left-1"}`} />
                              </button>
                            </div>
                            {askToFollow && (
                              <div className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                <label className="text-[12px] font-bold text-slate-700 mb-1 block">Follow Request Message</label>
                                <input
                                  type="text"
                                  value={form.follow_message}
                                  onChange={(e) => setForm((f) => ({ ...f, follow_message: e.target.value }))}
                                  placeholder="Hey! Make sure to follow me first so I can send the link!"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-[#0096d6]"
                                />
                              </div>
                            )}
                            <div className="flex items-center justify-between p-4 sm:p-5 bg-white border border-slate-200/80 rounded-[1.5rem] shadow-sm">
                              <span className="text-[14px] font-bold text-slate-800">Ask to share their email</span>
                              <button 
                                onClick={() => setAskForEmail(!askForEmail)}
                                className={`w-11 h-6 rounded-full transition-colors relative ${askForEmail ? "bg-slate-900" : "bg-slate-200"}`}
                              >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${askForEmail ? "left-6" : "left-1"}`} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <p className="text-[14px] font-bold text-slate-800">Then send the primary DM...</p>
                            <p className="text-[12px] text-slate-500 leading-relaxed">
                              Write the message you want to auto-send with a button that takes them to your link or product.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-white border-dashed">
                            <div>
                              <label className="text-[12px] font-bold text-slate-800 mb-1 block">DM type</label>
                              <select 
                                value={form.dm_type}
                                onChange={(e) => setForm(f => ({ ...f, dm_type: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-[#0096d6] transition-all"
                              >
                                <option>Message Only</option>
                                <option>Message + Link + Image</option>
                                <option>Link Only</option>
                                <option>Image Only</option>
                              </select>
                            </div>

                            {form.dm_type.includes("Message") && (
                              <div>
                                <label className="text-[12px] font-bold text-slate-800 mb-1 block">DM content</label>
                                <div className="rounded-xl border border-slate-200 overflow-hidden">
                                  <textarea
                                    value={form.reply_message}
                                    onChange={(e) => setForm((f) => ({ ...f, reply_message: e.target.value }))}
                                    placeholder="Hi there! Appreciate your comment..."
                                    rows={4}
                                    className="w-full p-3 text-[13px] text-slate-800 focus:outline-none resize-none"
                                  />
                                </div>
                              </div>
                            )}

                            {form.dm_type.includes("Image") && (
                              <div>
                                <label className="text-[12px] font-bold text-slate-800 mb-1 block">Image URL</label>
                                <input
                                  type="text"
                                  value={form.image_url}
                                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                                  placeholder="https://example.com/image.jpg"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-[#0096d6]"
                                />
                              </div>
                            )}

                            {form.dm_type.includes("Link") && (
                              <div>
                                <label className="text-[12px] font-bold text-slate-800 mb-1 block">URL Link</label>
                                <input
                                  type="text"
                                  value={form.link_attachment}
                                  onChange={(e) => setForm((f) => ({ ...f, link_attachment: e.target.value }))}
                                  placeholder="https://yourwebsite.com"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-[#0096d6]"
                                />
                              </div>
                            )}

                            {!showButtonSetup ? (
                              <button 
                                onClick={() => setShowButtonSetup(true)}
                                className="w-full py-2 border border-slate-200 border-dashed rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                              >
                                <Plus size={14} /> Add a button
                              </button>
                            ) : (
                              <div className="space-y-2 p-3 bg-slate-50 border border-slate-100 rounded-xl relative">
                                <button 
                                  onClick={() => {
                                    setShowButtonSetup(false);
                                    setForm(f => ({ ...f, button_name: "", button_link: "" }));
                                  }}
                                  className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                                >
                                  <X size={14} />
                                </button>
                                <label className="text-[12px] font-bold text-slate-800 block">Action Button</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={form.button_name}
                                    onChange={(e) => setForm((f) => ({ ...f, button_name: e.target.value }))}
                                    placeholder="Button text (e.g. Get Started)"
                                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-[#0096d6]"
                                  />
                                  <input
                                    type="text"
                                    value={form.button_link}
                                    onChange={(e) => setForm((f) => ({ ...f, button_link: e.target.value }))}
                                    placeholder="Button URL"
                                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-[#0096d6]"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <button className="w-full py-2 border border-[#0096d6] border-dashed rounded-xl text-[12px] font-bold text-[#0096d6] bg-blue-50/50 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                            <Plus size={14} /> Add follow-up message
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2 shrink-0">
                          <span className="text-[12px] font-medium text-slate-400">Step 3 of 3</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setFormStep("trigger_setup")}
                              className="px-5 py-2 rounded-full border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              Back
                            </button>
                            <button 
                              onClick={() => setFormStep("confirm_launch")}
                              disabled={(!form.reply_message && !form.link_attachment && !form.image_url)}
                              className="group relative flex items-center gap-4 bg-slate-900 hover:bg-black text-white pl-6 pr-1 py-1 rounded-full text-[13px] font-bold transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50"
                            >
                              Review & Launch
                              <div className="bg-white p-1 rounded-full transition-transform group-hover:translate-x-0.5 shadow-sm">
                                <ArrowRight className="h-3.5 w-3.5 text-[#0ea5e9]" />
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {formStep === "confirm_launch" && (
                      <div className="space-y-6 pb-4">
                        <p className="text-[15px] font-bold text-slate-800">Awesome! Let's review once before we launch!</p>
                        
                        <div className="space-y-6 pl-2">
                          <div className="space-y-3">
                            <p className="text-[14px] font-medium text-slate-600">When someone...</p>
                            <div className="flex gap-3">
                              <div className="pt-1 text-slate-300">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10l5 5 5-5"/></svg>
                              </div>
                              <div className="space-y-3 flex-1">
                                <p className="text-[14px] font-bold text-slate-800">comments on this specific post</p>
                                <img src={form.target_post_thumbnail || form.target_post_url || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400"} alt="Target" className="w-40 h-40 rounded-2xl object-cover shadow-md border border-slate-100" />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[14px] font-medium text-slate-600">and <span className="font-bold text-slate-800">includes</span> the following keywords in their comment</p>
                            <div className="flex gap-3">
                              <div className="pt-1 text-slate-300">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10l5 5 5-5"/></svg>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {keywords.length > 0 ? keywords.map((kw, i) => (
                                  <span key={i} className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[13px] font-bold rounded-xl border border-emerald-100">
                                    {kw}
                                  </span>
                                )) : <span className="px-4 py-2 bg-slate-50 text-slate-500 text-[13px] font-bold rounded-xl border border-slate-100 italic">Any comment</span>}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[14px] font-medium text-slate-600">leave a reply to their comment on the post</p>
                            <div className="flex gap-3">
                              <div className="pt-1 text-slate-300">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10l5 5 5-5"/></svg>
                              </div>
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                    <User size={14} className="text-slate-500" />
                                  </div>
                                  <span className="text-[13px] font-bold text-slate-800">User</span>
                                  <span className="text-[13px] text-slate-500">This is a comment</span>
                                </div>
                                <div className="flex items-start gap-2 ml-4">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-0.5">
                                    <div className="w-full h-full rounded-full bg-white p-0.5">
                                      <img src={selectedAccount?.profile_picture_url || session?.user?.image || "/api/placeholder/24/24"} className="w-full h-full rounded-full object-cover" />
                                    </div>
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[13px] font-bold text-slate-800">You</span>
                                      <span className="text-[13px] text-[#0096d6]">@user</span>
                                    </div>
                                    <p className="text-[13px] text-slate-600">Sent you a message! Check it out!</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[14px] font-medium text-slate-600">after they click the button, send the primary DM</p>
                            <div className="flex gap-3">
                              <div className="pt-1 text-slate-300">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10l5 5 5-5"/></svg>
                              </div>
                              <div className="flex-1 max-w-[80%] bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                <p className="text-[14px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                                  {form.reply_message}
                                  {askToFollow && form.follow_message && <span className="block mt-2 text-indigo-500 font-medium">[Follow Request: {form.follow_message}]</span>}
                                  {form.image_url && <span className="block mt-2 text-sky-500 font-medium">[Attached Image: {form.image_url}]</span>}
                                  {form.link_attachment && <span className="block mt-2 text-sky-500 font-medium">[Attached Link: {form.link_attachment}]</span>}
                                </p>
                                {form.button_name && (
                                  <div className="mt-3 inline-block px-4 py-2 bg-[#0ea5e9] text-white text-[12px] font-bold rounded-lg shadow-sm">
                                    {form.button_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6 shrink-0">
                          <div />
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setFormStep("action_setup")}
                              className="px-6 py-2.5 rounded-full border border-slate-200 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              Back
                            </button>
                            <button 
                              onClick={createRule}
                              disabled={saving}
                              className="group relative flex items-center gap-5 bg-slate-900 hover:bg-black text-white pl-6 pr-1.5 py-1.5 rounded-full text-[14px] font-bold transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl w-fit"
                            >
                              {saving ? "Launching..." : "Confirm & launch"}
                              <div className="bg-white p-1.5 rounded-full transition-transform group-hover:translate-x-0.5 shadow-sm">
                                <CheckCircle2 className="h-4 w-4 text-[#0ea5e9]" />
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-8 min-h-[300px]">
                    {ytStep === 'input' && (
                      <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mb-4 shadow-sm border border-red-100/50">
                            <Video size={32} />
                          </div>
                          <h3 className="text-[20px] font-bold text-slate-900">Transform YouTube to Reels</h3>
                          <p className="text-[14px] text-slate-500 mt-2 max-w-[300px]">Paste a YouTube link and our AI will find viral moments, cut 40-50s clips, and add captions.</p>
                        </div>

                        <div className="space-y-4">
                          <div className="relative group">
                            <input 
                              value={ytUrl}
                              onChange={(e) => setYtUrl(e.target.value)}
                              placeholder="https://youtube.com/watch?v=..."
                              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500/30 transition-all shadow-sm"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors">
                              <LinkIcon size={18} />
                            </div>
                          </div>
                          <button 
                            onClick={startYtProcessing}
                            disabled={!ytUrl.trim()}
                            className="group relative w-full flex items-center justify-center gap-5 bg-slate-900 hover:bg-black text-white px-6 py-4 rounded-2xl text-[15px] font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl disabled:opacity-30"
                          >
                            Analyze & Generate Reels
                            <div className="bg-white p-1.5 rounded-full transition-transform group-hover:translate-x-1 shadow-sm">
                              <Sparkles className="h-4 w-4 text-amber-500" />
                            </div>
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4">
                          {[
                            { icon: <Clock size={16} />, label: "40-50s Clips" },
                            { icon: <MessageCircle size={16} />, label: "Auto Captions" },
                            { icon: <Zap size={16} />, label: "Viral Scoring" },
                          ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                              <div className="text-slate-400">{item.icon}</div>
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight text-center leading-tight">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ytStep === 'processing' && (
                      <div className="py-12 flex flex-col items-center text-center space-y-8 animate-in fade-in duration-700">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl animate-pulse">
                            {processingStep === 0 ? <LinkIcon size={40} className="animate-bounce" /> : 
                             processingStep === 1 ? <User size={40} className="animate-spin-slow" /> : 
                             processingStep === 2 ? <Trash2 size={40} className="animate-pulse" /> : 
                             <Sparkles size={40} className="text-amber-400 animate-pulse" />}
                          </div>
                          <div className="absolute -inset-4 border-2 border-dashed border-slate-200 rounded-[3rem] animate-spin-slow opacity-20" />
                        </div>

                        <div className="space-y-4 w-full max-w-[280px]">
                          <div className="flex flex-col gap-1">
                            <h3 className="text-[18px] font-bold text-slate-900">
                              {processingStep === 0 ? "Downloading video..." : 
                               processingStep === 1 ? "Analyzing for hooks..." : 
                               processingStep === 2 ? "Cutting perfect 45s clips..." : 
                               "Adding AI captions & magic..."}
                            </h3>
                            <p className="text-[13px] text-slate-400 font-medium tracking-wide">PLEASE WAIT, MAGIC IN PROGRESS</p>
                          </div>
                          
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-slate-900 transition-all duration-1000 ease-out"
                              style={{ width: `${(processingStep + 1) * 25}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-4 gap-2 pt-2">
                            {[0, 1, 2, 3].map((s) => (
                              <div 
                                key={s} 
                                className={`h-1 rounded-full transition-all duration-500 ${s <= processingStep ? "bg-emerald-400" : "bg-slate-200"}`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                          {[
                            { step: 0, label: "Fetching source data", icon: <LinkIcon size={14} /> },
                            { step: 1, label: "AI Virality analysis", icon: <Radio size={14} /> },
                            { step: 2, label: "FFmpeg frame-perfect cutting", icon: <Scissors size={14} /> },
                            { step: 3, label: "Dynamic caption rendering", icon: <Sparkles size={14} /> },
                          ].map((item) => (
                            <div 
                              key={item.step} 
                              className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-500 ${
                                processingStep === item.step ? "bg-white border-slate-200 shadow-sm scale-105" : 
                                processingStep > item.step ? "bg-emerald-50 border-emerald-100 opacity-60" : 
                                "bg-slate-50/30 border-transparent opacity-20 grayscale"
                              }`}
                            >
                              <div className={`${processingStep > item.step ? "text-emerald-500" : "text-slate-400"}`}>
                                {processingStep > item.step ? <CheckCircle2 size={16} /> : item.icon}
                              </div>
                              <span className={`text-[12px] font-bold ${processingStep === item.step ? "text-slate-900" : "text-slate-400"}`}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ytStep === 'results' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-[22px] font-bold text-slate-900 tracking-tight">AI Generated Reels</h3>
                            <p className="text-[14px] text-slate-500 font-medium">3 viral moments found and processed</p>
                          </div>
                          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[13px] font-bold hover:bg-black transition-all shadow-lg active:scale-95">
                            <Plus size={16} /> Schedule All
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {reelResults.map((reel) => (
                            <div key={reel.id} className="group flex flex-col rounded-[2rem] border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all border-transparent hover:border-red-100">
                              <div className="relative aspect-[9/16] bg-slate-900 overflow-hidden">
                                <img src={reel.video_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                  <p className="text-white text-[12px] font-bold leading-tight line-clamp-2 drop-shadow-md">
                                    <span className="text-red-400">#AI:</span> {reel.caption}
                                  </p>
                                </div>
                                <div className="absolute top-4 left-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">{reel.duration}</span>
                                </div>
                                <div className="absolute top-4 right-4 h-8 w-8 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 flex items-center justify-center text-white cursor-pointer hover:bg-white hover:text-red-500 transition-all">
                                  <Play size={16} fill="currentColor" className="ml-0.5" />
                                </div>
                              </div>
                              <div className="p-5 space-y-4">
                                <div>
                                  <h4 className="text-[15px] font-bold text-slate-900 truncate">{reel.title}</h4>
                                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-1">Status: Pending</p>
                                </div>
                                <div className="space-y-2">
                                  <button className="w-full py-2.5 bg-slate-50 hover:bg-red-50 text-slate-900 hover:text-red-600 rounded-xl text-[12px] font-bold transition-all border border-transparent hover:border-red-100 flex items-center justify-center gap-2">
                                    <Clock size={14} /> Auto Schedule
                                  </button>
                                  <button className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[12px] font-bold transition-all shadow-md active:scale-95">
                                    Post Now
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                              <CheckCircle2 size={24} />
                            </div>
                            <div>
                              <p className="text-[15px] font-bold text-slate-900">Auto Captions Applied</p>
                              <p className="text-[12px] text-slate-500 font-medium">Synced with audio using OpenAI Whisper AI</p>
                            </div>
                          </div>
                          <button className="text-[13px] font-bold text-[#0ea5e9] hover:underline">Edit captions</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {rules.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Active Rules</h2>
                <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[11px] font-bold text-slate-500">{rules.length}</span>
              </div>
            </div>
            
            {loadingData ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0ea5e9] border-t-transparent" />
            </div>
          ) : rules.length > 0 && (
            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {rules.map((rule) => {
                const ruleAccount = instagramAccounts.find(acc => acc.id === rule.instagram_account_id);
                const parsed = parseReplyMessage(rule.reply_message);
                const matchingPost = realPosts.find(p => p.id === rule.instagram_media_id);
                const thumbUrl = matchingPost?.thumbnail_url || matchingPost?.media_url;
                const postCaption = matchingPost?.caption || "Instagram Post";

                return (
                  <div key={rule.id} className="group relative flex flex-col md:flex-row md:items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#2563EB]/20 gap-4 md:gap-0">
                    <div className="flex items-center gap-5 flex-wrap md:flex-nowrap flex-1">
                      <div className="flex items-center gap-3.5 min-w-[200px] max-w-[250px]">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1.5px] shadow-sm shrink-0">
                          <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center text-slate-700">
                            <InstagramIcon size={20} />
                          </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[14px] font-bold text-slate-900 truncate">{rule.name || `Rule #${rule.id.slice(0, 4)}`}</span>
                          {ruleAccount ? (
                            <span className="text-[11px] text-slate-400 font-bold mt-0.5">@{ruleAccount.username}</span>
                          ) : (
                            <span className="text-[11.5px] text-slate-400 font-medium">Instagram</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="h-8 w-px bg-slate-100 hidden md:block" />
                      
                      <div className="flex flex-col min-w-[150px] max-w-[200px]">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target Content</span>
                        {rule.comment_scope === "specific" ? (
                          <div className="flex items-center gap-2">
                            {thumbUrl ? (
                              <img src={thumbUrl} alt="Target post" className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-md bg-pink-50 flex items-center justify-center text-pink-500 border border-pink-100 shrink-0">
                                <InstagramIcon size={12} />
                              </div>
                            )}
                            <span className="text-[12px] font-bold text-slate-700 truncate">{postCaption}</span>
                          </div>
                        ) : rule.comment_scope === "any" ? (
                          <span className="text-[12px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md w-fit">Any Post/Reel</span>
                        ) : (
                          <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">Next Post/Reel</span>
                        )}
                      </div>

                      <div className="h-8 w-px bg-slate-100 hidden md:block" />
                      
                      <div className="flex flex-col min-w-[110px]">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Trigger Keyword</span>
                        <span className="text-[12.5px] font-bold text-slate-700 truncate">
                          {rule.trigger_keyword === "Any comment" ? (
                            <span className="italic text-slate-400">Any comment</span>
                          ) : (
                            <span>"{rule.trigger_keyword}"</span>
                          )}
                        </span>
                      </div>

                      <div className="h-8 w-px bg-slate-100 hidden md:block" />

                      <div className="flex flex-col min-w-[200px] max-w-[300px] flex-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Auto DM Message</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-bold text-slate-700 truncate max-w-[180px]">
                            {parsed.text || <span className="italic text-slate-400">No text content</span>}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {parsed.attachedImage && (
                              <span className="px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded text-[9px] font-black uppercase tracking-wider" title="Image Attached">Image</span>
                            )}
                            {parsed.fileLink && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-wider" title="File Link Attached">File</span>
                            )}
                            {parsed.button && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-wider" title={`Button: ${parsed.button.name}`}>Button</span>
                            )}
                            {parsed.followRequest && (
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black uppercase tracking-wider" title="Follow Required">Follow</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="h-8 w-px bg-slate-100 hidden md:block" />

                      <div className="flex flex-col min-w-[70px]">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Executions</span>
                        <span className="text-[13px] font-bold text-slate-800">{rule.executions || 0}</span>
                      </div>

                      <div className="h-8 w-px bg-slate-100 hidden md:block" />

                      <div className="flex flex-col min-w-[80px]">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</span>
                        <div className="flex items-center gap-1.5">
                          {rule.active ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[12px] font-bold text-emerald-600">Active</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              <span className="text-[12px] font-bold text-slate-500">Paused</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 md:mt-0 shrink-0">
                      <button 
                        onClick={() => toggleRule(rule.id, !rule.active)}
                        className={`px-5 py-2 rounded-xl text-[12px] font-bold transition-all ${rule.active ? "bg-slate-50 text-slate-600 hover:bg-slate-100" : "bg-[#0ea5e9] text-white shadow-md shadow-blue-500/20"}`}
                      >
                        {rule.active ? "Pause" : "Activate"}
                      </button>
                      <button 
                        onClick={() => deleteRule(rule.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
