"use client";

import { useState, useEffect, useCallback, type SVGProps } from "react";
import { Activity, AlertCircle, HelpCircle, Image as ImageIcon, MessageSquare, Plus, RefreshCw, Search, TrendingUp, Zap, ExternalLink, CheckCircle2, XCircle, Filter, Play, Film } from "lucide-react";
import { toast } from "sonner";
import CreateAutoDMModal from "./CreateAutoDMModal";
import { AutomationLogs } from "./AutomationLogs";

interface Account {
  id: string;
  username: string;
  profile_picture_url?: string;
  instagram_business_id?: string;
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
  post_thumbnail?: string | null;
  post_thumbnail_url?: string | null;
  post_type?: string | null;
  keyword_mode?: "specific" | "any";
  keywords?: string[];
  auto_reply_enabled?: boolean;
  auto_reply_text?: string | null;
  dm_type?: "message_only" | "message_button";
  dm_button_label?: string | null;
  dm_button_url?: string | null;
  ask_follow?: boolean;
  ask_email?: boolean;
  
  // Database schema additions
  post_id?: string | null;
  dm_message?: string | null;
  rule_name?: string | null;
  post_caption?: string | null;
  require_follow?: boolean;
  comment_reply_text?: string | null;
  total_dms_sent?: number;
}

interface RuleRecord extends Rule {
  deleted?: boolean;
}

const InstagramIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

function getRulePreviewText(rule: Rule) {
  const preview = rule.dm_message || rule.reply_message;
  if (preview?.trim()) return preview.trim();
  
  const keyword = rule.trigger_keyword || (rule.keywords?.length ? rule.keywords.join(", ") : "");
  if (keyword?.trim()) return keyword.trim();
  
  return "No message configured";
}

function getRuleMediaLabel(rule: Rule) {
  const isSpecific = !!rule.post_id || rule.comment_scope === "specific";
  if (isSpecific) {
    const isReel = rule.post_type === "REEL" || !!rule.instagram_media_id;
    return isReel ? "REEL" : "POST";
  }
  if (rule.comment_scope === "next") return "NEXT";
  return "ANY";
}

