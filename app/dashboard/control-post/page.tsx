"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Calendar,
  Share2,
  ImagePlus,
  ChevronDown,
  Paperclip,
  Brain,
  CheckCircle2,
  Clock,
  Shield,
  Globe2,
} from "lucide-react";
import { Manrope, Space_Grotesk } from "next/font/google";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-control-heading",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-control-body",
});

const featureCards = [
  {
    title: "Auto-generate platform-ready posts",
    description:
      "Create optimized copy for Instagram and LinkedIn with consistent brand tone and structured CTAs.",
    icon: Brain,
  },
  {
    title: "Smart scheduling with guardrails",
    description:
      "Queue posts across time zones, auto-avoid overlaps, and keep a healthy publishing cadence.",
    icon: Calendar,
  },
  {
    title: "Publish with confidence",
    description:
      "Approval flows, preview cards, and post checks help you ship without last-minute fixes.",
    icon: Shield,
  },
];

const steps = [
  {
    title: "Connect accounts",
    description: "Link Instagram and LinkedIn once. We keep tokens secure and refresh automatically.",
    icon: Globe2,
  },
  {
    title: "Generate post draft",
    description: "Describe your launch or update. We generate a platform-specific version.",
    icon: Sparkles,
  },
  {
    title: "Schedule and approve",
    description: "Pick date and time, review the preview, then approve for autopost.",
    icon: CheckCircle2,
  },
];

const plans = [
  {
    name: "Starter",
    price: "$0",
    description: "For testing autopost basics",
    items: ["2 scheduled posts/day", "Instagram and LinkedIn", "Basic analytics"],
    cta: "Stay on Free",
  },
  {
    name: "Growth",
    price: "$19",
    description: "For creators and small teams",
    items: ["30 scheduled posts/day", "AI post generation", "Team approvals"],
    cta: "Start Growth",
    featured: true,
  },
  {
    name: "Scale",
    price: "$49",
    description: "For agencies and brands",
    items: ["Unlimited scheduling", "Multi-brand workspaces", "Advanced analytics"],
    cta: "Talk to Sales",
  },
];

