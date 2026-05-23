
"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden pt-36 pb-24 md:pt-48 md:pb-32 bg-white">
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl text-center">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/50 px-4 py-1 text-[13px] font-semibold text-slate-600 shadow-sm animate-in fade-in duration-1000">
            <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse"></span>
            <span>Instagram Creator OS v1.2</span>
          </div>

          {/* Title */}
          <h1 className="mt-8 text-[32px] md:text-[68px] font-normal tracking-tight text-black leading-[1.08] max-w-none mx-auto md:whitespace-nowrap animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Automate Your Instagram Growth
          </h1>

          {/* Description */}
          <p className="mt-8 mx-auto max-w-2xl text-[16px] md:text-[18px] text-slate-500 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            AI powered reels scheduling, DM automation and engagement <br className="hidden md:block" />
            tools. Built specifically for creators, digital strategists, and modern <br className="hidden md:block" />
            brands.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <Link
              href={user ? "/dashboard/create" : "/login"}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#e84c9f] via-[#b656e3] to-[#5a60f6] text-white text-[15px] font-bold rounded-full shadow-[0_12px_24px_-4px_rgba(182,86,227,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Start Free</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path>
              </svg>
            </Link>

            <button
              onClick={() => {
                const el = document.getElementById("features");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-50/50 hover:bg-slate-50 text-slate-700 text-[15px] font-bold rounded-full border border-slate-200/80 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5"
            >
              <svg className="w-3.5 h-3.5 text-[#a855f7] fill-[#a855f7]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
              <span>Watch Demo</span>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
