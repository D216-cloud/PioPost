"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Plus,
  ArrowRight,
  LogOut,
  ChevronRight,
  X
} from "lucide-react";
import { InstagramIcon as Instagram } from "@/components/icons";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

type ViewState = "loading" | "not_connected" | "success" | "settings";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [instagramAccounts, setInstagramAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState("");
  const [postsByAccount, setPostsByAccount] = useState<Record<string, any[]>>({});
  const [loadingPostsFor, setLoadingPostsFor] = useState<string | null>(null);
  const [postsVisibleFor, setPostsVisibleFor] = useState<string | null>(null);

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

      if (checkSuccessParam) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
          setViewState("success");
          window.history.replaceState({}, '', window.location.pathname);
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
    window.location.href = "/api/auth/instagram/link";
  };

  const disconnectInstagram = async (accountId: string) => {
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from("instagram_accounts")
      .delete()
      .eq("id", accountId)
      .eq("user_id", session.user.id);

    if (error) {
      toast.error("Failed to disconnect account");
      return;
    }

    toast.success("Instagram account disconnected");
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
      <div className="relative w-[95%] md:max-w-6xl mx-auto px-4 md:px-8 pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 right-[-60px] h-72 w-72 rounded-full bg-sky-200/30 blur-[120px]" />
          <div className="absolute -bottom-24 left-[-40px] h-72 w-72 rounded-full bg-amber-200/30 blur-[120px]" />
        </div>
        <AnimatePresence mode="wait">
          {/* STEP 1: NOT CONNECTED */}
          {viewState === "not_connected" && (
            <motion.div 
              key="not_connected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
            >
              <div className="text-center space-y-3">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                  Connect Your <span className="text-transparent bg-clip-text bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">Instagram</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-md mx-auto">
                  Automate your content strategy and reach more people by linking your professional account.
                </p>
              </div>

              <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" />
                
                <div className="flex flex-col items-center space-y-8">
                  <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[2px]">
                    <div className="w-full h-full rounded-[1.9rem] bg-white flex items-center justify-center">
                      <Instagram size={48} className="text-[#ee2a7b]" />
                    </div>
                  </div>

                  <div className="space-y-2 text-center">
                    <h3 className="text-xl font-bold text-slate-900">Instagram Business</h3>
                    <p className="text-slate-400 text-sm font-medium">Standard professional connection</p>
                  </div>

                  <button 
                    onClick={connectInstagram}
                    disabled={isConnecting}
                    className="w-full group relative flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all active:scale-[0.98] disabled:opacity-70"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Instagram size={24} />
                        <span>Link Account</span>
                        <ArrowRight size={20} className="absolute right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SUCCESS MODAL/CARD (MATCHING IMAGE) */}
          {viewState === "success" && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center min-h-[70vh] p-4"
            >
              {(() => {
                const latestAccount = instagramAccounts[0];
                return (
              <div className="bg-white w-full max-w-[420px] rounded-[3rem] p-10 shadow-[0_30px_70px_rgba(0,0,0,0.1)] text-center space-y-10 border border-slate-50 relative">
                {/* Checkmark Icon */}
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-[#4ADE80] rounded-full flex items-center justify-center shadow-2xl shadow-emerald-200 border-[8px] border-white ring-1 ring-slate-100">
                    <CheckCircle2 size={42} className="text-white" strokeWidth={3} />
                  </div>
                </div>
                
                <div className="space-y-10">
                  <h2 className="text-[28px] font-bold text-slate-900 tracking-tight leading-[1.2] px-2">
                    Account reconnected successfully!
                  </h2>

                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-14 h-14 rounded-full overflow-hidden ring-4 ring-slate-50 shadow-sm bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                        {latestAccount?.profile_picture_url || latestAccount?.username ? (
                          <img 
                            src={latestAccount?.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${latestAccount?.username || "account"}`} 
                            alt="avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : "IG"}
                      </div>
                      <div>
                        <p className="text-[17px] font-bold text-slate-900 leading-tight mb-0.5">
                          {latestAccount?.username || 'Connected Account'}
                        </p>
                        <p className="text-[13px] text-slate-400 font-semibold tracking-tight">
                          {latestAccount ? "Account ready" : "Synchronizing..."}
                        </p>
                      </div>
                    </div>
                    <div className="w-7 h-7 bg-[#4ADE80] rounded-full flex items-center justify-center shadow-sm">
                      <CheckCircle2 size={16} className="text-white" strokeWidth={3} />
                    </div>
                  </div>

                  <button 
                    onClick={() => setViewState("settings")}
                    className="w-full py-5 border border-slate-200 rounded-[2rem] text-[16px] font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
                  >
                    Continue
                    <ChevronRight size={18} className="text-slate-400" />
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
                  <button
                    onClick={connectInstagram}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
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

              <div className="max-w-6xl w-full mx-auto">
                <div id="instagram-section" className="space-y-4">
                  {instagramAccounts.map((account) => {
                    const isOpen = postsVisibleFor === account.id;
                    const posts = postsByAccount[account.id] ?? [];
                    const isLoading = loadingPostsFor === account.id;

                    return (
                      <div key={account.id} className="p-4 sm:p-6 bg-white border border-slate-200/80 rounded-[2rem] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-slate-300 transition-all">
                        <div className="flex flex-row items-center gap-4 sm:gap-5 w-full md:w-auto">
                          <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
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
                              <h3 className="text-lg font-semibold text-slate-800 truncate tracking-tight max-w-[150px] sm:max-w-[250px]">@{account.username}</h3>
                              <div className="px-2 py-0.5 bg-emerald-50/80 text-emerald-600 rounded-md flex items-center gap-1.5 shrink-0 border border-emerald-100/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="text-[10px] font-bold tracking-wide uppercase">Active</span>
                              </div>
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
                                      posts.map((post: any) => (
                                        <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" className="aspect-square bg-slate-100 rounded-xl overflow-hidden group/item block relative">
                                          <img 
                                            src={post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : post.media_url} 
                                            alt="Instagram post"
                                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform" 
                                            onError={(e: any) => { e.target.src = 'https://placehold.co/200x200?text=No+Media' }}
                                          />
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
      </div>
    </div>
  );
}
