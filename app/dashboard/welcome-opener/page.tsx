"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";

// Custom robust SVG Icons to avoid lucide version mismatches
const InstagramIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const GiftIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const HandshakeIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 22a10 10 0 0 1-5.74-1.87L2.4 17.6a1 1 0 0 1-.2-1.4l1.2-1.5a1 1 0 0 1 1.4-.2l3.2 2.4a1 1 0 0 0 1.2-.1l7.8-6.2a1 1 0 0 1 1.4.1l3 3.6a1 1 0 0 1-.2 1.4l-6.8 5.4c-.9.7-2.1 1.1-3.4 1z" />
    <path d="m16 8 2.5-2.5a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4L18 12.1" />
    <path d="M12.5 5.5 15 3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-4 4" />
    <path d="m8.5 2 3-3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-5 5" />
  </svg>
);

const HeadphonesIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const TagIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2H2v10l9.29 9.29c.39.39 1.02.39 1.41 0l7.29-7.29c.39-.39.39-1.02 0-1.41L12 2z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const ChevronDownIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const XIcon = ({ size = 12, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PlusIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SaveIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const RefreshCwIcon = ({ size = 12, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

interface QuickReplyButton {
  label: string;
  iconType: "pricing" | "collab" | "support";
  colorClass: string;
}

export default function WelcomeOpenerPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // States
  const [autoWelcome, setAutoWelcome] = useState(true);
  const [askFollow, setAskFollow] = useState(true);
  const [commentReply, setCommentReply] = useState(true);
  const [message, setMessage] = useState(
    "Hey {{username}}! 👋\nThanks for following! We're excited to have you here.\nHow can we help you today?\nFeel free to choose an option below 👇"
  );
  
  const [buttons, setButtons] = useState<QuickReplyButton[]>([
    {
      label: "Pricing",
      iconType: "pricing",
      colorClass: "border-[#7c3aed]/60 text-[#a855f7] bg-[#7c3aed]/5",
    },
    {
      label: "Collab",
      iconType: "collab",
      colorClass: "border-[#06b6d4]/60 text-[#06b6d4] bg-[#06b6d4]/5",
    },
    {
      label: "Support",
      iconType: "support",
      colorClass: "border-[#7c3aed]/60 text-[#a855f7] bg-[#7c3aed]/5",
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newBtnLabel, setNewBtnLabel] = useState("");
  const [newBtnIconType, setNewBtnIconType] = useState<"pricing" | "collab" | "support">("pricing");
  const [isSaving, setIsSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Variable inserter
  const handleInsertVariable = () => {
    if (message.length + 14 <= 500) {
      setMessage(message + " {{username}}");
      toast.success("Variable {{username}} inserted");
    } else {
      toast.error("Message exceeds character limit!");
    }
  };

  // Add button
  const handleAddButton = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBtnLabel.trim()) return;
    
    let colorClass = "border-[#7c3aed]/60 text-[#a855f7] bg-[#7c3aed]/5";
    if (newBtnIconType === "collab") {
      colorClass = "border-[#06b6d4]/60 text-[#06b6d4] bg-[#06b6d4]/5";
    }

    const newBtn: QuickReplyButton = {
      label: newBtnLabel,
      iconType: newBtnIconType,
      colorClass,
    };

    setButtons([...buttons, newBtn]);
    setNewBtnLabel("");
    setIsAdding(false);
    toast.success(`Button "${newBtnLabel}" added`);
  };

  // Remove button
  const removeButton = (idx: number) => {
    const updated = buttons.filter((_, i) => i !== idx);
    setButtons(updated);
    toast.info("Button removed");
  };

  // Reset buttons
  const resetButtons = () => {
    setButtons([
      {
        label: "Pricing",
        iconType: "pricing",
        colorClass: "border-[#7c3aed]/60 text-[#a855f7] bg-[#7c3aed]/5",
      },
      {
        label: "Collab",
        iconType: "collab",
        colorClass: "border-[#06b6d4]/60 text-[#06b6d4] bg-[#06b6d4]/5",
      },
      {
        label: "Support",
        iconType: "support",
        colorClass: "border-[#7c3aed]/60 text-[#a855f7] bg-[#7c3aed]/5",
      },
    ]);
    toast.success("Buttons reset to defaults");
  };

  // Save Settings
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings saved successfully!");
    }, 1000);
  };

  // Helper to render icon based on type
  const renderIcon = (type: "pricing" | "collab" | "support") => {
    switch (type) {
      case "pricing":
        return <TagIcon size={14} className="shrink-0" />;
      case "collab":
        return <HandshakeIcon size={14} className="shrink-0" />;
      case "support":
        return <HeadphonesIcon size={14} className="shrink-0" />;
    }
  };

  return (
    <div className="min-h-full bg-[#03040b] text-slate-100 p-4 md:p-8 flex flex-col gap-6 font-sans">
      
      {/* ── Header Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
        {/* Instagram Account Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3.5 px-4 h-[46px] bg-[#0e1026] border border-[#1f2347] hover:border-[#2b306b] rounded-2xl cursor-pointer transition-all duration-150 active:scale-98 select-none shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-md shrink-0">
              <InstagramIcon size={18} className="text-white" />
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Instagram Account</span>
              <span className="text-sm font-bold text-white mt-1">your.username</span>
            </div>
            <ChevronDownIcon size={14} className={`text-slate-400 ml-1.5 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </div>

          {/* Simple Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-56 rounded-xl bg-[#0e1026] border border-[#1f2347] shadow-xl z-50 overflow-hidden py-1.5">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Account</div>
              <div className="flex items-center gap-2 px-3 py-2 hover:bg-[#131633] cursor-pointer text-sm text-white font-medium">
                <InstagramIcon size={14} className="text-pink-500" />
                <span>your.username</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 hover:bg-[#131633] cursor-pointer text-sm text-slate-400 font-medium">
                <InstagramIcon size={14} className="text-slate-500" />
                <span>another.profile</span>
              </div>
            </div>
          )}
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-3 sm:self-end">
          
          {/* What's New */}
          <button className="relative flex items-center gap-2 px-4 h-[46px] bg-[#0e1026] border border-[#1f2347] hover:bg-[#131633] text-white text-xs font-semibold rounded-xl transition-all duration-150 active:scale-95 cursor-pointer">
            <GiftIcon size={16} className="text-[#a855f7]" />
            <span>What's New</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#a855f7] rounded-full animate-pulse" />
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-[46px] h-[46px] rounded-xl bg-[#0e1026] border border-[#1f2347] hover:bg-[#131633] flex items-center justify-center text-slate-400 hover:text-white transition-all duration-150 active:scale-95 cursor-pointer"
            title="Toggle theme"
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>

          {/* User profile dropdown selector */}
          <div className="flex items-center gap-1.5 pl-1.5 h-[46px]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6366f1] to-[#a855f7] flex items-center justify-center text-white text-sm font-bold shadow-md cursor-pointer select-none">
              IB
            </div>
            <ChevronDownIcon size={14} className="text-slate-400 cursor-pointer hover:text-white transition-colors" />
          </div>

        </div>

      </div>

      {/* ── Main Settings Card ── */}
      <div className="w-full rounded-[24px] bg-[#070913] border border-[#161930] p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        
        {/* Settings Title */}
        <div className="space-y-1.5 mb-8 text-left">
          <h1 className="text-2xl md:text-[28px] font-bold text-white tracking-tight">
            Welcome Opener Settings
          </h1>
          <p className="text-[13.5px] text-slate-400 font-medium leading-normal">
            Automatically send a welcome message to new followers.
          </p>
        </div>

        {/* Section 1: Auto-Welcome DM Toggle */}
        <div className="flex items-center justify-between gap-6 py-1">
          <div className="flex flex-col gap-1 text-left min-w-0">
            <h3 className="text-base font-semibold text-white">Auto-Welcome DM</h3>
            <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed">
              Send a welcome message automatically when someone follows you.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 select-none">
            <button
              onClick={() => setAutoWelcome(!autoWelcome)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                autoWelcome ? "bg-[#7c3aed]" : "bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                  autoWelcome ? "translate-x-5" : ""
                }`}
              />
            </button>
            <span className="text-xs font-bold text-white w-8 uppercase tracking-wider">
              {autoWelcome ? "ON" : "OFF"}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#161930] my-6" />

        {/* Section 2: Welcome Message Input */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col gap-0.5 text-left">
              <h3 className="text-base font-semibold text-white">Welcome Message</h3>
              <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed">
                This message will be sent as a DM to new followers.
              </p>
            </div>
            
            {/* Insert Variable */}
            <button 
              onClick={handleInsertVariable}
              className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#1f2347] bg-[#0e1026] hover:bg-[#131633] text-white text-xs font-semibold transition-all duration-150 active:scale-98 cursor-pointer self-start sm:self-center"
            >
              <span className="text-[#a855f7] font-bold text-sm">{"{}"}</span>
              <span>Insert Variable</span>
              <ChevronDownIcon size={12} className="text-slate-400 ml-0.5" />
            </button>
          </div>

          {/* Text Area */}
          <div className="relative mt-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              className="w-full h-36 p-4 rounded-2xl bg-[#03040b]/60 border border-[#1f2347] hover:border-[#2b306b] focus:border-[#7c3aed] text-white text-sm focus:outline-none placeholder-slate-500 resize-none font-medium leading-relaxed transition-colors duration-150"
              placeholder="Type your welcome message here..."
            />
            
            {/* Bottom count badge */}
            <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2 select-none bg-[#03040b]/80 px-2.5 py-1 rounded-lg border border-[#1f2347]/50 backdrop-blur-sm">
              <span className="text-[11px] text-slate-400 font-bold">
                {message.length}/500
              </span>
              <div className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center text-white text-[10px] font-black shadow-sm" title="Grammarly checked">
                G
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Ask for Follow / Comment Reply Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          
          {/* Ask for Follow */}
          <div className="p-4 rounded-2xl bg-[#0e1026]/40 border border-[#1f2347] hover:border-[#2b306b] transition-colors flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5 text-left min-w-0">
              <span className="text-sm font-semibold text-white">Ask for Follow</span>
              <span className="text-xs text-slate-400 font-medium truncate">Ask users to follow your account.</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 select-none">
              <button
                onClick={() => setAskFollow(!askFollow)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                  askFollow ? "bg-[#7c3aed]" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                    askFollow ? "translate-x-5" : ""
                  }`}
                />
              </button>
              <span className="text-xs font-bold text-white w-8 uppercase tracking-wider">
                {askFollow ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          {/* Any Comment Reply */}
          <div className="p-4 rounded-2xl bg-[#0e1026]/40 border border-[#1f2347] hover:border-[#2b306b] transition-colors flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5 text-left min-w-0">
              <span className="text-sm font-semibold text-white">Any Comment Reply</span>
              <span className="text-xs text-slate-400 font-medium truncate">Send welcome message on any comment.</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 select-none">
              <button
                onClick={() => setCommentReply(!commentReply)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                  commentReply ? "bg-[#7c3aed]" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                    commentReply ? "translate-x-5" : ""
                  }`}
                />
              </button>
              <span className="text-xs font-bold text-white w-8 uppercase tracking-wider">
                {commentReply ? "ON" : "OFF"}
              </span>
            </div>
          </div>

        </div>

        {/* Section 4: Quick Reply Buttons */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-2 select-none">
            <span className="text-sm font-semibold text-white">Quick Reply Buttons</span>
            <button 
              onClick={resetButtons}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer" 
              title="Reset buttons to default"
            >
              <RefreshCwIcon size={12} />
            </button>
          </div>
          
          <p className="text-xs md:text-sm text-slate-400 font-medium text-left leading-normal">
            Add quick reply buttons to make it easy for users to respond.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {buttons.map((btn, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold shadow-sm transition-all duration-150 hover:scale-[1.02] ${btn.colorClass}`}
              >
                {renderIcon(btn.iconType)}
                <span>{btn.label}</span>
                <button
                  onClick={() => removeButton(idx)}
                  className="text-slate-400 hover:text-white transition-colors ml-1.5 focus:outline-none"
                >
                  <XIcon size={12} />
                </button>
              </div>
            ))}

            {/* Add Button Trigger */}
            {!isAdding ? (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-[#7c3aed]/50 hover:border-[#7c3aed] text-[#7c3aed] text-xs font-semibold hover:bg-[#7c3aed]/10 transition-all cursor-pointer"
              >
                <PlusIcon size={14} />
                <span>Add Button</span>
              </button>
            ) : (
              <form 
                onSubmit={handleAddButton} 
                className="flex items-center gap-2 p-1.5 rounded-full bg-[#0e1026] border border-[#1f2347] animate-in fade-in zoom-in-95 duration-150"
              >
                <input
                  type="text"
                  required
                  placeholder="Button Label"
                  value={newBtnLabel}
                  onChange={(e) => setNewBtnLabel(e.target.value)}
                  className="bg-transparent text-white text-xs px-2.5 py-1 focus:outline-none w-24 font-semibold"
                  autoFocus
                />
                
                <select
                  value={newBtnIconType}
                  onChange={(e) => setNewBtnIconType(e.target.value as "pricing" | "collab" | "support")}
                  className="bg-[#03040b] text-slate-350 text-xs border border-[#1f2347] rounded-full px-2 py-0.5 focus:outline-none"
                >
                  <option value="pricing">Tag</option>
                  <option value="collab">Handshake</option>
                  <option value="support">Headphones</option>
                </select>

                <button 
                  type="submit"
                  className="w-6 h-6 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] flex items-center justify-center text-white text-[10px] font-bold shrink-0 cursor-pointer"
                >
                  <PlusIcon size={12} />
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-[10px] shrink-0 cursor-pointer"
                >
                  <XIcon size={12} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Save Settings footer trigger */}
        <div className="mt-8 pt-4 border-t border-[#161930] flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#9333ea] hover:from-[#1d4ed8] hover:to-[#7e22ce] disabled:hover:from-[#2563eb] disabled:hover:to-[#9333ea] text-white text-xs font-bold rounded-xl shadow-lg transition-all duration-150 active:scale-97 disabled:opacity-55 cursor-pointer select-none"
          >
            <SaveIcon size={16} />
            <span>{isSaving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
