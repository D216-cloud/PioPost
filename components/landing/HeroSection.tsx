"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { SocialCarousel } from "./SocialCarousel";
import { motion } from "framer-motion";

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden pt-36 pb-24 md:pt-48 md:pb-40 bg-white">
      {/* Subtle Grid and Radial Glowing Lights */}
      <div className="absolute inset-0 pattern-grid opacity-[0.35] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-gradient-to-b from-slate-50/20 via-transparent to-transparent blur-3xl pointer-events-none" />

      <motion.div 
        className="relative z-10 mx-auto max-w-7xl px-6"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto max-w-4xl text-center">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/60 px-3.5 py-1 text-[12px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm animate-in fade-in duration-1000">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
            <span>Instagram Creator OS v1.2</span>
          </div>

          {/* Title */}
          <h1 className="mt-8 text-[36px] md:text-[72px] font-normal tracking-tight text-slate-900 leading-[1.15] max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Automate Your <br className="hidden sm:block" /> <span className="relative inline-block">Instagram Growth<svg className="absolute left-0 w-full" style={{bottom:'-8px', height:'12px'}} viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><path d="M2 8 Q150 0 298 8" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" fill="none"/></svg></span>
          </h1>

          {/* Description */}
          <p className="mt-6 mx-auto max-w-2xl text-[16px] md:text-[18px] text-slate-500 leading-relaxed font-normal animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            AI-powered reels scheduling, DM automation, and engagement tools. <br className="hidden md:block" />
            Built specifically for creators, digital strategists, and modern brands.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <Link
              href={user ? "/dashboard/create" : "/login"}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Start Free</span>
              <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path>
              </svg>
            </Link>

            <button
              onClick={() => {
                const el = document.getElementById("features");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 text-[14px] font-semibold rounded-full border border-slate-200 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <svg className="w-3 h-3 text-slate-400 fill-slate-400" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Visual proof section header */}
          <div className="mt-24 md:mt-32 space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              Visual proof
            </span>
            <h3 className="text-xl md:text-2xl font-normal tracking-tight text-slate-800">
              See what creators are building with StartProfile
            </h3>
          </div>

          {/* Loop showcase container with gradient overlay masks */}
          <div className="relative mt-8 w-full max-w-5xl mx-auto rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-400">
            {/* Carousel element */}
            <SocialCarousel />
            
            {/* Ambient side masks to blend carousel edges */}
            <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent pointer-events-none z-20" />
            <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent pointer-events-none z-20" />
          </div>

        </div>
      </motion.div>
    </section>
  );
}
