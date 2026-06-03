// components/automation/CreateAutoDMModal.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Check, Plus, MessageSquare, Zap, Link } from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: string;
  type: string;
  thumbnail: string;
  caption: string;
  permalink: string;
  likes: number;
  comments: number;
}

interface IGAccount {
  username: string;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const STEPS = ["Trigger", "Select Post", "Keywords", "Message", "Launch"];

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

function ToggleSwitch({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex items-center gap-2 rounded-full border px-2 py-1.5 transition-all ${
        on
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
      }`}
    >
      <span className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-slate-300"}`}>
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            on ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{on ? "On" : "Off"}</span>
      <span className="text-[11px] font-medium normal-case tracking-normal">{label}</span>
    </button>
  );
}

export default function CreateAutoDMModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [igAccount, setIgAccount] = useState<IGAccount | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [creating, setCreating] = useState(false);
  const [igAccountId, setIgAccountId] = useState<string | null>(null);
  const [mediaTab, setMediaTab] = useState<"all" | "posts" | "reels">("all");

  // Form state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [keywordMode, setKeywordMode] = useState<"specific" | "any">("specific");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [dmMessage, setDmMessage] = useState("");
  const [addButton, setAddButton] = useState(false);
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [autoReply, setAutoReply] = useState(false);
  const [commentReplyText, setCommentReplyText] = useState("Thanks for the comment! Link is in bio 📩");
  const [requireFollow, setRequireFollow] = useState(false);
  const [followGateMessage, setFollowGateMessage] = useState(
    "Hey! Follow me first and I'll send you the link 🙌"
  );
  const [activationDelayDays, setActivationDelayDays] = useState(0);

  const fetchPosts = useCallback(async () => {
    console.log("[AutoDM] CreateAutoDMModal opened: loading Instagram posts");
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/instagram/posts");
      console.log("[AutoDM] Fetching /api/instagram/posts", { status: res.status });
      const { data, account, error } = await res.json();
      if (error) throw new Error(error);
      setPosts(data || []);
      setIgAccount(account);
      console.log("[AutoDM] Instagram posts loaded", {
        postCount: Array.isArray(data) ? data.length : 0,
        accountUsername: account?.username ?? null,
      });

      // Get the account ID
      const acctRes = await fetch("/api/instagram/account");
      console.log("[AutoDM] Fetching /api/instagram/account", { status: acctRes.status });
      const acctData = await acctRes.json();
      if (acctData.id) {
        setIgAccountId(acctData.id);
        console.log("[AutoDM] Instagram account ID loaded", { accountId: acctData.id });
      } else {
        console.log("[AutoDM] Instagram account ID not found in response", acctData);
      }
    } catch (err: unknown) {
      console.error("[AutoDM] Could not load posts", err);
      toast.error("Could not load posts: " + getErrorMessage(err));
    } finally {
      console.log("[AutoDM] Loading posts finished");
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    console.log("[AutoDM] CreateAutoDMModal mounted");
    queueMicrotask(() => {
      void fetchPosts();
    });
  }, [fetchPosts]);

  function addKeyword() {
    const kw = keywordInput.trim().toUpperCase();
    if (kw && !keywords.includes(kw)) {
      console.log("[AutoDM] Keyword added", { keyword: kw });
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  }

  function removeKeyword(kw: string) {
    console.log("[AutoDM] Keyword removed", { keyword: kw });
    setKeywords(keywords.filter((k) => k !== kw));
  }

  function canProceed(): boolean {
    if (step === 1 && !selectedPost) return false;
    if (step === 2 && keywordMode === "specific" && keywords.length === 0) return false;
    if (step === 3 && !dmMessage.trim()) return false;
    return true;
  }

  async function handleCreate() {
    if (!selectedPost || !igAccountId) return;
    console.log("[AutoDM] Creating automation", {
      step,
      selectedPostId: selectedPost.id,
      selectedPostType: selectedPost.type,
      keywordMode,
      keywords,
      autoReply,
      requireFollow,
      addButton,
      igAccountId,
    });
    setCreating(true);
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagram_account_id: igAccountId,
          post_id: selectedPost.id,
          post_type: selectedPost.type === "VIDEO" ? "REEL" : "POST",
          post_thumbnail_url: selectedPost.thumbnail,
          post_caption: selectedPost.caption,
          post_permalink: selectedPost.permalink,
          keyword_mode: keywordMode,
          keywords: keywordMode === "specific" ? keywords : [],
          dm_message: dmMessage,
          dm_button_label: addButton ? buttonLabel : null,
          dm_button_url: addButton ? buttonUrl : null,
          auto_reply_comment: autoReply,
          comment_reply_text: autoReply ? commentReplyText : null,
          require_follow: requireFollow,
          follow_gate_message: requireFollow ? followGateMessage : null,
          activation_delay_days: activationDelayDays,
        }),
      });

      const { data, error } = await res.json();
      if (error) throw new Error(error);

      console.log("[AutoDM] Automation created successfully", { automation: data ?? null });
      onCreated();
    } catch (err: unknown) {
      console.error("[AutoDM] Failed to create automation", err);
      toast.error("Failed to create automation: " + getErrorMessage(err));
    } finally {
      console.log("[AutoDM] Create automation request finished");
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_-30px_rgba(15,23,42,0.35)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Create AutoDM</h2>
            <p className="mt-0.5 text-xs text-slate-500">Step {step + 1} of {STEPS.length}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="border-b border-slate-100 px-6 py-3">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  i < step ? "bg-slate-900 text-white" :
                  i === step ? "bg-slate-900 text-white ring-2 ring-slate-200" :
                  "bg-slate-100 text-slate-400"
                }`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className={`hidden text-xs sm:block ${i === step ? "font-medium text-slate-900" : "text-slate-400"}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`h-px w-4 ${i < step ? "bg-slate-900" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">

          {/* Step 0 — Trigger Type */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Choose your trigger</h3>
              <p className="text-sm text-slate-500">When should the AutoDM be sent?</p>
              <button
                onClick={() => {
                  console.log("[AutoDM] Trigger selected: comment on post or reel");
                  setStep(1);
                }}
                className="w-full flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900 px-0">Someone comments on a post or reel</p>
                  <p className="text-sm text-slate-500">Trigger a DM when a keyword is commented</p>
                </div>
                <ChevronRight size={18} className="ml-auto text-slate-400" />
              </button>
              <button disabled className="w-full flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left opacity-60">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <Zap size={20} className="text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-500">Someone replies to my story</p>
                  <p className="text-sm text-slate-400">Coming soon</p>
                </div>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Soon</span>
              </button>
            </div>
          )}

          {/* Step 1 — Select Post */}
          {step === 1 && (
            <div>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Select a post or reel</h3>
              <p className="mb-4 text-sm text-slate-500">Choose which post will trigger the AutoDM</p>

              {/* Media Type Filter Tabs */}
              <div className="mb-4 flex max-w-xs gap-1 rounded-full border border-slate-200 bg-white p-1">
                {(["all", "posts", "reels"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      console.log("[AutoDM] Media tab changed", { tab });
                      setMediaTab(tab);
                    }}
                    className={`flex-1 py-1.5 rounded-full text-[12px] font-bold capitalize transition-all ${
                      mediaTab === tab
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {loadingPosts ? (
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square animate-pulse rounded-xl bg-slate-200" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p>No posts found. Connect your Instagram account first.</p>
                </div>
              ) : (
                (() => {
                  const filteredPosts = posts.filter((post) => {
                    if (mediaTab === "posts") return post.type !== "VIDEO";
                    if (mediaTab === "reels") return post.type === "VIDEO";
                    return true;
                  });

                  if (filteredPosts.length === 0) {
                    return (
                      <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-500">
                        <p className="text-sm">No {mediaTab === "reels" ? "reels" : "posts"} found.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid max-h-90 grid-cols-3 gap-3 overflow-y-auto pr-1">
                      {filteredPosts.map((post) => (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => {
                            console.log("[AutoDM] Post selected", {
                              postId: post.id,
                              postType: post.type,
                              permalink: post.permalink,
                            });
                            setSelectedPost(post);
                          }}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedPost?.id === post.id
                              ? "border-slate-900 ring-2 ring-slate-200"
                              : "border-transparent hover:border-slate-300"
                          }`}
                        >
                          <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                          {selectedPost?.id === post.id && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20">
                              <Check size={24} className="text-white drop-shadow" />
                            </div>
                          )}
                          {post.type === "VIDEO" ? (
                            <span className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-800 shadow-sm">
                              🎬 Reel
                            </span>
                          ) : (
                            <span className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-800 shadow-sm">
                              📸 Post
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })()
              )}

              {selectedPost && (
                <div className="mt-4 flex gap-3 items-start rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img src={selectedPost.thumbnail} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-slate-950/70 py-0.5 text-center text-[8px] font-bold uppercase text-white">
                      {selectedPost.type === "VIDEO" ? "REEL" : "POST"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Selected {selectedPost.type === "VIDEO" ? "Reel" : "Post"}
                    </p>
                    <p className="line-clamp-2 text-sm leading-relaxed text-slate-700">{selectedPost.caption || "No caption"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedPost.likes} likes · {selectedPost.comments} comments
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Keywords */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-1 text-lg font-semibold text-slate-900">Set trigger keywords</h3>
                <p className="text-sm text-slate-500">When should the AutoDM send?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    console.log("[AutoDM] Keyword mode changed", { keywordMode: "specific" });
                    setKeywordMode("specific");
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    keywordMode === "specific" ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900">Specific keywords</p>
                  <p className="mt-1 text-xs text-slate-500">Only trigger for defined keywords</p>
                </button>
                <button
                  onClick={() => {
                    console.log("[AutoDM] Keyword mode changed", { keywordMode: "any" });
                    setKeywordMode("any");
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    keywordMode === "any" ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900">Any comment</p>
                  <p className="mt-1 text-xs text-slate-500">Trigger on every comment</p>
                </button>
              </div>

              {keywordMode === "specific" && (
                <div>
                  <label className="mb-2 block text-sm text-slate-600">Add keywords</label>
                  <div className="flex gap-2">
                    <input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                      placeholder='e.g. FREE, LINK, "SEND IT"'
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        console.log("[AutoDM] Keyword add button clicked", { keywordInput });
                        addKeyword();
                      }}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm"
                        >
                          {kw}
                          <button onClick={() => removeKeyword(kw)} className="text-slate-400 transition-colors hover:text-slate-900">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {keywordMode === "any" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-700">
                    ⚠️ &quot;Any comment&quot; mode will DM every single person who comments. Use wisely to avoid spam flags.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Message */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-1 text-lg font-semibold text-slate-900">Craft your DM</h3>
                <p className="text-sm text-slate-500">This message will be sent automatically</p>
              </div>

              {/* Main message */}
              <div>
                <label className="mb-2 block text-sm text-slate-600">
                  DM Message <span className="text-xs text-slate-400">({"{first_name}"} for personalization)</span>
                </label>
                <textarea
                  value={dmMessage}
                  onChange={(e) => setDmMessage(e.target.value)}
                  placeholder='Hey {first_name}! Here is the link you asked for 👇'
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
                />
              </div>

              {/* Button toggle */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Link size={14} className="text-slate-500" /> Add a CTA button
                    </p>
                    <p className="text-xs text-slate-500">Add a clickable button to your DM</p>
                  </div>
                  <ToggleSwitch
                    onClick={() => {
                      console.log("[AutoDM] CTA button toggle changed", { enabled: !addButton });
                      setAddButton(!addButton);
                    }}
                    on={addButton}
                    label="CTA button"
                  />
                </div>

                {addButton && (
                  <div className="mt-3 space-y-2">
                    <input
                      value={buttonLabel}
                      onChange={(e) => setButtonLabel(e.target.value)}
                      placeholder="Button label (e.g. Get the Free Guide)"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
                    />
                    <input
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="Button URL (https://...)"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Auto-reply toggle */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Auto-reply to comment</p>
                    <p className="text-xs text-slate-500">Publicly reply to let them know</p>
                  </div>
                  <ToggleSwitch
                    onClick={() => {
                      console.log("[AutoDM] Auto-reply toggle changed", { enabled: !autoReply });
                      setAutoReply(!autoReply);
                    }}
                    on={autoReply}
                    label="Reply"
                  />
                </div>
                {autoReply && (
                  <input
                    value={commentReplyText}
                    onChange={(e) => setCommentReplyText(e.target.value)}
                    placeholder="Thanks for the comment! Link is in bio 📩"
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Follow gate toggle */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Ask to follow first</p>
                    <p className="text-xs text-slate-500">Reward followers with the DM link</p>
                  </div>
                  <ToggleSwitch
                    onClick={() => {
                      console.log("[AutoDM] Follow gate toggle changed", { enabled: !requireFollow });
                      setRequireFollow(!requireFollow);
                    }}
                    on={requireFollow}
                    label="Gate"
                  />
                </div>
                {requireFollow && (
                  <textarea
                    value={followGateMessage}
                    onChange={(e) => setFollowGateMessage(e.target.value)}
                    placeholder="Hey! Follow me first and I'll send you the link 🙌"
                    rows={2}
                    className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 4 — Review & Launch */}
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Review & Launch</h3>
              <p className="text-sm text-slate-500">Confirm your AutoDM setup before going live</p>

              <div className="space-y-3">
                {/* Post */}
                <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  {selectedPost?.thumbnail && (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <img src={selectedPost.thumbnail} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-slate-950/70 py-0.5 text-center text-[8px] font-bold uppercase text-white">
                        {selectedPost.type === "VIDEO" ? "REEL" : "POST"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Target {selectedPost?.type === "VIDEO" ? "Reel" : "Post"}
                    </p>
                    <p className="line-clamp-2 text-sm text-slate-800">{selectedPost?.caption || "No caption"}</p>
                  </div>
                </div>

                {/* Keywords */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-xs text-slate-500">Trigger Keywords</p>
                  {keywordMode === "any" ? (
                    <span className="text-sm text-slate-700">Any comment</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {keywords.map((kw) => (
                        <span key={kw} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-700">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* DM Message */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-xs text-slate-500">DM Message</p>
                  <p className="text-sm text-slate-800">{dmMessage}</p>
                  {addButton && buttonLabel && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                      <Link size={11} />
                      {buttonLabel}
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-xs text-slate-500">Options</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={autoReply ? "text-emerald-500" : "text-slate-300"}>
                        {autoReply ? "✓" : "✗"}
                      </span>
                      <span className={autoReply ? "text-slate-800" : "text-slate-400"}>Auto-reply to comment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={requireFollow ? "text-emerald-500" : "text-slate-300"}>
                        {requireFollow ? "✓" : "✗"}
                      </span>
                      <span className={requireFollow ? "text-slate-800" : "text-slate-400"}>Follow gate enabled</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-xs text-slate-500">Activation delay</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      value={activationDelayDays}
                      onChange={(e) => {
                        const nextValue = Number(e.target.value);
                        setActivationDelayDays(Number.isFinite(nextValue) && nextValue > 0 ? Math.floor(nextValue) : 0);
                      }}
                      className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-slate-400 focus:outline-none"
                    />
                    <div>
                      <p className="text-sm text-slate-800">Start this automation after this many days.</p>
                      <p className="text-xs text-slate-500">Use 2 or 5 if you want the rule to begin later instead of immediately.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <button
            onClick={() => {
              const nextStep = Math.max(0, step - 1);
              console.log("[AutoDM] Back clicked", { fromStep: step, toStep: nextStep });
              setStep(nextStep);
            }}
            disabled={step === 0}
            className="flex items-center gap-2 text-slate-500 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => {
                const nextStep = step + 1;
                console.log("[AutoDM] Next clicked", { fromStep: step, toStep: nextStep });
                setStep(nextStep);
              }}
              disabled={!canProceed() && step !== 0}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {creating ? "Launching..." : "🚀 Launch AutoDM"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
