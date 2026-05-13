"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-8 py-24 space-y-16 animate-in fade-in duration-700">
        <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} />
          Back Home
        </Link>

        <div className="space-y-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2563EB]">
            <Shield size={32} />
          </div>
          <h1 className="text-[48px] font-bold text-slate-900 tracking-tight leading-tight">Privacy Policy</h1>
          <p className="text-[18px] text-slate-400 font-medium">Last updated: May 13, 2026</p>
        </div>

        <div className="space-y-12 text-slate-600 leading-relaxed text-[16px]">
          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-slate-900">1. Data Collection</h2>
            <p>At PinPost, we only collect data that is essential for providing our services. This includes your name, email address, and account identifiers for the platforms you connect (YouTube, Instagram).</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-slate-900">2. Usage of Information</h2>
            <p>Your data is used exclusively to facilitate content automation, scheduling, and analysis. We do not sell your personal data to third parties. Our AI models process your video content locally or via secure API endpoints to generate viral clips.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-slate-900">3. Third-Party Services</h2>
            <p>We integrate with Google (YouTube) and Meta (Instagram) APIs. By using PinPost, you also agree to be bound by their respective privacy policies. We only store the access tokens required to perform actions on your behalf.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-slate-900">4. Security</h2>
            <p>We implement industry-standard encryption to protect your account data and access tokens. All communication between our servers and third-party APIs is encrypted via TLS.</p>
          </section>
        </div>

        <div className="pt-12 border-t border-slate-50">
          <p className="text-[14px] text-slate-400 font-medium">If you have any questions about this policy, please contact us at support@pinpost.ai</p>
        </div>
      </div>
    </div>
  );
}
