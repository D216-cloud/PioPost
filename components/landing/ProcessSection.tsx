"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: "Connect Your Account",
    description: "Seamlessly link your Instagram account with one click. Secure OAuth — no passwords stored, ever.",
  },
  {
    number: "02",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "Generate or Upload Content",
    description: "Import your video clips or let our AI generate high-converting hooks and captions for your audience.",
  },
  {
    number: "03",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    title: "Automate DMs",
    description: "Set keyword triggers and configure smart automated replies. Engage your followers 24/7 without lifting a finger.",
  },
  {
    number: "04",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    title: "Schedule & Grow",
    description: "Publish automatically at peak engagement times. Watch your followers, reach, and revenue scale on autopilot.",
  },
];

const gradients = [
  "from-[#7c3aed] to-[#a855f7]",
  "from-[#e84c9f] to-[#b656e3]",
  "from-[#5a60f6] to-[#7c3aed]",
  "from-[#b656e3] to-[#e84c9f]",
];

export function ProcessSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how" className="py-28 md:py-40 bg-slate-50/50 border-y border-slate-100">
      <div className="mx-auto max-w-6xl px-6" ref={ref}>

        {/* Header */}
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-1 text-[13px] font-semibold text-slate-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#a855f7] animate-pulse"></span>
            How it works
          </div>
          <h2 className="mt-8 text-[32px] md:text-[68px] font-normal tracking-tight text-black leading-[1.08] max-w-none mx-auto md:whitespace-nowrap">
            From sign-up to growth in minutes
          </h2>
          <p className="mt-8 mx-auto max-w-2xl text-[16px] md:text-[18px] text-slate-500 leading-relaxed font-medium">
            Four simple steps to automate your entire Instagram presence.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div
              key={step.number}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: `all 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 120}ms`,
              }}
              className="group bg-white rounded-3xl p-7 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-300"
            >
              {/* Icon badge */}
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients[i]} flex items-center justify-center shadow-md mb-6`}>
                {step.icon}
              </div>

              {/* Step number */}
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{step.number}</span>

              {/* Title */}
              <h3 className="mt-2 text-[17px] font-bold text-slate-900 leading-snug">{step.title}</h3>

              {/* Description */}
              <p className="mt-3 text-[13.5px] text-slate-500 leading-relaxed font-medium">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
