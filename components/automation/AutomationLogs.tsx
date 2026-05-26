"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  MessageSquare, 
  Loader2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle
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
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h2 className="text-[17px] font-bold text-slate-800">
            {ruleName ? `Logs for: ${ruleName}` : "All Automation Logs"}
          </h2>
          <p className="text-[11.5px] text-slate-400 mt-0.5">
            Monitor real-time executions and message delivery outcomes.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing || loading}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer active:scale-95"
            title="Refresh logs"
          >
            <RefreshCw size={14} className={`${refreshing || loading ? "animate-spin text-[#a855f7]" : ""}`} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 md:px-6 py-4 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by comment keyword or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-slate-50 text-[13px] rounded-full focus:bg-white focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>

        <div className="text-[12px] font-semibold text-slate-450 self-end md:self-center shrink-0">
          Showing {filteredLogs.length} of {logs.length} executions
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-75 bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
            <Loader2 className="animate-spin text-slate-400" size={28} />
            <p className="text-[13px] text-slate-455 font-medium">Retrieving real-time logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-350">
              <MessageSquare size={24} />
            </div>
            <h3 className="font-bold text-[14px] text-slate-700">
              {logs.length === 0 ? "No Logs Found" : "No Matches"}
            </h3>
            <p className="text-[12px] text-slate-400 max-w-xs mt-1">
              {logs.length === 0 
                ? "This automation hasn't triggered yet. Leave a keyword comment on Instagram to test it!" 
                : "Try adjusting your search term."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4 md:p-5">
            {filteredLogs.map((log) => {
              const relativeTime = formatDistanceToNow(new Date(log.created_at), { addSuffix: true });
              const exactTime = new Date(log.created_at).toLocaleString();

              return (
                <div key={log.id} className="rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-[0_3px_16px_rgba(0,0,0,0.02)]">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-px shrink-0">
                        <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center text-[12px] font-black text-slate-600">
                          {log.triggered_by_username?.[0]?.toUpperCase() || "IG"}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-[13px] text-slate-900">
                            {log.triggered_by_username ? `@${log.triggered_by_username}` : "Instagram User"}
                          </p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[9px] font-black uppercase tracking-wider text-slate-500">
                            <Clock size={10} />
                            {relativeTime}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">ID: {log.instagram_user_id.slice(0, 10)}...</p>

                        <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                          <p className="text-[12.5px] font-medium text-slate-700 leading-relaxed line-clamp-3">
                            "{log.comment_text}"
                          </p>
                          {log.comment_id && (
                            <a
                              href={`https://instagram.com/p/${log.comment_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-[9.5px] font-black uppercase tracking-wider text-slate-400 hover:text-[#ee2a7b] transition-colors"
                            >
                              View Comment <ExternalLink size={8} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start md:items-end justify-between md:justify-end gap-3 md:min-w-50">
                      {log.dm_sent ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span className="text-[12px] font-semibold">Sent Successfully</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-500">
                            <XCircle size={14} className="shrink-0" />
                            <span className="text-[12px] font-semibold">Delivery Failed</span>
                          </div>
                          {log.error_message && (
                            <p className="text-[10px] text-red-500 bg-red-50 border border-red-100 px-2.5 py-2 rounded-xl max-w-70 wrap-break-word">
                              {log.error_message}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="text-right shrink-0">
                        <p className="text-[12px] font-semibold text-slate-700" title={exactTime}>
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
