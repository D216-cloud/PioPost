
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SocialCarousel } from "./SocialCarousel";
import avatar from "@/assets/landing-avatar.jpg";

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32 bg-white">
      {/* Background Layers */}
      <div
        className="absolute inset-x-0 bottom-0 top-[45%] z-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, transparent 0%, #e0f2fe 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[45%] z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(#0ea5e9 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Logo */}
          <p className="logo-script text-[32px] text-slate-900 mb-6">
            PinPost
          </p>

          <div className="flex items-center justify-center gap-3 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-150">
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
              <p className="text-[12px] font-bold text-slate-500 tracking-tight">Trusted by 10,000+ creators</p>
            </div>
          </div>

          <h1
            className="text-3xl md:text-[42px] font-bold tracking-tight text-slate-900 mb-8"
            style={{ lineHeight: 1.2, letterSpacing: "-0.02em", textWrap: "balance" }}
          >
            See exactly how your post looks before the world does
          </h1>

          <p
            className="mx-auto max-w-2xl text-[18px] text-slate-500 mb-10 leading-relaxed"
          >
            Preview your content across Instagram, LinkedIn, X, and Facebook — <br className="hidden md:block" />
            all in one editor. Completely free, no catches.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href={user ? "/editor" : "/login"}
              className="group relative flex items-center gap-6 bg-slate-900 hover:bg-black text-white pl-8 pr-2 py-2 rounded-full text-[17px] font-bold transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl"
            >
              {user ? "Go to Dashboard" : "Start Free"}
              <div className="bg-white p-2.5 rounded-full transition-transform group-hover:translate-x-1 shadow-sm">
                <ArrowRight className="h-5 w-5 text-[#0ea5e9]" />
              </div>
            </Link>

            <Link 
              href="/editor"
              className="group relative flex items-center gap-6 bg-white hover:bg-slate-50 text-slate-900 pl-8 pr-2 py-2 rounded-full text-[17px] font-bold border border-slate-200 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            >
              Open Editor
              <div className="bg-slate-900 p-2.5 rounded-full transition-transform group-hover:translate-x-1 shadow-sm">
                <ArrowRight className="h-5 w-5 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-20">
        <SocialCarousel />
      </div>
    </section>
  );
}
