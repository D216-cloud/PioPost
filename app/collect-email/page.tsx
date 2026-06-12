"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react";

const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

function EmailCollectionContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [creator, setCreator] = useState({ name: "Creator", avatar: "" });
  const [commenter, setCommenter] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("Missing access token");
      setLoading(false);
      return;
    }

    fetch(`/api/collect-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Invalid link");
      })
      .then((data) => {
        if (data.valid) {
          setValid(true);
          setCreator({ name: data.creatorName, avatar: data.profilePicture });
          setCommenter(data.commenter);
          setCustomMessage(data.message || "");
        } else {
          setErrorMsg(data.error || "This link has expired or is invalid");
        }
      })
      .catch((err) => {
        setErrorMsg("This link is invalid or has expired");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/collect-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit email");
      }
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-6">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-400 font-semibold">Verifying secure link...</p>
      </div>
    );
  }

  if (errorMsg && !valid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-6">
        <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-6">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-white mb-2">Link Invalid or Expired</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            {errorMsg}. Please check that you clicked the correct link from your Instagram DMs.
          </p>
          <a
            href="https://instagram.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-sm font-bold rounded-2xl transition-all"
          >
            <InstagramIcon size={16} />
            <span>Go to Instagram</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0f19] text-white p-6 selection:bg-indigo-500/30">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-md w-full bg-slate-950/40 border border-slate-900 rounded-[32px] p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)] text-center backdrop-blur-xl relative overflow-hidden">
        
        {submitted ? (
          /* Success Screen */
          <div className="py-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Access Granted!</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 px-2">
              Thanks! We've sent the guide to your Instagram DMs. Check your inbox in 10 seconds!
            </p>
            <a
              href={`https://instagram.com`}
              className="inline-flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-500/15 hover:shadow-indigo-600/25 transition-all text-sm"
            >
              <InstagramIcon size={18} />
              <span>Open Instagram DMs</span>
            </a>
          </div>
        ) : (
          /* Form Screen */
          <div className="flex flex-col gap-6">
            
            {/* Header / Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-lg shadow-pink-500/10">
                <div className="p-[2px] bg-[#0b0f19] rounded-full">
                  {creator.avatar ? (
                    <img
                      src={creator.avatar}
                      alt="creator profile"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold">
                      {creator.name.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Get Guide from @{creator.name}
                </h2>
                <p className="text-[12px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                  INSTAGRAM AUTODM SYSTEM
                </p>
              </div>
            </div>

            {/* Custom Creator message or default */}
            <p className="text-xs text-slate-400 leading-relaxed px-4">
              {customMessage || `Hey @${commenter}! Submit your email below to instantly receive the guide directly in your Instagram DMs.`}
            </p>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-2xl text-xs font-semibold text-left animate-in slide-in-from-top-1">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-slate-900/40 hover:bg-slate-900/60 focus:bg-[#0f172a] border border-slate-900 focus:border-indigo-500/40 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none transition-all placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/5"
                  disabled={submitting}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !email}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-indigo-500/40 disabled:to-purple-600/40 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-600/25 transition-all text-xs cursor-pointer group"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending Guide...</span>
                  </>
                ) : (
                  <>
                    <span>Send Guide to My DMs</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
}

export default function EmailCollectionPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-6">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-400 font-semibold">Loading Page...</p>
      </div>
    }>
      <EmailCollectionContent />
    </Suspense>
  );
}
