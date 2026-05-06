"use client";

import { motion } from "framer-motion";
import { LogOut, Sparkles } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { platforms, type Platform, usePostStore } from "@/store/usePostStore";
import { PreviewCard } from "./PreviewCard";

interface DashboardClientProps {
  userName: string;
}

export function DashboardClient({ userName }: DashboardClientProps) {
  const caption = usePostStore((state) => state.caption);
  const activePlatforms = usePostStore((state) => state.activePlatforms);
  const setCaption = usePostStore((state) => state.setCaption);
  const togglePlatform = usePostStore((state) => state.togglePlatform);

  const onToggle = (platform: Platform) => {
    if (activePlatforms.length === 1 && activePlatforms[0] === platform) {
      toast.warning("At least one platform must stay active.");
      return;
    }
    togglePlatform(platform);
  };

  return (
    <main className="p-4 lg:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Welcome back</p>
          <h1 className="text-2xl font-bold">{userName}&apos;s Post Studio</h1>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white/70 px-4 py-2 text-sm font-medium hover:bg-white dark:bg-slate-950/70"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Sparkles size={18} className="text-blue-600 dark:text-cyan-300" /> Post editor
          </h2>

          <label className="mb-2 block text-sm font-medium">Caption</label>
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Write your post..."
            className="min-h-40 w-full rounded-2xl border border-[var(--line)] bg-white/90 p-4 outline-none focus:border-blue-400 dark:bg-slate-950/80"
          />

          <div className="mt-5">
            <p className="mb-3 text-sm font-medium">Platform selector</p>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => {
                const active = activePlatforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => onToggle(platform)}
                    className={`rounded-full px-4 py-2 text-sm transition-all ${
                      active
                        ? "gradient-primary text-white"
                        : "border border-[var(--line)] bg-white/80 text-muted dark:bg-slate-950/70"
                    }`}
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5">
          <h2 className="mb-4 text-lg font-semibold">Live preview</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activePlatforms.map((platform) => (
              <PreviewCard key={platform} platform={platform} caption={caption} compact />
            ))}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
