"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  MessageSquare, 
  Calendar,
  AlertCircle,
  Loader2,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LogEntry {
  id: string;
  automation_id: string;
  instagram_user_id: string;
  comment_text: string;
  comment_id?: string | null;
  triggered_by_username?: string | null;
  dm_sent: boolean;
  dm_sent_at?: string | null;
  error_message?: string | null;
  created_at: string;
}

interface Props {
  ruleId?: string | null;
  ruleName?: string | null;
  onClose?: () => void;
}

export function AutomationLogs({ ruleId, ruleName, onClose }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const url = ruleId 
        ? `/api/automation-logs?automationId=${ruleId}&limit=100` 
        : `/api/automation-logs?limit=100`;
        
      const res = await fetch(url);
      const { data } = await res.json();
      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching automation logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [ruleId]);

  const filteredLogs = logs.filter(log => {
    const textMatch = log.comment_text?.toLowerCase().includes(search.toLowerCase());
    const userMatch = log.triggered_by_username?.toLowerCase().includes(search.toLowerCase());
    const errorMatch = log.error_message?.toLowerCase().includes(search.toLowerCase());
    return textMatch || userMatch || errorMatch;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-[17px] font-bold text-slate-800 dark:text-slate-200">
            {ruleName ? `Logs for: ${ruleName}` : "All Automation Logs"}
          </h2>
          <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-0.5">
            Monitor real-time executions and message delivery outcomes.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing || loading}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer active:scale-95"
            title="Refresh logs"
          >
            <RefreshCw size={14} className={`${refreshing || loading ? "animate-spin text-indigo-500" : ""}`} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by comment keyword or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/20 text-[13px] rounded-xl focus:bg-white focus:outline-none focus:border-slate-450 dark:focus:border-slate-700 transition-colors"
          />
        </div>

        <div className="text-[12px] font-semibold text-slate-450 dark:text-slate-500 self-end sm:self-center shrink-0">
          Showing {filteredLogs.length} of {logs.length} executions
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="flex-1 overflow-y-auto min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
            <Loader2 className="animate-spin text-slate-400 dark:text-slate-650" size={28} />
            <p className="text-[13px] text-slate-455 font-medium">Retrieving real-time logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-850/60 rounded-full flex items-center justify-center mb-4 text-slate-350 dark:text-slate-600">
              <MessageSquare size={24} />
            </div>
            <h3 className="font-bold text-[14px] text-slate-700 dark:text-slate-300">
              {logs.length === 0 ? "No Logs Found" : "No Matches"}
            </h3>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 max-w-xs mt-1">
              {logs.length === 0 
                ? "This automation hasn't triggered yet. Leave a keyword comment on Instagram to test it!" 
                : "Try adjusting your search term."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-850/20 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Comment</th>
                  <th className="px-6 py-3.5">DM Status</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredLogs.map((log) => {
                  const relativeTime = formatDistanceToNow(new Date(log.created_at), { addSuffix: true });
                  const exactTime = new Date(log.created_at).toLocaleString();

                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors group"
                    >
                      {/* User Column */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1px] flex-shrink-0">
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              {log.triggered_by_username?.[0]?.toUpperCase() || "IG"}
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-[13px] text-slate-800 dark:text-slate-200">
                              {log.triggered_by_username ? `@${log.triggered_by_username}` : "Instagram User"}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              ID: {log.instagram_user_id.slice(0, 10)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Comment Column */}
                      <td className="px-6 py-4.5 max-w-[280px]">
                        <div className="space-y-1">
                          <p className="text-[12.5px] font-medium text-slate-700 dark:text-slate-350 leading-normal line-clamp-2">
                            "{log.comment_text}"
                          </p>
                          {log.comment_id && (
                            <a
                              href={`https://instagram.com/p/${log.comment_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider text-slate-400 hover:text-[#ee2a7b] dark:text-slate-500 transition-colors"
                            >
                              View Comment <ExternalLink size={8} />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* DM Status Column */}
                      <td className="px-6 py-4.5">
                        {log.dm_sent ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={14} className="flex-shrink-0" />
                            <span className="text-[12px] font-semibold">Sent Successfully</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400">
                              <XCircle size={14} className="flex-shrink-0" />
                              <span className="text-[12px] font-semibold">Delivery Failed</span>
                            </div>
                            {log.error_message && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 bg-red-50/50 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/30 px-2 py-1 rounded-md max-w-xs break-words">
                                {log.error_message}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Date Column */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Clock size={12} className="text-slate-405" />
                          <div>
                            <p className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-350" title={exactTime}>
                              {relativeTime}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
