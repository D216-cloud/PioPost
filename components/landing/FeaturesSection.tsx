"use client";

import { motion } from "framer-motion";

const COMPARISON_FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5 text-slate-750" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    title: "Auto DM",
    description: "Instantly send links, assets, or coupons to anyone who comments a trigger word on your posts.",
    traditional: "No automation / manual DMs",
    startprofile: "Instant AI Delivery"
  },
  {
    icon: (
      <svg className="w-5 h-5 text-slate-750" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Auto Quick Reply",
    description: "Provide immediate responses to common questions, keeping response rates perfect.",
    traditional: "Hours of delay checking inbox",
    startprofile: "Contextual AI Reply"
  },
  {
    icon: (
      <svg className="w-5 h-5 text-slate-750" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
    title: "Auto-Post on Instagram",
    description: "Schedule your videos and Reels to publish automatically at peak traffic times.",
    traditional: "Manual app upload",
    startprofile: "Set-and-Forget Autopilot"
  },
  {
    icon: (
      <svg className="w-5 h-5 text-slate-750" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "AI Generate Post",
    description: "Write viral hooks, engaging descriptions, and hashtags using our fine-tuned AI model.",
    traditional: "Writer's block / manual typing",
    startprofile: "1-Click AI Generator"
  },
  {
    icon: (
      <svg className="w-5 h-5 text-slate-750" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7C4.547 9.547 4.5 10.768 4.5 12s.047 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.092-1.209.138-2.43.138-3.662z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 10.5l3 3 6-6" />
      </svg>
    ),
    title: "Unique Comment Templates",
    description: "Keep replies natural and diverse using randomized dynamic comment sets to avoid bot limits.",
    traditional: "Copy-paste spam / generic replies",
    startprofile: "Dynamic Custom Templates"
  }
];

const TESTIMONIALS = [
  {
    name: "Jerome Morton",
    role: "History Channel Creator",
    initials: "JM",
    color: "from-slate-700 to-slate-800",
    text: "StartProfile turned my content strategy around completely. My reach exploded by 400% in just one month with almost zero manual effort.",
    stars: 5,
  },
  {
    name: "Third Eye Vision",
    role: "Scary Stories Influencer",
    initials: "TE",
    color: "from-slate-800 to-slate-900",
    text: "The AI scheduling is incredibly accurate. It posts at exactly the right time, every time. My engagement doubled in just 2 weeks.",
    stars: 5,
  },
  {
    name: "Alara K.",
    role: "Mythology Content Creator",
    initials: "AK",
    color: "from-slate-900 to-black",
    text: "I used to spend 5 hours managing comments. Now I schedule a whole week of auto-replies in 10 minutes. Absolute game changer.",
    stars: 5,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-28 md:py-40 bg-white">
      <motion.div 
        className="mx-auto max-w-6xl px-6 space-y-32"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >

        {/* ── Why creators choose us ── */}
        <div className="space-y-14">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/60 px-3.5 py-1 text-[12px] font-semibold text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse"></span>
              Comparison
            </div>
            <h2 className="mt-6 text-[32px] md:text-[56px] font-normal tracking-tight text-slate-900 leading-[1.1] text-center max-w-3xl mx-auto">
              Why creators choose us
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-[16px] md:text-[18px] text-slate-500 leading-relaxed font-normal">
              Stop wasting thousands on editors or hours on manual work.
            </p>
          </div>

          {/* Comparison Cards Grid */}
          <div className="space-y-4 max-w-5xl mx-auto">
            {/* Headers (hidden on small screens) */}
            <div className="hidden md:grid grid-cols-12 gap-6 px-8 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-5">Feature & Description</div>
              <div className="col-span-3 text-center">Traditional Methods</div>
              <div className="col-span-4 text-center">StartProfile (AI Autopilot)</div>
            </div>

            {COMPARISON_FEATURES.map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ 
                  scale: 1.01, 
                  rotateX: 1.5,
                  rotateY: -0.5,
                  boxShadow: "0 15px 30px rgba(0,0,0,0.04)"
                }}
                style={{ transformStyle: "preserve-3d", perspective: 1000 }}
                className="bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl p-6 md:p-8 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.01)]"
              >
                {/* Feature info */}
                <div className="col-span-1 md:col-span-5 flex items-start gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-900 leading-snug">{item.title}</h3>
                    <p className="text-[12.5px] text-slate-400 leading-relaxed mt-1 font-medium">{item.description}</p>
                  </div>
                </div>

                {/* Traditional Methods */}
                <div className="col-span-1 md:col-span-3 py-3 px-4 bg-slate-50/50 rounded-xl border border-slate-100/60 flex items-center gap-2.5 justify-start md:justify-center">
                  <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-[12.5px] font-semibold text-slate-500">{item.traditional}</span>
                </div>

                {/* StartProfile AI Autopilot */}
                <div className="col-span-1 md:col-span-4 py-3 px-5 bg-gradient-to-tr from-[#f8fafc] to-slate-50/30 rounded-xl border border-slate-200/80 flex items-center gap-2.5 justify-start md:justify-center relative overflow-hidden shadow-sm shadow-slate-100">
                  {/* Subtle left glow border bar */}
                  <div className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-[#3b82f6] to-[#ec4899]" />
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[12.5px] font-bold text-slate-900 flex items-center gap-1.5">
                    {item.startprofile}
                    {/* Verified Badge */}
                    <svg className="w-3.5 h-3.5 text-[#0095f6] fill-current shrink-0 inline-block align-middle" viewBox="0 0 24 24">
                      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.152-.4.238-.83.238-1.29 0-2.07-1.68-3.75-3.75-3.75-.46 0-.89.086-1.29.238C14.95 2.875 13.58 2 12 2c-1.58 0-2.95.875-3.6 2.148-.4-.152-.83-.238-1.29-.238-2.07 0-3.75 1.68-3.75 3.75 0 .46.086.89.238 1.29C2.25 9.55 1.375 10.92 1.375 12.5c0 1.58.875 2.95 2.148 3.6-.152.4-.238.83-.238 1.29 0 2.07 1.68 3.75 3.75 3.75.46 0 .89-.086 1.29-.238C9.05 21.125 10.42 22 12 22c1.58 0 2.95-.875 3.6-2.148.4.152.83.238 1.29.238 2.07 0 3.75-1.68 3.75-3.75 0-.46-.086-.89-.238-1.29 1.273-.65 2.148-2.02 2.148-3.6zm-12.72 4.19l-3.37-3.37 1.41-1.41 1.96 1.96 5.56-5.56 1.41 1.41-6.97 6.97z" />
                    </svg>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Testimonials ── */}
        <div className="space-y-14">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/60 px-3.5 py-1 text-[12px] font-semibold text-slate-655 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse"></span>
              Testimonials
            </div>
            <h2 className="mt-6 text-[32px] md:text-[56px] font-normal tracking-tight text-slate-900 leading-[1.1] text-center max-w-3xl mx-auto">
              Trusted by world-class creators
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-slate-50/30 p-8 rounded-3xl border border-slate-100 hover:border-slate-200 hover:bg-white shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 space-y-5 group"
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(t.stars)].map((_, s) => (
                    <svg key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                  &ldquo;{t.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100/60">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-[13px] font-black shadow-sm`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{t.name}</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </motion.div>
    </section>
  );
}
