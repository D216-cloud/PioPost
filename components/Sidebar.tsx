"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  Send,
  Bot,
  MessageCircle,
  BarChart3,
  Users,
  PieChart,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Crown,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",          icon: Home,            href: "/dashboard" },
  { label: "Inbox",              icon: MessageSquare,   href: "/dashboard/inbox", badge: 12 },
  { label: "Welcome Opener",     icon: Send,            href: "/dashboard/welcome-opener" },
  { label: "Auto Reply",         icon: Bot,             href: "/dashboard/auto-dm" },
  { label: "DM Campaigns",       icon: Send,            href: "/dashboard/campaigns" },
  { label: "Comment Automation",  icon: MessageCircle,   href: "/dashboard/quick-replies" },
  { label: "Growth Tools",       icon: BarChart3,       href: "/dashboard/growth-tools" },
  { label: "Subscribers",        icon: Users,           href: "/dashboard/subscribers" },
  { label: "Analytics",          icon: PieChart,        href: "/dashboard/analytics" },
  { label: "Settings",           icon: Settings,        href: "/dashboard/settings" },
];

export function Sidebar({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={onToggle}
        />
      )}
      
      <aside
        className={`fixed md:relative z-50 h-dvh bg-[#070913] text-slate-350 flex flex-col shrink-0 border-r border-[#161930] transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-20"
        }`}
      >
        <div className="flex flex-col h-full py-6 overflow-hidden">

          {/* ── Logo row ── */}
          <div className={`flex items-center mb-8 px-5 ${isOpen ? "justify-between" : "justify-center"}`}>
            <Link href="/dashboard" className="flex items-center gap-3.5 min-w-0">
              {/* Circle Ring with Gradient */}
              <div className="relative p-[1.5px] rounded-full bg-gradient-to-tr from-[#a855f7] via-[#6366f1] to-[#3b82f6] shadow-[0_0_12px_rgba(168,85,247,0.3)] shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#070913] flex items-center justify-center">
                  <Bot size={22} className="text-blue-400 fill-blue-400/10" />
                </div>
              </div>

              {isOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xl leading-none text-white tracking-normal">
                    <span className="text-[#be5cff]">Insta</span>
                    <span className="text-[#3b82f6]">Bot</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium tracking-wide mt-1">
                    Automation
                  </span>
                </div>
              )}
            </Link>

            {/* Collapse/Expand button */}
            {isOpen && (
              <button
                onClick={onToggle}
                className="w-7 h-7 rounded-lg hover:bg-slate-800/50 flex items-center justify-center text-slate-500 hover:text-slate-200 transition-all shrink-0 ml-2"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={15} />
              </button>
            )}
          </div>

          {/* Divider Line */}
          {isOpen && <div className="border-b border-[#161930] mx-5 mb-6" />}

          {/* Expand button when collapsed */}
          {!isOpen && (
            <div className="flex justify-center mb-6 -mt-3">
              <button
                onClick={onToggle}
                className="w-8 h-8 rounded-lg hover:bg-slate-800/50 flex items-center justify-center text-slate-500 hover:text-slate-200 transition-all"
                title="Expand sidebar"
              >
                <PanelLeftOpen size={15} />
              </button>
            </div>
          )}

          {/* ── Navigation ── */}
          <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto no-scrollbar">
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
                  className={`flex items-center gap-3.5 rounded-[14px] px-4 py-2.5 text-[13.5px] font-medium transition-all duration-200 group relative ${
                    isOpen ? "" : "justify-center"
                  } ${
                    active
                      ? "bg-gradient-to-r from-[#3e27df] to-[#160b86] text-white shadow-[0_4px_12px_rgba(62,39,223,0.25)]"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                  }`}
                >
                  <Icon
                    size={18}
                    className={`shrink-0 transition-colors ${
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  {isOpen && <span className="truncate">{item.label}</span>}
                  
                  {/* Inbox count badge */}
                  {isOpen && item.badge !== undefined && (
                    <span className="ml-auto bg-[#7c3aed] text-white text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                  
                  {/* Collapsed Badge */}
                  {!isOpen && item.badge !== undefined && (
                    <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-[#7c3aed] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Bottom section ── */}
          <div className="mt-auto pt-4 px-4 border-t border-[#161930]">
            
            {/* Pro Plan Card */}
            {isOpen ? (
              <div className="p-4 rounded-[20px] bg-[#0e1026] border border-[#1f2347] flex flex-col gap-4">
                {/* Top details */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6366f1] to-[#a855f7] flex items-center justify-center shrink-0">
                    <Crown size={16} className="text-white fill-white" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-white">Pro Plan</span>
                    <span className="text-[10px] text-slate-400">Expires on 30 May, 2025</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-[#1b1c3c] overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-[#9333ea] to-[#3b82f6]" 
                      style={{ width: "75%" }}
                    />
                  </div>
                  <span className="text-xs text-white font-medium shrink-0">75%</span>
                </div>

                {/* Upgrade button */}
                <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#9333ea] hover:from-[#1d4ed8] hover:to-[#7e22ce] text-white text-xs font-bold transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.2)]">
                  Upgrade Plan
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6366f1] to-[#a855f7] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform" title="Pro Plan (75%)">
                  <Crown size={16} className="text-white fill-white" />
                </div>
                <span className="text-[10px] text-white font-semibold">75%</span>
              </div>
            )}
          </div>

        </div>
      </aside>
    </>
  );
}
