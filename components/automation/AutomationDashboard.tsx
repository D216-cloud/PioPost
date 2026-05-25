"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  Sparkles, 
  MessageSquare, 
  Activity, 
  Settings, 
  Plus, 
  Layers, 
  TrendingUp, 
  RefreshCw, 
  Zap, 
  HelpCircle,
  FileText,
  AlertCircle
} from "lucide-react";
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

  const selectedAccount = instagramAccounts.find(a => a.id === selectedAccountId) || instagramAccounts[0] || null;

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/instagram-account");
      const { data } = await res.json();
      const accounts = Array.isArray(data) ? data : [];
      setInstagramAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    } catch (err) {
      console.error("Error fetching Instagram accounts:", err);
    }
  };

  const fetchRules = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const url = selectedAccountId 
        ? `/api/automation-rules?accountId=${encodeURIComponent(selectedAccountId)}`
        : "/api/automation-rules";
        
      const res = await fetch(url);
      const { data } = await res.json();
      // Filter out deleted rules (soft delete)
      const activeRules = (data || []).filter((r: any) => !r.deleted);
      setRules(activeRules);
    } catch (err) {
      console.error("Error fetching rules:", err);
      toast.error("Failed to load automation rules");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAccountId]);

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
        body: JSON.stringify({ active })
      });
      const { error } = await res.json();
      if (error) throw new Error(error);
      
      setRules(prev => prev.map(r => r.id === id ? { ...r, active } : r));
      toast.success(active ? "Automation activated!" : "Automation paused");
    } catch (err: any) {
      console.error("Error toggling rule:", err);
      toast.error(err.message || "Failed to update automation status");
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/automation-rules/${id}`, {
        method: "DELETE"
      });
      const { error } = await res.json();
      if (error) throw new Error(error);

      setRules(prev => prev.filter(r => r.id !== id));
      toast.success("Automation rule deleted successfully");
      
      // If we were looking at logs for this rule, clear it
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

  // Stats calculation
  const activeAutomationsCount = rules.filter(r => r.active).length;
  const totalExecutionsCount = rules.reduce((acc, curr) => acc + (curr.executions || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-8 md:py-12 space-y-8 animate-in fade-in duration-500">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-400/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] rounded-full bg-[#ee2a7b]/5 blur-[120px] pointer-events-none" />

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 text-left">
            <h1 className="text-[28px] md:text-[38px] font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-[#6228d7] dark:from-white dark:via-slate-200 dark:to-[#ee2a7b] bg-clip-text text-transparent leading-tight">
              AutoDM Studio
            </h1>
            <p className="text-[13.5px] font-medium text-slate-400 dark:text-slate-500 max-w-lg leading-relaxed">
              Automate comment triggers, deliver instant product links, collect leads, and scale your Instagram growth like ManyChat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRules(true)}
              disabled={refreshing || loading}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={`${refreshing ? "animate-spin text-indigo-500" : ""}`} />
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              disabled={!selectedAccount}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ee2a7b] to-[#6228d7] text-white text-[13px] font-black uppercase tracking-wider rounded-full shadow-[0_4px_16px_rgba(238,42,123,0.25)] transition-all duration-300 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} strokeWidth={3} />
              New Automation
            </button>
          </div>
        </div>

        {/* Selected IG Account & Quick Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Instagram Profile Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-[28px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-full overflow-hidden ring-4 ring-[#ee2a7b]/10 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-0.5 flex-shrink-0">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 p-0.5">
                  {selectedAccount?.profile_picture_url ? (
                    <img src={selectedAccount.profile_picture_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold">
                      {selectedAccount?.username?.[0]?.toUpperCase() || "IG"}
                    </div>
                  )}
                </div>
              </div>
              <div>
                {selectedAccount ? (
                  <div className="space-y-0.5">
                    <p className="font-bold text-[15px] text-slate-800 dark:text-slate-200">
                      @{selectedAccount.username}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Trigger Synced
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-[14px] text-slate-400 italic">No Account Connected</p>
                    <Link href="/dashboard/settings" className="text-[11px] font-black uppercase tracking-wider text-indigo-500 hover:text-indigo-600">
                      Link Instagram Account
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {instagramAccounts.length > 1 && (
              <select
                value={selectedAccountId ?? ""}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="py-1.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-[12px] font-semibold text-slate-600 dark:text-slate-400 focus:outline-none"
              >
                {instagramAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>@{acc.username}</option>
                ))}
              </select>
            )}
          </div>

          {/* Stat: Active Rules */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-[28px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Zap size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[22px] font-black text-slate-800 dark:text-slate-100">
                {activeAutomationsCount}
              </p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Active Automations
              </p>
            </div>
          </div>

          {/* Stat: Total Executions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-[28px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[22px] font-black text-slate-800 dark:text-slate-100">
                {totalExecutionsCount}
              </p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Total DM Deliveries
              </p>
            </div>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-850 gap-6">
          <button
            onClick={() => setViewTab("rules")}
            className={`pb-4 text-[13.5px] font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              viewTab === "rules"
                ? "border-slate-900 dark:border-white text-slate-950 dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Active Rules
          </button>
          <button
            onClick={() => setViewTab("logs")}
            className={`pb-4 text-[13.5px] font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              viewTab === "logs"
                ? "border-slate-900 dark:border-white text-slate-950 dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Activity size={14} />
            Activity Logs
            {selectedRuleForLogs && (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                Filtered
              </span>
            )}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="min-h-[400px]">
          {viewTab === "rules" ? (
            loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-[#ee2a7b] border-t-transparent animate-spin" />
                <p className="text-[13px] text-slate-400 font-semibold uppercase tracking-wider">Syncing Studio rules...</p>
              </div>
            ) : rules.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-[32px] p-8 md:p-12 text-center max-w-xl mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.01)] mt-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-850/60 rounded-[22px] flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <MessageSquare size={28} />
                </div>
                <h3 className="font-bold text-[18px] text-slate-800 dark:text-slate-200">
                  Create Your First AutoDM Automation
                </h3>
                <p className="text-[13px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-2 leading-relaxed">
                  Automatically DM leads when they comment a specific word on your Posts or Reels. Increase conversions by up to 400%.
                </p>
                <div className="mt-8 flex justify-center gap-3">
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    disabled={!selectedAccount}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[13px] font-black uppercase tracking-wider rounded-full hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow disabled:opacity-50"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                    New Automation Rule
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.map((rule) => (
                  <AutomationCard
                    key={rule.id}
                    rule={rule}
                    onToggle={handleToggleRule}
                    onDelete={handleDeleteRule}
                    onViewLogs={handleViewLogs}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {selectedRuleForLogs && (
                <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-150/40 dark:border-indigo-900/30 rounded-2xl">
                  <div className="flex items-center gap-2 text-[12.5px] font-semibold text-indigo-700 dark:text-indigo-300">
                    <AlertCircle size={15} />
                    Showing logs filtered to: <span className="underline font-black">"{selectedRuleForLogs.name}"</span>
                  </div>
                  <button
                    onClick={() => setSelectedRuleForLogs(null)}
                    className="text-[11.5px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
              
              <AutomationLogs
                ruleId={selectedRuleForLogs?.id || null}
                ruleName={selectedRuleForLogs?.name || null}
                onClose={selectedRuleForLogs ? () => setSelectedRuleForLogs(null) : undefined}
              />
            </div>
          )}
        </div>

        {/* Create Modal */}
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
    </div>
  );
}
