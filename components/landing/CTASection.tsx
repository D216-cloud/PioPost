"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-32 md:py-48 bg-white border-t border-slate-50">
      <div
        ref={ref}
        className="mx-auto max-w-3xl px-6 text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          filter: visible ? "blur(0)" : "blur(4px)",
          transition: "all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-[42px]" style={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          Stop guessing. Start previewing.
        </h2>
        <p className="mt-6 text-slate-500 text-lg font-medium">
          Free for everyone. No credit card, no limits.
        </p>
        <div className="mt-10 flex justify-center">
          <Link 
            href={user ? "/editor" : "/login"}
            className="group relative flex items-center gap-6 bg-slate-900 hover:bg-black text-white pl-8 pr-2 py-2 rounded-full text-[17px] font-bold transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl"
          >
            {user ? "Open Editor" : "Get Started Free"}
            <div className="bg-white p-2.5 rounded-full transition-transform group-hover:translate-x-1 shadow-sm">
              <ArrowRight className="h-5 w-5 text-[#0ea5e9]" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
