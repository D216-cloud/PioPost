"use client";

import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  theme?: "light" | "dark";
}

export function Logo({ className = "", size = "md", withText = true, theme = "light" }: LogoProps) {
  // Dimensions mapping
  const dimensions = {
    sm: { box: "w-7 h-7 rounded-[8px]", icon: "w-4 h-4", text: "text-[15px]" },
    md: { box: "w-9 h-9 rounded-[11px]", icon: "w-5.5 h-5.5", text: "text-[17px]" },
    lg: { box: "w-14 h-14 rounded-[18px]", icon: "w-8.5 h-8.5", text: "text-[26px]" },
  };

  const current = dimensions[size];

  // A highly premium, modern brand symbol representing "ReelFlow"
  // It combines overlapping video reels/shutters (flow loops) and AI nodes in a continuous infinity/wave flow.
  const LogoSymbol = (
    <div className={`relative flex items-center justify-center bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] shadow-[0_4px_16px_rgba(168,85,247,0.22)] transition-transform duration-300 hover:scale-105 active:scale-95 flex-shrink-0 ${current.box} ${className}`}>
      {/* Dynamic overlapping wave flow paths */}
      <svg className={`${current.icon} text-white`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Continuous loop representation of seamless flows */}
        <path
          d="M4 12C4 8.68629 6.68629 6 10 6C11.6569 6 13.1569 6.67157 14.2426 7.75736L18 11.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M20 12C20 15.3137 17.3137 18 14 18C12.3431 18 10.8431 17.3284 9.75736 16.2426L6 12.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />
        
        {/* Glow dots representing automated AI checkpoints */}
        <circle cx="10" cy="6" r="1.5" fill="white" className="animate-pulse" />
        <circle cx="14" cy="18" r="1.5" fill="white" className="animate-pulse" />

        {/* Dynamic center focus loop representing core reels media */}
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeDasharray="3 1" />
      </svg>
    </div>
  );

  if (!withText) {
    return LogoSymbol;
  }

  return (
    <div className="flex items-center gap-3 select-none">
      {LogoSymbol}
      <span className={`font-black tracking-tight ${current.text} ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
        ReelFlow<span className="bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent font-medium">.</span>
      </span>
    </div>
  );
}
