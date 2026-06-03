"use client";

import { 
  Play, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  BookOpen,
  Video,
  Settings as SettingsIcon
} from "lucide-react";
import { YoutubeIcon, InstagramIcon } from "@/components/icons";

export default function GuidesPage() {
  const guides = [
    {
      title: "Quick Start: From URL to Reel",
      description: "Learn how to turn any long-form YouTube video into 5-10 high-quality Instagram Reels in under 2 minutes.",
      duration: "3 min read",
      category: "Basics",
      icon: Play,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Mastering the AI Clipper",
      description: "Discover how our AI detects viral moments and how you can fine-tune the segmenting for maximum engagement.",
      duration: "5 min read",
      category: "Advanced",
      icon: Sparkles,
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "Optimizing Your Posting Schedule",
      description: "Find out the best times to post for your specific audience and how to use the automation queue effectively.",
      duration: "4 min read",
      category: "Strategy",
      icon: Clock,
      color: "bg-emerald-50 text-emerald-600"
    },
    {
      title: "Connecting Instagram Professional",
      description: "Step-by-step guide on connecting your Instagram Business or Creator account for automated posting.",
      duration: "2 min read",
      category: "Setup",
      icon: InstagramIcon,
      color: "bg-pink-50 text-pink-600"
    }
  ];

  return (
    <div className="relative mx-auto max-w-7xl px-6 md:px-8 pt-8 md:pt-24 pb-20 space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-[32px] md:text-[40px] font-bold text-slate-900 tracking-tight leading-tight">Platform Guides</h1>
        <p className="text-[15px] md:text-[18px] text-slate-500 font-medium">Everything you need to master faceless content automation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {guides.map((guide, i) => {
          const Icon = guide.icon;
          return (
            <div key={i} className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#2563EB]/10 transition-colors" />
              
              <div className="flex items-start justify-between relative z-10">
                <div className={`w-14 h-14 rounded-2xl ${guide.color} flex items-center justify-center mb-6`}>
                   <Icon size={28} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{guide.duration}</span>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-2">
                   <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${guide.color.replace('bg-', 'bg-opacity-10 bg-')}`}>{guide.category}</span>
                </div>
                <h3 className="text-[22px] font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">{guide.title}</h3>
                <p className="text-[15px] text-slate-500 font-medium leading-relaxed">{guide.description}</p>
              </div>

              <div className="mt-8 flex items-center gap-2 text-[#2563EB] font-bold text-[14px]">
                Read Guide <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#1E293B] rounded-[3rem] p-12 relative overflow-hidden text-center space-y-8">
         <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent" />
         </div>
         
         <div className="space-y-4 relative z-10">
            <h2 className="text-[32px] font-bold text-white tracking-tight">Need custom help?</h2>
            <p className="text-[16px] text-slate-400 font-medium max-w-lg mx-auto">Our team is available 24/7 to help you optimize your content workflow and resolve any technical issues.</p>
         </div>

         <div className="flex items-center justify-center gap-4 relative z-10">
            <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-10 py-4 rounded-2xl text-[15px] font-bold transition-all shadow-xl shadow-[#2563EB]/20">
              Contact Support
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-2xl text-[15px] font-bold backdrop-blur-md transition-all">
              Watch Demo
            </button>
         </div>
      </div>
    </div>
  );
}
