
"use client";

import Image from "next/image";
import { Heart, MessageCircle, Send, Bookmark, Share2, Repeat2, ThumbsUp } from "lucide-react";
import previewInstagram from "@/assets/preview-instagram.jpg";
import previewLinkedin from "@/assets/preview-linkedin.jpg";
import previewX from "@/assets/preview-x.jpg";
import previewFacebook from "@/assets/preview-facebook.jpg";
import avatar from "@/assets/landing-avatar.jpg";

// Custom SVG Logos for Platform headers
const InstagramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#E4405F]">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1877F2]">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const LinkedinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0A66C2]">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const platforms = [
  {
    name: "Instagram",
    id: "instagram",
    res: "1080×1080",
    image: previewInstagram,
    user: "Sarah Chen",
    handle: "sarahcreates",
    text: "Just launched something incredible 🚀 Check out PinPost — preview your posts across every platform before you publish. No mor... more",
    icon: <InstagramIcon />,
    actions: [<Heart size={16} />, <MessageCircle size={16} />, <Send size={16} />],
    rightAction: <Bookmark size={16} />
  },
  {
    name: "LinkedIn",
    id: "linkedin",
    res: "1200×1200",
    image: previewLinkedin,
    user: "Sarah Chen",
    title: "Content Strategist • 2h",
    text: "Excited to announce PinPost — the precision preview tool for modern marketing teams. See exactly how your content renders across Instagram, X, LinkedIn, and Facebook.",
    icon: <LinkedinIcon />,
    actions: [
      { icon: <ThumbsUp size={14} />, label: "Like" },
      { icon: <MessageCircle size={14} />, label: "Comment" },
      { icon: <Repeat2 size={14} />, label: "Repost" },
      { icon: <Send size={14} />, label: "Send" }
    ]
  },
  {
    name: "X",
    id: "x",
    res: "1080×1080",
    image: previewX,
    user: "Sarah Chen",
    handle: "@sarahcreates • 3h",
    text: "Your post looks different on every platform.\n\nPinPost fixes that.\n\nPreview across Instagram, LinkedIn, X, and Facebook — in real time. ✨",
    icon: <XIcon />,
    actions: [
      { icon: <MessageCircle size={14} />, label: "89" },
      { icon: <Repeat2 size={14} />, label: "247" },
      { icon: <Heart size={14} />, label: "1.2K" },
      { icon: <Share2 size={14} />, label: "" }
    ]
  },
  {
    name: "Facebook",
    id: "facebook",
    res: "1080×1080",
    image: previewFacebook,
    user: "Sarah Chen",
    time: "Just now • 🌐",
    text: "Stop guessing how your posts will look. PinPost gives you pixel-perfect previews across every major platform. Try it free today 🎯",
    icon: <FacebookIcon />,
    actions: [
      { icon: <ThumbsUp size={14} />, label: "Like" },
      { icon: <MessageCircle size={14} />, label: "Comment" },
      { icon: <Share2 size={14} />, label: "Share" }
    ]
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-[42px]" style={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            Everything you need to preview with confidence
          </h2>
          <p className="mt-4 text-slate-500 font-medium">
            One editor. Four platforms. Zero guesswork.
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="absolute -top-3 left-6 z-10 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse-live" />
            Live preview
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
            {/* Browser Header */}
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              </div>
              <div className="mx-auto rounded-lg bg-white border border-slate-200 px-10 py-1.5 text-[11px] text-slate-400 font-medium">
                pinpost.app/editor
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-slate-100">
              {platforms.map((p) => (
                <div key={p.id} className="flex flex-col bg-white">
                  {/* Platform Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      {p.icon}
                      <span className="text-[11px] font-bold text-slate-800">{p.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-tight">{p.res}</span>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1">
                    {/* User */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <Image src={avatar} alt={p.user} width={28} height={28} className="rounded-full shadow-sm" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-900 leading-tight">{p.user}</p>
                        <p className="text-[9px] text-slate-400 font-medium leading-tight">{p.handle || p.title || p.time}</p>
                      </div>
                    </div>
                    {/* Text */}
                    <p className="text-[11px] text-slate-700 leading-[1.5] mb-4 whitespace-pre-wrap tracking-tight">
                      {p.text}
                    </p>
                    {/* Image */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-sm bg-slate-50">
                      <Image src={p.image} alt={p.name} fill className="object-cover" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 flex items-center justify-between border-t border-slate-50 mt-auto">
                    <div className="flex items-center gap-4 text-slate-400">
                      {p.actions.map((action: any, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          {action.icon || action}
                          {action.label && <span className="text-[10px] font-bold">{action.label}</span>}
                        </div>
                      ))}
                    </div>
                    {p.rightAction && <div className="text-slate-400">{p.rightAction}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