export default function ControlPostPage() {
  const [prompt, setPrompt] = useState("Write a post about my new product launch for LinkedIn and Instagram...");
  const [platform, setPlatform] = useState<"instagram" | "linkedin">("instagram");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate generation process
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className={`${bodyFont.className} min-h-screen bg-white pt-28 md:pt-20 text-black`}>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-10 h-64 w-64 rounded-full bg-[#1D4ED8]/25 blur-[120px]" />
          <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-[#06B6D4]/20 blur-[140px]" />
        </div>
      </div>

      <section className="relative px-6 pb-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className={`${headingFont.className} text-3xl font-semibold md:text-4xl`}>
                AutoPost for Instagram and LinkedIn
              </h1>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-black/70">
                Autopilot
              </span>
            </div>
            <p className="mt-3 text-sm text-black/60 md:text-base">
              Generate launch posts, approve drafts, and schedule on both platforms in one workflow.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-700 shadow-md">
                <span className="font-medium">2 free scheduled posts daily on the Starter plan</span>
                <span className="h-5 w-px bg-gray-300" />
                <span className="inline-flex items-center gap-2 font-semibold text-amber-500 hover:text-amber-600 cursor-pointer transition">
                  <span>Upgrade (Save 30%)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[20px] border border-gray-200 bg-white p-5 text-gray-900 sm:p-6 shadow-md">
              <div className="flex min-h-[200px] flex-col justify-between gap-10">
              <div className="flex items-start gap-3">
                <Image
                  src="/assets/avatar-placeholder.png"
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-xl object-cover"
                />
                <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100">
                  <ImagePlus size={20} strokeWidth={1.5} />
                </button>
                <div className="flex-1">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full resize-none bg-transparent pt-2 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    rows={4}
                    placeholder="Describe your product launch and goal..."
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium text-gray-600">
                    <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 transition-colors hover:bg-gray-100">
                      <Brain size={16} className="text-[#818CF8]" />
                      <span className="text-[#818CF8]">AutoPost Generator</span>
                      <ChevronDown size={14} className="ml-1 opacity-50" />
                    </button>
                    <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 transition-colors hover:bg-gray-100">
                      <Paperclip size={16} className="opacity-70" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                  Schedule date
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                  />
                </label>
                <label className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                  Schedule time
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                  />
                </label>
                <label className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                  Cadence
                  <select className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900">
                    <option>One-time</option>
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Campaign burst</option>
                  </select>
                </label>
                <label className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                  Time zone
                  <select className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900">
                    <option>UTC -08:00 Pacific</option>
                    <option>UTC -05:00 Eastern</option>
                    <option>UTC +00:00 London</option>
                    <option>UTC +05:30 India</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
                    <button
                      onClick={() => setPlatform("instagram")}
                      className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                        platform === "instagram"
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                      Instagram
                    </button>
                    <button
                      onClick={() => setPlatform("linkedin")}
                      className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                        platform === "linkedin"
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                      LinkedIn
                    </button>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600">
                    <Clock size={16} className="opacity-70" />
                    Auto-post after approval
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate & Schedule
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Preview</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">
                    {platform === "instagram" ? "Instagram Post" : "LinkedIn Post"}
                  </h3>
                </div>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                  Draft
                </span>
              </div>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">New launch: Your Product</p>
                <p className="mt-2">
                  We are rolling out a faster way to plan content across Instagram and LinkedIn. Generate the post,
                  approve, and let autopost handle the rest.
                </p>
                <p className="mt-3 text-xs font-semibold text-gray-500">Scheduled: {scheduleDate || "Pick a date"} {scheduleTime || ""}</p>
              </div>
              <div className="mt-4 flex flex-col gap-2 text-xs font-semibold text-gray-500">
                <span>Linked account: Connected</span>
                <span>Campaign: Product launch</span>
                <span>Status: Waiting for approval</span>
              </div>
              <button className="mt-6 w-full rounded-xl border border-gray-200 bg-gray-50 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                Review approvals
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className={`${headingFont.className} text-3xl font-semibold`}>Why AutoPost makes launches smoother</h2>
            <p className="mt-3 text-sm text-black/60 md:text-base">
              Automate the busywork while keeping approvals and brand quality in your control.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-[24px] border border-black/10 bg-white p-6 shadow-lg shadow-black/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-black">{card.title}</h3>
                  <p className="mt-3 text-sm text-black/60">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className={`${headingFont.className} text-3xl font-semibold`}>How AutoPost works</h2>
            <p className="mt-3 text-sm text-black/60 md:text-base">
              A clear plan after you apply: connect, generate, approve, and schedule.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-[24px] border border-black/10 bg-white p-6 shadow-lg shadow-black/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-black">{step.title}</h3>
                  <p className="mt-3 text-sm text-black/60">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className={`${headingFont.className} text-3xl font-semibold`}>Choose a plan for autoposting</h2>
            <p className="mt-3 text-sm text-black/60 md:text-base">
              Start free and scale when you are ready to schedule more.
            </p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[26px] border p-6 shadow-lg shadow-black/5 ${
                  plan.featured
                    ? "border-blue-200 bg-gradient-to-br from-[#EFF6FF] via-white to-white"
                    : "border-black/10 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-black">{plan.name}</h3>
                  {plan.featured && (
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">Most popular</span>
                  )}
                </div>
                <div className="mt-3 text-3xl font-semibold text-black">{plan.price}</div>
                <p className="mt-2 text-sm text-black/60">{plan.description}</p>
                <div className="mt-4 space-y-2 text-sm font-semibold text-gray-600">
                  {plan.items.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-blue-600" />
                      {item}
                    </div>
                  ))}
                </div>
                <button className="mt-6 w-full rounded-xl bg-[#2563EB] py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-[#1D4ED8]">
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 rounded-[32px] border border-white/10 bg-white px-10 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB] text-white">
            <Share2 size={24} />
          </div>
          <h3 className={`${headingFont.className} text-2xl font-semibold`}>Ready to create your next post?</h3>
          <p className="text-sm text-black/60 md:text-base">
            Generate, approve, and schedule your launch content across Instagram and LinkedIn.
          </p>
          <button className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30">
            <Sparkles size={16} />
            Start autoposting
          </button>
        </div>
      </section>
    </div>
  );
}
