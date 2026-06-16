"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Plus,
  LogOut,
  ChevronRight,
  X,
  ChevronDown,
  HelpCircle,
  Check,
  Bot,
  Trash2,
  MessageCircle,
  Target,
  User
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
      <div className="flex h-screen bg-[#f8fafc] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col gap-6">
        
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Account Settings</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Manage your app integrations and connections
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap w-full sm:w-auto">
            <button className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold text-slate-650 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-50 transition-all flex-1 sm:flex-none">
              <HelpCircle size={14} className="text-slate-400" />
              <span>How it works?</span>
            </button>
            <button
              onClick={connectInstagram}
              disabled={isConnecting}
              className="flex items-center justify-center gap-1.5 bg-slate-900 text-white rounded-xl px-3 sm:px-4 py-2 text-xs font-bold shadow-md hover:bg-slate-800 transition-all cursor-pointer flex-1 sm:flex-none disabled:opacity-75"
            >
              <Plus size={14} />
              <span>Connect Instagram</span>
            </button>
          </div>
        </div>

        {viewState === "not_connected" ? (
          /* ── NOT CONNECTED LAYOUT ── */
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-16 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col items-center gap-6 text-center max-w-2xl mx-auto mt-12 w-full">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <Bot size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Instagram Account Connected</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Connect your Instagram Business Account to start building powerful DM, comment, and story reply automation rules.
              </p>
            </div>
            <button
              onClick={connectInstagram}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e84c9f] via-[#b656e3] to-[#5a60f6] text-white text-[13.5px] font-bold rounded-full shadow-[0_8px_20px_-4px_rgba(182,86,227,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-75"
            >
              {isConnecting ? "Redirecting to Instagram..." : "Connect Instagram Account"}
            </button>
          </div>
        ) : (
          /* ── CONNECTED LAYOUT ── */
          <div className="flex flex-col gap-6 w-full animate-in fade-in duration-350">
            {instagramAccounts.map((account) => {
              const isOpen = postsVisibleFor === account.id;
              const posts = postsByAccount[account.id] ?? [];
              const isLoading = loadingPostsFor === account.id;
              const isActive = activeAccountId === account.id;

              return (
                <div key={account.id} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar Ring Gradient */}
                      <div className="relative shrink-0 p-[2.5px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                        <div className="p-[2px] bg-white rounded-full">
                          {account.profile_picture_url ? (
                            <img
                              src={account.profile_picture_url}
                              alt="avatar"
                              className="w-14 h-14 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-lg font-bold">
                              {account.username ? account.username[0].toUpperCase() : "I"}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-base font-bold text-slate-900">@{account.username}</p>
                          {/* Blue Checkmark */}
                          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                            <Check size={10} strokeWidth={4} />
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-1">
                          Business Account • Connected
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active Account</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveAccountId(account.id);
                            localStorage.setItem("active_instagram_account_id", account.id);
                            toast.success(`Switched active account to @${account.username}`);
                          }}
                          className="inline-flex items-center gap-1.5 bg-slate-900 text-white rounded-xl px-3.5 py-2 text-xs font-bold shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          <span>Make Active</span>
                        </button>
                      )}

                      <div className="relative group/dropdown">
                        <button
                          onClick={() => fetchPosts(account.id)}
                          className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
                        >
                          <span>Posts</span>
                          <ChevronRight size={12} className={`transition-transform duration-300 text-slate-400 ${isOpen ? 'rotate-90' : ''}`} />
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
                                <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest font-sans">Recent Posts</span>
                                <button onClick={() => setPostsVisibleFor(null)}>
                                  <X size={14} className="text-slate-300 hover:text-slate-650" />
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-64 no-scrollbar">
                                {isLoading ? (
                                  <div className="col-span-3 py-8 flex justify-center">
                                    <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                                  </div>
                                ) : posts.length > 0 ? (
                                  posts.map((post) => (
                                    <a
                                      key={post.id}
                                      href={post.permalink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="aspect-square bg-slate-100 rounded-xl overflow-hidden group/item block relative"
                                    >
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
                                <a
                                  href={`https://instagram.com/${account.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full mt-4 py-3 bg-slate-50 rounded-xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-colors text-center"
                                >
                                  View on Instagram
                                </a>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        onClick={() => disconnectInstagram(account.id)}
                        className="inline-flex items-center justify-center bg-white border border-slate-200 hover:border-red-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl p-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
                        title="Disconnect Account"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full" />

                  {/* Sub-Access Indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <MessageCircle size={16} fill="currentColor" className="fill-blue-100 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">DM Access</p>
                        <p className="text-xs font-bold text-emerald-600 mt-1 leading-none">Active</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <MessageCircle size={16} fill="currentColor" className="fill-blue-100 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Comments</p>
                        <p className="text-xs font-bold text-emerald-600 mt-1 leading-none">Active</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                        <Target size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Story Replies</p>
                        <p className="text-xs font-bold text-emerald-600 mt-1 leading-none">Active</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Followers</p>
                        <p className="text-xs font-bold text-emerald-600 mt-1 leading-none">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SUCCESS MODAL Overlay */}
      {viewState === "success" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 md:p-8 shadow-2xl text-center space-y-6 border border-slate-100 relative">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100 border-4 border-white ring-1 ring-slate-100">
                <CheckCircle2 size={28} className="text-white" strokeWidth={3} />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                Connected!
              </h2>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Your Instagram account has been linked successfully.
              </p>
            </div>

            <button 
              onClick={() => {
                setViewState("settings");
                loadInstagramAccounts(false);
              }}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              Continue
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* ERROR MODAL POPUP */}
      <AnimatePresence>
        {errorMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl text-center border border-slate-100 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500" />
              
              <button 
                onClick={() => setErrorMessage(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-650 transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              <div className="space-y-6 mt-2">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg shadow-red-100 ring-1 ring-red-100">
                    <X size={28} className="text-red-500" strokeWidth={3} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Connection Failed</h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    Something went wrong while connecting to Instagram.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-left">
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-1">Details</span>
                  <p className="text-xs text-red-750 font-semibold font-mono break-words leading-relaxed">
                    {errorMessage}
                  </p>
                </div>

                <div className="text-left text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 font-semibold">
                  <span className="font-bold text-slate-700 block mb-1">How to fix this:</span>
                  <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                    <li>Your Instagram account must be a <strong>Professional (Business or Creator)</strong> account.</li>
                    <li>Ensure you accepted the Instagram Tester invitation in Meta Developer Dashboard.</li>
                    <li>Ensure that required callback and data deletion URLs are filled out.</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      connectInstagram();
                    }}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-sm cursor-pointer"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Dismiss
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
