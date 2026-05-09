"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  Image as ImageIcon, 
  Sparkles, 
  Trash2, 
  Video, 
  Play, 
  Scissors, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Plus,
  Zap,
  MoreVertical,
  Share2
} from "lucide-react";
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
  
  // YouTube to Shorts State
  const [ytUrl, setYtUrl] = useState("");
  const [processingStatus, setProcessingStatus] = useState<"idle" | "analyzing" | "clipping" | "ready">("idle");
  const [clips, setClips] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

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

  const handleYtAnalyze = () => {
    if (!ytUrl.trim()) return;
    setAnalyzing(true);
    setProcessingStatus("analyzing");
    
    // Simulate pipeline
    setTimeout(() => setProcessingStatus("clipping"), 2000);
    setTimeout(() => {
      setClips([
        { id: "c1", title: "The Hook", start: "00:12", end: "00:45", score: 94, thumb: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=711&fit=crop" },
        { id: "c2", title: "Middle Insight", start: "01:05", end: "01:30", score: 88, thumb: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=711&fit=crop" },
        { id: "c3", title: "Closing Call", start: "02:40", end: "03:10", score: 91, thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=711&fit=crop" }
      ]);
      setProcessingStatus("ready");
      setAnalyzing(false);
    }, 4000);
  };

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
    <div className="min-h-screen bg-[#fcfcfd] font-sans">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex w-full max-w-7xl items-center px-8 py-4">
          <div className="flex-[0.5] flex items-center gap-4">
            <Link href="/dashboard" className="logo-script text-[26px] text-slate-900">PinPost</Link>
          </div>
          <div className="flex flex-[0.5] items-center justify-end gap-4">
            <div className="flex items-center gap-2.5 bg-slate-50 pl-2 pr-5 py-1.5 rounded-full border border-slate-100">
              <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[12px] font-bold uppercase shadow-sm">
                {session?.user?.email?.[0] || "A"}
              </div>
              <span className="text-[13px] font-bold text-slate-600 truncate max-w-[150px]">{session?.user?.email || "amitmaheta2007@gmail.com"}</span>
            </div>
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-[#0ea5e9] mb-6 transition-colors group">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /> Back to dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-[36px] font-bold tracking-tight text-slate-900">Schedule</h1>
              <p className="text-[16px] text-slate-500 font-medium leading-relaxed max-w-md">
                Plan your content across all platforms with AI-powered smart scheduling.
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Analytics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Scheduled", count: items.filter(i => i.status === 'pending').length, sub: "Upcoming", color: "text-[#0ea5e9]", bg: "bg-[#0ea5e9]/10" },
            { label: "Published", count: 12, sub: "This month", color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Smart Clips", count: clips.length, sub: "Generated", color: "text-red-500", bg: "bg-red-500/10" },
            { label: "Processing", count: analyzing ? 1 : 0, sub: "Background", color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map((stat, i) => (
            <div
              key={i}
              className="group flex flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:border-[#0ea5e9]/30 text-center"
            >
              <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-1`}>
                {i === 0 ? <Calendar size={16} /> : i === 1 ? <CheckCircle2 size={16} /> : i === 2 ? <Scissors size={16} /> : <Activity size={16} />}
              </div>
              <p className="text-[20px] font-bold text-slate-900">{stat.count}</p>
              <div className="flex flex-col">
                <p className="text-[12px] font-bold text-slate-900 group-hover:text-[#0ea5e9] transition-colors">{stat.label}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* YouTube to Shorts Feature */}
        <section className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-red-500/10" />
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
              <YoutubeIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Smart Shorts</h2>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">YouTube → Reels/Shorts AI</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <input 
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                placeholder="Paste YouTube URL (e.g., https://youtube.com/watch?v=...)"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all focus:border-red-500/30 pr-32"
              />
              <button 
                onClick={handleYtAnalyze}
                disabled={analyzing || !ytUrl}
                className="absolute right-2 top-2 bottom-2 bg-slate-900 hover:bg-black text-white px-5 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
              >
                {analyzing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Sparkles size={16} className="text-amber-400" />
                )}
                Analyze
              </button>
            </div>

            {processingStatus !== "idle" && (
              <div className="space-y-3 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-slate-600 flex items-center gap-2">
                    {processingStatus === "analyzing" ? "Analyzing video context..." : 
                     processingStatus === "clipping" ? "Extracting smart clips..." : 
                     "Clips ready for review"}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {processingStatus === "ready" ? "Complete" : "In Progress"}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${processingStatus === "ready" ? "bg-emerald-500 w-full" : "bg-red-500 w-2/3 animate-pulse"}`}
                  />
                </div>
              </div>
            )}

            {clips.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 animate-in fade-in slide-in-from-top-4 duration-700">
                {clips.map((clip) => (
                  <div key={clip.id} className="group/clip relative flex flex-col rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all border-transparent hover:border-red-100">
                    <div className="relative aspect-[9/16] bg-slate-100">
                      <img src={clip.thumb} className="h-full w-full object-cover transition-transform duration-700 group-hover/clip:scale-110" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/clip:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl transform translate-y-4 group-hover/clip:translate-y-0 transition-transform duration-300">
                          <Play size={20} className="text-red-500 ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                        <Activity size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-700">{clip.score}% Viral</span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md">
                        <span className="text-[10px] font-bold text-white font-mono">{clip.start} - {clip.end}</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <h4 className="text-[14px] font-bold text-slate-800">{clip.title}</h4>
                      <button className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-500 py-2 rounded-xl text-[12px] font-bold transition-all border border-transparent hover:border-red-100">
                        <Calendar size={14} /> Schedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Traditional Generator (Restyled) */}
        <section className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-[#0ea5e9]/10" />
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">AI Post Generator</h2>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Static Content</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <button 
                onClick={() => setMediaType("image")}
                className={`flex-1 py-2.5 text-[12px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mediaType === "image" ? "bg-white text-[#0ea5e9] shadow-md" : "text-slate-500 hover:text-slate-800"}`}
              >
                <ImageIcon size={14} /> Image Post
              </button>
              <button 
                onClick={() => setMediaType("video")}
                className={`flex-1 py-2.5 text-[12px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mediaType === "video" ? "bg-white text-[#0ea5e9] shadow-md" : "text-slate-500 hover:text-slate-800"}`}
              >
                <Video size={14} /> Video Cover
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what to generate..."
              rows={3}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all focus:border-[#0ea5e9]/30 resize-none"
            />

            <div className="flex items-center justify-between">
              <button 
                onClick={generateMedia}
                disabled={generating || !prompt.trim()}
                className="group relative flex items-center gap-5 bg-slate-900 hover:bg-black text-white pl-6 pr-1.5 py-1.5 rounded-full text-[13px] font-bold transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Media"}
                <div className="bg-white p-1.5 rounded-full transition-transform group-hover:translate-x-0.5 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-[#0ea5e9]" />
                </div>
              </button>
              
              {generatedUrl && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 animate-in zoom-in duration-300">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-[11px] font-bold text-emerald-600">Ready</span>
                </div>
              )}
            </div>

            {generatedUrl && (
              <div className="relative rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl animate-in fade-in zoom-in duration-500">
                <img src={generatedUrl} className="w-full h-auto object-cover" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg text-slate-600 hover:text-[#0ea5e9] transition-colors"><MoreVertical size={16} /></button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Scheduling Form */}
        {generatedUrl && (
          <section className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Publication Settings</h2>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Finalize your post</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1 block">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write an engaging caption..."
                  rows={4}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all focus:border-[#0ea5e9]/30"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1 block">Publish to</label>
                <div className="flex flex-wrap gap-3">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    const active = platforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-2.5 rounded-2xl border px-5 py-3 text-[13px] font-bold transition-all ${
                          active 
                            ? "border-[#0ea5e9] bg-[#0ea5e9]/5 text-[#0ea5e9] shadow-sm" 
                            : "border-slate-100 bg-slate-50/50 text-slate-400 hover:bg-white hover:border-slate-200"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${active ? "" : "grayscale"}`} />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1 block">Schedule Time</label>
                <div className="relative max-w-sm">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-12 pr-5 py-3.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={schedulePost}
                disabled={saving || !scheduledFor || platforms.length === 0}
                className="group relative flex items-center gap-5 bg-slate-900 hover:bg-black text-white pl-6 pr-1.5 py-1.5 rounded-full text-[14px] font-bold transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50"
              >
                {saving ? "Scheduling..." : "Schedule Post"}
                <div className="bg-white p-1.5 rounded-full transition-transform group-hover:translate-x-0.5 shadow-sm">
                  <ArrowRight className="h-4 w-4 text-[#0ea5e9]" />
                </div>
              </button>
            </div>
          </section>
        )}

        {/* Upcoming Posts */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Queue</h2>
              <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[11px] font-bold text-slate-500">{items.length}</span>
            </div>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0ea5e9] border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-white py-24 text-center space-y-4 shadow-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 mx-auto border border-slate-100 shadow-inner">
                <Calendar className="h-10 w-10 text-slate-300" />
              </div>
              <div className="space-y-2">
                <p className="text-[18px] font-bold text-slate-900">Queue is empty</p>
                <p className="text-[14px] text-slate-400 max-w-xs mx-auto font-medium">
                  Use the tools above to generate and schedule your next viral content.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="group relative flex items-center gap-6 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-xl hover:border-[#0ea5e9]/20">
                  {item.media_url && (
                    <div className="h-24 w-24 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-inner bg-slate-50">
                      <img src={item.media_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-slate-900 truncate leading-tight">{item.caption || "Untitled Post"}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                        {item.platforms.map((id) => {
                          const p = PLATFORMS.find((x) => x.id === id);
                          if (!p) return null;
                          const Icon = p.icon;
                          return <Icon key={id} className={`h-3.5 w-3.5 ${p.color}`} />;
                        })}
                      </div>
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
                        <Clock size={14} />
                        {new Date(item.scheduled_for).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-[#0ea5e9] hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"><Share2 size={18} /></button>
                    <button
                      onClick={() => remove(item.id)}
                      className="p-2.5 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
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
