"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Activity, AlertCircle, HelpCircle, MessageSquare, Plus, RefreshCw, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";
import { CreateAutomationModal } from "./CreateAutomationModal";
import { AutomationCard } from "./AutomationCard";
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
  keyword_mode?: "specific" | "any";
  keywords?: string[];
  auto_reply_enabled?: boolean;
  auto_reply_text?: string | null;
  dm_type?: "message_only" | "message_button";
  dm_button_label?: string | null;
  dm_button_url?: string | null;
  ask_follow?: boolean;
  ask_email?: boolean;
}

const InstagramIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export function AutomationDashboard() {
  const { data: session } = useSession();
  const [instagramAccounts, setInstagramAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewTab, setViewTab] = useState<"rules" | "logs">("rules");
  const [selectedRuleForLogs, setSelectedRuleForLogs] = useState<Rule | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const selectedAccount = instagramAccounts.find((account) => account.id === selectedAccountId) || instagramAccounts[0] || null;

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/instagram-account");
      const { data } = await res.json();
      const accounts = Array.isArray(data) ? data : [];
      setInstagramAccounts(accounts);
      if (accounts.length > 0) setSelectedAccountId(accounts[0].id);
    } catch (err) {
      console.error("Error fetching Instagram accounts:", err);
    }
  };

  const fetchRules = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        const url = selectedAccountId
          ? `/api/automation-rules?accountId=${encodeURIComponent(selectedAccountId)}`
          : "/api/automation-rules";

        const res = await fetch(url);
        const { data } = await res.json();
        setRules((data || []).filter((rule: any) => !rule.deleted));
      } catch (err) {
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
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId !== null || instagramAccounts.length > 0) {
      fetchRules();
    }
  }, [selectedAccountId, fetchRules]);

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
    } catch (err: any) {
      console.error("Error toggling rule:", err);
      toast.error(err.message || "Failed to update automation status");
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
    } catch (err: any) {
      console.error("Error deleting rule:", err);
      toast.error(err.message || "Failed to delete automation rule");
    }
  };

  const handleViewLogs = (rule: Rule) => {
    setSelectedRuleForLogs(rule);
    setViewTab("logs");
  };

  const activeAutomationsCount = rules.filter((rule) => rule.active).length;
  const totalExecutionsCount = rules.reduce((acc, curr) => acc + (curr.executions || 0), 0);

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

        <div className="flex items-center gap-3 flex-shrink-0">
          {instagramAccounts.length > 1 && (
            <select
              value={selectedAccount?.id ?? ""}
              onChange={(e) => {
                const account = instagramAccounts.find((item) => item.id === e.target.value);
                if (account) setSelectedAccountId(account.id);
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
            onClick={() => selectedAccount && fetchRules(true)}
            disabled={refreshing || loading}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            disabled={!selectedAccount}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#e84c9f] via-[#b656e3] to-[#5a60f6] text-white text-[13.5px] font-bold rounded-full shadow-[0_8px_20px_-4px_rgba(182,86,227,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
            New Automation
          </button>
        </div>
      </div>

      {selectedAccount && (
        <div className="bg-white rounded-[24px] border border-[#e4e4e7] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex items-center gap-4 mb-8">
          {selectedAccount.profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedAccount.profile_picture_url} alt="avatar" className="w-11 h-11 rounded-full object-cover ring-2 ring-[#a855f7]/20 flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white text-[14px] font-black flex-shrink-0">
              {selectedAccount.username.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="max-w-60 truncate text-[15px] font-bold text-slate-900">@{selectedAccount.username}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Live</span>
              </span>
            </div>
            <p className="text-[12px] text-slate-400 mt-0.5">Showing real-time automations from your Instagram account.</p>
          </div>
        </div>
      )}

      {selectedAccount && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-[20px] border border-[#e4e4e7] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-44">
            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2.5">
                <InstagramIcon className="w-4 h-4 text-slate-400 stroke-[1.8]" />
                <span className="text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase">CONNECTED ACCOUNT</span>
                <button className="focus:outline-none hover:text-slate-600 transition-colors">
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-[#ee2a7b]/10 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-0.5 shrink-0">
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  {selectedAccount.profile_picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedAccount.profile_picture_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold">
                      {selectedAccount.username?.[0]?.toUpperCase() || "IG"}
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="max-w-full truncate text-[18px] md:text-[22px] font-semibold tracking-tight text-slate-900 leading-tight">
                  @{selectedAccount.username}
                </p>
                <div className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 w-fit mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Trigger Synced
                </div>
              </div>
            </div>
          </div>

          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-[20px] border border-[#e4e4e7] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-44">
                <div className="flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${card.iconClass} stroke-[1.8]`} />
                    <span className="text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase">{card.label}</span>
                    <button className="focus:outline-none hover:text-slate-600 transition-colors">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-[36px] font-bold tracking-tight text-slate-900 leading-none">{card.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex border-b border-slate-200 gap-6 mb-6">
        <button
          onClick={() => setViewTab("rules")}
          className={`pb-4 text-[13.5px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            viewTab === "rules" ? "border-slate-900 text-slate-950" : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Active Rules
        </button>
        <button
          onClick={() => setViewTab("logs")}
          className={`pb-4 text-[13.5px] font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            viewTab === "logs" ? "border-slate-900 text-slate-950" : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <Activity size={14} />
          Activity Logs
          {selectedRuleForLogs && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">Filtered</span>}
        </button>
      </div>

      <div className="min-h-100">
        {viewTab === "rules" ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-[#ee2a7b] border-t-transparent animate-spin" />
              <p className="text-[13px] text-slate-400 font-semibold">Syncing Studio rules...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-4xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.01)] mt-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rules.map((rule) => (
                <AutomationCard key={rule.id} rule={rule} onToggle={handleToggleRule} onDelete={handleDeleteRule} onViewLogs={handleViewLogs} />
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {selectedRuleForLogs && (
              <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 border border-indigo-150/40 rounded-2xl">
                <div className="flex items-center gap-2 text-[12.5px] font-semibold text-indigo-700">
                  <AlertCircle size={15} />
                  Showing logs filtered to: <span className="underline font-black">"{selectedRuleForLogs.name}"</span>
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

      <CreateAutomationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        account={selectedAccount}
        onCreated={() => {
          fetchRules(true);
          setViewTab("rules");
        }}
      />
    </div>
  );
}