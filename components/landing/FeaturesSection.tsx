"use client";

const COMPARISON = [
  { feature: "Speed of content creation", hiring: "Days", manual: "Hours", reelflow: "Seconds" },
  { feature: "Cost per video", hiring: "$50 – $200", manual: "Time-intensive", reelflow: "< $1" },
  { feature: "AI Scheduling", hiring: "Manual", manual: "Manual", reelflow: "Automatic" },
  { feature: "DM Automation", hiring: "No", manual: "No", reelflow: "Yes" },
  { feature: "Auto-Post to Instagram", hiring: "No", manual: "No", reelflow: "Yes" },
];

const TESTIMONIALS = [
  {
    name: "Jerome Morton",
    role: "History Channel Creator",
    initials: "JM",
    color: "from-[#7c3aed] to-[#a855f7]",
    text: "ReelFlow turned my content strategy around completely. My reach exploded by 400% in just one month with almost zero manual effort.",
    stars: 5,
  },
  {
    name: "Third Eye Vision",
    role: "Scary Stories Influencer",
    initials: "TE",
    color: "from-[#e84c9f] to-[#b656e3]",
    text: "The AI scheduling is incredibly accurate. It posts at exactly the right time, every time. My engagement doubled in just 2 weeks.",
    stars: 5,
  },
  {
    name: "Alara K.",
    role: "Mythology Content Creator",
    initials: "AK",
    color: "from-[#5a60f6] to-[#7c3aed]",
    text: "I used to spend 5 hours managing comments. Now I schedule a whole week of auto-replies in 10 minutes. Absolute game changer.",
    stars: 5,
  },
];

function CheckIcon() {
  return (
    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] shadow-sm">
      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function CrossIcon() {
  return (
    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100">
      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}

function renderCell(val: string) {
  if (val === "Yes" || val === "Automatic" || val === "Seconds" || val === "< $1" || val === "Data-driven AI")
    return <CheckIcon />;
  if (val === "No" || val === "Manual" || val === "Guesswork")
    return <CrossIcon />;
  return <span className="text-[13px] font-semibold text-slate-400">{val}</span>;
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-28 md:py-40 bg-white">
      <div className="mx-auto max-w-6xl px-6 space-y-32">

        {/* ── Why creators choose us ── */}
        <div className="space-y-14">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-4 py-1 text-[12px] font-bold text-slate-500 uppercase tracking-widest">
              Comparison
            </div>
            <h2 className="text-[36px] md:text-[52px] font-bold tracking-tight text-black leading-[1.1]">
              Why creators choose us
            </h2>
            <p className="text-slate-500 font-medium max-w-xl mx-auto text-[16px] leading-relaxed">
              Stop wasting thousands on editors or hours on manual work.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="rounded-3xl border border-slate-100 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.05)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-8 py-5 text-[12px] font-black text-slate-400 uppercase tracking-widest w-[35%]">Feature</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-widest text-center">Hiring Editors</th>
                  <th className="px-6 py-5 text-[12px] font-black text-slate-400 uppercase tracking-widest text-center">Manual Work</th>
                  <th className="px-6 py-5 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#7c3aed]/10 to-[#d946ef]/10 text-[12px] font-black text-[#7c3aed] uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]"></span>
                      ReelFlow
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <td className="px-8 py-5 text-[14px] font-semibold text-slate-700">{row.feature}</td>
                    <td className="px-6 py-5 text-center">{renderCell(row.hiring)}</td>
                    <td className="px-6 py-5 text-center">{renderCell(row.manual)}</td>
                    <td className="px-6 py-5 text-center">{renderCell(row.reelflow)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Testimonials ── */}
        <div className="space-y-14">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-4 py-1 text-[12px] font-bold text-slate-500 uppercase tracking-widest">
              Testimonials
            </div>
            <h2 className="text-[36px] md:text-[52px] font-bold tracking-tight text-black leading-[1.1]">
              Trusted by world-class creators
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5 group hover:shadow-[0_8px_40px_rgba(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(t.stars)].map((_, s) => (
                    <svg key={s} className="w-4 h-4 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                  &ldquo;{t.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
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

      </div>
    </section>
  );
}
