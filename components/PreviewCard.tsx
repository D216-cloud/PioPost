"use client";

import { Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Platform } from "@/store/usePostStore";

interface PreviewCardProps {
  platform: Platform;
  caption: string;
  compact?: boolean;
}

const platformMeta: Record<Platform, { badge: string; accent: string }> = {
  Instagram: { badge: "Reel Preview", accent: "from-pink-500 to-orange-400" },
  LinkedIn: { badge: "Professional Post", accent: "from-blue-700 to-blue-400" },
  X: { badge: "Post", accent: "from-slate-900 to-slate-500" },
  Facebook: { badge: "Feed Update", accent: "from-blue-600 to-indigo-400" },
};

export function PreviewCard({ platform: rawPlatform, caption, compact = false }: PreviewCardProps) {
  // Normalize platform name
  const normalizedPlatform = (rawPlatform.charAt(0).toUpperCase() + rawPlatform.slice(1).toLowerCase()) as Platform;
  const platform = normalizedPlatform as any === "Twitter" || normalizedPlatform as any === "twitter" || normalizedPlatform as any === "x" ? "X" : normalizedPlatform;
  
  const meta = platformMeta[platform as Platform] || platformMeta["Instagram"];

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`rounded-[20px] border border-[var(--line)] bg-white/90 p-4 shadow-xl shadow-slate-900/8 dark:bg-slate-950/70 ${
        compact ? "min-h-[240px]" : "min-h-[320px]"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${meta.accent}`} />
          <div>
            <p className="text-sm font-semibold">{platform}</p>
            <p className="text-xs text-muted">@pinpost.creator</p>
          </div>
        </div>
        <span className="rounded-full border border-[var(--line)] px-3 py-1 text-[11px] text-muted">{meta.badge}</span>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-foreground/90">{caption || "Write something to preview your post in real-time."}</p>

      <div className="mt-auto grid grid-cols-4 gap-2 text-muted">
        <div className="flex items-center justify-center gap-1 rounded-xl bg-slate-100/80 py-2 text-xs dark:bg-slate-900">
          <Heart size={14} /> 128
        </div>
        <div className="flex items-center justify-center gap-1 rounded-xl bg-slate-100/80 py-2 text-xs dark:bg-slate-900">
          <MessageCircle size={14} /> 19
        </div>
        <div className="flex items-center justify-center gap-1 rounded-xl bg-slate-100/80 py-2 text-xs dark:bg-slate-900">
          <Repeat2 size={14} /> 44
        </div>
        <div className="flex items-center justify-center gap-1 rounded-xl bg-slate-100/80 py-2 text-xs dark:bg-slate-900">
          <Share2 size={14} /> 7
        </div>
      </div>
    </motion.article>
  );
}
