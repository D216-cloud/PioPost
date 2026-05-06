
"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Write your content",
    description: "Type your post in the unified editor. Character counts update in real time for every platform.",
  },
  {
    number: "02",
    title: "Upload your visuals",
    description: "Add images and see how they'll crop on each platform. Aspect ratio guides show you exactly what's visible.",
  },
  {
    number: "03",
    title: "Review every preview",
    description: "All four platform previews update as you type. Spot issues before your audience does.",
  },
  {
    number: "04",
    title: "Publish with confidence",
    description: "Export your optimized content or copy it directly to each platform. No more post-publish regrets.",
  },
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
    <section id="how-it-works" className="py-24 md:py-40 bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-6xl px-6" ref={ref}>
        <div className="text-center mb-24">
          <h2 className="text-3xl font-bold tracking-tight md:text-[42px]" style={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            From draft to pixel-perfect in minutes
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="relative"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                filter: visible ? "blur(0)" : "blur(8px)",
                transition: `all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 150}ms`,
              }}
            >
              <span className="text-[54px] font-bold text-white/10 leading-none">{step.number}</span>
              <h3 className="mt-4 text-[16px] font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-[14px] text-slate-400 leading-relaxed font-medium">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
