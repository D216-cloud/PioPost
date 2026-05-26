"use client";

import { useState } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  Activity, 
  CheckCircle2,
  Calendar as CalendarIcon,
  Clock,
  Settings as SettingsIcon,
  Plus,
  Loader2,
  BadgeInfo,
  X
} from "lucide-react";
import { YoutubeIcon as Youtube } from "@/components/icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [ytUrl, setYtUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "ready">("idle");
  const [processingStep, setProcessingStep] = useState("");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [discoveredClips, setDiscoveredClips] = useState<Record<string, unknown>[]>([]);
  
  // Configuration State
  const [numReels, setNumReels] = useState(3);
  const [captionTemplate, setCaptionTemplate] = useState("Watch the full insane story! {keyword} #reels #ai");
  const [addLinkComment, setAddLinkComment] = useState(true);
  
  // Scheduling State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState("12:00");
  const [postsPerDay, setPostsPerDay] = useState(1);
  const [isScheduling, setIsScheduling] = useState(false);
  const [playingClip, setPlayingClip] = useState<Record<string, unknown> | null>(null);

  const handleProcess = async () => {
    if (!ytUrl.trim()) return;
    setStatus("processing");
    setData(null);
    setDiscoveredClips([]);
    setProcessingStep("Initializing AI Engine...");
    
    try {
      // 1. Initial Processing Call
      setProcessingStep("Downloading & Analyzing YouTube Content...");
      const res = await fetch("/api/youtube-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: ytUrl }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to process");

      // 2. Simulated "Live Discovery" of Clips
      setProcessingStep("Scanning for Viral Moments...");
      
      for (let i = 0; i < json.clips.length; i++) {
        await new Promise(r => setTimeout(r, 800)); // Simulate AI thinking
        setDiscoveredClips(prev => [...prev, json.clips[i]]);
        setProcessingStep(`Found Viral Moment #${i + 1}...`);
      }

      setData(json);
      setNumReels(Math.min(3, json.clips.length));
      
      // Save to LocalStorage for persistence across dashboard
      localStorage.setItem('pinpost_latest_draft', JSON.stringify({
        ...json,
        timestamp: new Date().getTime()
      }));
      
      setStatus("ready");
      setProcessingStep("");
      toast.success(`AI discovered ${json.clips.length} potential reels!`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to process video");
      setStatus("idle");
      setProcessingStep("");
    }
  };

  const handleScheduleAll = async () => {
    if (!session?.user?.id) {
      toast.error("Please login to schedule posts");
      return;
    }
    
    setIsScheduling(true);
    try {
      const selectedClips = discoveredClips.slice(0, numReels);
      const rows = selectedClips.map((clip: Record<string, unknown>, index: number) => {
        const dayOffset = Math.floor(index / postsPerDay);
        const hourOffset = (index % postsPerDay) * (24 / postsPerDay);
        
        const scheduledDate = new Date(`${startDate}T${startTime}`);
        scheduledDate.setDate(scheduledDate.getDate() + dayOffset);
        scheduledDate.setHours(scheduledDate.getHours() + Math.floor(hourOffset));
        scheduledDate.setMinutes(scheduledDate.getMinutes() + Math.floor((hourOffset % 1) * 60));

        return {
          user_id: session.user.id,
          title: `${data?.title || 'Unknown Title'} — Clip ${index + 1}`,
          source_url: data?.youtubeUrl as string || '',
          youtube_url: data?.youtubeUrl as string || '',
          thumbnail_url: data?.thumbnail as string || '',
          transcript: clip.text,
          clip_text: clip.text,
          caption: captionTemplate.replace("{keyword}", (data?.title as string) || ''),
          start_seconds: clip.start_seconds,
          end_seconds: clip.end_seconds,
          status: "scheduled",
          scheduled_at: scheduledDate.toISOString(),
          add_link_comment: addLinkComment,
          platform: "instagram"
        };
      });

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });

      if (!res.ok) throw new Error("Scheduling failed");

      // Clear draft after scheduling
      localStorage.removeItem('pinpost_latest_draft');
      
      toast.success(`Successfully scheduled ${numReels} reels!`);
      router.push("/dashboard/videos");
    } catch (e: unknown) {
      console.error(e);
      toast.error("Failed to schedule: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl px-6 md:px-8 pt-8 md:pt-24 pb-16 space-y-12 md:space-y-16 animate-in fade-in duration-700">
      {/* Ambient glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-violet-100/30 blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 h-80 w-80 rounded-full bg-pink-100/20 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
        <div className="space-y-3">
          <h1 className="text-[32px] md:text-[52px] font-normal tracking-tight text-slate-900 leading-none">
            Create <span className="text-[#a855f7] font-medium">Viral Reels</span>
          </h1>
          <p className="text-[14.5px] md:text-[16px] text-slate-500 font-medium max-w-xl leading-relaxed">
            Turn any YouTube video into high-quality short-form content with our advanced AI engine.
          </p>
        </div>
      </div>

      {/* High-Fidelity Input Pill */}
      <section className="relative max-w-3xl group">
        <div className="absolute -inset-1 bg-linear-to-r from-[#a855f7]/20 to-[#e84c9f]/20 rounded-2xl md:rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-white rounded-2xl md:rounded-[2rem] p-2 md:p-3 border border-[#e4e4e7] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center gap-2 md:gap-4">
          <div className="hidden md:flex pl-6 text-slate-400">
            <Youtube size={24} />
          </div>
          <input 
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            placeholder="Paste YouTube video link here..."
            className="w-full md:flex-1 h-12 md:h-14 bg-transparent px-6 md:px-0 text-[15px] md:text-[16px] font-medium focus:outline-none placeholder:text-slate-300"
          />
          <button 
            onClick={handleProcess}
            disabled={status === "processing" || !ytUrl}
            className="w-full md:w-auto bg-slate-900 hover:bg-black text-white h-12 md:h-14 px-10 rounded-xl md:rounded-2xl text-[15px] font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-slate-900/10 active:scale-95"
          >
            {status === "processing" ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={18} />}
            Generate
          </button>
        </div>
      </section>

      {/* Step 2 & 3: Configuration & Preview */}
      {(status === "ready" || status === "processing") && (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-12">
          {/* Metadata Card - ChatGPT Style */}
          {data ? (
            <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#e4e4e7] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 group animate-in zoom-in-95 duration-500 text-center md:text-left">
               <div className="w-full md:w-40 aspect-video rounded-2xl overflow-hidden shadow-sm shrink-0 border border-slate-100">
                 <img src={data.thumbnail as string} className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-400" />
                     <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Found {(data.clips as unknown[])?.length || 0} Clips</span>
                  </div>
                  <h3 className="text-[20px] md:text-[22px] font-bold text-slate-900 leading-tight truncate w-full">{data.title as string}</h3>
                  <p className="text-[14px] text-slate-400 font-medium">{data.author as string}</p>
               </div>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] p-8 border border-[#e4e4e7] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex items-center gap-8 animate-pulse">
               <div className="w-40 aspect-video rounded-2xl bg-slate-100 shrink-0" />
               <div className="flex-1 space-y-3">
                  <div className="h-2 w-24 bg-slate-100 rounded-full" />
                  <div className="h-6 w-64 bg-slate-100 rounded-full" />
                  <div className="h-4 w-32 bg-slate-100 rounded-full" />
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Configuration */}
             <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#e4e4e7] shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6 md:space-y-8 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <SettingsIcon size={20} />
                  </div>
                  <h4 className="text-[18px] font-bold text-slate-900 tracking-tight">Configuration</h4>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Quantity</label>
                      <span className="text-[14px] font-black text-[#a855f7]">{numReels} Reels</span>
                    </div>
                    <input 
                      type="range" min="1" max={(data?.clips as unknown[])?.length || 5} 
                      value={numReels}
                      onChange={(e) => setNumReels(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#a855f7]"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Caption Template</label>
                    <textarea 
                      value={captionTemplate}
                      onChange={(e) => setCaptionTemplate(e.target.value)}
                      className="w-full h-24 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 focus:border-[#a855f7]/20 focus:bg-white transition-all text-[14px] font-medium resize-none outline-none"
                      placeholder="Use {keyword} for variety..."
                    />
                  </div>

                  <label className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border border-slate-100">
                    <span className="text-[13px] font-bold text-slate-600">Auto-comment source link</span>
                    <input 
                      type="checkbox" 
                      checked={addLinkComment}
                      onChange={(e) => setAddLinkComment(e.target.checked)}
                      className="w-5 h-5 rounded accent-slate-900" 
                    />
                  </label>
                </div>
             </div>

             {/* Scheduling */}
             <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#e4e4e7] shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6 md:space-y-8 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <CalendarIcon size={20} />
                  </div>
                  <h4 className="text-[18px] font-bold text-slate-900 tracking-tight">Scheduling</h4>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                      <input 
                        type="date" value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-4 bg-slate-50/50 rounded-2xl border border-slate-100 focus:border-[#a855f7]/20 text-[14px] font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Time</label>
                      <input 
                        type="time" value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full p-4 bg-slate-50/50 rounded-2xl border border-slate-100 focus:border-[#a855f7]/20 text-[14px] font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Posts per day</span>
                      <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                         <button onClick={() => setPostsPerDay(Math.max(1, postsPerDay - 1))} className="w-8 h-8 rounded-lg hover:bg-white transition-all font-black text-slate-400">-</button>
                         <span className="text-[14px] font-black text-slate-900 w-4 text-center">{postsPerDay}</span>
                         <button onClick={() => setPostsPerDay(postsPerDay + 1)} className="w-8 h-8 rounded-lg hover:bg-white transition-all font-black text-slate-400">+</button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleScheduleAll}
                      disabled={isScheduling || !data}
                      className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl text-[15px] font-black transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isScheduling ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                      Schedule Reels
                    </button>
                  </div>
                </div>
             </div>
          </div>

          {/* Real-time Previews */}
          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
               <div className="space-y-1 text-center sm:text-left">
                 <h4 className="text-[24px] md:text-[28px] font-bold text-slate-900 tracking-tight">
                   {status === "ready" ? `Discovered ${discoveredClips.length} Reels` : "AI Discovery in Progress"}
                 </h4>
                 {processingStep && (
                   <p className="text-[14px] text-[#a855f7] font-bold uppercase tracking-wider animate-pulse flex items-center justify-center sm:justify-start gap-2">
                     <Loader2 size={14} className="animate-spin" />
                     {processingStep}
                   </p>
                 )}
               </div>
               <div className="flex items-center gap-2 text-slate-400 font-bold text-[13px] uppercase tracking-widest">
                  <Activity size={16} className={status === "ready" ? "text-emerald-500" : "text-slate-300 animate-pulse"} />
                  <span>{status === "ready" ? "Analysis Complete" : "Real-time Scoring"}</span>
               </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 pb-10">
              {discoveredClips.slice(0, numReels).map((clip: Record<string, unknown>, i: number) => (
                <div key={i} className="w-full sm:w-[280px] aspect-[9/16] bg-slate-900 rounded-[2.5rem] relative overflow-hidden shadow-2xl border-[6px] border-white shrink-0 group transition-all duration-700 animate-in fade-in slide-in-from-bottom-10 hover:scale-[1.03] hover:shadow-purple-500/10">
                  <img src={clip.thumb as string} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-700" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/10" />
                  
                  <div className="absolute top-6 left-6">
                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20 shadow-xl">
                      Reel #{i + 1}
                    </div>
                  </div>

                  <div 
                    onClick={() => setPlayingClip({ ...clip, ytId: ytUrl.split('v=')[1] || ytUrl.split('/').pop() })}
                    className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl hover:bg-white transition-all duration-300 hover:text-slate-900 text-white cursor-pointer z-10"
                  >
                     <Play size={20} className="fill-current ml-1" />
                  </div>

                  <div className="absolute bottom-10 left-8 right-8 space-y-5">
                    <div className="flex items-center gap-2">
                       <div className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-lg border border-emerald-500/30">
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">98% Viral Potential</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-white text-[14px] font-bold leading-relaxed line-clamp-3 italic opacity-95">
                         &quot;{clip.text as string}&quot;
                       </p>
                       <div className="flex items-center gap-3 pt-2">
                          <Clock size={12} className="text-white/40" />
                          <p className="text-white/40 text-[11px] font-mono tracking-tighter">
                            {clip.start as string} — {clip.end as string}
                          </p>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Video Playback Modal */}
      {playingClip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg aspect-[9/16] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
            <button 
              onClick={() => setPlayingClip(null)}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white z-50 transition-all"
            >
              <X size={24} />
            </button>
            <iframe 
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${playingClip.ytId}?start=${playingClip.start_seconds}&end=${playingClip.end_seconds}&autoplay=1&rel=0&modestbranding=1`}
              title="Reel Preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
