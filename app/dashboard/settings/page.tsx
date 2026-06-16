"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Plus,
  LogOut,
  ChevronRight,
  X,
  ChevronDown
} from "lucide-react";
import { InstagramIcon as Instagram } from "@/components/icons";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

type ViewState = "loading" | "not_connected" | "success" | "settings";

type InstagramAccount = {
  id: string;
  username: string;
  profile_picture_url?: string | null;
};

type InstagramPost = {
  id: string;
  permalink?: string;
  media_type?: string;
  thumbnail_url?: string | null;
  media_url?: string | null;
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState("");
  const [postsByAccount, setPostsByAccount] = useState<Record<string, InstagramPost[]>>({});
  const [loadingPostsFor, setLoadingPostsFor] = useState<string | null>(null);
  const [postsVisibleFor, setPostsVisibleFor] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPosts = async (accountId: string) => {
    if (postsVisibleFor === accountId) {
      setPostsVisibleFor(null);
      return;
    }

    setPostsVisibleFor(accountId);

    if (postsByAccount[accountId]?.length) return;

    setLoadingPostsFor(accountId);
    try {
      const res = await fetch(`/api/instagram-posts?accountId=${encodeURIComponent(accountId)}`);
      const { data } = await res.json();
      if (data) {
        setPostsByAccount((prev) => ({ ...prev, [accountId]: data }));
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoadingPostsFor(null);
    }
  };


  const loadInstagramAccounts = useCallback(async (checkSuccessParam = true) => {
    try {
      const res = await fetch("/api/instagram-account");
      const { data } = await res.json();
      const accounts = Array.isArray(data) ? data : [];

      setInstagramAccounts(accounts);
      if (accounts.length > 0) {
        const savedActiveId = localStorage.getItem("active_instagram_account_id");
        const found = accounts.find((acc) => acc.id === savedActiveId);
        if (found) {
          setActiveAccountId(found.id);
        } else {
          setActiveAccountId(accounts[0].id);
          localStorage.setItem("active_instagram_account_id", accounts[0].id);
        }
      } else {
        setActiveAccountId(null);
      }

      if (checkSuccessParam) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true' || urlParams.get('connected') === 'true') {
          setViewState("success");
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          return;
        }
      }

      if (accounts.length === 0) {
        setViewState("not_connected");
      } else {
        setViewState("settings");
      }
    } catch (err) {
      console.error("Failed to fetch instagram account:", err);
      setViewState("not_connected");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Parse query params for errors
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get('error');
      if (errorParam) {
        const msg = decodeURIComponent(errorParam);
        setErrorMessage(msg);
        setIsConnecting(false);
        toast.error(`Instagram connection failed: ${msg}`);
        
        // Clean URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    loadInstagramAccounts(true);

    const channel = supabase
      .channel('instagram_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instagram_accounts',
          filter: `user_id=eq.${session.user.id}`
        },
        () => {
          loadInstagramAccounts(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, loadInstagramAccounts]);

  const connectInstagram = async () => {
    setIsConnecting(true);
    setConnectionStep("Redirecting to Instagram...");
    setErrorMessage(null);
    window.location.href = "/api/auth/instagram/link?returnTo=/dashboard/settings";
  };

  const disconnectInstagram = async (accountId: string) => {
    if (!session?.user?.id) return;
    if (!confirm("Are you sure you want to disconnect this Instagram account? This will also disable any automations set up for this account.")) {
      return;
    }

    try {
      const response = await fetch(`/api/instagram-account?accountId=${encodeURIComponent(accountId)}`, {
        method: "DELETE",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to disconnect account");
      }

      setInstagramAccounts((prev) => {
        const nextAccounts = prev.filter((account) => account.id !== accountId);

        if (nextAccounts.length === 0) {
          setViewState("not_connected");
          setActiveAccountId(null);
          localStorage.removeItem("active_instagram_account_id");
        } else if (activeAccountId === accountId) {
          setActiveAccountId(nextAccounts[0].id);
          localStorage.setItem("active_instagram_account_id", nextAccounts[0].id);
        }

        return nextAccounts;
      });
      setPostsByAccount((prev) => {
        const next = { ...prev };
        delete next[accountId];
        return next;
      });
      setPostsVisibleFor((current) => (current === accountId ? null : current));

      toast.success("Instagram account disconnected");
    } catch (error) {
      console.error("Failed to disconnect instagram account:", error);
      toast.error("Failed to disconnect account");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-[#2563EB] rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse text-sm">Initializing settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen overflow-y-auto bg-white pt-24 md:pt-20">
      <div className="relative mx-auto max-w-7xl px-6 md:px-8 pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-15 h-72 w-72 rounded-full bg-sky-200/30 blur-[120px]" />
          <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-amber-200/30 blur-[120px]" />
        </div>
        <AnimatePresence mode="wait">
          {/* STEP 1: NOT CONNECTED — Login-page style */}
          {viewState === "not_connected" && (
            <motion.div
              key="not_connected"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Full-page login-style shell */}
              <div className="relative flex min-h-screen flex-col justify-between bg-white px-6 py-6 md:px-12 -mt-20 -mx-4 md:-mx-8">

                {/* Top header row — mirrors login page */}
                <div className="flex items-center justify-between w-full">
                  <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200/80 bg-white hover:bg-slate-50 text-[13px] font-bold text-slate-600 rounded-full transition-all shadow-sm active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    <span>Back</span>
                  </button>

                  {/* Pill logo badge */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/80 bg-white shadow-sm">
                    <div className="w-5 h-5 rounded-md bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center">
                      <Instagram size={11} className="text-white" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-700">StartProfile</span>
                  </div>
                </div>

                {/* Center card — exactly mirrors login card layout */}
                <div className="flex-1 flex flex-col items-center justify-center py-12">
                  <div className="w-full max-w-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">

                    {/* Instagram gradient icon — mirrors login's logo */}
                    <div className="w-18 h-18 rounded-[20px] bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-0.5 shadow-lg">
                      <div className="w-full h-full rounded-[18px] bg-white flex items-center justify-center">
                        <Instagram size={34} className="text-[#ee2a7b]" />
                      </div>
                    </div>

                    {/* Heading & sub — same classes as login */}
                    <h2 className="text-[28px] font-black text-black tracking-tight mt-6">
                      Connect Instagram
                    </h2>
                    <p className="text-[13.5px] text-slate-500 max-w-85 mx-auto mt-2.5 leading-relaxed font-semibold">
                      Link your professional Instagram account to unlock automation, scheduling, and DM tools.
                    </p>

                    {/* CTA button block */}
                    <div className="w-full mt-9 space-y-3.5">

                      {/* Primary connect button */}
                      <button
                        onClick={connectInstagram}
                        disabled={isConnecting}
                        className="w-full py-3.5 bg-linear-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white text-[14.5px] font-bold rounded-full shadow-[0_8px_24px_-4px_rgba(238,42,123,0.35)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-70"
                      >
                        {isConnecting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Redirecting to Instagram…</span>
                          </>
                        ) : (
                          <>
                            <Instagram size={18} />
                            <span>Continue with Instagram</span>
                          </>
                        )}
                      </button>

                      {/* Separator */}
                      <div className="flex items-center gap-3 my-1">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">What you get</span>
                        <div className="flex-1 h-px bg-slate-100" />
                      </div>

                      {/* Feature bullets — styled like secondary button row on login */}
                      {[
                        "AI-powered comment auto-DM",
                        "Smart post & reel scheduling",
                        "Engagement analytics dashboard",
                      ].map((feat) => (
                        <div
                          key={feat}
                          className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[13.5px] font-semibold rounded-full border border-slate-200/80 transition-all flex items-center justify-center gap-2.5"
                        >
                          <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {feat}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer — exact copy from login page */}
                <div className="w-full flex items-center justify-center gap-2 pb-2 text-[11px] font-bold text-slate-400 tracking-wider">
                  <svg className="w-3.5 h-3.5 text-slate-400 stroke-[2.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>OFFICIAL INSTAGRAM PARTNER API | LOCKED &amp; SECURED VIA AES-256</span>
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 2: SUCCESS MODAL/CARD */}
          {viewState === "success" && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center min-h-[60vh] p-4"
            >
              {(() => {
                const latestAccount = instagramAccounts[0];
                return (
                  <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] text-center space-y-8 border border-slate-100/80 relative">
                    {/* Checkmark Icon */}
                    <div className="flex justify-center">
                      <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100 border-4 border-white ring-1 ring-slate-100">
                        <CheckCircle2 size={36} className="text-white" strokeWidth={3} />
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                          Connected!
                        </h2>
                        <p className="text-xs text-slate-400 font-semibold">
                          Your Instagram account is ready for automation.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between gap-4 transition-all w-full min-w-0">
                        <div className="flex items-center gap-3 text-left min-w-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-slate-100 shadow-xs bg-slate-100 flex items-center justify-center shrink-0">
                            {latestAccount?.profile_picture_url || latestAccount?.username ? (
                              <img 
                                src={latestAccount?.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${latestAccount?.username || "account"}`} 
                                alt="avatar" 
                                className="w-full h-full object-cover"
                              />
                            ) : "IG"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[15px] font-bold text-slate-900 leading-tight mb-0.5 truncate">
                              @{latestAccount?.username || 'Connected Account'}
                            </p>
                            <p className="text-[11px] text-slate-400 font-semibold tracking-tight">
                              Account ready
                            </p>
                          </div>
                        </div>
                        <div className="w-5.5 h-5.5 bg-emerald-500 rounded-full flex items-center justify-center shadow-xs shrink-0">
                          <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setViewState("settings");
                          loadInstagramAccounts(false);
                        }}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[14px] font-bold transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Continue
                        <ChevronRight size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* STEP 3: FULL SETTINGS */}
          {viewState === "settings" && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                  <h1 className="text-[32px] md:text-[40px] font-semibold text-slate-900 tracking-tight">Account Settings</h1>
                  <p className="text-[15px] md:text-[16px] text-slate-500 font-medium">Manage your app integrations and connections.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                  {instagramAccounts.length > 0 && (
                    <div className="relative inline-flex items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm mr-2">
                      <select
                        value={activeAccountId || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActiveAccountId(val);
                          localStorage.setItem("active_instagram_account_id", val);
                          toast.success(`Switched active account`);
                        }}
                        className="appearance-none pr-8 pl-1 bg-transparent font-bold text-slate-750 focus:outline-none cursor-pointer"
                      >
                        {instagramAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            @{acc.username}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                    </div>
                  )}
                  <button
                    onClick={connectInstagram}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    Add account
                  </button>
                  <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Status
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-7xl w-full mx-auto">
                <div id="instagram-section" className="space-y-4">
                  {instagramAccounts.map((account) => {
                    const isOpen = postsVisibleFor === account.id;
                    const posts = postsByAccount[account.id] ?? [];
                    const isLoading = loadingPostsFor === account.id;

                    return (
                      <div key={account.id} className="p-4 sm:p-6 bg-white border border-slate-200/80 rounded-4xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-slate-300 transition-all">
                        <div className="flex flex-row items-center gap-4 sm:gap-5 w-full md:w-auto">
                          <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-full p-0.5 bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
                              <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-50">
                                <img 
                                  src={account.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${account.username}`} 
                                  alt="IG Avatar" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-50">
                              <Instagram size={14} className="text-[#ee2a7b]" />
                            </div>
                          </div>
                          
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <h3 className="text-lg font-semibold text-slate-800 truncate tracking-tight max-w-37.5 sm:max-w-62.5">@{account.username}</h3>
                              {activeAccountId === account.id ? (
                                <div className="px-2 py-0.5 bg-emerald-50/80 text-emerald-600 rounded-md flex items-center gap-1.5 shrink-0 border border-emerald-100/50">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span className="text-[10px] font-bold tracking-wide uppercase">Active</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveAccountId(account.id);
                                    localStorage.setItem("active_instagram_account_id", account.id);
                                    toast.success(`Switched active account to @${account.username}`);
                                  }}
                                  className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-850 rounded-md flex items-center gap-1.5 shrink-0 border border-slate-200 transition-colors cursor-pointer"
                                >
                                  <span className="text-[10px] font-bold tracking-wide uppercase">Make Active</span>
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 text-[13px] text-slate-500 font-medium">
                              <span>Instagram</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span>0 Automations</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-slate-100 mt-1 md:mt-0">
                          <div className="relative w-full sm:w-auto group/dropdown flex-1 sm:flex-none">
                            <button 
                              className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-[13px] font-semibold text-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                              onClick={() => fetchPosts(account.id)}
                            >
                              Posts
                              <ChevronRight size={14} className={`transition-transform duration-300 text-slate-400 ${isOpen ? 'rotate-90' : ''}`} />
                            </button>
                            
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute right-0 top-full mt-3 w-[calc(100vw-3rem)] sm:w-80 bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-4 z-50 origin-top-right md:origin-top-right"
                                >
                                  <div className="flex items-center justify-between mb-4 px-2">
                                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Recent Posts</span>
                                    <button onClick={() => setPostsVisibleFor(null)}>
                                      <X size={14} className="text-slate-300 hover:text-slate-600" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-64 no-scrollbar">
                                    {isLoading ? (
                                      <div className="col-span-3 py-8 flex justify-center">
                                        <div className="w-6 h-6 border-2 border-slate-200 border-t-[#2563EB] rounded-full animate-spin" />
                                      </div>
                                    ) : posts.length > 0 ? (
                                      posts.map((post) => (
                                        <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" className="aspect-square bg-slate-100 rounded-xl overflow-hidden group/item block relative">
                                          {(() => {
                                            const mediaSrc = post.media_type === "VIDEO"
                                              ? (post.thumbnail_url ?? post.media_url ?? "https://placehold.co/200x200?text=No+Media")
                                              : (post.media_url ?? "https://placehold.co/200x200?text=No+Media");

                                            return (
                                          <img 
                                            src={mediaSrc}
                                            alt="Instagram post"
                                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform" 
                                            onError={(event) => {
                                              event.currentTarget.src = 'https://placehold.co/200x200?text=No+Media';
                                            }}
                                          />
                                            );
                                          })()}
                                        </a>
                                      ))
                                    ) : (
                                      <div className="col-span-3 py-8 text-center">
                                        <p className="text-xs text-slate-400 font-medium">No posts found.</p>
                                      </div>
                                    )}
                                  </div>
                                  {posts.length > 0 && (
                                    <a href={`https://instagram.com/${account.username}`} target="_blank" rel="noopener noreferrer" className="block w-full mt-4 py-3 bg-slate-50 rounded-xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-colors text-center">
                                      View on Instagram
                                    </a>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <button 
                            onClick={() => disconnectInstagram(account.id)}
                            className="p-2 sm:px-4 sm:py-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-100 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
                            title="Disconnect Account"
                          >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Disconnect</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ERROR MODAL POPUP */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-white w-full max-w-md rounded-[3rem] p-8 md:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.25)] text-center border border-slate-100 relative overflow-hidden"
              >
                {/* Decorative background blur */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 via-pink-500 to-red-600" />
                
                {/* Close Button */}
                <button 
                  onClick={() => setErrorMessage(null)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors active:scale-95"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>

                <div className="space-y-8 mt-4">
                  {/* Danger/Warning Badge */}
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg shadow-red-100 ring-1 ring-red-100/50">
                      <X size={32} className="text-red-500" strokeWidth={3} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Connection Failed</h3>
                    <p className="text-[13.5px] text-slate-500 font-semibold leading-relaxed">
                      Something went wrong while connecting to Instagram.
                    </p>
                  </div>

                  {/* Clean Error Message display */}
                  <div className="bg-red-50/60 border border-red-100/70 p-4 rounded-3xl text-left">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-1">Details</span>
                    <p className="text-xs text-red-700 font-bold font-mono break-words leading-relaxed">
                      {errorMessage}
                    </p>
                  </div>

                  {/* Actionable Suggestions */}
                  <div className="text-left text-xs text-slate-500 bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-2 font-semibold">
                    <span className="font-bold text-slate-700 block mb-1">How to fix this:</span>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-500 leading-relaxed font-semibold">
                      <li>Your Instagram account must be a <strong>Professional (Business or Creator)</strong> account.</li>
                      <li>In your Meta Developer Dashboard, ensure you have invited this Instagram account as an <strong>Instagram Tester</strong> and accepted the invitation.</li>
                      <li>Ensure that <strong>Deauthorize callback URL</strong> and <strong>Data deletion request URL</strong> are filled out in your App dashboard under Instagram Business Login settings.</li>
                    </ul>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setErrorMessage(null);
                        connectInstagram();
                      }}
                      className="w-full py-4.5 bg-linear-to-r from-red-500 to-pink-600 text-white rounded-full text-sm font-bold shadow-lg shadow-red-200 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      Try Again
                    </button>
                    
                    <button
                      onClick={() => setErrorMessage(null)}
                      className="w-full py-3.5 border border-slate-200 hover:bg-slate-50 rounded-full text-xs font-bold text-slate-600 transition-all active:scale-[0.98]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
