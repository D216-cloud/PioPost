// components/automation/CreateAutoDMModal.tsx
"use client";

import { useState, useEffect } from "react";
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
  const [commentReplyText, setCommentReplyText] = useState("Check your DMs! 📩");
  const [requireFollow, setRequireFollow] = useState(false);
  const [followGateMessage, setFollowGateMessage] = useState(
    "Hey! Follow me first and I'll send you the link 🙌"
  );

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/instagram/posts");
      const { data, account, error } = await res.json();
      if (error) throw new Error(error);
      setPosts(data || []);
      setIgAccount(account);

      // Get the account ID
      const acctRes = await fetch("/api/instagram/account");
      const acctData = await acctRes.json();
      if (acctData.id) setIgAccountId(acctData.id);
    } catch (err: any) {
      toast.error("Could not load posts: " + err.message);
    } finally {
      setLoadingPosts(false);
    }
  }

  function addKeyword() {
    const kw = keywordInput.trim().toUpperCase();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  }

  function removeKeyword(kw: string) {
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
        }),
      });

      const { data, error } = await res.json();
      if (error) throw new Error(error);

      onCreated();
    } catch (err: any) {
      toast.error("Failed to create automation: " + err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="font-semibold text-white">Create AutoDM</h2>
            <p className="text-xs text-gray-400 mt-0.5">Step {step + 1} of {STEPS.length}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  i < step ? "bg-purple-600 text-white" :
                  i === step ? "bg-purple-600 text-white ring-2 ring-purple-400/40" :
                  "bg-gray-800 text-gray-500"
                }`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? "text-white font-medium" : "text-gray-500"}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`h-px w-4 ${i < step ? "bg-purple-600" : "bg-gray-800"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* Step 0 — Trigger Type */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Choose your trigger</h3>
              <p className="text-gray-400 text-sm">When should the AutoDM be sent?</p>
              <button
                onClick={() => setStep(1)}
                className="w-full flex items-center gap-4 p-4 bg-gray-800 border-2 border-purple-600 rounded-xl hover:bg-gray-750 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center">
                  <MessageSquare size={20} className="text-purple-400" />
                </div>
                <div>
                  <p className="font-medium px-0">Someone comments on a post/reel</p>
                  <p className="text-sm text-gray-400">Trigger DM when a specific keyword is commented</p>
                </div>
                <ChevronRight size={18} className="ml-auto text-gray-500" />
              </button>
              <button disabled className="w-full flex items-center gap-4 p-4 bg-gray-800/50 border border-gray-800 rounded-xl opacity-50 cursor-not-allowed text-left">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                  <Zap size={20} className="text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-400">Someone replies to my story</p>
                  <p className="text-sm text-gray-500">Coming soon</p>
                </div>
                <span className="ml-auto text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Soon</span>
              </button>
            </div>
          )}

          {/* Step 1 — Select Post */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-1">Select a post or reel</h3>
              <p className="text-gray-400 text-sm mb-4">Choose which post will trigger the AutoDM</p>

              {/* Media Type Filter Tabs */}
              <div className="flex p-1 bg-gray-800 rounded-full gap-1 mb-4 max-w-xs border border-gray-700">
                {(["all", "posts", "reels"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setMediaTab(tab)}
                    className={`flex-1 py-1.5 rounded-full text-[12px] font-bold capitalize transition-all ${
                      mediaTab === tab
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {loadingPosts ? (
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-gray-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
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
                      <div className="text-center py-12 text-gray-450 bg-gray-850 rounded-xl border border-gray-800">
                        <p className="text-sm">No {mediaTab === "reels" ? "reels" : "posts"} found.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
                      {filteredPosts.map((post) => (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => setSelectedPost(post)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedPost?.id === post.id
                              ? "border-purple-500 ring-2 ring-purple-500/30"
                              : "border-transparent hover:border-gray-600"
                          }`}
                        >
                          <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                          {selectedPost?.id === post.id && (
                            <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                              <Check size={24} className="text-white drop-shadow" />
                            </div>
                          )}
                          {post.type === "VIDEO" ? (
                            <span className="absolute top-1.5 right-1.5 text-[9px] font-black bg-black/60 text-purple-300 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                              🎬 Reel
                            </span>
                          ) : (
                            <span className="absolute top-1.5 right-1.5 text-[9px] font-black bg-black/60 text-sky-300 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
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
                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700 flex gap-3 items-start">
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 relative border border-gray-700 bg-gray-900">
                    <img src={selectedPost.thumbnail} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 text-[8px] font-bold bg-black/75 text-white text-center py-0.5 uppercase">
                      {selectedPost.type === "VIDEO" ? "REEL" : "POST"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-purple-400 mb-0.5 uppercase tracking-wider">
                      Selected {selectedPost.type === "VIDEO" ? "Reel" : "Post"}
                    </p>
                    <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">{selectedPost.caption || "No caption"}</p>
                    <p className="text-xs text-gray-500 mt-1">
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
                <h3 className="text-lg font-semibold mb-1">Set trigger keywords</h3>
                <p className="text-gray-400 text-sm">When should the AutoDM send?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setKeywordMode("specific")}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    keywordMode === "specific" ? "border-purple-600 bg-purple-600/10" : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <p className="font-medium text-sm">Specific keywords</p>
                  <p className="text-xs text-gray-400 mt-1">Only trigger for defined keywords</p>
                </button>
                <button
                  onClick={() => setKeywordMode("any")}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    keywordMode === "any" ? "border-purple-600 bg-purple-600/10" : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <p className="font-medium text-sm">Any comment</p>
                  <p className="text-xs text-gray-400 mt-1">Trigger on every comment</p>
                </button>
              </div>

              {keywordMode === "specific" && (
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Add keywords</label>
                  <div className="flex gap-2">
                    <input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                      placeholder='e.g. FREE, LINK, "SEND IT"'
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={addKeyword}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="flex items-center gap-1.5 bg-purple-900/40 text-purple-300 border border-purple-800/50 px-3 py-1 rounded-full text-sm"
                        >
                          {kw}
                          <button onClick={() => removeKeyword(kw)} className="hover:text-white">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {keywordMode === "any" && (
                <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm">
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
                <h3 className="text-lg font-semibold mb-1">Craft your DM</h3>
                <p className="text-gray-400 text-sm">This message will be sent automatically</p>
              </div>

              {/* Main message */}
              <div>
                <label className="text-sm text-gray-300 mb-2 block">
                  DM Message <span className="text-gray-500 text-xs">({"{first_name}"} for personalization)</span>
                </label>
                <textarea
                  value={dmMessage}
                  onChange={(e) => setDmMessage(e.target.value)}
                  placeholder='Hey {first_name}! Here is the link you asked for 👇'
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Button toggle */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Link size={14} className="text-purple-400" /> Add a CTA button
                    </p>
                    <p className="text-xs text-gray-500">Add a clickable button to your DM</p>
                  </div>
                  <button
                    onClick={() => setAddButton(!addButton)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${addButton ? "bg-purple-600" : "bg-gray-700"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${addButton ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {addButton && (
                  <div className="mt-3 space-y-2">
                    <input
                      value={buttonLabel}
                      onChange={(e) => setButtonLabel(e.target.value)}
                      placeholder="Button label (e.g. Get the Free Guide)"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="Button URL (https://...)"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* Auto-reply toggle */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-reply to comment</p>
                    <p className="text-xs text-gray-500">Publicly reply to let them know</p>
                  </div>
                  <button
                    onClick={() => setAutoReply(!autoReply)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${autoReply ? "bg-purple-600" : "bg-gray-700"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${autoReply ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {autoReply && (
                  <input
                    value={commentReplyText}
                    onChange={(e) => setCommentReplyText(e.target.value)}
                    placeholder="Check your DMs! 📩"
                    className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                )}
              </div>

              {/* Follow gate toggle */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Ask to follow first</p>
                    <p className="text-xs text-gray-500">Reward followers with the DM link</p>
                  </div>
                  <button
                    onClick={() => setRequireFollow(!requireFollow)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${requireFollow ? "bg-purple-600" : "bg-gray-700"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${requireFollow ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {requireFollow && (
                  <textarea
                    value={followGateMessage}
                    onChange={(e) => setFollowGateMessage(e.target.value)}
                    placeholder="Hey! Follow me first and I'll send you the link 🙌"
                    rows={2}
                    className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 4 — Review & Launch */}
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold mb-1">Review & Launch</h3>
              <p className="text-gray-400 text-sm">Confirm your AutoDM setup before going live</p>

              <div className="space-y-3">
                {/* Post */}
                <div className="flex gap-3 bg-gray-800 rounded-xl p-4 border border-gray-700">
                  {selectedPost?.thumbnail && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-gray-700 bg-gray-900">
                      <img src={selectedPost.thumbnail} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 text-[8px] font-bold bg-black/75 text-white py-0.5 text-center uppercase">
                        {selectedPost.type === "VIDEO" ? "REEL" : "POST"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-purple-400 mb-0.5 uppercase tracking-wider">
                      Target {selectedPost?.type === "VIDEO" ? "Reel" : "Post"}
                    </p>
                    <p className="text-sm text-white line-clamp-2">{selectedPost?.caption || "No caption"}</p>
                  </div>
                </div>

                {/* Keywords */}
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">Trigger Keywords</p>
                  {keywordMode === "any" ? (
                    <span className="text-sm text-purple-300">Any comment</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {keywords.map((kw) => (
                        <span key={kw} className="text-xs bg-purple-900/40 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded-full font-mono">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* DM Message */}
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">DM Message</p>
                  <p className="text-sm text-white">{dmMessage}</p>
                  {addButton && buttonLabel && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs bg-blue-900/40 text-blue-300 border border-blue-800/40 px-3 py-1.5 rounded-lg">
                      <Link size={11} />
                      {buttonLabel}
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">Options</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={autoReply ? "text-green-400" : "text-gray-600"}>
                        {autoReply ? "✓" : "✗"}
                      </span>
                      <span className={autoReply ? "text-white" : "text-gray-500"}>Auto-reply to comment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={requireFollow ? "text-green-400" : "text-gray-600"}>
                        {requireFollow ? "✓" : "✗"}
                      </span>
                      <span className={requireFollow ? "text-white" : "text-gray-500"}>Follow gate enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-900">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed() && step !== 0}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {creating ? "Launching..." : "🚀 Launch AutoDM"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
