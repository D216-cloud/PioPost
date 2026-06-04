"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface Message {
  id: number;
  user: string;
  sender: "user" | "bot";
  text: string;
  avatar: string;
}

const USERS = ["alex_travels", "creative_mind", "growth_hacker", "fitness_pro", "sarah_k"];
const AVATARS = ["AT", "CM", "GH", "FP", "SK"];
const DIALOGUES = [
  { trigger: "guide", response: "Hey! Just sent you the custom link. Check your DMs! 🚀" },
  { trigger: "link", response: "Here is your registration link! Let us know how it goes. 👍" },
  { trigger: "template", response: "Sure! Here is the Figma template file: reelflow.co/figma-tmp 🎨" },
  { trigger: "beta", response: "Awesome! Welcome to our private beta. You are now linked! 🔑" },
];

export function RealtimeSection() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, user: "alex_travels", sender: "user", text: "guide", avatar: "AT" },
    { id: 2, user: "alex_travels", sender: "bot", text: "Hey! Just sent you the custom link. Check your DMs! 🚀", avatar: "RF" },
  ]);

  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      const user = USERS[index % USERS.length];
      const avatar = AVATARS[index % AVATARS.length];
      const diag = DIALOGUES[index % DIALOGUES.length];

      // Add user query message
      const userId = Date.now();
      setMessages((prev) => [
        ...prev.slice(-6), // Keep list compact
        { id: userId, user, sender: "user", text: diag.trigger, avatar }
      ]);

      // Add bot auto-reply 1 second later
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, user, sender: "bot", text: diag.response, avatar: "RF" }
        ]);
      }, 1000);

      index++;
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-28 md:py-40 bg-slate-50/20 border-t border-slate-100 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(241,245,249,0.4),transparent_50%)] pointer-events-none" />

      {/* Viewport Scroll-Triggered Reveal Animation */}
      <motion.div 
        className="mx-auto max-w-6xl px-6 relative z-10"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Information */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1 text-[12px] font-semibold text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time Processing
            </div>
            <h2 className="text-[32px] md:text-[52px] font-normal tracking-tight text-slate-900 leading-[1.1]">
              Live automation at your fingertips
            </h2>
            <p className="text-[16px] text-slate-500 leading-relaxed font-normal">
              Watch incoming comments and DMs trigger intelligent automated replies in milliseconds. No delays, no missed leads.
            </p>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-slate-900">Instant Comment Detection</h4>
                  <p className="text-[13px] text-slate-400 font-medium">Triggers activate in &lt; 200ms when a user leaves a comment.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-slate-900">AI Contextual Personalization</h4>
                  <p className="text-[13px] text-slate-400 font-medium">Sends hyper-personalized direct messages matching the user's intent.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Real Mobile UI with 3D Interaction */}
          <div className="lg:col-span-7 flex justify-center">
            <motion.div
              whileHover={{ 
                rotateY: -8, 
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

              {/* Screen Content (Mock Instagram DM Chat Screen) */}
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

                {/* Instagram Style Header */}
                <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-3 shrink-0">
                  {/* Colorful Avatar ring */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1.5px] shadow-sm flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-black text-[10px] text-slate-900">
                      RF
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-[12px] font-bold leading-tight flex items-center gap-1 text-slate-950">
                      reelflow_ai
                      {/* Verified Badge */}
                      <svg className="w-3.5 h-3.5 text-[#0095f6] fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.152-.4.238-.83.238-1.29 0-2.07-1.68-3.75-3.75-3.75-.46 0-.89.086-1.29.238C14.95 2.875 13.58 2 12 2c-1.58 0-2.95.875-3.6 2.148-.4-.152-.83-.238-1.29-.238-2.07 0-3.75 1.68-3.75 3.75 0 .46.086.89.238 1.29C2.25 9.55 1.375 10.92 1.375 12.5c0 1.58.875 2.95 2.148 3.6-.152.4-.238.83-.238 1.29 0 2.07 1.68 3.75 3.75 3.75.46 0 .89-.086 1.29-.238C9.05 21.125 10.42 22 12 22c1.58 0 2.95-.875 3.6-2.148.4.152.83.238 1.29.238 2.07 0 3.75-1.68 3.75-3.75 0-.46-.086-.89-.238-1.29 1.273-.65 2.148-2.02 2.148-3.6zm-12.72 4.19l-3.37-3.37 1.41-1.41 1.96 1.96 5.56-5.56 1.41 1.41-6.97 6.97z" />
                      </svg>
                    </h4>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Live Event Monitor</p>
                  </div>
                </div>

                {/* Chat Message Stream */}
                <div 
                  ref={chatRef}
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-3 flex flex-col no-scrollbar"
                >
                  {messages.map((msg) => {
                    const isBot = msg.sender === "bot";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[82%] ${isBot ? "self-end items-end" : "self-start items-start"}`}
                      >
                        {/* Username label (only for user) */}
                        {!isBot && (
                          <span className="text-[9px] font-bold text-slate-400 mb-1 ml-1.5">
                            @{msg.user}
                          </span>
                        )}
                        <div
                          className={`px-3.5 py-2.5 text-[12px] leading-relaxed shadow-sm font-medium ${
                            isBot
                              ? "rounded-2xl rounded-tr-none bg-gradient-to-tr from-[#3b82f6] via-[#8b5cf6] to-[#ec4899] text-white text-right"
                              : "rounded-2xl rounded-tl-none bg-slate-100 text-slate-800 text-left"
                          }`}
                        >
                          {!isBot ? (
                            <span>
                              Comment matched: <strong className="text-slate-950 font-bold">&quot;{msg.text}&quot;</strong>
                            </span>
                          ) : (
                            <span>{msg.text}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mock Chat Input Bar */}
                <div className="px-4 pt-2 shrink-0 border-t border-slate-100 flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-100 rounded-full px-4 py-2 flex items-center text-[10px] text-slate-400 text-left font-medium">
                    Automating replies...
                  </div>
                </div>

              </div>
            </motion.div>
          </div>

        </div>
      </motion.div>
    </section>
  );
}
