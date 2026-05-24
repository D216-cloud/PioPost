import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="py-24 bg-white border-t border-slate-50">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Link href="/">
            <Logo size="md" />
          </Link>
        </div>
        <p className="max-w-md mx-auto text-slate-400 text-[14px] leading-relaxed mb-10">
          Precision previews for modern marketing teams. Built for creators <br />
          who care about how their content looks.
        </p>
        
        <div className="flex items-center justify-center gap-8 mb-12">
          <Link href="/privacy" className="text-[12px] font-black text-slate-300 hover:text-slate-900 uppercase tracking-widest transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-[12px] font-black text-slate-300 hover:text-slate-900 uppercase tracking-widest transition-colors">Terms of Service</Link>
          <Link href="/dashboard" className="text-[12px] font-black text-slate-300 hover:text-slate-900 uppercase tracking-widest transition-colors">Dashboard</Link>
        </div>

        <div className="mb-12">
          <Link
            href="/delete-data"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-[12px] font-black uppercase tracking-widest text-white transition-colors hover:bg-slate-700"
          >
            Delete My Data
          </Link>
        </div>

        <p className="text-slate-300 text-[11px] font-black uppercase tracking-tighter">
          © {new Date().getFullYear()} REELFLOW. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
