"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: number;
  user: string;
  avatar: string;
  text: string;
  isBot: boolean;
  isTyping?: boolean;
}

const INITIAL_COMMENTS: Comment[] = [
  { id: 1, user: "fitness_journey", avatar: "FJ", text: "Where can I sign up for the template?", isBot: false },
  { id: 2, user: "reelflow_ai", avatar: "RF", text: "Hey! Just sent the signup link to your DMs! Check it out 🚀", isBot: true },
];

const NEW_COMMENTS = [
  {
    user: "travel_blogger",
    avatar: "TB",
    text: "Is there a free trial for this tool?",
    reply: "Yes! We have a free forever plan with 3 video schedules per month. No card required! 🌟"
  },
  {
    user: "tech_reviewer",
    avatar: "TR",
    text: "Can it auto-post reels or only schedule?",
    reply: "It auto-posts directly to your Instagram feed at your scheduled peak times! ⏰"
  },
  {
    user: "baker_chef",
    avatar: "BC",
    text: "Send me the recipe checklist link!",
    reply: "Sending the link straight to your DMs right now! Check your messages 🧁"
  }
];

function VerifiedBadge() {
  return (
    <svg className="w-3.5 h-3.5 text-[#0095f6] fill-current shrink-0 inline-block align-middle ml-0.5" viewBox="0 0 24 24">
      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.152-.4.238-.83.238-1.29 0-2.07-1.68-3.75-3.75-3.75-.46 0-.89.086-1.29.238C14.95 2.875 13.58 2 12 2c-1.58 0-2.95.875-3.6 2.148-.4-.152-.83-.238-1.29-.238-2.07 0-3.75 1.68-3.75 3.75 0 .46.086.89.238 1.29C2.25 9.55 1.375 10.92 1.375 12.5c0 1.58.875 2.95 2.148 3.6-.152.4-.238.83-.238 1.29 0 2.07 1.68 3.75 3.75 3.75.46 0 .89-.086 1.29-.238C9.05 21.125 10.42 22 12 22c1.58 0 2.95-.875 3.6-2.148.4.152.83.238 1.29.238 2.07 0 3.75-1.68 3.75-3.75 0-.46-.086-.89-.238-1.29 1.273-.65 2.148-2.02 2.148-3.6zm-12.72 4.19l-3.37-3.37 1.41-1.41 1.96 1.96 5.56-5.56 1.41 1.41-6.97 6.97z" />
    </svg>
  );
}

