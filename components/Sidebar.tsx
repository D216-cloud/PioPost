"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  Film,
  CalendarDays,
  BarChart2,
  User,
  Settings,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",        icon: LayoutDashboard, href: "/dashboard" },
  { label: "Reels",            icon: Film,            href: "/dashboard/reels" },
  { label: "Scheduler",        icon: CalendarDays,    href: "/dashboard/schedule" },
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
        className={`fixed md:relative z-50 h-dvh bg-[#f8f8f8] flex flex-col shrink-0 border-r border-slate-100/80 transition-all duration-300 ease-in-out ${
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
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

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
              {/* Theme label + moon */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.18em]">
                  Theme Style
                </span>
                <button className="w-6 h-6 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-all">
                  <Moon size={12} className="text-slate-500" />
                </button>
              </div>

              {/* Profile card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_6px_rgba(0,0,0,0.05)] px-3.5 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-[#a855f7]/20"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white text-[13px] font-black shrink-0">
                      {username.charAt(1)?.toUpperCase() ?? "D"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-900 truncate">{username}</p>
                    <span className="inline-flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                      <span className="text-[9px] font-black text-[#10b981] uppercase tracking-wider">
                        Online
                      </span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm border border-slate-100 shrink-0"
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            /* Collapsed: just avatar + moon icon stacked */
            <div className="flex flex-col items-center gap-3">
              <button
                className="w-7 h-7 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-all"
                title="Toggle theme"
              >
                <Moon size={12} className="text-slate-500" />
              </button>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="avatar"
                  title={username}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-[#a855f7]/20"
                />
              ) : (
                <div
                  title={username}
                  className="w-9 h-9 rounded-full bg-linear-to-br from-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white text-[13px] font-black"
                >
                  {username.charAt(1)?.toUpperCase() ?? "D"}
                </div>
              )}
              <div className="w-full h-px bg-slate-200 my-1" />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-7 h-7 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all text-slate-400"
                title="Sign out"
              >
                <LogOut size={12} />
              </button>
            </div>
          )}
        </div>

      </div>
    </aside>
    </>
  );
}
