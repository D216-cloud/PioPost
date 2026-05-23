"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// ── Stage 1 — Niche ──────────────────────────────────────────────
const NICHES = ["Fitness", "Motivation", "AI", "Business", "Meme", "Reels"];

// ── Stage 2 — Automation Goals ───────────────────────────────────
const GOALS = ["DMs", "Comments", "Reels", "Scheduling", "Captions"];

// ── Stage 3 — AI Calibration ─────────────────────────────────────
const TONES = ["Professional", "Casual & Fun", "Inspirational", "Educational", "Edgy & Bold"];
const FREQUENCIES = ["1–2 posts/day", "3–5 posts/day", "6–10 posts/day", "10+ posts/day"];

export default function OnboardingPage() {
  const router = useRouter();
  const [stage, setStage] = useState(1);

  // Stage 1
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  // Stage 2
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["DMs", "Comments"]);
  // Stage 3
  const [selectedTone, setSelectedTone] = useState<string>("Casual & Fun");
  const [selectedFreq, setSelectedFreq] = useState<string>("3–5 posts/day");

  const toggleGoal = (g: string) => {
    setSelectedGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const progressDots = [1, 2, 3];

  useEffect(() => {
    if (stage === 4) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [stage, router]);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[500px]">
        <div className="bg-white rounded-[32px] border border-slate-100/80 shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-10 animate-in fade-in zoom-in-95 duration-500">

          {/* Header row (Hidden on stage 4) */}
          {stage !== 4 && (
            <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">
                Strategy Setup • Stage {stage} of 3
              </p>
            </div>
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {progressDots.map((d) => (
                <div
                  key={d}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    d < stage
                      ? "w-5 bg-gradient-to-r from-[#e84c9f] to-[#b656e3]"
                      : d === stage
                      ? "w-8 bg-gradient-to-r from-[#e84c9f] to-[#b656e3]"
                      : "w-5 bg-slate-200"
                  }`}
                />
              ))}
            </div>
            </div>
          )}

          {/* ── STAGE 1: Identify Your Niche ── */}
          {stage === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-400">
              <h2 className="text-[26px] font-black text-slate-900 leading-tight mb-2">
                Identify Your Niche
              </h2>
              <p className="text-[13.5px] text-slate-500 leading-relaxed mb-8">
                Select the core vertical of your Instagram account.{" "}
                <span className="text-[#a855f7] font-semibold">ReelFlow</span>{" "}
                adapts its caption style, suggestions, and auto hashtags to your niche automatically.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {NICHES.map((niche) => {
                  const active = selectedNiche === niche;
                  return (
                    <button
                      key={niche}
                      onClick={() => setSelectedNiche(niche)}
                      className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                        active
                          ? "border-[#a855f7] bg-[#faf5ff]"
                          : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                      }`}
                    >
                      <span className={`text-[15px] font-bold ${active ? "text-[#7c3aed]" : "text-slate-800"}`}>
                        {niche}
                      </span>
                      {active ? (
                        <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-[#7c3aed] flex items-center justify-center shadow-sm">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <span className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                          Select
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStage(2)}
                disabled={!selectedNiche}
                className="w-full py-3.5 bg-black hover:bg-slate-900 disabled:opacity-40 text-white text-[14.5px] font-bold rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                Configure Goals
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          )}

          {/* ── STAGE 2: What do you want to automate? ── */}
          {stage === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-400">
              <h2 className="text-[26px] font-black text-slate-900 leading-tight mb-2">
                What do you want to automate?
              </h2>
              <p className="text-[13.5px] text-slate-500 leading-relaxed mb-8">
                Select your core objectives.{" "}
                <span className="text-[#a855f7] font-semibold">ReelFlow</span>{" "}
                organizes your{" "}
                <span className="text-[#a855f7] font-semibold">sidebar modules</span>{" "}
                and default{" "}
                <span className="text-[#a855f7] font-semibold">priorities</span>{" "}
                to optimize these goals.
              </p>

              <div className="space-y-2.5 mb-8">
                {GOALS.map((goal) => {
                  const active = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all duration-200 text-left ${
                        active
                          ? "border-[#a855f7]/40 bg-[#faf5ff]"
                          : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${
                          active ? "bg-[#a855f7]" : "bg-slate-200"
                        }`}
                      />
                      <span className={`text-[14px] font-bold flex-1 ${active ? "text-[#7c3aed]" : "text-slate-700"}`}>
                        {goal}
                      </span>
                      {active && (
                        <svg className="w-4 h-4 text-[#7c3aed] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStage(1)}
                  className="px-6 py-3.5 rounded-2xl border border-slate-200 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStage(3)}
                  disabled={selectedGoals.length === 0}
                  className="flex-1 py-3.5 bg-black hover:bg-slate-900 disabled:opacity-40 text-white text-[14.5px] font-bold rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  AI Calibration
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 3: AI Calibration ── */}
          {stage === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-400">
              <h2 className="text-[26px] font-black text-slate-900 leading-tight mb-2">
                AI Calibration
              </h2>
              <p className="text-[13.5px] text-slate-500 leading-relaxed mb-8">
                Fine-tune how <span className="text-[#a855f7] font-semibold">ReelFlow</span> creates
                captions and auto-replies to perfectly match your brand voice.
              </p>

              {/* Tone */}
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Content Tone</p>
              <div className="flex flex-wrap gap-2 mb-7">
                {TONES.map((t) => {
                  const active = selectedTone === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedTone(t)}
                      className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${
                        active
                          ? "bg-gradient-to-r from-[#e84c9f] to-[#b656e3] text-white border-transparent shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              {/* Posting Frequency */}
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Posting Frequency</p>
              <div className="space-y-2 mb-8">
                {FREQUENCIES.map((f) => {
                  const active = selectedFreq === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setSelectedFreq(f)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all text-left ${
                        active
                          ? "border-[#a855f7]/40 bg-[#faf5ff]"
                          : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${active ? "bg-[#a855f7]" : "bg-slate-200"}`} />
                      <span className={`text-[14px] font-bold ${active ? "text-[#7c3aed]" : "text-slate-700"}`}>{f}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStage(2)}
                  className="px-6 py-3.5 rounded-2xl border border-slate-200 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStage(4)}
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#e84c9f] via-[#b656e3] to-[#5a60f6] text-white text-[14.5px] font-bold rounded-2xl shadow-[0_8px_24px_-4px_rgba(182,86,227,0.35)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  Launch ReelFlow
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 4: Synthesizing OS ── */}
          {stage === 4 && (
            <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center py-8">
              <div className="relative w-20 h-20 mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#e84c9f] via-[#b656e3] to-transparent opacity-20 blur-md"></div>
                <svg className="w-20 h-20 animate-spin" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="34" stroke="#f1f5f9" strokeWidth="6" />
                  <path
                    d="M40 6 A34 34 0 0 1 74 40"
                    stroke="url(#spinGrad2)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="spinGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#e84c9f" />
                      <stop offset="100%" stopColor="#b656e3" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#f3e8ff] to-[#fce7f3] flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#e84c9f] to-[#b656e3] opacity-60 blur-sm"></div>
                </div>
              </div>

              <h2 className="text-[20px] font-black text-slate-900 mb-2">Synthesizing Creator OS</h2>
              <p className="text-[13px] text-slate-400 font-medium text-center mb-8">
                Please wait while the AI fine-tunes your workspace.
              </p>

              <div className="w-full bg-white border border-slate-100 rounded-2xl p-5 space-y-3 shadow-sm font-mono text-[11px] font-medium tracking-tight">
                <div className="flex items-center gap-2 text-[#10b981]">
                  <span>✓</span>
                  <span>Establishing secure partner handshakes...</span>
                </div>
                <div className="flex items-center gap-2 text-[#10b981]">
                  <span>✓</span>
                  <span>Reading connected Instagram metadata...</span>
                </div>
                <div className="flex items-center gap-2 text-[#10b981]">
                  <span>✓</span>
                  <span>Injecting AI intelligence & growth configurations...</span>
                </div>
                <div className="flex items-center gap-2 text-[#10b981]">
                  <span>✓</span>
                  <span>Preparing triggers database...</span>
                </div>
                <div className="flex items-center gap-2 text-[#a855f7] animate-pulse">
                  <span>➔</span>
                  <span>Synthesizing customized creator dashboard...</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
