import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="py-20 bg-white border-t border-slate-100">
      <div className="mx-auto max-w-6xl px-6 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <Link href="/">
            <Logo size="md" />
          </Link>
        </div>

        {/* Tagline */}
        <p className="max-w-md mx-auto text-slate-400 text-[14px] leading-relaxed mb-8 font-normal">
          Precision previews for modern marketing teams. <br />
          Built for creators who care about how their content looks.
        </p>
        
        {/* Navigation Links */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <Link 
            href="/privacy" 
            className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link 
            href="/terms" 
            className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Terms of Service
          </Link>
          <Link 
            href="/dashboard" 
            className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/delete-data"
            className="text-[13px] font-medium text-slate-400 hover:text-red-500 transition-colors"
          >
            Delete My Data
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-slate-300 text-[12px] font-normal tracking-wide">
          © {new Date().getFullYear()} StartProfile. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
