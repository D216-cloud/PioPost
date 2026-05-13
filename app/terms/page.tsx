"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-8 py-24 space-y-16 animate-in fade-in duration-700">
        <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} />
          Back Home
        </Link>

        <div className="space-y-6">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
            <FileText size={32} />
          </div>
          <h1 className="text-[48px] font-bold text-slate-900 tracking-tight leading-tight">Terms of Service</h1>
          <p className="text-[18px] text-slate-400 font-medium">Last updated: May 13, 2026</p>
        </div>

        <div className="space-y-12 text-slate-600 leading-relaxed text-[16px]">
          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>By accessing and using PinPost, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using the service.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-slate-900">2. Use License</h2>
            <p>Permission is granted to use PinPost for personal or commercial social media automation. This is the grant of a license, not a transfer of title, and under this license you may not attempt to decompile or reverse engineer any software contained on the PinPost platform.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-slate-900">3. Content Ownership</h2>
            <p>You retain all rights to the content you process through PinPost. We do not claim ownership of the videos you download from YouTube or the Reels you post to Instagram. You are responsible for ensuring you have the necessary rights to use and distribute such content.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-slate-900">4. Service Limitations</h2>
            <p>PinPost uses AI models and third-party APIs which may have downtime or limitations beyond our control. We do not guarantee 100% uptime or success rate for automated posting due to platform-specific API restrictions.</p>
          </section>
        </div>

        <div className="pt-12 border-t border-slate-50">
          <p className="text-[14px] text-slate-400 font-medium">© 2026 PINPOST. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
