"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronRight, ChevronLeft, Check, Plus, Trash2, Film, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Account {
  id: string;
  username: string;
  profile_picture_url?: string;
  instagram_business_id?: string;
}

interface IGMedia {
  id: string;
  media_type: "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
}

interface FormData {
  triggerType: "post_comment" | "reel_comment";
  commentScope: "specific" | "any" | "next";
  selectedMedia: IGMedia | null;
  keywordMode: "specific" | "any";
  keywords: string[];
  autoReplyEnabled: boolean;
  autoReplyText: string;
  askFollow: boolean;
  askEmail: boolean;
  dmType: "message_only" | "message_button";
  dmContent: string;
  dmButtonLabel: string;
  dmButtonUrl: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  onCreated: () => void;
}

const STEPS = ["Trigger", "Select Post", "Keywords", "DM Setup", "Launch"];

// ─── Step 1: Trigger Selection ─────────────────────────────────────────────
function StepTrigger({ onSelect }: { onSelect: (type: "post_comment" | "reel_comment") => void }) {
  const options = [
    { type: "reel_comment" as const, label: "Comments on your Reels", icon: "🎬", gradient: "from-[#ee2a7b] to-[#6228d7]", coming: false },
    { type: "post_comment" as const, label: "Comments on your Posts", icon: "📸", gradient: "from-[#4facfe] to-[#00f2fe]", coming: false },
    { type: null, label: "Sends you a DM", icon: "💬", gradient: "from-[#43e97b] to-[#38f9d7]", coming: true },
    { type: null, label: "Replies to your Story", icon: "✨", gradient: "from-[#f7971e] to-[#ffd200]", coming: true },
  ];
  return (
    <div className="space-y-3">
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={() => !opt.coming && opt.type && onSelect(opt.type)}
          disabled={opt.coming}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
            opt.coming
              ? "border-slate-100 bg-slate-50 cursor-not-allowed opacity-60"
              : "border-slate-200 bg-white hover:border-slate-900 hover:shadow-md active:scale-[0.99]"
          }`}
        >
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center text-xl flex-shrink-0`}>
            {opt.icon}
          </div>
          <span className="flex-1 font-semibold text-[15px] text-slate-800">{opt.label}</span>
          {opt.coming ? (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-amber-100 text-amber-600 rounded-full">Soon</span>
          ) : (
            <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Step 2: Select Post ──────────────────────────────────────────────────
function StepSelectPost({
  account,
  form,
  setForm,
}: {
  account: Account | null;
  form: FormData;
  setForm: (f: Partial<FormData>) => void;
}) {
  const [mediaTab, setMediaTab] = useState<"posts" | "reels">("posts");
  const [media, setMedia] = useState<IGMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;
    setAccountId(account.id);
    setLoading(true);
    fetch(`/api/instagram-posts?accountId=${account.id}&limit=30`)
      .then(r => r.json())
      .then(({ data }) => setMedia(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [account]);

  const filtered = media.filter(m =>
    mediaTab === "reels" ? m.media_type === "VIDEO" : m.media_type !== "VIDEO"
  );

  const scopeTabs: { label: string; value: FormData["commentScope"] }[] = [
    { label: "Specific Post/Reel", value: "specific" },
    { label: "Any Post/Reel", value: "any" },
    { label: "Next Post/Reel", value: "next" },
  ];

  return (
    <div className="space-y-5">
      {/* Account badge */}
      {account && (
        <div className="flex flex-col items-center gap-2 pb-2">
          <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-[#ee2a7b]/30 bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              {account.profile_picture_url ? (
                <img src={account.profile_picture_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-lg font-bold">
                  {account.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <p className="font-bold text-[14px] text-slate-900">@{account.username}</p>
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected Live
          </span>
        </div>
      )}

      <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">The Comment is on…</p>

      {/* Scope tabs */}
      <div className="flex p-1 bg-slate-100 rounded-full gap-1">
        {scopeTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setForm({ commentScope: tab.value, selectedMedia: tab.value !== "specific" ? null : form.selectedMedia })}
            className={`flex-1 py-2 rounded-full text-[12px] font-bold transition-all ${
              form.commentScope === tab.value
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {form.commentScope === "specific" && (
        <>
          {/* Media type toggle */}
          <div className="flex gap-2">
            {(["posts", "reels"] as const).map(t => (
              <button
                key={t}
                onClick={() => setMediaTab(t)}
                className={`px-5 py-2 rounded-full text-[13px] font-bold capitalize transition-all ${
                  mediaTab === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Media grid */}
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-[13px]">No {mediaTab} found.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {filtered.map(item => {
                const thumb = item.thumbnail_url || item.media_url || "";
                const selected = form.selectedMedia?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setForm({ selectedMedia: selected ? null : item })}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selected ? "border-slate-900 scale-[0.98]" : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        {item.media_type === "VIDEO" ? <Film size={20} className="text-slate-400" /> : <ImageIcon size={20} className="text-slate-400" />}
                      </div>
                    )}
                    {selected && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                          <Check size={16} className="text-slate-900" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {form.commentScope === "any" && (
        <div className="flex items-center gap-3 p-4 bg-violet-50 rounded-2xl border border-violet-100">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">📱</div>
          <div>
            <p className="font-bold text-[13px] text-slate-800">Any Post or Reel</p>
            <p className="text-[11px] text-slate-500">Triggers on every post/reel on your account</p>
          </div>
        </div>
      )}

      {form.commentScope === "next" && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">🆕</div>
          <div>
            <p className="font-bold text-[13px] text-slate-800">Next Post or Reel</p>
            <p className="text-[11px] text-slate-500">Only triggers on your next upload</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Keywords ─────────────────────────────────────────────────────
function StepKeywords({ account, form, setForm }: { account: Account | null; form: FormData; setForm: (f: Partial<FormData>) => void }) {
  const [input, setInput] = useState("");

  const addKeyword = () => {
    const kw = input.trim().toLowerCase();
    if (!kw || form.keywords.includes(kw)) return;
    setForm({ keywords: [...form.keywords, kw] });
    setInput("");
  };

  return (
    <div className="space-y-5">
      {/* Account badge */}
      {account && (
        <div className="flex flex-col items-center gap-1.5 pb-1">
          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#ee2a7b]/30 bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              {account.profile_picture_url ? (
                <img src={account.profile_picture_url} alt="" className="w-full h-full object-cover" />
              ) : <div className="w-full h-full bg-slate-100 flex items-center justify-center font-bold">{account.username?.[0]?.toUpperCase()}</div>}
            </div>
          </div>
          <p className="font-bold text-[13px] text-slate-900">@{account.username}</p>
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Account Synced
          </span>
        </div>
      )}

      <p className="font-bold text-[14px] text-slate-800">What kind of comment should trigger this automation?</p>

      {/* Mode toggle */}
      <div className="flex p-1 bg-slate-100 rounded-full gap-1">
        {(["specific", "any"] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setForm({ keywordMode: mode })}
            className={`flex-1 py-2.5 rounded-full text-[13px] font-bold capitalize transition-all ${
              form.keywordMode === mode ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {mode === "specific" ? "Specific keyword" : "Any comment"}
          </button>
        ))}
      </div>

      {form.keywordMode === "specific" && (
        <div className="space-y-3">
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Should include any of these:</p>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addKeyword()}
              placeholder="Type a keyword (min. 1 character)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400"
            />
            <button
              onClick={addKeyword}
              disabled={!input.trim()}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[13px] font-bold disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              + Add
            </button>
          </div>

          {form.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.keywords.map(kw => (
                <span key={kw} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-[12px] font-semibold">
                  {kw}
                  <button onClick={() => setForm({ keywords: form.keywords.filter(k => k !== kw) })} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Keywords are not case-sensitive. Automations trigger only on exact keyword matches.
          </p>
        </div>
      )}

      {/* Auto-Reply toggle */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setForm({ autoReplyEnabled: !form.autoReplyEnabled })}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <span className="font-semibold text-[14px] text-slate-800">Auto-Reply to comments</span>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${form.autoReplyEnabled ? "bg-slate-900" : "bg-slate-200"}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${form.autoReplyEnabled ? "left-5.5" : "left-0.5"}`} />
          </div>
        </button>
        {form.autoReplyEnabled && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100">
            <input
              value={form.autoReplyText}
              onChange={e => setForm({ autoReplyText: e.target.value })}
              placeholder="Reply text to show on post publicly"
              className="w-full mt-3 px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 4: DM Setup ─────────────────────────────────────────────────────
function StepDMSetup({ account, form, setForm }: { account: Account | null; form: FormData; setForm: (f: Partial<FormData>) => void }) {
  const charCount = form.dmContent.length;

  return (
    <div className="space-y-5">
      {/* Account badge */}
      {account && (
        <div className="flex flex-col items-center gap-1.5 pb-1">
          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#ee2a7b]/30 bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              {account.profile_picture_url ? (
                <img src={account.profile_picture_url} alt="" className="w-full h-full object-cover" />
              ) : <div className="w-full h-full bg-slate-100 flex items-center justify-center font-bold">{account.username?.[0]?.toUpperCase()}</div>}
            </div>
          </div>
          <p className="font-bold text-[13px] text-slate-900">@{account.username}</p>
        </div>
      )}

      {/* Pre-DM actions */}
      <div>
        <p className="font-bold text-[14px] text-slate-800 mb-3">Before you send your primary DM, send them…</p>
        <div className="space-y-2">
          {[
            { key: "askFollow" as const, label: "Ask to follow you" },
            { key: "askEmail" as const, label: "Ask to share their email" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setForm({ [key]: !form[key] })}
              className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors"
            >
              <span className="font-semibold text-[14px] text-slate-800">{label}</span>
              <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form[key] ? "bg-slate-900" : "bg-slate-200"}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${form[key] ? "left-5.5" : "left-0.5"}`} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Primary DM */}
      <div>
        <p className="font-bold text-[14px] text-slate-800 mb-1">Then send the primary DM…</p>
        <p className="text-[12px] text-slate-400 mb-4">Write the message you want to auto-send with a button that takes them to your link or product.</p>

        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">DM type</label>
            <select
              value={form.dmType}
              onChange={e => setForm({ dmType: e.target.value as FormData["dmType"] })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold bg-white focus:outline-none focus:border-slate-400"
            >
              <option value="message_only">Message Only</option>
              <option value="message_button">Message + Button</option>
            </select>
          </div>

          <div>
            <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">DM content</label>
            <textarea
              value={form.dmContent}
              onChange={e => setForm({ dmContent: e.target.value.slice(0, 1000) })}
              placeholder="Hi there! Appreciate your comment..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400 resize-none"
            />
            <p className={`text-right text-[11px] mt-1 ${charCount > 900 ? "text-red-500" : "text-slate-400"}`}>{charCount}/1000</p>
          </div>

          {form.dmType === "message_button" && (
            <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Button details</p>
              <input
                value={form.dmButtonLabel}
                onChange={e => setForm({ dmButtonLabel: e.target.value })}
                placeholder="Button Label (e.g. Get the Link)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] bg-white focus:outline-none focus:border-slate-400"
              />
              <input
                value={form.dmButtonUrl}
                onChange={e => setForm({ dmButtonUrl: e.target.value })}
                placeholder="Button URL (https://...)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] bg-white focus:outline-none focus:border-slate-400"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Review + Launch ──────────────────────────────────────────────
function StepReview({ account, form }: { account: Account | null; form: FormData }) {
  const thumb = form.selectedMedia?.thumbnail_url || form.selectedMedia?.media_url;

  return (
    <div className="space-y-4">
      <p className="font-bold text-[16px] text-slate-800">Awesome! Let's review once before we launch!</p>

      <div className="space-y-3">
        {/* When someone */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">When someone…</p>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-500" />
            <p className="text-[13px] font-semibold text-slate-800">
              {form.commentScope === "specific" ? "Comments on this specific post" : form.commentScope === "any" ? "Comments on any post/reel" : "Comments on the next post/reel"}
            </p>
          </div>
          {thumb && (
            <div className="mt-3 w-28 h-28 rounded-xl overflow-hidden border border-slate-200">
              <img src={thumb} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Keywords */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">and <strong>includes</strong> the following keywords</p>
          {form.keywordMode === "any" ? (
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[12px] font-semibold text-slate-600 italic">Any comment</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {form.keywords.map(k => (
                <span key={k} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[12px] font-semibold text-slate-700">{k}</span>
              ))}
            </div>
          )}
        </div>

        {/* Auto-reply */}
        {form.autoReplyEnabled && form.autoReplyText && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">leave a reply to their comment on the post</p>
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">U</div>
              <div>
                <p className="text-[11px] text-slate-400">User <span className="text-slate-300">·</span> This is a comment</p>
                <div className="mt-1 flex items-start gap-1.5">
                  {account?.profile_picture_url ? (
                    <img src={account.profile_picture_url} alt="" className="w-5 h-5 rounded-full" />
                  ) : <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ee2a7b] to-[#6228d7]" />}
                  <p className="text-[12px] text-slate-600"><span className="font-bold text-[#ee2a7b]">@{account?.username}</span> {form.autoReplyText}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DM preview */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">after they comment, send the primary DM</p>
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
            <p className="text-[13px] text-slate-700 leading-relaxed">{form.dmContent || <span className="text-slate-300 italic">No message set</span>}</p>
            {form.dmType === "message_button" && form.dmButtonLabel && (
              <div className="pt-1">
                <span className="inline-block px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-[12px] font-bold">{form.dmButtonLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────
export function CreateAutomationModal({ isOpen, onClose, account, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setFormRaw] = useState<FormData>({
    triggerType: "post_comment",
    commentScope: "specific",
    selectedMedia: null,
    keywordMode: "specific",
    keywords: [],
    autoReplyEnabled: false,
    autoReplyText: "",
    askFollow: false,
    askEmail: false,
    dmType: "message_only",
    dmContent: "",
    dmButtonLabel: "",
    dmButtonUrl: "",
  });

  const setForm = (partial: Partial<FormData>) => setFormRaw(prev => ({ ...prev, ...partial }));

  const reset = () => {
    setStep(1);
    setFormRaw({
      triggerType: "post_comment",
      commentScope: "specific",
      selectedMedia: null,
      keywordMode: "specific",
      keywords: [],
      autoReplyEnabled: false,
      autoReplyText: "",
      askFollow: false,
      askEmail: false,
      dmType: "message_only",
      dmContent: "",
      dmButtonLabel: "",
      dmButtonUrl: "",
    });
  };

  const handleClose = () => { reset(); onClose(); };

  const canNext = () => {
    if (step === 2 && form.commentScope === "specific" && !form.selectedMedia) return false;
    if (step === 3 && form.keywordMode === "specific" && form.keywords.length === 0) return false;
    if (step === 4 && !form.dmContent.trim()) return false;
    return true;
  };

  const handleLaunch = async () => {
    if (!account) return;
    setSaving(true);
    try {
      const payload = {
        platform: "instagram",
        name: `AutoDM — ${form.commentScope === "specific" ? (form.selectedMedia?.caption?.slice(0, 30) || "Specific Post") : form.commentScope === "any" ? "Any Post" : "Next Post"}`,
        trigger_type: form.triggerType,
        comment_scope: form.commentScope,
        instagram_media_id: form.selectedMedia?.id || null,
        post_thumbnail: form.selectedMedia?.thumbnail_url || form.selectedMedia?.media_url || null,
        keyword_mode: form.keywordMode,
        keywords: form.keywords,
        trigger_keyword: form.keywordMode === "any" ? "Any comment" : form.keywords.join(", "),
        reply_message: form.dmContent,
        auto_reply_enabled: form.autoReplyEnabled,
        auto_reply_text: form.autoReplyText,
        dm_type: form.dmType,
        dm_button_label: form.dmButtonLabel,
        dm_button_url: form.dmButtonUrl,
        ask_follow: form.askFollow,
        ask_email: form.askEmail,
        instagram_account_id: account.id,
        active: true,
        deleted: false,
      };

      const res = await fetch("/api/automation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const { data, error } = await res.json();
      if (error || !data) throw new Error(error || "Failed to create rule");

      toast.success("🚀 AutoDM launched successfully!");
      onCreated();
      handleClose();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const stepTitle = ["Trigger AutoDM when someone…", "Select the post to automate", "Setup keyword triggers", "Create auto-DM rule", "Launch AutoDM"];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-[16px] font-bold text-slate-900">{stepTitle[step - 1]}</h2>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        {step > 1 && (
          <div className="h-1 bg-slate-100 flex-shrink-0">
            <div
              className="h-full bg-gradient-to-r from-[#ee2a7b] to-[#6228d7] transition-all duration-500"
              style={{ width: `${((step - 1) / 4) * 100}%` }}
            />
          </div>
        )}

        {/* Step counter */}
        {step > 1 && (
          <div className="px-5 pt-3 pb-0 flex-shrink-0">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Step {step - 1} of 4</p>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && <StepTrigger onSelect={type => { setForm({ triggerType: type }); setStep(2); }} />}
          {step === 2 && <StepSelectPost account={account} form={form} setForm={setForm} />}
          {step === 3 && <StepKeywords account={account} form={form} setForm={setForm} />}
          {step === 4 && <StepDMSetup account={account} form={form} setForm={setForm} />}
          {step === 5 && <StepReview account={account} form={form} />}
        </div>

        {/* Footer nav */}
        {step > 1 && (
          <div className="flex gap-3 px-5 py-4 border-t border-slate-100 flex-shrink-0">
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-5 py-3 rounded-full border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={15} /> Back
            </button>
            {step < 5 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-full text-[13px] font-bold disabled:opacity-40 hover:bg-slate-800 transition-colors"
              >
                Next Step <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleLaunch}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#ee2a7b] to-[#6228d7] text-white rounded-full text-[13px] font-bold disabled:opacity-70 hover:opacity-90 transition-opacity shadow-lg"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : "🚀"}
                {saving ? "Launching…" : "Launch AutoDM"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
