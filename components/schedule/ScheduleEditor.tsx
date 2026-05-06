"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Image as ImageIcon, Sparkles, Trash2, Video } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Scheduled {
  id: string;
  caption: string;
  media_url: string;
  media_type: string;
  platforms: string[];
  scheduled_for: string;
  status: string;
}

const InstagramIcon = (props: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>);
const LinkedinIcon = (props: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>);
const TwitterIcon = (props: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>);
const FacebookIcon = (props: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>);
const YoutubeIcon = (props: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>);

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: InstagramIcon, color: "text-pink-500" },
  { id: "linkedin", label: "LinkedIn", icon: LinkedinIcon, color: "text-blue-700" },
  { id: "x", label: "X", icon: TwitterIcon, color: "text-slate-900" },
  { id: "facebook", label: "Facebook", icon: FacebookIcon, color: "text-blue-600" },
  { id: "youtube", label: "YouTube", icon: YoutubeIcon, color: "text-red-600" },
] as const;

export function ScheduleEditor() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const user = session?.user;
  const router = useRouter();

  const [items, setItems] = useState<Scheduled[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [prompt, setPrompt] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["instagram"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_for", { ascending: true });
      if (data) setItems(data as Scheduled[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const togglePlatform = (id: string) => {
    setPlatforms((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  };

  const generateMedia = useCallback(async () => {
    if (!prompt.trim() || !user) return;
    setGenerating(true);
    setError("");
    try {
      // Mocked AI generation for UI purposes
      setTimeout(() => {
        setGeneratedUrl("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop");
        setGenerating(false);
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setGenerating(false);
    }
  }, [prompt, user]);

  const schedulePost = useCallback(async () => {
    if (!user || !generatedUrl || !scheduledFor || platforms.length === 0) return;
    setSaving(true);
    try {
      await supabase.from("scheduled_posts").insert({
        user_id: user.id,
        caption,
        media_url: generatedUrl,
        media_type: mediaType,
        platforms,
        scheduled_for: new Date(scheduledFor).toISOString(),
        status: "pending",
      });
      setPrompt("");
      setCaption("");
      setGeneratedUrl("");
      setScheduledFor("");
      await load();
    } catch (e) {
      console.error("Failed to schedule:", e);
    } finally {
      setSaving(false);
    }
  }, [user, generatedUrl, caption, mediaType, platforms, scheduledFor, load]);

  const remove = useCallback(async (id: string) => {
    try {
      await supabase.from("scheduled_posts").delete().eq("id", id);
      setItems((p) => p.filter((x) => x.id !== id));
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
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Schedule content</h1>
          <p className="text-[14px] text-slate-500 mt-1">
            Generate AI images for posts or short-form video covers, then schedule autoposts.
          </p>
        </div>

        {/* Generator */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-slate-800">
            <Sparkles className="h-4 w-4 text-[#0096d6]" />
            <h2 className="text-[15px] font-bold">Generate media</h2>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setMediaType("image")}
              className={`flex-1 rounded-xl border py-2.5 text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${
                mediaType === "image" 
                  ? "border-[#0096d6] bg-[#0096d6]/5 text-[#0096d6]" 
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <ImageIcon className="h-4 w-4" /> Image (post)
            </button>
            <button
              onClick={() => setMediaType("video")}
              className={`flex-1 rounded-xl border py-2.5 text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${
                mediaType === "video" 
                  ? "border-[#0096d6] bg-[#0096d6]/5 text-[#0096d6]" 
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Video className="h-4 w-4" /> Reel / Short cover
            </button>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what to generate. e.g. Minimal product shot of a coffee mug on a wooden table, soft morning light"
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0096d6] focus:ring-1 focus:ring-[#0096d6] resize-none transition-all shadow-sm"
          />

          <button 
            onClick={generateMedia} 
            disabled={generating || !prompt.trim()} 
            className="inline-flex items-center gap-2 rounded-xl bg-[#60bdf0] px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#0096d6] disabled:opacity-50 shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? "Generating…" : "Generate"}
          </button>

          {error && <p className="text-[12px] text-red-500">{error}</p>}

          {generatedUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 w-full sm:w-[400px]">
              <img src={generatedUrl} alt="Generated" className="w-full h-auto object-cover" />
            </div>
          )}
        </section>

        {/* Scheduling */}
        {generatedUrl && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-slate-800">
              <Calendar className="h-4 w-4 text-[#0096d6]" />
              <h2 className="text-[15px] font-bold">Schedule autopost</h2>
            </div>

            <div>
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption…"
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-[13px] text-slate-800 focus:outline-none focus:border-[#0096d6] focus:ring-1 focus:ring-[#0096d6] resize-none transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">Platforms (allowed)</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const Icon = p.icon;
                  const active = platforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-bold transition-all shadow-sm ${
                        active 
                          ? "border-[#0096d6] bg-[#0096d6]/10 text-[#0096d6]" 
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${active ? "" : p.color}`} />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">Schedule for</label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full sm:w-[300px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-800 focus:outline-none focus:border-[#0096d6] transition-all shadow-sm"
              />
            </div>

            <button 
              onClick={schedulePost} 
              disabled={saving || !scheduledFor || platforms.length === 0} 
              className="inline-flex items-center rounded-xl bg-[#0096d6] px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#0085bd] disabled:opacity-50 shadow-sm"
            >
              {saving ? "Scheduling…" : "Schedule post"}
            </button>
          </section>
        )}

        {/* Upcoming */}
        <section>
          <h2 className="text-[15px] font-bold text-slate-900 mb-4">Upcoming posts</h2>
          {loadingData ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0096d6] border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center shadow-sm">
              <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-slate-600">Nothing scheduled yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                  {item.media_url && (
                    <img src={item.media_url} alt="" className="h-20 w-20 rounded-xl object-cover shrink-0 border border-slate-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-slate-900 line-clamp-1">{item.caption || "(No caption)"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {item.platforms.map((id) => {
                        const p = PLATFORMS.find((x) => x.id === id);
                        if (!p) return null;
                        const Icon = p.icon;
                        return <Icon key={id} className={`h-4 w-4 ${p.color}`} />;
                      })}
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wide">
                      {new Date(item.scheduled_for).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
