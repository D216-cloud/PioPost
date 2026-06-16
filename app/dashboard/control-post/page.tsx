"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  ChevronDown,
  Bot,
  MessageCircle,
  Send,
  Radio,
  BarChart2,
  Settings,
  ChevronRight,
  ArrowUpRight,
  Edit3,
  Check,
  User,
  Star,
  Activity,
  Play,
  HelpCircle,
  Plus,
  RefreshCw,
  MoreVertical,
  Link as LinkIcon,
  Flame,
  CheckCircle2,
  Lock,
  Target,
  Trash2,
  X
} from "lucide-react";
import Link from "next/link";
import { InstagramIcon as Instagram } from "@/components/icons";


export default function ControlPostPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [automations, setAutomations] = useState<any[]>([]);
  const [fetchingAutomations, setFetchingAutomations] = useState(true);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const account = activeAccount;

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/instagram-account");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      const resData = await res.json();
      const list = resData.data || [];
      setAccounts(list);
      if (list.length > 0) {
        const savedActiveId = localStorage.getItem("active_instagram_account_id");
        const found = list.find((acc: any) => acc.id === savedActiveId);
        if (found) {
          setActiveAccount(found);
        } else {
          setActiveAccount(list[0]);
          localStorage.setItem("active_instagram_account_id", list[0].id);
        }
      } else {
        setActiveAccount(null);
      }
    } catch (err) {
      console.error(err);
      setAccounts([]);
      setActiveAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to disconnect this Instagram account? This will also disable any automations set up for this account.")) {
      return;
    }
    try {
      const res = await fetch(`/api/instagram-account?accountId=${encodeURIComponent(accountId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete account");
      
      const newAccounts = accounts.filter((a) => a.id !== accountId);
      setAccounts(newAccounts);
      if (newAccounts.length > 0) {
        setActiveAccount(newAccounts[0]);
        localStorage.setItem("active_instagram_account_id", newAccounts[0].id);
      } else {
        setActiveAccount(null);
        localStorage.removeItem("active_instagram_account_id");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to disconnect Instagram account");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      setShowSuccessModal(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  useEffect(() => {
    loadAccounts();

    // Fetch automations
    fetch("/api/automations")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch automations");
      })
      .then((resData) => {
        setAutomations(resData.data || []);
      })
      .catch((err) => {
        console.error("Error fetching automations:", err);
      })
      .finally(() => {
        setFetchingAutomations(false);
      });
  }, []);

  const toggleAutomation = async (id: string | number) => {
    const item = automations.find((a) => a.id === id);
    if (!item) return;

    const newActive = !item.active;

    // Optimistic UI update
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: newActive } : a))
    );

    try {
      const res = await fetch("/api/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: newActive }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      console.error("Error toggling automation:", err);
      // Revert state on failure
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active: item.active } : a))
      );
    }
  };

  const deleteAutomation = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this automation?")) return;

    // Optimistic UI update
    setAutomations((prev) => prev.filter((a) => a.id !== id));

    try {
      const res = await fetch(`/api/automations?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete automation");
      }
    } catch (err) {
      console.error("Error deleting automation:", err);
      alert("Failed to delete automation. Please try again.");
      // Reload automations from server
      fetch("/api/automations")
        .then((res) => res.json())
        .then((resData) => setAutomations(resData.data || []));
    }
  };

  const getTriggerDescription = (item: any) => {
    const kws = item.keywords || [];
    const mode = item.keyword_mode || "any";
    
    let kwStr = "";
    if (mode === "any_comment") {
      kwStr = " (any comment)";
    } else if (mode === "exact") {
      kwStr = kws.length > 0 ? ` matching exactly "${kws.join(', ')}"` : ' (any comment)';
    } else if (mode === "all") {
      kwStr = kws.length > 0 ? ` containing ALL of "${kws.join(', ')}"` : ' (any comment)';
    } else {
      // 'any'
      kwStr = kws.length > 0 ? ` containing ANY of "${kws.join(', ')}"` : ' (any comment)';
    }

    const targetStr = item.trigger_type === 'all_posts' ? 'Any Reel/Post' : 'Specific Reel/Post';
    return `Trigger: Comment on ${targetStr}${kwStr}`;
  };

  const filteredAutomations = automations.filter((item) =>
    (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!activeAccount || item.instagram_account_id === activeAccount.id)
  );

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
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">AutoDM</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Create powerful DM automations that engage your audience 24/7
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap w-full sm:w-auto">
            <button className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold text-slate-650 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-50 transition-all flex-1 sm:flex-none">
              <HelpCircle size={14} className="text-slate-400" />
              <span>How it works?</span>
            </button>
            <Link
              href="/dashboard/control-post/create"
              className="flex items-center justify-center gap-1.5 bg-slate-900 text-white rounded-xl px-3 sm:px-4 py-2 text-xs font-bold shadow-md hover:bg-slate-800 transition-all cursor-pointer flex-1 sm:flex-none"
            >
              <Plus size={14} />
              <span>Create Automation</span>
            </Link>
          </div>
        </div>

        {account ? (
          /* ── CONNECTED LAYOUT ── */
          <div className="flex flex-col gap-6 w-full animate-in fade-in duration-350">
              
              {/* Connected Instagram Account Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col gap-5">
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
                            M
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {accounts.length > 1 ? (
                          <div className="relative inline-flex items-center">
                            <select
                              value={activeAccount?.id || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const found = accounts.find((a) => a.id === val);
                                if (found) {
                                  setActiveAccount(found);
                                  localStorage.setItem("active_instagram_account_id", found.id);
                                }
                              }}
                              className="appearance-none pr-8 pl-1 py-0.5 bg-transparent border-b border-transparent hover:border-slate-350 focus:border-slate-400 font-bold text-slate-900 text-base focus:outline-none cursor-pointer"
                            >
                              {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  @{acc.username}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                          </div>
                        ) : (
                          <p className="text-base font-bold text-slate-900">@{account.username || "maheta.deepak"}</p>
                        )}
                        {/* Blue Checkmark */}
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                          <Check size={10} strokeWidth={4} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold mt-1">
                        Business Account • Connected on May 16, 2025
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Connected</span>
                    </span>
                    <button
                      onClick={() => setIsAddAccountModalOpen(true)}
                      className="inline-flex items-center gap-1.5 bg-slate-900 text-white rounded-xl px-3.5 py-2 text-xs font-bold shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Add Another</span>
                    </button>
                    <button
                      onClick={() => (window.location.href = "/api/auth/instagram/link?returnTo=/dashboard/control-post")}
                      className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
                    >
                      <RefreshCw size={12} className="text-slate-400" />
                      <span>Reconnect</span>
                    </button>
                    <button
                      onClick={() => activeAccount && handleDeleteAccount(activeAccount.id)}
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
                      <MessageCircle size={16} fill="currentColor" className="fill-blue-100" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">DM Access</p>
                      <p className="text-xs font-bold text-emerald-600 mt-1 leading-none">Active</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <MessageCircle size={16} fill="currentColor" className="fill-blue-100" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Comments</p>
                      <p className="text-xs font-bold text-emerald-600 mt-1 leading-none">Active</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                      <Target size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Story Replies</p>
                      <p className="text-xs font-bold text-emerald-600 mt-1 leading-none">Active</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Followers</p>
                      <p className="text-xs font-bold text-emerald-600 mt-1 leading-none">Active</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Active Automations Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-slate-900">Active Automations</h3>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search automations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all w-full sm:w-56"
                    />
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-650 cursor-pointer w-full sm:w-auto">
                      <span>All Status</span>
                      <ChevronDown size={14} className="text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {fetchingAutomations ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
                    </div>
                  ) : filteredAutomations.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30 flex flex-col items-center justify-center">
                      <Bot size={36} className="text-slate-350 mx-auto mb-2.5" />
                      <p className="text-xs font-bold text-slate-800">No automations found</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        {searchQuery ? "Try adjusting your search query." : "Get started by creating your first DM automation!"}
                      </p>
                      {!searchQuery && (
                        <Link
                          href="/dashboard/control-post/create"
                          className="inline-flex items-center gap-1 bg-slate-900 text-white rounded-xl px-3.5 py-1.5 text-[10px] font-extrabold mt-4 shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>Create Automation</span>
                        </Link>
                      )}
                    </div>
                  ) : (
                    filteredAutomations.map((item) => {
                      const getIcon = () => {
                        if (item.type === "giveaway") return <Star size={16} fill="currentColor" className="text-blue-600" />;
                        if (item.type === "link") return <LinkIcon size={16} className="text-emerald-600" />;
                        if (item.type === "reel") return <Flame size={16} className="text-orange-600" />;
                        if (item.type === "story") return <MessageCircle size={16} className="text-purple-600" />;
                        return <User size={16} className="text-pink-600" />;
                      };

                      const getBg = () => {
                        if (item.type === "giveaway") return "bg-blue-50";
                        if (item.type === "link") return "bg-emerald-50";
                        if (item.type === "reel") return "bg-orange-50";
                        if (item.type === "story") return "bg-purple-50";
                        return "bg-pink-50";
                      };

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between border border-slate-100 hover:border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-all gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {item.specific_post_thumbnail ? (
                              <img
                                src={item.specific_post_thumbnail}
                                alt="Post thumbnail"
                                className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full ${getBg()} flex items-center justify-center shrink-0`}>
                                {getIcon()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-900 leading-none">{item.name || item.rule_name || "Untitled"}</p>
                                <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                  item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                                }`}>
                                  {item.active ? "Active" : "Paused"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-semibold mt-1 truncate">
                                {getTriggerDescription(item)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 ml-auto sm:ml-0 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0 border-slate-50">
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-750">
                              <div className="text-center sm:text-right">
                                <span className="block text-slate-900">{item.dmsSent || 0}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">DMs Sent</span>
                              </div>
                              <div className="text-center sm:text-right">
                                <span className="block text-slate-900">{item.comments || 0}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Comments</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleAutomation(item.id)}
                                className={`w-9 h-5 rounded-full relative transition-all duration-200 outline-none ${
                                  item.active ? "bg-blue-600" : "bg-slate-200"
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all duration-200 ${
                                  item.active ? "left-[18px]" : "left-[3px]"
                                }`} />
                              </button>
                              <button
                                onClick={() => deleteAutomation(item.id)}
                                className="text-slate-450 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                                title="Delete Automation"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button className="w-full border border-slate-200 bg-white hover:bg-slate-50 rounded-xl py-2.5 text-xs font-bold text-slate-650 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all">
                  View All Automations
                </button>
              </div>

              {/* Automation Types Progress Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-900">Automation Types</h3>
                
                <div className="space-y-4">
                  
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-750 mb-1.5">
                      <span>Keyword Trigger</span>
                      <span className="text-slate-900">12</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: "80%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-750 mb-1.5">
                      <span>Comment Trigger</span>
                      <span className="text-slate-900">6</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "40%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-750 mb-1.5">
                      <span>Story Trigger</span>
                      <span className="text-slate-900">4</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: "25%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-750 mb-1.5">
                      <span>Follower Trigger</span>
                      <span className="text-slate-900">2</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full" style={{ width: "12%" }} />
                    </div>
                  </div>

                </div>
              </div>

          </div>
        ) : (
          /* ── NOT CONNECTED LAYOUT ── */
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-16 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col items-center gap-6 text-center max-w-2xl mx-auto mt-12">
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
              onClick={() => (window.location.href = "/api/auth/instagram/link?returnTo=/dashboard/control-post")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e84c9f] via-[#b656e3] to-[#5a60f6] text-white text-[13.5px] font-bold rounded-full shadow-[0_8px_20px_-4px_rgba(182,86,227,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              Connect Instagram Account
            </button>
          </div>
        )}

      </div>

      {/* ADD ANOTHER ACCOUNT MODAL */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsAddAccountModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-650 transition-colors"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 shadow-md mb-4 flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center animate-pulse">
                  <Instagram size={28} className="text-[#ee2a7b]" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Connect another Instagram account</h3>
              <p className="text-xs text-slate-400 font-semibold mt-2 max-w-xs leading-relaxed font-sans">
                Link another professional Instagram Business account to manage its automations under the same workspace.
              </p>

              <button
                onClick={() => {
                  window.location.href = "/api/auth/instagram/link?returnTo=/dashboard/control-post";
                }}
                className="w-full mt-6 py-3.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Instagram size={14} />
                <span>Connect Another Instagram</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
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
                setShowSuccessModal(false);
                loadAccounts();
              }}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              Continue
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
