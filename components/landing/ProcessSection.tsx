"use client";

import { motion } from "framer-motion";

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
  "from-slate-700 to-slate-900",
  "from-slate-800 to-black",
  "from-slate-900 to-slate-800",
  "from-black to-slate-700",
];

export function ProcessSection() {
  return (
    <section id="how" className="py-28 md:py-40 bg-white border-y border-slate-100 relative">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(241,245,249,0.5),transparent_40%)] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6 relative z-10">

        {/* Header */}
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/60 px-3.5 py-1 text-[12px] font-semibold text-slate-600 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse"></span>
            How it works
          </div>
          <h2 className="mt-6 text-[32px] md:text-[56px] font-normal tracking-tight text-slate-900 leading-[1.1] text-center max-w-3xl mx-auto">
            From sign-up to growth in minutes
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-[16px] md:text-[18px] text-slate-500 leading-relaxed font-normal">
            Four simple steps to automate your entire Instagram presence.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ 
                rotateY: 8, 
                rotateX: -4,
                scale: 1.02,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.04)"
              }}
              style={{ transformStyle: "preserve-3d" }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20
              }}
              className="group bg-slate-50/30 rounded-3xl p-7 border border-slate-100 hover:border-slate-200 hover:bg-white transition-all duration-300 cursor-pointer"
            >
              {/* Icon badge */}
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients[i]} flex items-center justify-center shadow-md mb-6`}>
                {step.icon}
              </div>

              {/* Step number */}
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{step.number}</span>

              {/* Title */}
              <h3 className="mt-2 text-[17px] font-bold text-slate-900 leading-snug">{step.title}</h3>

              {/* Description */}
              <p className="mt-3 text-[13.5px] text-slate-500 leading-relaxed font-medium">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
