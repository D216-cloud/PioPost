
import Link from "next/link";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 bg-white">
      <nav className="mx-auto flex w-full max-w-7xl items-center px-8 py-4">
        {/* Logo */}
        <div className="flex-[0.5]">
          <Link href="/" className="logo-script text-[24px] text-slate-900">
            PinPost
          </Link>
        </div>

        {/* Center Links */}
        <div className="flex flex-1 items-center justify-center gap-10 text-[13px] font-medium text-slate-500">
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
        <div className="flex flex-[0.5] items-center justify-end gap-6">
          <Link href="/login" className="text-[13px] font-medium text-slate-900 transition-colors hover:text-blue-600">
            Log in
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-900 transition-all hover:bg-slate-50"
          >
            Sign up free
          </Link>
        </div>
      </nav>
    </header>
  );
}
