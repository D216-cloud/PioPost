
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-6xl items-center px-4 md:px-8 py-4">
        {/* Logo */}
        <div className="flex-[0.5] flex items-center">
          <Link href="/" className="text-[26px] font-logo font-bold tracking-tight text-slate-900 flex items-center">
            Pin<span className="text-[#2563EB]">Post</span>
            <span className="w-2 h-2 rounded-full bg-[#2563EB] ml-1 mt-2"></span>
          </Link>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-10 text-[14px] font-bold text-[#64748B]">
          <Link href="/#how" className="transition-colors hover:text-[#2563EB]">
            How it works
          </Link>
          <Link href="/faq" className="transition-colors hover:text-[#2563EB]">
            FAQ
          </Link>
          <Link href="/blog" className="transition-colors hover:text-[#2563EB]">
            Blog
          </Link>
        </div>

        {/* Right Auth */}
        <div className="flex flex-[0.5] items-center justify-end gap-6">
          <Link 
            href="/login" 
            className="text-[14px] font-bold text-[#64748B] hover:text-[#2563EB] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="group relative hidden md:flex items-center gap-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white pl-6 pr-1.5 py-1.5 rounded-full text-[14px] font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#2563EB]/20"
          >
            Get started
            <div className="bg-white p-1 rounded-full transition-transform group-hover:translate-x-0.5 shadow-sm">
              <ArrowRight className="h-3.5 w-3.5 text-[#2563EB]" />
            </div>
          </Link>
        </div>
      </nav>
    </header>
  );
}
