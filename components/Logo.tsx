"use client";

import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  theme?: "light" | "dark";
}

export function Logo({ className = "", size = "md", withText = true, theme = "light" }: LogoProps) {
  const dimensions = {
    sm: { box: "w-7 h-7", text: "text-[15px]" },
    md: { box: "w-9 h-9", text: "text-[17px]" },
    lg: { box: "w-14 h-14", text: "text-[26px]" },
  };

  const current = dimensions[size];

  const LogoSymbol = (
    <div className={`relative flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 flex-shrink-0 ${current.box} ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
        </defs>
        {/* Background Circle (warm beige) */}
        <circle cx="50" cy="50" r="46" fill="#f4eae4" />
        
        {/* 4-pointed thin star outline */}
        <path d="M 50 22 Q 50 50 22 50 Q 50 50 50 78 Q 50 50 78 50 Q 50 50 50 22 Z" stroke="url(#starGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="none" opacity="0.8" />
        
        {/* Central vibrant blue gradient lightning bolt */}
        <path d="M 57 28 L 36 60 H 50 L 39 78 L 64 47 H 50 L 57 28 Z" fill="url(#boltGrad)" />
      </svg>
    </div>
  );

  if (!withText) {
    return LogoSymbol;
  }

  return (
    <div className="flex items-center gap-2 select-none">
      {LogoSymbol}
      <span className={`font-sans font-bold tracking-tight ${current.text} ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
        StartProfile
      </span>
    </div>
  );
}
