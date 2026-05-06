"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Zap, MessageCircle, Link as LinkIcon, FileText, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const InstagramIcon = (props: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>);

interface Rule {
  id: string;
  name: string;
  platform: string;
  trigger_keyword: string;
  reply_message: string;
  target_post_url: string;
  active: boolean;
  created_at: string;
}

const MOCK_POSTS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=300&fit=crop"
];

export function AutomationEditor() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const user = session?.user;
  const router = useRouter();

  const [rules, setRules] = useState<Rule[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Flow State
  const [isIgConnected, setIsIgConnected] = useState(false);
  const [formStep, setFormStep] = useState<"connect" | "select_post" | "setup">("connect");
  
  const [form, setForm] = useState({
    name: "",
    trigger_keyword: "",
    reply_message: "",
    target_post_url: "",
    link_attachment: ""
  });

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setRules(data as Rule[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleNewRuleClick = () => {
    setShowForm(true);
    if (!isIgConnected) {
      setFormStep("connect");
    } else {
      setFormStep("select_post");
    }
  };

  const handleConnect = () => {
    // Fake connection process
    setSaving(true);
    setTimeout(() => {
      setIsIgConnected(true);
      setSaving(false);
      setFormStep("select_post");
    }, 1500);
  };

  const handleSelectPost = (url: string) => {
    setForm(prev => ({ ...prev, target_post_url: url }));
    setFormStep("setup");
  };

  const createRule = useCallback(async () => {
    if (!user || !form.trigger_keyword.trim() || !form.reply_message.trim()) return;
    setSaving(true);
    
    const finalMessage = form.link_attachment 
      ? `${form.reply_message.trim()}\n\nHere is your file: ${form.link_attachment}` 
      : form.reply_message.trim();

    try {
      const { data, error } = await supabase.from("automation_rules").insert({
        user_id: user.id,
        platform: "instagram",
        name: form.name.trim() || "Untitled rule",
        trigger_keyword: form.trigger_keyword.trim(),
        reply_message: finalMessage,
        target_post_url: form.target_post_url.trim(),
        active: true,
      }).select().single();

      if (error) {
        // Fallback for missing table UI
        setRules(prev => [{
          id: Date.now().toString(),
          name: form.name.trim() || "Untitled rule",
          platform: "instagram",
          trigger_keyword: form.trigger_keyword.trim(),
          reply_message: finalMessage,
          target_post_url: form.target_post_url.trim(),
          active: true,
          created_at: new Date().toISOString()
        }, ...prev]);
      } else if (data) {
        await load();
      }

      setForm({ name: "", trigger_keyword: "", reply_message: "", target_post_url: "", link_attachment: "" });
      setShowForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [user, form, load]);

  const toggleActive = useCallback(async (id: string, active: boolean) => {
    try {
      await supabase.from("automation_rules").update({ active }).eq("id", id);
      setRules((r) => r.map((x) => x.id === id ? { ...x, active } : x));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    try {
      await supabase.from("automation_rules").delete().eq("id", id);
      setRules((r) => r.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (loading || (!loading && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0096d6] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="logo-script text-[28px] text-slate-900">PinPost</Link>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 pl-2 pr-4 py-1.5 rounded-full border border-slate-100">
          <div className="h-6 w-6 rounded-full bg-[#e1f5fe] text-[#0096d6] border border-[#b3e5fc] flex items-center justify-center text-[12px] font-bold uppercase">
            {session?.user?.email?.[0] || "A"}
          </div>
          <span className="text-[13px] font-semibold text-slate-600 truncate max-w-[150px]">{session?.user?.email || "amitmaheta2007@gmail.com"}</span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 mb-4 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Automation</h1>
              <p className="text-[14px] text-slate-500 mt-1">
                Auto-DM users when they comment a keyword on your Instagram post.
              </p>
            </div>
            {!showForm && (
              <button 
                onClick={handleNewRuleClick}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0096d6] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#0085bd] shadow-sm"
              >
                <Plus className="h-4 w-4" /> New rule
              </button>
            )}
          </div>
        </div>

        {!showForm && (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <InstagramIcon className="h-5 w-5 text-pink-500" />
            <span className="text-[14px] font-bold text-slate-800">Instagram</span>
            <span className="ml-auto text-[12px] font-medium text-slate-400">Only platform supported</span>
          </div>
        )}

        {showForm && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-[16px] font-bold text-slate-900">Create auto-DM rule</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <Trash2 size={16} />
              </button>
            </div>

            {formStep === "connect" && (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-2">
                  <InstagramIcon className="h-8 w-8 text-pink-500" />
                </div>
                <h3 className="text-[18px] font-bold text-slate-900">Connect your Instagram</h3>
                <p className="text-[14px] text-slate-500 max-w-sm mx-auto">To setup automations, you need to link your professional Instagram account.</p>
                <button 
                  onClick={handleConnect}
                  disabled={saving}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-[14px] font-bold text-white transition-colors hover:bg-slate-800 shadow-sm disabled:opacity-70"
                >
                  {saving ? "Connecting..." : "Connect Account"}
                </button>
              </div>
            )}

            {formStep === "select_post" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#0096d6] font-bold text-[14px] mb-4">
                  <CheckCircle2 size={16} /> Instagram Connected
                </div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-2">Select a post to automate</h3>
                <div className="grid grid-cols-3 gap-4">
                  {MOCK_POSTS.map((url, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleSelectPost(url)}
                      className="cursor-pointer group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-[#0096d6] transition-all"
                    >
                      <img src={url} alt={`Post ${i}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[12px] font-bold bg-[#0096d6] px-3 py-1.5 rounded-full shadow-lg">Select</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formStep === "setup" && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <img src={form.target_post_url} alt="Target post" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-slate-800">Target Post Selected</p>
                    <p className="text-[12px] text-slate-500">The automation will run when users comment on this specific post.</p>
                  </div>
                  <button onClick={() => setFormStep("select_post")} className="text-[12px] font-bold text-[#0096d6] hover:underline">Change</button>
                </div>

                <div>
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">Rule name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Free PDF giveaway"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] text-slate-800 focus:outline-none focus:border-[#0096d6] transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">Trigger keyword</label>
                  <input
                    value={form.trigger_keyword}
                    onChange={(e) => setForm((f) => ({ ...f, trigger_keyword: e.target.value }))}
                    placeholder="e.g. GUIDE"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] text-slate-800 font-mono focus:outline-none focus:border-[#0096d6] transition-all shadow-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">When someone comments this exact word, they will receive the DM.</p>
                </div>
                <div>
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">DM reply message</label>
                  <textarea
                    value={form.reply_message}
                    onChange={(e) => setForm((f) => ({ ...f, reply_message: e.target.value }))}
                    placeholder="Hey! Thanks for commenting. Here's the link you asked for…"
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 text-[13px] text-slate-800 focus:outline-none focus:border-[#0096d6] resize-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">Link or File Attachment</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LinkIcon size={16} />
                    </div>
                    <input
                      value={form.link_attachment}
                      onChange={(e) => setForm((f) => ({ ...f, link_attachment: e.target.value }))}
                      placeholder="https://yourwebsite.com/guide.pdf"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-[13px] text-slate-800 focus:outline-none focus:border-[#0096d6] transition-all shadow-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={createRule} 
                    disabled={saving || !form.trigger_keyword || !form.reply_message}
                    className="inline-flex items-center rounded-xl bg-[#0096d6] px-6 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#0085bd] disabled:opacity-50 shadow-sm"
                  >
                    {saving ? "Saving…" : "Create automation"}
                  </button>
                  <button 
                    onClick={() => setShowForm(false)}
                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50 shadow-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="text-[15px] font-bold text-slate-900 mb-4">Your rules</h2>
          {loadingData ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0096d6] border-t-transparent" />
            </div>
          ) : rules.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mx-auto mb-4 border border-slate-100">
                <Zap className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-[15px] font-bold text-slate-800">No automation rules yet</p>
              <p className="text-[13px] text-slate-500 mt-1 max-w-xs mx-auto">Create your first rule to start automatically replying to comments with DMs.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <InstagramIcon className="h-4 w-4 text-pink-500 shrink-0" />
                        <p className="text-[14px] font-bold text-slate-900 truncate">{rule.name}</p>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase ${rule.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {rule.active ? "Active" : "Paused"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-center gap-2">
                          <span className="text-[12px] font-medium text-slate-500">When comment contains:</span>
                          <span className="text-[13px] font-bold font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{rule.trigger_keyword}</span>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-start gap-2.5">
                          <MessageCircle className="h-4 w-4 mt-0.5 text-[#0096d6] shrink-0" />
                          <span className="text-[13px] font-medium text-slate-700 line-clamp-2 leading-relaxed">{rule.reply_message}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <button
                        onClick={() => toggleActive(rule.id, !rule.active)}
                        className="text-[12px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        {rule.active ? "Pause" : "Resume"}
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
