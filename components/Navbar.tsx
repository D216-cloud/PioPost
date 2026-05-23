
"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-100/50">
      <nav className="mx-auto flex w-full max-w-7xl items-center px-6 md:px-12 py-4">
        {/* Logo */}
        <div className="flex-[0.5] flex items-center">
          <Link href="/">
            <Logo size="md" />
          </Link>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-8 text-[14px] font-semibold text-[#475569]">
          <Link href="#features" className="transition-colors hover:text-slate-900">
            Features
          </Link>
          <Link href="#solutions" className="transition-colors hover:text-slate-900">
            Solutions
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex flex-[0.5] items-center justify-end gap-3">
          {/* Theme Toggle Button */}
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors shadow-sm">
            <svg className="h-[18px] w-[18px] text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </button>
          
          {/* Launch OS Action */}
          <Link
            href="/login"
            className="bg-black hover:bg-slate-900 text-white px-5 py-2 rounded-full text-[13px] font-bold tracking-tight transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Launch OS
          </Link>
        </div>
      </nav>
    </header>
  );
}

