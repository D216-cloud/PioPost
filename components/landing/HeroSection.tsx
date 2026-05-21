
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import avatar from "@/assets/landing-avatar.jpg";

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28 bg-white border-b border-black/5">
      {/* Background Layers */}
      <div className="absolute inset-x-0 bottom-0 top-[55%] bg-white" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-slate-900" />
            Editorial launch
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-150">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white overflow-hidden bg-slate-100">
                  <Image src={avatar} alt="User" width={32} height={32} className="object-cover" />
                </div>
              ))}
            </div>
            <div className="flex flex-col items-start gap-0.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="h-3.5 w-3.5 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-[12px] font-bold text-slate-600 tracking-tight">Trusted by 862k+ users</p>
            </div>
          </div>

          <h1
            className="display-serif mt-10 text-4xl md:text-[72px] font-semibold tracking-tight text-slate-900 mb-6 leading-[0.98]"
            style={{ textWrap: "balance" }}
          >
            Create viral faceless videos on <span className="relative inline-flex">
              auto-pilot
              <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-[#fbbf24]/70 -z-10" />
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-[19px] text-slate-600 mb-10 leading-relaxed font-medium">
            Turn YouTube videos into short-form content in seconds. <br className="hidden md:block" />
            AI-powered clipping, captions, and scheduling for Instagram Reels.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href={user ? "/dashboard/create" : "/login"}
              className="group relative flex items-center gap-6 bg-slate-900 hover:bg-black text-white pl-10 pr-2 py-2 rounded-full text-[18px] font-bold transition-all hover:scale-[1.03] active:scale-[0.98] shadow-[0_18px_40px_rgba(15,23,42,0.25)]"
            >
              {user ? "Go to Dashboard" : "Get started"}
              <div className="bg-white p-2.5 rounded-full transition-transform group-hover:translate-x-1 shadow-sm">
                <ArrowRight className="h-5 w-5 text-slate-900" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Mock Social Proof Cards */}
      <div className="relative z-10 mt-20 overflow-hidden">
        <div className="flex justify-center gap-6 px-6 md:px-0 animate-in slide-in-from-right-8 duration-1000">
          {[
            { title: "Scary History", views: "745.1K", label: "Pinned" },
            { title: "Mystery Tales", views: "663.9K", label: "Viral" },
            { title: "Ancient Wisdom", views: "512.4K", label: "Top" },
          ].map((card, i) => (
            <div
              key={i}
              className="w-52 aspect-[9/16] bg-slate-900 rounded-[2rem] relative overflow-hidden shadow-[0_24px_60px_rgba(15,23,42,0.35)] border-4 border-white/10 shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white/10" />
              <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase border border-white/20">
                {card.label}
              </div>
              <div className="absolute bottom-6 left-6 right-6 space-y-1">
                <p className="text-white text-[18px] font-bold">{card.views}</p>
                <p className="text-white/60 text-[12px] font-medium">{card.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
