"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export function CTASection() {
  const { user } = useAuth();

  return (
    <section className="py-28 md:py-40 bg-white border-t border-slate-100 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(241,245,249,0.3),transparent_50%)] pointer-events-none" />

      {/* Framer Motion Viewport Scroll-Triggered Reveal */}
      <motion.div
        className="mx-auto max-w-3xl px-6 text-center relative z-10"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/60 px-3.5 py-1 text-[12px] font-semibold text-slate-600 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse"></span>
          Get started today
        </div>

        {/* Headline */}
        <h2 className="mt-6 text-[32px] md:text-[56px] font-normal tracking-tight text-slate-900 leading-[1.1] max-w-2xl mx-auto mb-6 text-center">
          Ready to scale your Instagram growth?
        </h2>

        {/* Subheading */}
        <p className="mt-4 mx-auto max-w-2xl text-[16px] md:text-[18px] text-slate-500 leading-relaxed font-normal mb-10">
          Get started in 60 seconds. Unlock AI scheduling, automated engagement, and DM automation — free.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <span>{user ? "Go to Dashboard" : "Start Free"}</span>
            <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>

          <button
            onClick={() => {
              const el = document.getElementById("how");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 text-[14px] font-semibold rounded-full border border-slate-200 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5 text-slate-400 fill-slate-400" viewBox="0 0 24 24">
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
            <span>Watch Demo</span>
          </button>
        </div>

        {/* Trust badges */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 text-[12px] font-bold text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Free forever plan
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Cancel anytime
          </span>
        </div>
      </motion.div>
    </section>
  );
}
