"use client";

import { Layers, Plus, Sparkles, Clock, Video } from "lucide-react";

export default function SeriesPage() {
  return (
    <div className="max-w-6xl mx-auto px-8 py-12 space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight">Content Series</h1>
          <p className="text-[15px] text-slate-500 font-medium">Group your reels into episodic series for better engagement.</p>
        </div>
        <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-3 rounded-2xl text-[14px] font-bold transition-all flex items-center gap-2 shadow-xl shadow-[#2563EB]/20">
          <Plus size={18} />
          Create New Series
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-6 flex flex-col items-center text-center justify-center py-20 border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 border border-slate-100/50">
             <Layers size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-[18px] font-bold text-slate-900">No Series Created</h3>
            <p className="text-[14px] text-slate-400 font-medium max-w-[200px]">Start grouping your related reels into logical series.</p>
          </div>
          <button className="text-[#2563EB] text-[13px] font-bold hover:underline">Read the Series Guide</button>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6 relative overflow-hidden group hover:border-[#2563EB]/20 transition-all">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-[#2563EB]/10 transition-all" />
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                 <Sparkles size={20} />
              </div>
              <h3 className="text-[18px] font-bold text-slate-900">AI Series</h3>
           </div>
           <p className="text-[14px] text-slate-500 font-medium leading-relaxed">Let AI automatically detect patterns in your content and group them into logical episodic series.</p>
           <div className="pt-4 flex items-center justify-between border-t border-slate-50">
              <div className="flex items-center gap-2">
                 <Video size={14} className="text-slate-300" />
                 <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Pro</span>
              </div>
              <button className="text-[13px] font-bold text-[#2563EB] hover:bg-blue-50 px-4 py-2 rounded-lg transition-all">Enable Now</button>
           </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6 relative overflow-hidden group hover:border-[#2563EB]/20 transition-all">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                 <Clock size={20} />
              </div>
              <h3 className="text-[18px] font-bold text-slate-900">Sequencing</h3>
           </div>
           <p className="text-[14px] text-slate-500 font-medium leading-relaxed">Schedule entire series at once. We'll automatically space them out to keep your audience engaged daily.</p>
           <div className="pt-4">
              <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 py-3 rounded-2xl text-[13px] font-bold transition-all">
                 Configure Logic
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
