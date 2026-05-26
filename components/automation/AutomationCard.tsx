"use client";

import { useState } from "react";
import { 
  Play, 
  Trash2, 
  MessageSquare, 
  Check, 
  X, 
  FileText, 
  Layers, 
  Clock, 
  ArrowRight, 
  Activity, 
  User, 
  Sparkles,
  RefreshCw,
  Mail,
  UserCheck
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

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
}

interface Props {
  rule: Rule;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewLogs: (rule: Rule) => void;
}

export function AutomationCard({ rule, onToggle, onDelete, onViewLogs }: Props) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggle(rule.id, !rule.active);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this automation rule?")) return;
    setDeleting(true);
    try {
      await onDelete(rule.id);
    } finally {
      setDeleting(false);
    }
  };

  const parsedKeywords = rule.keywords?.length 
    ? rule.keywords 
    : rule.trigger_keyword 
        ? rule.trigger_keyword.split(",").map(k => k.trim()).filter(Boolean)
        : [];

  const isKeywordAny = rule.keyword_mode === "any" || rule.trigger_keyword === "Any comment";

  // Format execution dates
  const lastExecutedText = rule.last_execution
    ? formatDistanceToNow(new Date(rule.last_execution), { addSuffix: true })
    : null;

  const scopeColors = {
    specific: {
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-100 dark:border-indigo-900/50",
      label: "Specific Post"
    },
    any: {
      bg: "bg-purple-50 dark:bg-purple-950/30",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-100 dark:border-purple-900/50",
      label: "Any Post"
    },
    next: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-100 dark:border-emerald-900/50",
      label: "Next Post"
    }
  };

  const currentScope = rule.comment_scope || "any";
  const scopeMeta = scopeColors[currentScope];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`relative group bg-white dark:bg-slate-900 rounded-3xl border ${
        rule.active 
          ? "border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]" 
          : "border-slate-100 dark:border-slate-900 opacity-75 shadow-none"
      } p-6 transition-all duration-300 flex flex-col justify-between`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Scope Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${scopeMeta.bg} ${scopeMeta.text} ${scopeMeta.border}`}>
              <Layers size={11} />
              {scopeMeta.label}
            </span>

            {/* Active/Inactive state indicator */}
            <span className={`w-2 h-2 rounded-full ${rule.active ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"}`} />
          </div>

          {/* Toggle and Delete */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`w-12 h-6 rounded-full relative transition-all flex-shrink-0 cursor-pointer ${
                rule.active 
                  ? "bg-gradient-to-r from-[#ee2a7b] to-[#6228d7]" 
                  : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                rule.active ? "right-0.5" : "left-0.5"
              }`} />
            </button>
            
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Delete Automation"
            >
              <Trash2 size={14} className={deleting ? "animate-pulse" : ""} />
            </button>
          </div>
        </div>

        {/* Rule Title & Thumbnail */}
        <div className="flex items-start gap-4 mb-5">
          {/* Post/Reel thumbnail container */}
          {currentScope === "specific" ? (
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 flex-shrink-0 relative group-hover:scale-105 transition-transform duration-300">
              {(rule.post_thumbnail_url || rule.post_thumbnail) ? (
                <img src={(rule.post_thumbnail_url || rule.post_thumbnail) ?? undefined} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-400">
                  <Play size={16} fill="currentColor" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ee2a7b]/10 to-[#6228d7]/10 border border-[#ee2a7b]/20 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Sparkles size={20} className="text-[#ee2a7b]" />
            </div>
          )}

          <div className="min-w-0">
            <h3 className="font-bold text-[15px] text-slate-800 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {rule.name}
            </h3>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
              Created {new Date(rule.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Keywords trigger display */}
        <div className="mb-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 p-3 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Trigger keyword</p>
          
          {isKeywordAny ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[11px] font-semibold text-slate-500 italic">
              <MessageSquare size={11} className="text-slate-400" />
              Any comment triggers DM
            </span>
          ) : parsedKeywords.length === 0 ? (
            <span className="text-[11px] font-semibold text-slate-400 italic">No keywords configured</span>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {parsedKeywords.map((kw, i) => (
                <span 
                  key={kw + i} 
                  className="inline-flex items-center px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 transition-colors"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Workflow actions status */}
        <div className="mb-5 flex flex-wrap gap-2">
          {rule.auto_reply_enabled && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/20 px-2.5 py-1 rounded-full">
              <Check size={11} /> Comment Auto-Reply
            </span>
          )}
          {rule.ask_follow && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 px-2.5 py-1 rounded-full">
              <UserCheck size={11} /> Ask to Follow
            </span>
          )}
          {rule.ask_email && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/20 px-2.5 py-1 rounded-full">
              <Mail size={11} /> Collect Emails
            </span>
          )}
          {rule.dm_type === "message_button" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full">
              <ArrowRight size={11} /> DM Button
            </span>
          )}
        </div>
      </div>

      {/* Footer stats and view logs */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-4">
        {/* Executions details */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400">
            <Activity size={13} className="text-slate-500" />
          </div>
          <div>
            <p className="text-[13px] font-black text-slate-800 dark:text-slate-200">
              {rule.executions || 0}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              Executions
            </p>
          </div>
        </div>

        {/* View Logs Button */}
        <button
          onClick={() => onViewLogs(rule)}
          className="flex items-center gap-1 px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-[12px] font-bold text-slate-700 dark:text-slate-350 rounded-full transition-colors active:scale-[0.98]"
        >
          <FileText size={12} />
          View Logs
        </button>
      </div>
    </motion.div>
  );
}
