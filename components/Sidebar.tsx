"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  Film,
  CalendarDays,
  Zap,
  BarChart2,
  User,
  Settings,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  MessageSquareText,
  Send,
} from "lucide-react";

const navItems = [
  { label: "Home",             icon: LayoutDashboard, href: "/dashboard" },
  { label: "AutoDM",           icon: Film,            href: "/dashboard/auto-dm" },
  { label: "Quick Replies",    icon: MessageSquareText, href: "/dashboard/quick-replies" },
  { label: "Welcome Openers",  icon: Send,            href: "/dashboard/welcome-opener" },
  { label: "Scheduler",        icon: CalendarDays,    href: "/dashboard/schedule" },
  { label: "Automation",       icon: Zap,             href: "/dashboard/automation" },
  { label: "Analytics",        icon: BarChart2,       href: "/dashboard/analytics" },
  { label: "Profile",          icon: User,            href: "/dashboard/profile" },
  { label: "Settings",         icon: Settings,        href: "/dashboard/settings" },
];

export function Sidebar({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const username = session?.user?.name
    ? "@" + session.user.name.toLowerCase().replace(/\s+/g, ".")
    : "@deepak.ai";
  const avatarUrl = session?.user?.image;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/20 z-40 backdrop-blur-sm transition-opacity"
          onClick={onToggle}
        />
      )}
      
      <aside
        className={`fixed md:relative z-50 h-dvh bg-white flex flex-col shrink-0 border-r border-slate-100/80 transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0 w-60" : "-translate-x-full md:translate-x-0 md:w-17"
        }`}
      >
      <div className="flex flex-col h-full py-6 overflow-hidden">

        {/* ── Logo row ── */}
        <div className={`flex items-center mb-10 px-4 ${isOpen ? "justify-between" : "justify-center"}`}>
          {/* Squircle icon — always visible */}
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            {isOpen ? (
              <Logo size="md" />
            ) : (
              <Logo size="md" withText={false} />
            )}
          </Link>

          {/* Collapse/Expand button — inside sidebar */}
          {isOpen && (
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg hover:bg-slate-200/70 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all shrink-0 ml-2"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {!isOpen && (
          <div className="flex justify-center mb-6 -mt-4">
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-lg hover:bg-slate-200/70 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={15} />
            </button>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="flex-1 space-y-0.5 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const currentPath = pathname ?? "";
            const active =
              currentPath === item.href ||
              (item.href !== "/dashboard" && currentPath.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                title={!isOpen ? item.label : undefined}
                className={`flex items-center gap-3.5 rounded-2xl px-4 py-2.5 text-[13.5px] font-semibold transition-all duration-150 group relative ${
                  isOpen ? "" : "justify-center"
                } ${
                  active
                    ? "bg-white text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.04)] border border-slate-100"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={`shrink-0 ${
                    active
                      ? "text-slate-800"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                {isOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom section ── */}
        <div className="mt-4 px-3 space-y-3">
          {isOpen ? (
            <>
              {/* Profile Card & Theme Toggle side by side */}
              <div className="flex gap-2 w-full min-w-0">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-2.5 flex-1 p-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 shadow-[0_1px_5px_rgba(0,0,0,0.03)] transition-all duration-150 text-left min-w-0"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-205"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white text-[12px] font-black shrink-0">
                      {username.charAt(1)?.toUpperCase() ?? "D"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-slate-900 truncate leading-snug">{username}</p>
                    <span className="inline-flex items-center gap-1 mt-0.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">
                        Online
                      </span>
                    </span>
                  </div>
                </Link>

                <button
                  className="w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-[0_1px_5px_rgba(0,0,0,0.03)] flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-700 shrink-0"
                  title="Toggle theme"
                >
                  <Moon size={14} className="text-slate-500" />
                </button>
              </div>

              {/* Separate Sign Out Button */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 bg-white hover:shadow-[0_1px_5px_rgba(0,0,0,0.03)] transition-all duration-150 group cursor-pointer"
              >
                <LogOut size={15} className="text-slate-400 group-hover:text-rose-500 shrink-0" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            /* Collapsed: just avatar + moon icon stacked */
            <div className="flex flex-col items-center gap-2 w-full">
              <Link
                href="/dashboard/profile"
                title={username}
                className="w-9 h-9 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 shadow-[0_1px_5px_rgba(0,0,0,0.03)] flex items-center justify-center transition-all overflow-hidden"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white text-[12px] font-black">
                    {username.charAt(1)?.toUpperCase() ?? "D"}
                  </div>
                )}
              </Link>
              
              <button
                className="w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-[0_1px_5px_rgba(0,0,0,0.03)] flex items-center justify-center hover:bg-slate-50 transition-all text-slate-450"
                title="Toggle theme"
              >
                <Moon size={14} className="text-slate-500" />
              </button>
              
              <div className="w-full h-px bg-slate-100 my-1" />
              
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-[0_1px_5px_rgba(0,0,0,0.03)] flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all text-slate-400"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>

      </div>
    </aside>
    </>
  );
}
