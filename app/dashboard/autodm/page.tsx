"use client";

import { useState, useEffect } from "react";
import { Zap, Clock, User, Send, Heart, Wifi, Battery, Signal, BarChart2 } from "lucide-react";
import { toast } from "sonner";

export default function DMAutomationPage() {
  const [activeTab, setActiveTab] = useState("Keyword Triggers");
  
  // Keyword Trigger State
  const [keyword, setKeyword] = useState("ebook");
  const [keywordResponse, setKeywordResponse] = useState("Hey 👋\nHere is your free ebook:\nhttps://reelflow.ai/download-ebook");

  // Welcome DM State
  const [welcomeResponse, setWelcomeResponse] = useState("Thanks for following! 👋\nHere's a 10% discount code: WELCOME10");

  // Story Reply State
  const [storyKeyword, setStoryKeyword] = useState("🔥");
  const [storyResponse, setStoryResponse] = useState("Thanks for the love! Here's the link I promised in my story:\nhttps://reelflow.ai/link");

  // Data fetching
  const [instagramAccounts, setInstagramAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/instagram-account")
      .then(res => res.json())
      .then(data => {
         const accounts = Array.isArray(data.data) ? data.data : [];
         setInstagramAccounts(accounts);
         if (accounts.length > 0) setSelectedAccountId(accounts[0].id);
      })
      .catch(console.error);

    fetch("/api/automation-rules")
      .then(res => res.json())
      .then(data => {
         if (data.data) setRules(data.data);
      })
      .catch(console.error);
  }, []);

  const totalExecutions = rules.reduce((acc, rule) => acc + (rule.executions || 0), 0);
  const activeRulesCount = rules.filter(r => r.active).length;

  const handleApplyRule = async (triggerType: string, triggerKeyword: string, messageValue: string) => {
    if (!selectedAccountId) {
       toast.error("Please connect an Instagram account first");
       return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/automation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "instagram",
          name: `${triggerType} Rule - ${triggerKeyword}`,
          trigger_keyword: triggerKeyword,
          reply_message: messageValue,
          trigger_type: triggerType,
          comment_scope: "any",
          instagram_account_id: selectedAccountId,
          active: true,
        })
      });
      if (res.ok) {
        toast.success(`${triggerType} rule created successfully!`);
        // Refresh rules
        const rulesRes = await fetch("/api/automation-rules");
        const rulesData = await rulesRes.json();
        if (rulesData.data) setRules(rulesData.data);
      } else {
        toast.error("Failed to create rule");
      }
    } catch (e) {
      toast.error("Error creating rule");
    } finally {
      setSaving(false);
    }
  };


  // Typing animation states
  const [isTyping, setIsTyping] = useState(false);
  const [showBotMessage, setShowBotMessage] = useState(true);

  // Trigger animation when relevant dependencies change
  useEffect(() => {
    setShowBotMessage(false);
    setIsTyping(true);
    
    const timer = setTimeout(() => {
      setIsTyping(false);
      setShowBotMessage(true);
    }, 1500); // 1.5s typing delay
    
    return () => clearTimeout(timer);
  }, [activeTab, keyword, keywordResponse, welcomeResponse, storyKeyword, storyResponse]);

  const tabs = [
    { id: "Welcome DM", icon: User },
    { id: "Keyword Triggers", icon: Zap },
    { id: "Story Reply DMs", icon: Clock },
  ];

  return (
    <div className="relative mx-auto max-w-6xl px-6 md:px-8 pt-8 md:pt-24 pb-16 md:pb-20 space-y-10 animate-in fade-in duration-700">
      {/* Ambient glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-violet-100/30 blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 h-80 w-80 rounded-full bg-pink-100/20 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-center md:text-left mb-6">
        <div className="space-y-3">
          <h1 className="text-[32px] md:text-[52px] font-normal tracking-tight text-slate-900 leading-none">
            DM <span className="text-[#a855f7] font-medium">Automation</span>
          </h1>
          <p className="text-[14.5px] md:text-[16px] text-slate-500 font-medium max-w-xl leading-relaxed">
            Set up automatic direct message replies and lead capture flows.
          </p>
        </div>
      </div>
      
      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total DMs Sent</p>
             <p className="text-[28px] font-black text-slate-800">{totalExecutions}</p>
           </div>
           <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center">
             <Send size={20} />
           </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Rules</p>
             <p className="text-[28px] font-black text-slate-800">{activeRulesCount}</p>
           </div>
           <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
             <Zap size={20} />
           </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Connected Accounts</p>
             <p className="text-[28px] font-black text-slate-800">{instagramAccounts.length}</p>
           </div>
           <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
             <User size={20} />
           </div>
        </div>
      </div>

      {/* Account Selector */}
      {instagramAccounts.length > 0 && (
         <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-semibold text-slate-600">Select Account:</span>
            <select
              value={selectedAccountId || ""}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#a855f7] bg-white text-sm font-medium"
            >
               {instagramAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>@{acc.username}</option>
               ))}
            </select>
         </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-4 text-[14.5px] font-bold transition-all relative whitespace-nowrap
                ${isActive ? "text-[#a855f7]" : "text-slate-400 hover:text-slate-600"}
              `}
            >
              <tab.icon size={16} />
              {tab.id}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#a855f7] rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-8">
        
        {/* ======================= LEFT PANEL (CONFIGURATION) ======================= */}
        <div className="bg-white rounded-[24px] border border-[#e4e4e7] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Welcome DM Config */}
          {activeTab === "Welcome DM" && (
            <>
              <div>
                <h2 className="text-[20px] font-bold text-slate-900">Configure Welcome DM</h2>
                <p className="text-[14px] text-slate-500 mt-2 leading-relaxed">
                  Automatically send a personalized direct message to anyone who starts following your account.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Welcome Message Content
                  </label>
                  <textarea
                    value={welcomeResponse}
                    onChange={(e) => setWelcomeResponse(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] transition-all text-[14px] text-slate-900 min-h-[140px] resize-y"
                    placeholder="Type your welcome message..."
                  />
                </div>

                <button 
                  onClick={() => handleApplyRule("Welcome", "Any new follower", welcomeResponse)}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#a855f7] to-[#8B5CF6] text-white text-[15px] font-bold rounded-[14px] shadow-[0_8px_20px_-4px_rgba(168,85,247,0.3)] transition-all hover:scale-[1.01] disabled:opacity-70"
                >
                  <User size={18} className="fill-white/20" />
                  {saving ? "Saving..." : "Apply Welcome Rule"}
                </button>
              </div>
            </>
          )}

          {/* Keyword Triggers Config */}
          {activeTab === "Keyword Triggers" && (
            <>
              <div>
                <h2 className="text-[20px] font-bold text-slate-900">Configure DM Keyword Trigger</h2>
                <p className="text-[14px] text-slate-500 mt-2 leading-relaxed">
                  When a user sends this specific keyword privately or in a comment, the auto-system fires your message instantly.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Trigger Keyword
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] transition-all text-[14px] font-medium text-slate-900"
                    placeholder="Enter keyword..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Response Auto Message
                  </label>
                  <textarea
                    value={keywordResponse}
                    onChange={(e) => setKeywordResponse(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] transition-all text-[14px] text-slate-900 min-h-[140px] resize-y"
                    placeholder="Type your message here..."
                  />
                </div>

                <button 
                  onClick={() => handleApplyRule("Keyword", keyword, keywordResponse)}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#a855f7] to-[#8B5CF6] text-white text-[15px] font-bold rounded-[14px] shadow-[0_8px_20px_-4px_rgba(168,85,247,0.3)] transition-all hover:scale-[1.01] disabled:opacity-70"
                >
                  <Zap size={18} className="fill-white/20" />
                  {saving ? "Saving..." : "Apply Keyword DM Rule"}
                </button>
              </div>
            </>
          )}

          {/* Story Reply DMs Config */}
          {activeTab === "Story Reply DMs" && (
            <>
              <div>
                <h2 className="text-[20px] font-bold text-slate-900">Configure Story Reply Trigger</h2>
                <p className="text-[14px] text-slate-500 mt-2 leading-relaxed">
                  Send an automatic response when someone replies to your Instagram Story with a specific keyword or emoji.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Story Reply Keyword
                  </label>
                  <input
                    type="text"
                    value={storyKeyword}
                    onChange={(e) => setStoryKeyword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] transition-all text-[14px] font-medium text-slate-900"
                    placeholder="Enter keyword or emoji (e.g. 🔥)..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Response Auto Message
                  </label>
                  <textarea
                    value={storyResponse}
                    onChange={(e) => setStoryResponse(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] transition-all text-[14px] text-slate-900 min-h-[140px] resize-y"
                    placeholder="Type your message here..."
                  />
                </div>

                <button 
                  onClick={() => handleApplyRule("Story", storyKeyword, storyResponse)}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#a855f7] to-[#8B5CF6] text-white text-[15px] font-bold rounded-[14px] shadow-[0_8px_20px_-4px_rgba(168,85,247,0.3)] transition-all hover:scale-[1.01] disabled:opacity-70"
                >
                  <Clock size={18} className="fill-white/20" />
                  {saving ? "Saving..." : "Apply Story Rule"}
                </button>
              </div>
            </>
          )}

        </div>

        {/* ======================= RIGHT PANEL (PHONE SIMULATOR) ======================= */}
        <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Dynamic Phone Simulator
          </h3>
          
          {/* Realistic iPhone Container */}
          <div className="w-[320px] h-[650px] bg-white rounded-[3.5rem] border-[12px] border-slate-900 shadow-2xl relative flex flex-col overflow-hidden shrink-0 ring-4 ring-slate-100">
            
            {/* Power Button */}
            <div className="absolute right-[-14px] top-32 w-1 h-16 bg-slate-800 rounded-r-md"></div>
            {/* Volume Buttons */}
            <div className="absolute left-[-14px] top-24 w-1 h-12 bg-slate-800 rounded-l-md"></div>
            <div className="absolute left-[-14px] top-40 w-1 h-12 bg-slate-800 rounded-l-md"></div>

            {/* Dynamic Island / Notch */}
            <div className="absolute top-2 inset-x-0 flex justify-center z-30">
              <div className="w-24 h-7 bg-black rounded-full flex items-center justify-end px-2 gap-1">
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                <div className="w-2 h-2 bg-slate-800/50 rounded-full"></div>
              </div>
            </div>

            {/* iOS Status Bar */}
            <div className="h-12 pt-2 px-6 flex justify-between items-center text-[11px] font-bold text-slate-900 bg-white z-20">
              <span className="mt-1 ml-1">9:41</span>
              <div className="flex items-center gap-1.5 mt-1 mr-1 text-slate-900">
                <Signal size={12} />
                <Wifi size={12} />
                <Battery size={14} className="rotate-90" />
              </div>
            </div>

            {/* App Header (Instagram style) */}
            <div className="pb-3 px-4 border-b border-slate-100 flex items-center gap-3 bg-white z-10">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[14px] font-bold shrink-0 border border-slate-200">
                F
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[14px] font-bold text-slate-900 truncate leading-tight">fan.account</h4>
                <p className="text-[11px] text-slate-500 font-medium">Instagram</p>
              </div>
            </div>

            {/* Phone Chat Area */}
            <div className="flex-1 bg-white p-4 overflow-y-auto flex flex-col gap-5 custom-scrollbar">
              {/* Spacer to push messages to bottom */}
              <div className="flex-1" />
              
              {/* Timestamp */}
              <div className="flex justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today 9:41 AM</span>
              </div>

              {/* ================= WELCOME DM SIMULATOR ================= */}
              {activeTab === "Welcome DM" && (
                <>
                  {/* System Event Notice */}
                  <div className="flex justify-center mb-2">
                    <div className="bg-slate-50 text-slate-500 px-4 py-1.5 rounded-full text-[11.5px] font-medium border border-slate-100 shadow-sm">
                      fan.account started following you
                    </div>
                  </div>
                  
                  {isTyping ? (
                    <TypingIndicator />
                  ) : showBotMessage ? (
                    <BotBubble response={welcomeResponse} />
                  ) : null}
                </>
              )}

              {/* ================= KEYWORD TRIGGER SIMULATOR ================= */}
              {activeTab === "Keyword Triggers" && (
                <>
                  <UserBubble text={keyword} />
                  {isTyping ? (
                    <TypingIndicator />
                  ) : showBotMessage ? (
                    <BotBubble response={keywordResponse} />
                  ) : null}
                </>
              )}

              {/* ================= STORY REPLY SIMULATOR ================= */}
              {activeTab === "Story Reply DMs" && (
                <>
                  <div className="flex justify-end">
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mr-1 flex items-center gap-1">
                        <Heart size={10} className="fill-slate-300 stroke-none" /> Replied to your story
                      </div>
                      <div className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-[18px] rounded-br-sm text-[14px] max-w-[220px] shadow-sm">
                        {storyKeyword || "..."}
                      </div>
                    </div>
                  </div>

                  {isTyping ? (
                    <TypingIndicator />
                  ) : showBotMessage ? (
                    <BotBubble response={storyResponse} />
                  ) : null}
                </>
              )}

            </div>

            {/* Phone Input Bar */}
            <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <User size={14} className="text-slate-400" />
              </div>
              <div className="flex-1 h-9 rounded-full border border-slate-200 bg-slate-50 px-3 flex items-center text-[12px] text-slate-400">
                {activeTab === "Welcome DM" 
                  ? "Message..." 
                  : `Type "${activeTab === "Story Reply DMs" ? storyKeyword : keyword}"...`
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Bubble Components
function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-in slide-in-from-right-4 duration-300">
      <div className="bg-slate-100 text-slate-800 px-4 py-2.5 rounded-[18px] rounded-br-[4px] text-[14px] max-w-[220px]">
        {text || "..."}
      </div>
    </div>
  );
}

function BotBubble({ response }: { response: string }) {
  return (
    <div className="flex justify-start animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="flex gap-2 items-end">
        <div className="bg-gradient-to-tr from-[#ec4899] to-[#a855f7] text-white px-4 py-3 rounded-[18px] rounded-bl-[4px] text-[14px] max-w-[220px] shadow-sm whitespace-pre-wrap leading-relaxed">
          {response || "..."}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-in fade-in duration-300">
      <div className="bg-slate-100 px-4 py-3 rounded-[18px] rounded-bl-[4px] w-fit shadow-sm flex gap-1 items-center h-[38px]">
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
}
