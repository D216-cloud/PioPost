"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Instagram, ShieldCheck, Link2, Webhook } from "lucide-react";

export default function InstagramConnectPage() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const callbackUrl = origin ? `${origin}/api/auth/instagram/callback` : "https://your-domain.com/api/auth/instagram/callback";
  const webhookUrl = origin ? `${origin}/api/webhooks/instagram` : "https://your-domain.com/api/webhooks/instagram";

  const startConnect = () => {
    window.location.href = "/api/auth/instagram/link";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-14">
        <Link
          href="/dashboard/settings"
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-slate-300 transition-colors hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </Link>

        <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-12">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-lg">
              <Instagram size={32} />
            </div>
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-300">Instagram Connect</p>
              <h1 className="mt-1 text-[36px] font-black tracking-tight text-slate-900 md:text-[48px]">Open Instagram Login</h1>
            </div>
          </div>

          <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-slate-500">
            This page is the first step before Instagram login. It shows the exact callback URL your Meta app must
            allow, then sends you to Instagram once everything is ready.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
              <div className="mb-4 flex items-center gap-3 text-slate-900">
                <Link2 size={18} />
                <h2 className="text-[18px] font-bold">OAuth callback URL</h2>
              </div>
              <p className="break-all rounded-2xl bg-white px-4 py-3 text-[13px] font-mono text-slate-600 ring-1 ring-slate-100">
                {callbackUrl}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
                Add this exact URL in Meta as a Valid OAuth Redirect URI.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
              <div className="mb-4 flex items-center gap-3 text-slate-900">
                <Webhook size={18} />
                <h2 className="text-[18px] font-bold">Webhook callback URL</h2>
              </div>
              <p className="break-all rounded-2xl bg-white px-4 py-3 text-[13px] font-mono text-slate-600 ring-1 ring-slate-100">
                {webhookUrl}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
                Use this for Meta webhooks, with verify token <span className="font-mono">piopost123verifytoken</span>.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-emerald-900">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="mt-0.5 shrink-0" />
              <div className="space-y-2">
                <h3 className="text-[16px] font-bold">Before you continue</h3>
                <p className="text-[14px] leading-relaxed text-emerald-800/90">
                  Make sure the exact callback URL above is already saved in your Meta app settings. If Meta does not
                  have this exact URL, it will keep showing <span className="font-semibold">Invalid redirect_uri</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={startConnect}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] px-7 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-4px_rgba(238,42,123,0.35)] transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Continue to Instagram Login
            </button>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-7 py-3.5 text-[14px] font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}