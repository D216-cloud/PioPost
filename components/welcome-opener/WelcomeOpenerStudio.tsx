"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Tag,
  Users,
  Headphones,
  Sparkles,
  Plus,
  X,
  Save,
  ChevronDown,
  Loader2,
  Wand2,
  Check,
  Send,
  MessageSquare,
  Mail,
  Calendar,
  Phone,
  Video,
  ChevronLeft,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
}

interface QuickReplyButton {
  id: string;
  label: string;
  iconName: string;
}

// Available icons for selection when creating a quick reply button
const ICON_OPTIONS = [
  { name: "Tag", label: "Offer/Price", icon: Tag, color: "text-purple-600 bg-purple-50 border-purple-100" },
  { name: "Users", label: "Collab/Partner", icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
  { name: "Headphones", label: "Support/Help", icon: Headphones, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  { name: "Sparkles", label: "Special/AI", icon: Sparkles, color: "text-amber-600 bg-amber-50 border-amber-100" },
  { name: "MessageSquare", label: "Chat/QA", icon: MessageSquare, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  { name: "Mail", label: "Contact/Email", icon: Mail, color: "text-rose-600 bg-rose-50 border-rose-100" },
  { name: "Calendar", label: "Book/Schedule", icon: Calendar, color: "text-pink-600 bg-pink-50 border-pink-100" },
];

const renderIcon = (iconName: string, size = 16, className = "") => {
  switch (iconName) {
    case "Tag": return <Tag size={size} className={className} />;
    case "Users": return <Users size={size} className={className} />;
    case "Headphones": return <Headphones size={size} className={className} />;
    case "Sparkles": return <Sparkles size={size} className={className} />;
    case "MessageSquare": return <MessageSquare size={size} className={className} />;
    case "Mail": return <Mail size={size} className={className} />;
    case "Calendar": return <Calendar size={size} className={className} />;
    default: return <Tag size={size} className={className} />;
  }
};

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
}

export function WelcomeOpenerStudio() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Form States
  const [autoWelcomeEnabled, setAutoWelcomeEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [quickReplies, setQuickReplies] = useState<QuickReplyButton[]>([]);
  const [dbRuleId, setDbRuleId] = useState<string | null>(null);
  
  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [showVariableDropdown, setShowVariableDropdown] = useState(false);
  
  // AI Enhance States
  const [aiTone, setAiTone] = useState("friendly");
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Add Button Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newButtonLabel, setNewButtonLabel] = useState("");
  const [newButtonIcon, setNewButtonIcon] = useState("Tag");

  // Chat Preview States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTypingInPreview, setIsTypingInPreview] = useState(false);
  const [simStep, setSimStep] = useState<"idle" | "bot-typing" | "sent">("sent");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const variableDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (variableDropdownRef.current && !variableDropdownRef.current.contains(event.target as Node)) {
        setShowVariableDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Instagram Accounts
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch("/api/instagram-account");
        const { data } = await res.json();
        const nextAccounts = Array.isArray(data) ? data : [];
        setAccounts(nextAccounts);
        if (nextAccounts.length > 0) {
          setSelectedAccountId(nextAccounts[0].id);
        } else {
          // Fallback mock account for interactive experience
          const mockAccount = { id: "mock-default", username: "your.username" };
          setAccounts([mockAccount]);
          setSelectedAccountId(mockAccount.id);
        }
      } catch (error) {
        console.error("Failed to load accounts:", error);
        // Fallback mock account
        const mockAccount = { id: "mock-default", username: "your.username" };
        setAccounts([mockAccount]);
        setSelectedAccountId(mockAccount.id);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    void loadAccounts();
  }, []);

  // Load Settings from DB when Account Changes
  useEffect(() => {
    if (!selectedAccountId) return;

    const loadSettings = async () => {
      try {
        const res = await fetch(`/api/automation-rules?accountId=${encodeURIComponent(selectedAccountId)}`);
        const { data } = await res.json();
        const rules = Array.isArray(data) ? data : [];
        const openerRule = rules.find((rule: any) => rule.post_id === "welcome_opener" && !rule.deleted);

        if (openerRule) {
          setDbRuleId(openerRule.id);
          setAutoWelcomeEnabled(openerRule.active ?? true);
          setWelcomeMessage(openerRule.dm_message ?? "");
          let parsedQuickReplies = [];
          try {
            parsedQuickReplies = JSON.parse(openerRule.post_caption || "[]");
          } catch (e) {
            console.error("Failed to parse quick replies JSON", e);
          }
          setQuickReplies(parsedQuickReplies);
        } else {
          setDbRuleId(null);
          loadDefaultSettings();
        }
      } catch (e) {
        console.error("Failed to fetch settings from DB", e);
        setDbRuleId(null);
        // Fallback to localStorage as backup
        const saved = localStorage.getItem(`welcome_opener_settings_${selectedAccountId}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setAutoWelcomeEnabled(parsed.autoWelcomeEnabled ?? true);
            setWelcomeMessage(parsed.welcomeMessage ?? "");
            setQuickReplies(parsed.quickReplies ?? []);
          } catch (err) {
            loadDefaultSettings();
          }
        } else {
          loadDefaultSettings();
        }
      }
    };

    void loadSettings();
  }, [selectedAccountId]);

  // Sync Chat Preview Welcome Message
  useEffect(() => {
    if (simStep === "sent") {
      setChatMessages((prev) => {
        const newMsgs = [...prev];
        const botIndex = newMsgs.findIndex((m) => m.id === "welcome-bot");
        if (botIndex !== -1) {
          newMsgs[botIndex] = { ...newMsgs[botIndex], text: getProcessedWelcomeMessage() };
        } else if (newMsgs.length === 0) {
          return [
            {
              id: "welcome-bot",
              sender: "bot",
              text: getProcessedWelcomeMessage(),
              timestamp: new Date(),
            },
          ];
        }
        return newMsgs;
      });
    }
  }, [welcomeMessage, quickReplies, selectedAccountId]);

  const loadDefaultSettings = () => {
    setAutoWelcomeEnabled(true);
    setWelcomeMessage(
      "Hey {{username}}! 👋\nThanks for following! We're excited to have you here.\nHow can we help you today?\nFeel free to choose an option below 👇"
    );
    setQuickReplies([
      { id: "1", label: "Pricing", iconName: "Tag" },
      { id: "2", label: "Collab", iconName: "Users" },
      { id: "3", label: "Support", iconName: "Headphones" },
    ]);
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null;

  // Insert Variable at Cursor
  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const placeholder = `{{${variable}}}`;
    const newText = welcomeMessage.substring(0, start) + placeholder + welcomeMessage.substring(end);
    
    if (newText.length > 500) {
      toast.warning("Variables cannot exceed the 500 character limit.");
      return;
    }

    setWelcomeMessage(newText);
    setShowVariableDropdown(false);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  // AI Enhancement
  const handleAIEnhance = async () => {
    if (!welcomeMessage.trim()) {
      toast.error("Please enter some text to enhance.");
      return;
    }

    setIsEnhancing(true);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: welcomeMessage, tone: aiTone }),
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      if (data.text) {
        if (data.text.length > 500) {
          setWelcomeMessage(data.text.substring(0, 500));
          toast.success(`Enhanced with ${aiTone} tone (truncated to fit 500 limit).`);
        } else {
          setWelcomeMessage(data.text);
          toast.success(`Enhanced message in a ${aiTone} tone!`);
        }
      }
    } catch (error: any) {
      console.error("AI enhancement failed:", error);
      // Premium Fallback Generator if Gemini fails (e.g. key missing/quota)
      setTimeout(() => {
        let enhancedText = "";
        const username = "{{username}}";
        if (aiTone === "professional") {
          enhancedText = `Hello ${username}. Thank you for connecting with us. We are pleased to welcome you to our community.\n\nCould you please let us know how we can assist you today? We would be delighted to provide details on our services.\n\nSelect an option below to proceed:`;
        } else if (aiTone === "excited") {
          enhancedText = `Hey there ${username}! 🎉 Oh my goodness, thank you so much for the follow! We are absolutely THRILLED to have you join us here!\n\nWe've got so many amazing things lined up. What are you looking to crush today?\n\nTap one of the options below and let's go! 👇✨`;
        } else if (aiTone === "creative") {
          enhancedText = `Welcome to our creative bubble, ${username}! 🎨 Gravity doesn't apply here. Thanks for following our journey!\n\nWe're crafting some magic. How would you like to explore with us today?\n\nLet the curiosity begin! Click a button below:`;
        } else if (aiTone === "urgent") {
          enhancedText = `Hi ${username}! ⏳ Thanks for stopping by! We have a quick limited-time event happening right now, and we'd hate for you to miss it!\n\nHow can we speed up your onboarding today?\n\nChoose an option below before it's too late:`;
        } else {
          enhancedText = `Hey ${username}! 😊 Thanks so much for following us! We love connecting with our community.\n\nHow is your week going? Let us know how we can help you out today!\n\nJust tap an option below:`;
        }
        setWelcomeMessage(enhancedText.substring(0, 500));
        toast.info(`AI generated fallback (${aiTone} tone)`);
      }, 600);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Add Quick Reply
  const handleAddQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newButtonLabel.trim();
    if (!label) {
      toast.error("Button label is required");
      return;
    }
    if (label.length > 20) {
      toast.error("Label must be 20 characters or less");
      return;
    }
    if (quickReplies.some((b) => b.label.toLowerCase() === label.toLowerCase())) {
      toast.error("A button with this label already exists");
      return;
    }

    const newBtn: QuickReplyButton = {
      id: `btn-${Date.now()}`,
      label,
      iconName: newButtonIcon,
    };

    setQuickReplies((prev) => [...prev, newBtn]);
    setShowAddModal(false);
    setNewButtonLabel("");
    setNewButtonIcon("Tag");
    toast.success("Quick reply button added!");
  };

  // Remove Quick Reply
  const handleRemoveQuickReply = (id: string) => {
    setQuickReplies((prev) => prev.filter((b) => b.id !== id));
    toast.info("Button removed");
  };

  // Save Settings
  const handleSaveSettings = async () => {
    if (welcomeMessage.length > 500) {
      toast.error("Welcome message cannot exceed 500 characters.");
      return;
    }

    setIsSaving(true);
    try {
      if (dbRuleId) {
        // PATCH update existing rule
        const res = await fetch(`/api/automation-rules?id=${encodeURIComponent(dbRuleId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            active: autoWelcomeEnabled,
            dm_message: welcomeMessage,
            post_caption: JSON.stringify(quickReplies),
          }),
        });
        const { error } = await res.json();
        if (error) throw new Error(error);
        toast.success("Welcome Opener settings updated!");
      } else {
        // POST create new rule
        const res = await fetch("/api/automation-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instagram_account_id: selectedAccountId,
            post_id: "welcome_opener",
            post_type: "WELCOME_OPENER",
            active: autoWelcomeEnabled,
            dm_message: welcomeMessage,
            post_caption: JSON.stringify(quickReplies),
            rule_name: "Welcome Opener Settings",
            keyword_mode: "any",
            keywords: [],
          }),
        });
        const { data, error } = await res.json();
        if (error) throw new Error(error);
        if (data?.id) {
          setDbRuleId(data.id);
        }
        toast.success("Welcome Opener settings saved successfully!");
      }
      // Backup to localStorage
      const payload = {
        autoWelcomeEnabled,
        welcomeMessage,
        quickReplies,
      };
      localStorage.setItem(`welcome_opener_settings_${selectedAccountId}`, JSON.stringify(payload));
    } catch (e: any) {
      console.error("Failed to save settings to DB:", e);
      toast.error(e.message || "Failed to save settings to the database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Render variables in welcome message
  const getProcessedWelcomeMessage = () => {
    if (!welcomeMessage) return "Hi there! Welcome to our DM.";
    return welcomeMessage
      .replace(/{{username}}/g, selectedAccount ? `@${selectedAccount.username}` : "@user")
      .replace(/{{first_name}}/g, "John")
      .replace(/{{full_name}}/g, "John Doe");
  };

  // Reset chat preview
  const resetChat = () => {
    setSimStep("sent");
    setIsTypingInPreview(false);
    setChatMessages([
      {
        id: "welcome-bot",
        sender: "bot",
        text: getProcessedWelcomeMessage(),
        timestamp: new Date(),
      },
    ]);
  };

  const handleSimulateFollow = () => {
    // Clear chat
    setChatMessages([]);
    setSimStep("idle");
    setIsTypingInPreview(false);

    // After 0.5s, show "bot typing"
    setTimeout(() => {
      setSimStep("bot-typing");
      setIsTypingInPreview(true);

      // After 1.5s, send welcome message
      setTimeout(() => {
        setIsTypingInPreview(false);
        setSimStep("sent");
        setChatMessages([
          {
            id: "welcome-bot",
            sender: "bot",
            text: getProcessedWelcomeMessage(),
            timestamp: new Date(),
          },
        ]);
      }, 1500);
    }, 500);
  };

  // Handle Quick Reply Click in simulator
  const handleQuickReplyClick = (button: QuickReplyButton) => {
    // Prevent duplicate triggers if bot is typing
    if (isTypingInPreview) return;

    // Add user response bubble
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: button.label,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsTypingInPreview(true);

    // Simulate bot response after a delay
    setTimeout(() => {
      let botResponse = "";
      switch (button.label.toLowerCase()) {
        case "pricing":
          botResponse = "💰 Here is our pricing structure! We have the Starter plan for beginners, and the Pro plan for scaling creators. Check the pricing section in the sidebar to learn more!";
          break;
        case "collab":
          botResponse = "🤝 Awesome! We love partnerships. Drop us your media kit or email us at collab@reelflow.ai, and we will get back to you soon!";
          break;
        case "support":
          botResponse = "🎧 Our support team is online! Describe your issue or query, and our agent will jump into this chat in just a few minutes.";
          break;
        default:
          botResponse = `✨ Thanks for your interest in "${button.label}"! Our automated system is logging this, and a team member will reply to you directly in a bit.`;
      }

      const replyMsg: ChatMessage = {
        id: `bot-reply-${Date.now()}`,
        sender: "bot",
        text: botResponse,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, replyMsg]);
      setIsTypingInPreview(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-100/40 blur-[150px]" />
        <div className="absolute top-[40%] -left-60 h-[500px] w-[500px] rounded-full bg-purple-100/30 blur-[130px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-16">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10 pb-6 border-b border-slate-200/50">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Welcome Opener Settings
            </h1>
            <p className="text-slate-500 text-[14.5px] mt-1 font-medium">
              Automatically send a welcome message to new followers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[12.5px] font-bold text-slate-400 uppercase tracking-wider">
              Instagram Account:
            </span>
            {isLoadingAccounts ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200">
                <Loader2 size={14} className="animate-spin text-slate-400" />
                <span className="text-sm font-semibold text-slate-500">Loading...</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedAccountId ?? ""}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    resetChat();
                  }}
                  className="appearance-none h-11 pr-10 pl-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-w-[200px]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      @{acc.username}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout: Controls & Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Configuration Forms */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-6 md:p-8 space-y-8">
              
              {/* 1. Toggle Switch section */}
              <div className="flex items-start justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1.5">
                  <h3 className="text-[16px] font-bold text-slate-900">Auto-Welcome DM</h3>
                  <p className="text-[13px] text-slate-400 font-medium">
                    Send a welcome message automatically when someone follows you.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-[12.5px] font-bold uppercase tracking-wider transition-colors ${autoWelcomeEnabled ? "text-purple-600" : "text-slate-400"}`}>
                    {autoWelcomeEnabled ? "ON" : "OFF"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoWelcomeEnabled(!autoWelcomeEnabled)}
                    className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      autoWelcomeEnabled ? "bg-purple-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        autoWelcomeEnabled ? "translate-x-5.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 2. Welcome Message Textarea */}
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-[16px] font-bold text-slate-900">Welcome Message</h3>
                    <p className="text-[13px] text-slate-400 font-medium">
                      This message will be sent as a DM to new followers.
                    </p>
                  </div>

                  {/* Variable Dropdown */}
                  <div className="relative" ref={variableDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowVariableDropdown(!showVariableDropdown)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-100/50"
                    >
                      <span>{`{ }`} Insert Variable</span>
                      <ChevronDown size={13} className={`transition-transform ${showVariableDropdown ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {showVariableDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden py-1.5"
                        >
                          <button
                            type="button"
                            onClick={() => insertVariable("username")}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between"
                          >
                            <span>Username</span>
                            <span className="text-[10px] text-slate-400 font-mono">{"{{username}}"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertVariable("first_name")}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between"
                          >
                            <span>First Name</span>
                            <span className="text-[10px] text-slate-400 font-mono">{"{{first_name}}"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertVariable("full_name")}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between"
                          >
                            <span>Full Name</span>
                            <span className="text-[10px] text-slate-400 font-mono">{"{{full_name}}"}</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Message Textarea Container */}
                <div className="relative rounded-2xl border border-slate-200 focus-within:border-purple-400 focus-within:ring-3 focus-within:ring-purple-100 bg-slate-50/30 transition-all p-4">
                  <textarea
                    ref={textareaRef}
                    value={welcomeMessage}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setWelcomeMessage(e.target.value);
                      }
                    }}
                    placeholder="Write your welcome message..."
                    className="w-full min-h-[140px] resize-none outline-none border-none bg-transparent text-[14.5px] leading-relaxed text-slate-700"
                    maxLength={500}
                  />

                  {/* Character limit and Grammarly/AI Mock Indicator */}
                  <div className="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-slate-100 text-slate-400">
                    <span className={`text-xs font-semibold ${welcomeMessage.length >= 480 ? "text-rose-500" : ""}`}>
                      {welcomeMessage.length}/500
                    </span>
                    <div 
                      className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-600 font-bold cursor-help"
                      title="AI check active"
                    >
                      G
                    </div>
                  </div>
                </div>

                {/* AI Assist Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-500" />
                    <span className="text-xs font-bold text-slate-600">AI Assist:</span>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 outline-none cursor-pointer"
                    >
                      <option value="friendly">😊 Friendly</option>
                      <option value="professional">💼 Professional</option>
                      <option value="creative">🎨 Creative</option>
                      <option value="excited">🎉 Excited</option>
                      <option value="urgent">⏳ Urgent</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAIEnhance}
                    disabled={isEnhancing || !welcomeMessage.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:border-purple-300 hover:text-purple-600 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                  >
                    {isEnhancing ? (
                      <>
                        <Loader2 size={12} className="animate-spin text-purple-500" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Wand2 size={12} className="text-purple-500" />
                        AI Rewrite
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3. Quick Reply Buttons Grid */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-[16px] font-bold text-slate-900">Quick Reply Buttons</h3>
                    <p className="text-[13px] text-slate-400 font-medium">
                      Add quick reply buttons to make it easy for users to respond.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-purple-200 hover:bg-purple-50 text-purple-600 text-[13px] font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Plus size={14} />
                    Add Button
                  </button>
                </div>

                {quickReplies.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs font-semibold text-slate-400">No quick reply buttons added yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <AnimatePresence mode="popLayout">
                      {quickReplies.map((btn) => (
                        <motion.div
                          key={btn.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-purple-200 bg-white hover:border-purple-300 hover:bg-slate-50/50 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-colors group relative"
                        >
                          {renderIcon(btn.iconName, 14, "text-purple-500")}
                          <span className="text-[13px] font-semibold text-slate-700">{btn.label}</span>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveQuickReply(btn.id)}
                            className="w-5 h-5 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                            title="Remove button"
                          >
                            <X size={10} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Controls */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(124,58,237,0.25)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Settings
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Column: Live Instagram DM Phone Mockup */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[340px] aspect-[9/19.5] bg-slate-900 rounded-[50px] p-3 shadow-2xl relative border-4 border-slate-800">
              
              {/* iPhone camera island */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800 ml-10" />
              </div>

              {/* iPhone screen area */}
              <div className="w-full h-full bg-white rounded-[40px] overflow-hidden flex flex-col relative select-none">
                
                {/* Instagram Message App Header */}
                <div className="pt-8 pb-3 px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <ChevronLeft size={20} className="text-slate-700 cursor-pointer" />
                    
                    <div className="relative">
                      {selectedAccount?.profile_picture_url ? (
                        <img
                          src={selectedAccount.profile_picture_url}
                          alt="preview avatar"
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[11px] font-black">
                          {selectedAccount?.username.charAt(0).toUpperCase() || "I"}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>

                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800 max-w-[130px] truncate leading-tight">
                        @{selectedAccount?.username || "your.username"}
                      </p>
                      <span className="text-[9px] text-slate-400 font-bold block leading-none">Active now</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone size={14} />
                    <Video size={15} />
                  </div>
                </div>

                {/* Message Body Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col no-scrollbar bg-slate-50/20">
                  
                  {/* Informational Hint */}
                  <div className="bg-slate-100/60 rounded-xl p-2.5 text-center text-[10px] text-slate-400 font-semibold leading-relaxed border border-slate-200/50">
                    ℹ️ Tapping quick reply buttons simulates a live DM webhook response.
                  </div>

                  {simStep !== "sent" && simStep !== "bot-typing" && chatMessages.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center p-4 bg-white/50 rounded-2xl border border-slate-100">
                        <Users size={24} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold text-slate-400">Waiting for a new follower...</p>
                      </div>
                    </div>
                  )}

                  {(simStep === "bot-typing" || simStep === "sent") && (
                    <div className="text-center py-2">
                      <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500">
                        👤 @user started following you
                      </span>
                    </div>
                  )}

                  {chatMessages.map((msg) => {
                    const isBot = msg.sender === "bot";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] ${isBot ? "self-start items-start" : "self-end items-end"}`}
                      >
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                            isBot
                              ? "bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                              : "bg-linear-to-br from-purple-600 to-indigo-600 text-white rounded-tr-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-left">{msg.text}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold mt-1 px-1">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}

                  {/* Typing Simulator */}
                  {isTypingInPreview && (
                    <div className="self-start bg-white text-slate-400 rounded-2xl rounded-tl-sm border border-slate-100 px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Reply Drawer (only shown if bot sent the last message) */}
                {simStep === "sent" && chatMessages[chatMessages.length - 1]?.sender === "bot" && (
                  <div className="px-3 py-2 border-t border-slate-50 bg-white/95 backdrop-blur-xs flex flex-wrap gap-2 justify-center shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                    {quickReplies.map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => handleQuickReplyClick(btn)}
                        disabled={isTypingInPreview}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-100 bg-purple-50/50 hover:bg-purple-100 text-purple-600 text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer active:scale-95 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                      >
                        {renderIcon(btn.iconName, 11, "text-purple-500")}
                        <span>{btn.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Mock Chat input */}
                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex-1 bg-slate-100 rounded-full h-9 px-4 flex items-center justify-between text-slate-400 text-xs">
                    <span>Message...</span>
                    <Send size={12} className="text-slate-400" />
                  </div>
                  
                  {/* Simulate Follow trigger */}
                  <button
                    type="button"
                    onClick={handleSimulateFollow}
                    className="ml-2 px-3 h-9 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-600 flex items-center justify-center transition-colors cursor-pointer text-[11px] font-bold whitespace-nowrap"
                    title="Simulate New Follower"
                  >
                    <Plus size={12} className="mr-1" />
                    Simulate Follow
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>

      {/* 4. Center Dialog Modal: Add Button Form */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-[24px] border border-slate-200/80 w-full max-w-md shadow-2xl p-6 relative z-10 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <h3 className="text-lg font-bold text-slate-900 mb-1">Add Quick Reply Button</h3>
              <p className="text-xs text-slate-400 font-semibold mb-6">Create a quick interaction button for users.</p>

              <form onSubmit={handleAddQuickReply} className="space-y-5">
                {/* Button Label Input */}
                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-bold text-slate-600">Button Label</label>
                  <input
                    type="text"
                    required
                    value={newButtonLabel}
                    onChange={(e) => setNewButtonLabel(e.target.value.substring(0, 20))}
                    placeholder="e.g. Portfolio"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-purple-400 outline-none text-[13.5px] font-semibold text-slate-700 transition-all"
                    maxLength={20}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1">
                    <span>Appears as button text</span>
                    <span>{newButtonLabel.length}/20</span>
                  </div>
                </div>

                {/* Icon Selection */}
                <div className="space-y-2">
                  <label className="text-[12.5px] font-bold text-slate-600">Choose Icon</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ICON_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = newButtonIcon === opt.name;
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => setNewButtonIcon(opt.name)}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                            active
                              ? "border-purple-500 bg-purple-50/50 shadow-xs ring-2 ring-purple-100"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                          title={opt.label}
                        >
                          <Icon size={18} className={active ? "text-purple-600" : "text-slate-400"} />
                          <span className={`text-[9px] font-bold mt-1 truncate max-w-full ${active ? "text-purple-700" : "text-slate-400"}`}>
                            {opt.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(124,58,237,0.15)] transition-all cursor-pointer"
                  >
                    Add Button
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
