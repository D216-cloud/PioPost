
"use client";

import { Check, X, Star, Quote } from "lucide-react";
import Image from "next/image";
import avatar from "@/assets/landing-avatar.jpg";

const COMPARISON = [
  { feature: "Speed of creation", hiring: "Days", manual: "Hours", faceless: "Seconds" },
  { feature: "Cost per video", hiring: "$50 - $200", manual: "Time-intensive", faceless: "< $1" },
  { feature: "AI Clipping", hiring: "Manual", manual: "Manual", faceless: "Automatic" },
  { feature: "Viral Hook Detection", hiring: "Experience-based", manual: "Guesswork", faceless: "Data-driven AI" },
  { feature: "Auto-Post to IG", hiring: "No", manual: "No", faceless: "Yes" },
];

const TESTIMONIALS = [
  { name: "Jerome Morton", role: "History Channel Creator", text: "FacelessReels turned my 20-minute documentaries into 30 viral shorts in one click. My reach exploded by 400% in a month.", stars: 5 },
  { name: "Third Eye Vision", role: "Scary Stories Influencer", text: "The AI hook detection is scary accurate. It finds exactly where the story gets intense and crops it perfectly for Reels.", stars: 5 },
  { name: "Alara K.", role: "Mythology Content Creator", text: "I used to spend 5 hours editing one short. Now I schedule a whole week of content in 10 minutes. Absolute game changer.", stars: 5 },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 bg-[#F8FAFC]">
      <div className="mx-auto max-w-6xl px-6 space-y-32">
        
        {/* Comparison Table */}
        <div className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-[#1E293B] md:text-[42px]">
              Why creators choose us
            </h2>
            <p className="text-[#64748B] font-medium max-w-2xl mx-auto">
              Stop wasting thousands on editors or hours on manual work.
            </p>
          </div>

          <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-8 text-[14px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Feature</th>
                  <th className="p-8 text-[14px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">Hiring Editors</th>
                  <th className="p-8 text-[14px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">Manual Work</th>
                  <th className="p-8 text-[16px] font-black text-[#2563EB] uppercase tracking-wider border-b border-[#2563EB]/10 bg-[#EFF6FF] text-center">FacelessReels</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-8 text-[15px] font-bold text-[#1E293B] border-b border-slate-100">{row.feature}</td>
                    <td className="p-8 text-[14px] font-medium text-[#64748B] border-b border-slate-100 text-center">{row.hiring}</td>
                    <td className="p-8 text-[14px] font-medium text-[#64748B] border-b border-slate-100 text-center">{row.manual}</td>
                    <td className="p-8 text-[15px] font-bold text-[#2563EB] border-b border-[#2563EB]/10 bg-[#EFF6FF]/30 text-center">{row.faceless}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Testimonials */}
        <div className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-[#1E293B] md:text-[42px]">
              Trusted by world-class creators
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 relative group hover:shadow-xl transition-all">
                <Quote className="absolute top-8 right-8 text-[#EFF6FF] w-12 h-12 -z-0" />
                <div className="flex gap-1">
                  {[...Array(t.stars)].map((_, s) => (
                    <Star key={s} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-[16px] text-[#1E293B] leading-relaxed font-medium relative z-10 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                   <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100">
                     <Image src={avatar} alt={t.name} width={48} height={48} />
                   </div>
                   <div>
                     <p className="text-[15px] font-bold text-[#1E293B]">{t.name}</p>
                     <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-widest">{t.role}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