export function CommentAutomationSection() {
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [comments]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      const current = NEW_COMMENTS[index % NEW_COMMENTS.length];
      
      // Step 1: Add user comment
      const userCommentId = Date.now();
      setComments((prev) => [
        ...prev.slice(-5), // Keep list compact
        { id: userCommentId, user: current.user, avatar: current.avatar, text: current.text, isBot: false }
      ]);

      // Step 2: Add typing indicator for bot 1 second later
      const botReplyId = Date.now() + 1;
      setTimeout(() => {
        setComments((prev) => [
          ...prev,
          { id: botReplyId, user: "reelflow_ai", avatar: "RF", text: "", isBot: true, isTyping: true }
        ]);
      }, 1000);

      // Step 3: Replace typing indicator with bot reply 2.5 seconds later
      setTimeout(() => {
        setComments((prev) => 
          prev.map((c) => c.id === botReplyId ? { ...c, text: current.reply, isTyping: false } : c)
        );
      }, 2500);

      index++;
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-28 md:py-40 bg-white border-t border-slate-100 overflow-hidden relative">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(241,245,249,0.35),transparent_50%)] pointer-events-none" />

      {/* Viewport Scroll-Triggered Reveal */}
      <motion.div 
        className="mx-auto max-w-6xl px-6 relative z-10"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: 3D Interactive iPhone Comment UI */}
          <div className="lg:col-span-7 flex justify-center order-2 lg:order-1">
            <motion.div
              whileHover={{ 
                rotateY: 8, 
                rotateX: 6,
                scale: 1.02,
                boxShadow: "0 35px 70px rgba(0, 0, 0, 0.1)"
              }}
              style={{ transformStyle: "preserve-3d", perspective: 1000 }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
              className="relative w-[300px] h-[580px] bg-slate-950 rounded-[48px] p-[10px] shadow-2xl border-4 border-slate-900 cursor-pointer overflow-hidden"
            >
              {/* Inner screen glass highlight */}
              <div className="absolute inset-[3px] rounded-[42px] border border-white/10 pointer-events-none z-30" />
              
              {/* Top speaker notch */}
              <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-40 flex items-center justify-center">
                {/* Camera lens */}
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800/80 mr-6" />
                {/* Speaker slit */}
                <div className="w-12 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Screen Content (Mock Instagram Comment Feed Screen) */}
              <div className="w-full h-full bg-white rounded-[38px] overflow-hidden flex flex-col relative pt-7 pb-4 text-slate-800">
                
                {/* Status Bar */}
                <div className="px-6 pt-1 pb-1 flex items-center justify-between text-[10px] font-bold text-slate-900 shrink-0">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span>LTE</span>
                    <div className="w-5 h-2.5 border border-slate-900 rounded-[3px] p-[1px] flex items-center">
                      <div className="w-full h-full bg-slate-900 rounded-[1px]" />
                    </div>
                  </div>
                </div>

                {/* Instagram Comments Header */}
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    <span className="text-[13px] font-bold text-slate-900">Comments</span>
                  </div>
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h.008v.008H6V12zm0 0h.008v.008H6V12zm0 0h.008v.008H6V12z" />
                  </svg>
                </div>

                {/* Main Caption (pinned top comment) */}
                <div className="px-4 py-3 border-b border-slate-50 flex gap-3 text-left shrink-0 bg-slate-50/40">
                  {/* Pinned user with Instagram Story colorful ring */}
                  <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-black text-[9px] text-slate-900">
                      RF
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11.5px] text-slate-800 leading-snug">
                      <strong className="font-bold text-slate-950 mr-0.5 inline-flex items-center gap-0.5">
                        reelflow_ai
                        <VerifiedBadge />
                      </strong>
                      Automate your entire presence, comments, and DMs on autopilot. Try ReelFlow free! 👇
                    </p>
                  </div>
                </div>

                {/* Comments Thread Area */}
                <div 
                  ref={containerRef}
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-4 flex flex-col no-scrollbar"
                >
                  <AnimatePresence initial={false}>
                    {comments.map((comment) => {
                      const isBot = comment.isBot;
                      return (
                        <div
                          key={comment.id}
                          className={`flex gap-3 text-left ${isBot ? "pl-5" : ""}`}
                        >
                          {/* Avatar - Colorful story ring for Bot, standard gray for User */}
                          {isBot ? (
                            <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
                              <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-black text-[8px] text-slate-900">
                                RF
                              </div>
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[9px] font-black shrink-0 shadow-sm">
                              {comment.avatar}
                            </div>
                          )}

                          {/* Comment Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[11.5px] text-slate-800 leading-normal font-medium">
                              <span className="font-bold text-slate-950 mr-0.5 inline-flex items-center gap-0.5">
                                @{comment.user}
                                {isBot && <VerifiedBadge />}
                              </span>
                              {comment.isTyping ? (
                                <span className="inline-flex gap-1 items-center pt-1 pl-1">
                                  <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-[75ms]" />
                                  <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-[150ms]" />
                                  <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-[225ms]" />
                                </span>
                              ) : (
                                <span>{comment.text}</span>
                              )}
                            </p>
                            
                            <div className="flex items-center gap-3 mt-1 text-[9px] font-bold text-slate-400">
                              <span>Just now</span>
                              <span className="cursor-pointer hover:text-slate-600">Reply</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Mock Comment Input Bar */}
                <div className="px-4 pt-2 shrink-0 border-t border-slate-100 flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-100 rounded-full px-4 py-2 flex items-center text-[10px] text-slate-400 text-left font-medium">
                    Add a comment for @reelflow_ai...
                  </div>
                </div>

              </div>
            </motion.div>
          </div>

          {/* Right Column: Information */}
          <div className="lg:col-span-5 space-y-6 text-left order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1 text-[12px] font-semibold text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-900 animate-pulse"></span>
              AI Comment Agent
            </div>
            <h2 className="text-[32px] md:text-[52px] font-normal tracking-tight text-slate-900 leading-[1.1]">
              Engage every comment, automatically
            </h2>
            <p className="text-[16px] text-slate-500 leading-relaxed font-normal">
              Boost your post engagement velocity. Our AI reads comments, detects intent, and posts contextually perfect replies in real-time.
            </p>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-slate-900">Contextual Auto-Replies</h4>
                  <p className="text-[13px] text-slate-400 font-medium">Understands questions about price, shipping, features, or links and answers perfectly.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-slate-900">Boosts Post Reach</h4>
                  <p className="text-[13px] text-slate-400 font-medium">Increases comment volume instantly, triggering the Instagram algorithm for higher reach.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </section>
  );
}
