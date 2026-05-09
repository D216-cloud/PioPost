
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-7xl items-center px-8 py-4">
        {/* Logo */}
        <div className="flex-[0.5]">
          <Link href="/" className="logo-script text-[26px] text-slate-900">
            PinPost
          </Link>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-10 text-[13px] font-bold text-slate-500 uppercase tracking-wider">
          <Link href="/#preview" className="transition-colors hover:text-slate-900">
            Features
          </Link>
          <Link href="/#how" className="transition-colors hover:text-slate-900">
            How it works
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-slate-900">
            Pricing
          </Link>
        </div>

        {/* Right Auth */}
        <div className="flex flex-[0.5] items-center justify-end gap-4">
          <Link 
            href="/login" 
            className="group relative hidden sm:flex items-center gap-2.5 bg-white text-slate-900 pl-5 pr-1.5 py-1.5 rounded-full text-[13px] font-bold border border-slate-200 transition-all hover:bg-slate-50 hover:scale-105 active:scale-95 shadow-sm"
          >
            Log in
            <div className="bg-slate-900 p-1 rounded-full transition-transform group-hover:translate-x-0.5 shadow-sm">
              <ArrowRight className="h-3 w-3 text-white" />
            </div>
          </Link>
          <Link
            href="/login"
            className="group relative flex items-center gap-2.5 bg-slate-900 hover:bg-black text-white pl-5 pr-1.5 py-1.5 rounded-full text-[13px] font-bold transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
            Sign up free
            <div className="bg-white p-1 rounded-full transition-transform group-hover:translate-x-0.5 shadow-sm">
              <ArrowRight className="h-3 w-3 text-[#0ea5e9]" />
            </div>
          </Link>
        </div>
      </nav>
    </header>
  );
}
