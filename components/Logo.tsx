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
          <linearGradient id="pinkGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff1a70" />
            <stop offset="100%" stopColor="#ff66a0" />
          </linearGradient>
          <linearGradient id="cyanGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="100%" stopColor="#4facfe" />
          </linearGradient>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00c6ff" />
            <stop offset="100%" stopColor="#0072ff" />
          </linearGradient>
          <linearGradient id="yellowGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd200" />
            <stop offset="100%" stopColor="#f7971e" />
          </linearGradient>
        </defs>

        {/* Confetti Dots */}
        <circle cx="28" cy="12" r="2.5" fill="#f7971e" opacity="0.8" />
        <circle cx="10" cy="45" r="2" fill="#00c6ff" opacity="0.8" />
        <circle cx="90" cy="52" r="2.5" fill="#f7971e" opacity="0.8" />

        {/* Main R Box */}
        <rect x="22" y="22" width="56" height="56" rx="16" fill="#090e1a" />
        <text x="50" y="61" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="34" fill="white" textAnchor="middle">R</text>

        {/* Top Left Heart Bubble */}
        <g transform="translate(18, 22)">
          <rect x="-10" y="-10" width="20" height="16" rx="6" fill="url(#pinkGrad)" />
          <path d="M-2 6 L3 6 L0 10 Z" fill="#ff1a70" />
          <path d="M-3 -4 C-5 -4 -6.5 -2.5 -6.5 -0.5 C-6.5 1.5 -3.5 3.5 0 5 C3.5 3.5 6.5 1.5 6.5 -0.5 C6.5 -2.5 5 -4 3 -4 C1.8 -4 0.8 -3.2 0 -2.2 C-0.8 -3.2 -1.8 -4 -3 -4 Z" fill="white" transform="scale(0.8)" />
        </g>

        {/* Top Right Checkmark Bubble */}
        <g transform="translate(76, 20)">
          <circle cx="0" cy="0" r="9" fill="url(#cyanGrad)" />
          <path d="M-4.5 -0.5 L-1.5 2.5 L4.5 -3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Bottom Left Chat Bubble */}
        <g transform="translate(18, 74)">
          <rect x="-10" y="-8" width="20" height="15" rx="6" fill="url(#blueGrad)" />
          <path d="M-4 7 L0 7 L-2 10 Z" fill="#0072ff" />
          <circle cx="-4" cy="-0.5" r="1.5" fill="white" />
          <circle cx="0" cy="-0.5" r="1.5" fill="white" />
          <circle cx="4" cy="-0.5" r="1.5" fill="white" />
        </g>

        {/* Bottom Right Bell Bubble */}
        <g transform="translate(76, 75)">
          <circle cx="0" cy="0" r="9.5" fill="url(#yellowGrad)" />
          <path d="M-3 2 L3 2 M-3.5 1 C-3.5 -2 -1.5 -3 0 -3 C1.5 -3 3.5 -2 3.5 1 Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="0" cy="3" r="1" fill="white" />
        </g>
      </svg>
    </div>
  );

  if (!withText) {
    return LogoSymbol;
  }

  return (
    <div className="flex items-center gap-3 select-none">
      {LogoSymbol}
      <span className={`font-sans tracking-tight ${current.text} ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
        <span className="font-extrabold">R</span> <span className="font-medium">Decode</span>
      </span>
    </div>
  );
}
