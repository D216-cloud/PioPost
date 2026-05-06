"use client";

import React from "react";

export function Footer() {
  return (
    <footer className="py-24 bg-white border-t border-slate-50">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="logo-script text-[32px] mb-4 text-slate-900">
          PinPost
        </p>
        <p className="max-w-md mx-auto text-slate-400 text-[14px] leading-relaxed mb-8">
          Precision previews for modern marketing teams. Built for creators <br />
          who care about how their content looks.
        </p>
        <p className="text-slate-300 text-[12px] font-medium tracking-wide">
          © {new Date().getFullYear()} PINPOST. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