export function AutomationDashboard() {
  const [instagramAccounts, setInstagramAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewTab, setViewTab] = useState<"rules" | "logs">("rules");
  const [selectedRuleForLogs, setSelectedRuleForLogs] = useState<Rule | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const selectedAccount = instagramAccounts.find((account) => account.id === selectedAccountId) || instagramAccounts[0] || null;

  const fetchAccounts = useCallback(async (): Promise<Account[]> => {
    try {
      const res = await fetch("/api/instagram-account");
      const { data } = await res.json();
      const accounts = Array.isArray(data) ? data : [];
      setInstagramAccounts(accounts);
      return accounts;
    } catch (err: unknown) {
      console.error("Error fetching Instagram accounts:", err);
      return [];
    }
  }, []);

  const fetchRules = useCallback(
    async (accountId: string | null = selectedAccountId, isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        const url = accountId
          ? `/api/automation-rules?accountId=${encodeURIComponent(accountId)}`
          : "/api/automation-rules";

        const res = await fetch(url);
        const { data } = await res.json();
        const automationRules = Array.isArray(data) ? (data as RuleRecord[]) : [];
        setRules(automationRules.filter((rule) => !rule.deleted));
      } catch (err: unknown) {
        console.error("Error fetching rules:", err);
        toast.error("Failed to load automation rules");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedAccountId],
  );

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        const accounts = await fetchAccounts();
        const initialAccountId = accounts[0]?.id ?? null;

        setSelectedAccountId(initialAccountId);
        await fetchRules(initialAccountId);
      } catch (err: unknown) {
        console.error("Error loading automation dashboard:", err);
        toast.error("Failed to load automation dashboard");
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [fetchAccounts, fetchRules]);

  const handleToggleRule = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/automation-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const { error } = await res.json();
      if (error) throw new Error(error);

      setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, active } : rule)));
      toast.success(active ? "Automation activated!" : "Automation paused");
    } catch (err: unknown) {
      console.error("Error toggling rule:", err);
      toast.error(getErrorMessage(err, "Failed to update automation status"));
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/automation-rules/${id}`, { method: "DELETE" });
      const { error } = await res.json();
      if (error) throw new Error(error);

      setRules((prev) => prev.filter((rule) => rule.id !== id));
      toast.success("Automation rule deleted successfully");

      if (selectedRuleForLogs?.id === id) {
        setSelectedRuleForLogs(null);
      }
    } catch (err: unknown) {
      console.error("Error deleting rule:", err);
      toast.error(getErrorMessage(err, "Failed to delete automation rule"));
    }
  };

  const handleViewLogs = (rule: Rule) => {
    setSelectedRuleForLogs(rule);
    setViewTab("logs");
  };

  const activeAutomationsCount = rules.filter((rule) => rule.active).length;
  const totalExecutionsCount = rules.reduce((acc, curr) => acc + (curr.total_dms_sent ?? curr.executions ?? 0), 0);
  const filteredRules = rules.filter((rule) => {
    const haystack = [
      rule.rule_name,
      rule.name,
      rule.trigger_keyword,
      rule.dm_message,
      rule.reply_message,
      rule.post_caption,
      ...(rule.keywords || [])
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const metricCards = [
    { label: "Active Automations", value: activeAutomationsCount, icon: Zap, iconClass: "text-indigo-500" },
    { label: "Total DM Deliveries", value: totalExecutionsCount, icon: TrendingUp, iconClass: "text-purple-500" },
  ];

  return (
    <div className="relative mx-auto max-w-6xl px-6 md:px-8 pt-8 md:pt-24 pb-16 animate-in fade-in duration-700">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-violet-100/30 blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 h-80 w-80 rounded-full bg-pink-100/20 blur-[120px]" />
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
        <div className="space-y-3">
          <h1 className="text-[32px] md:text-[52px] font-normal tracking-tight text-slate-900 leading-none">
            AutoDM <span className="text-[#a855f7] font-medium">Studio</span>
          </h1>
          <p className="text-[14.5px] md:text-[16px] text-slate-500 font-medium max-w-xl leading-relaxed">
            Automate comment triggers, deliver instant product links, collect leads, and scale your Instagram growth like ManyChat.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {instagramAccounts.length > 1 && (
            <select
              value={selectedAccount?.id ?? ""}
              onChange={(e) => {
                const account = instagramAccounts.find((item) => item.id === e.target.value);
                if (account) {
                  setSelectedAccountId(account.id);
                  void fetchRules(account.id);
                }
              }}
              className="h-10 rounded-full border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#a855f7]/20"
            >
              {instagramAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  @{account.username}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => selectedAccount && void fetchRules(selectedAccount.id, true)}
            disabled={refreshing || loading}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            disabled={!selectedAccount}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-[#e84c9f] via-[#b656e3] to-[#5a60f6] text-white text-[13.5px] font-bold rounded-full shadow-[0_8px_20px_-4px_rgba(182,86,227,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
            New Automation
          </button>
        </div>
      </div>

      {selectedAccount && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {selectedAccount.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedAccount.profile_picture_url} alt="avatar" className="w-11 h-11 rounded-full object-cover ring-2 ring-[#a855f7]/20 shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-linear-to-br from-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white text-[14px] font-black shrink-0">
                {selectedAccount.username.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="max-w-60 truncate text-[15px] font-bold text-slate-900">@{selectedAccount.username}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Live</span>
                </span>
              </div>
              <p className="text-[12px] text-slate-400 mt-0.5">Showing real-time automations from your Instagram account.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="text-center px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-16">
              <p className="text-[20px] font-bold text-slate-900 leading-none">{activeAutomationsCount}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Active</p>
            </div>
            <div className="text-center px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-16">
              <p className="text-[20px] font-bold text-slate-900 leading-none">{totalExecutionsCount}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Sent</p>
            </div>
            <div className="text-center px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-16">
              <p className="text-[20px] font-bold text-slate-900 leading-none">{filteredRules.length}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Shown</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full w-fit">
          <button
            onClick={() => setViewTab("rules")}
            className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
              viewTab === "rules" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Active Rules
          </button>
          <button
            onClick={() => setViewTab("logs")}
            className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 ${
              viewTab === "logs" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Activity size={14} />
            Activity Logs
            {selectedRuleForLogs && <span className={`text-[10px] px-2 py-0.5 rounded-full ${viewTab === "logs" ? "bg-white/15 text-white" : "bg-slate-200 text-slate-500"}`}>Filtered</span>}
          </button>
        </div>

        {viewTab === "rules" && (
          <div className="relative w-full md:w-[320px]">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rules..."
              className="w-full h-11 pl-10 pr-4 rounded-full border border-slate-200 bg-white text-[13px] font-medium text-slate-700 focus:outline-none focus:border-slate-400 transition-colors"
            />
          </div>
        )}
      </div>

      <div className="min-h-100">
        {viewTab === "rules" ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-[#ee2a7b] border-t-transparent animate-spin" />
              <p className="text-[13px] text-slate-400 font-semibold">Syncing Studio rules...</p>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-[28px] p-8 md:p-12 text-center max-w-xl mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.01)] mt-4">
              <div className="w-16 h-16 bg-slate-50 rounded-[22px] flex items-center justify-center mx-auto mb-6 text-slate-400">
                <MessageSquare size={28} />
              </div>
              <h3 className="font-bold text-[18px] text-slate-800">Create Your First AutoDM Automation</h3>
              <p className="text-[13px] text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
                Automatically DM leads when they comment a specific word on your Posts or Reels. Increase conversions by up to 400%.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <button
                  onClick={() => setIsCreateOpen(true)}
                  disabled={!selectedAccount}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[13px] font-black uppercase tracking-wider rounded-full hover:bg-slate-800 transition-colors shadow disabled:opacity-50"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  New Automation Rule
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRules.map((rule) => {
                const mediaLabel = getRuleMediaLabel(rule);
                const isActive = rule.active;
                const previewText = getRulePreviewText(rule);
                const lastExecutedText = rule.last_execution ? new Date(rule.last_execution).toLocaleString() : null;
                const isSpecific = !!rule.post_id || rule.comment_scope === "specific";

                return (
                  <div key={rule.id} className="bg-white rounded-3xl border border-slate-200 p-4 md:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                          {isSpecific && (rule.post_thumbnail_url || rule.post_thumbnail) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={(rule.post_thumbnail_url || rule.post_thumbnail) ?? undefined} alt="automation thumbnail" className="w-full h-full object-cover" />
                          ) : isSpecific ? (
                            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 text-slate-400">
                              <Play size={18} fill="currentColor" />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#ee2a7b]/10 to-[#6228d7]/10 text-[#ee2a7b]">
                              <Zap size={18} />
                            </div>
                          )}
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur text-[9px] font-black uppercase tracking-wider text-slate-700">
                            {mediaLabel}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f5f3ff] text-[#8b5cf6] text-[10px] font-black uppercase tracking-wider">
                              {isSpecific ? ((rule.post_type === "REEL" || !!rule.instagram_media_id) ? "REEL" : "POST") : "ANY COMMENT"}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                              {isActive ? "Active" : "Paused"}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                              {new Date(rule.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-[15px] md:text-[16px] font-bold text-slate-900 truncate font-sans">
                              {rule.rule_name || rule.name || (rule.post_caption ? rule.post_caption.slice(0, 40) + "..." : "") || "AutoDM Rule"}
                            </h3>
                            <p className="text-[13px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                              {previewText}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {rule.keyword_mode === "any" || rule.trigger_keyword === "Any comment" ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-500 italic">
                                Any comment triggers DM
                              </span>
                            ) : (
                              (rule.keywords?.length ? rule.keywords : rule.trigger_keyword ? rule.trigger_keyword.split(",").map((item) => item.trim()).filter(Boolean) : []).slice(0, 4).map((keyword) => (
                                <span key={keyword} className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
                                  {keyword}
                                </span>
                              ))
                            )}
                            {(rule.require_follow || rule.ask_follow) && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-[11px] font-semibold text-amber-600">
                                Ask to Follow
                              </span>
                            )}
                            {rule.ask_email && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 border border-purple-100 text-[11px] font-semibold text-purple-600">
                                Ask Email
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end gap-3 md:min-w-50">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleViewLogs(rule)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-50 border border-slate-200 text-[12px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Activity size={13} />
                            Logs
                          </button>
                          <button
                            onClick={() => void handleToggleRule(rule.id, !rule.active)}
                            className={`w-12 h-6 rounded-full relative transition-all shrink-0 ${rule.active ? "bg-linear-to-r from-[#ee2a7b] to-[#6228d7]" : "bg-slate-200"}`}
                            title={rule.active ? "Pause automation" : "Activate automation"}
                          >
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${rule.active ? "right-0.5" : "left-0.5"}`} />
                          </button>
                          <button
                            onClick={() => void handleDeleteRule(rule.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete automation"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-[12px] font-semibold text-slate-700">{rule.total_dms_sent ?? rule.executions ?? 0} executions</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{lastExecutedText ? `Last sent ${lastExecutedText}` : "No sends yet"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {selectedRuleForLogs && (
              <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 border border-indigo-150/40 rounded-2xl">
                <div className="flex items-center gap-2 text-[12.5px] font-semibold text-indigo-700">
                  <AlertCircle size={15} />
                  Showing logs filtered to: <span className="underline font-black">&quot;{selectedRuleForLogs.name}&quot;</span>
                </div>
                <button onClick={() => setSelectedRuleForLogs(null)} className="text-[11.5px] font-bold text-slate-400 hover:text-indigo-600 underline cursor-pointer">
                  Clear Filter
                </button>
              </div>
            )}

            <AutomationLogs ruleId={selectedRuleForLogs?.id || null} ruleName={selectedRuleForLogs?.name || null} onClose={selectedRuleForLogs ? () => setSelectedRuleForLogs(null) : undefined} />
          </div>
        )}
      </div>

      {isCreateOpen && (
        <CreateAutoDMModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            void fetchRules(selectedAccount?.id ?? null, true);
            setViewTab("rules");
          }}
        />
      )}
    </div>
  );
}