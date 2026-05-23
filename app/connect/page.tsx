"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const SCOPES = [
  {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    color: "text-rose-400",
    bg: "bg-rose-50",
    title: "Read Comments & Mentions",
    desc: "Allows instant triggers when fans write keywords.",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: "text-violet-500",
    bg: "bg-violet-50",
    title: "Send Direct Messages (DMs)",
    desc: "Allows sending instant welcome rewards and links directly.",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
    color: "text-blue-500",
    bg: "bg-blue-50",
    title: "Publish & Manage Reels",
    desc: "Allows publishing slated drafts during designated optimal times.",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: "text-amber-500",
    bg: "bg-amber-50",
    title: "Access Core Insights",
    desc: "Enables dynamic calculation of conversion rates and growth.",
  },
];

export default function ConnectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = useCallback(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setIsConnecting(true);
    // Redirect to real Instagram OAuth flow
    window.location.href = "/api/auth/instagram/link";
  }, [session, router]);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-violet-100/40 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-pink-100/30 blur-[120px]" />
      </div>

      <div className="w-full max-w-[480px]">
        <div className="bg-white rounded-[32px] border border-slate-100/80 shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-10 animate-in fade-in zoom-in-95 duration-500">

          {/* Header badge */}
          <div className="flex items-center gap-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.18em]">
              ReelFlow · Instagram Connect
            </span>
          </div>

          {/* Instagram Icon */}
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-[1.4rem] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[2.5px] shadow-lg shrink-0">
              <div className="w-full h-full rounded-[1.3rem] bg-white flex items-center justify-center">
                <svg className="w-8 h-8 text-[#ee2a7b]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-[24px] font-black text-slate-900 leading-tight">
                Connect Instagram
              </h1>
              <p className="text-[13.5px] text-slate-500 font-medium mt-1">
                Link your professional account to get started.
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-[13.5px] text-slate-500 leading-relaxed mb-7">
            ReelFlow requires standard{" "}
            <span className="text-[#a855f7] font-semibold">secure partner API scopes</span>{" "}
            to read engagement events and automate scheduled content. You'll be redirected to Instagram to authorize safely.
          </p>

          {/* Requested Scopes */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-5 mb-8 space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Requested Permissions:
            </p>
            {SCOPES.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-800">{s.title}</p>
                  <p className="text-[11.5px] text-slate-400 font-medium">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={isConnecting || status === "loading"}
            className="w-full py-4 bg-gradient-to-r from-[#e84c9f] via-[#b656e3] to-[#5a60f6] text-white text-[15px] font-bold rounded-2xl shadow-[0_8px_24px_-4px_rgba(182,86,227,0.35)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Redirecting to Instagram...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                <span>Connect Instagram Account</span>
              </>
            )}
          </button>

          {/* Trust note */}
          <p className="text-center text-[11.5px] text-slate-400 font-medium mt-5 flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[#10b981]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Authorized via Meta's official OAuth 2.0. We never store your password.
          </p>
        </div>
      </div>
    </main>
  );
}
