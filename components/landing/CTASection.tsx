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
            className="inline-flex items-center gap-2 bg-[#0096d6] hover:bg-[#0085bd] text-white px-8 py-4 rounded-xl text-[16px] font-semibold transition-all shadow-sm"
          >
            {user ? "Open editor" : "Get started free"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
