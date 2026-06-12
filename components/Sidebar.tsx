"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "@/components/Logo";
import {
  Home,
  Inbox,
  Bot,
  MessageCircle,
  Send,
  Radio,
  BarChart2,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Star,
  ChevronRight,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Home",             icon: Home,            href: "/dashboard" },
  { label: "Inbox",            icon: Inbox,           href: "/dashboard/quick-replies", badge: "12" },
  { label: "AutoDM",           icon: Bot,             href: "/dashboard/auto-dm" },
  { label: "Story Replies",    icon: MessageCircle,   href: "/dashboard/automation" },
  { label: "Instagram Poster", icon: Send,            href: "/dashboard/schedule" },
  { label: "Live",             icon: Radio,           href: "/dashboard/control-post" },
  { label: "Analytics",        icon: BarChart2,       href: "/dashboard/analytics" },
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
        className={`fixed md:relative z-50 h-dvh bg-white flex flex-col shrink-0 border-r border-slate-100 transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-20"
        }`}
      >
        <div className="flex flex-col h-full py-6 overflow-hidden">

          {/* ── Logo row ── */}
          <div className={`flex items-center mb-8 px-4 ${isOpen ? "justify-between" : "justify-center"}`}>
            <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
              {isOpen ? (
                <Logo size="md" />
              ) : (
                <Logo size="md" withText={false} />
              )}
            </Link>

            {/* Collapse button — inside sidebar */}
            {isOpen && (
              <button
                onClick={onToggle}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all shrink-0 ml-2"
                title="Collapse sidebar"
              >
                <ChevronsLeft size={18} />
              </button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {!isOpen && (
            <div className="flex justify-center mb-6">
              <button
                onClick={onToggle}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all"
                title="Expand sidebar"
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          )}

          {/* ── Navigation ── */}
          <nav className="flex-1 space-y-1.5 px-3">
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
                  className={`flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 group relative ${
                    isOpen ? "" : "justify-center"
                  } ${
                    active
                      ? "bg-slate-100/80 text-slate-950 font-semibold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    size={18}
                    className={`shrink-0 ${
                      active
                        ? "text-slate-900"
                        : "text-slate-400 group-hover:text-slate-650"
                    }`}
                  />
                  {isOpen && <span className="truncate">{item.label}</span>}
                  {isOpen && item.badge && (
                    <span className="ml-auto bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Bottom section ── */}
          <div className="mt-auto px-4 space-y-4">
            {/* Upgrade Plan Card */}
            {isOpen && (
              <div className="bg-white border border-slate-150 rounded-2xl p-4 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <Star size={16} fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-tight">Upgrade Plan</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">Unlock all premium features</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </div>
            )}

            {/* Profile section */}
            <div className="flex flex-col gap-3">
              <div className={`flex items-center gap-3 ${isOpen ? "px-1" : "justify-center"}`}>
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#ec4899] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      M
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                {isOpen && (
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate leading-none mb-1">
                      {username}
                    </p>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Active</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Sign Out Button */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className={`flex items-center gap-3 rounded-xl border border-slate-150 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all py-2.5 ${
                  isOpen ? "w-full px-4 text-sm font-medium" : "w-10 h-10 justify-center mx-auto"
                }`}
                title="Sign Out"
              >
                <LogOut size={16} className="shrink-0" />
                {isOpen && <span>Sign Out</span>}
              </button>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}

