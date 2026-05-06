"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = (resolvedTheme ?? "light") === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="glass inline-flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105"
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
