"use client";
/* eslint-disable react-hooks/purity */

import React, { useState, useEffect, useRef } from "react";
import {
  Workflow,
  Sparkles,
  Plus,
  Save,
  ChevronDown,
  Loader2,
  Wand2,
  Check,
  Send,
  Phone,
  Video,
  ChevronLeft,
  Activity,
  Trash2,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
}

interface WelcomeFlowButton {
  id: string;
  title: string;
  payload: string;
  response: string;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
}

export function WelcomeFlowStudio() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Form States
  const [enabled, setEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [buttons, setButtons] = useState<WelcomeFlowButton[]>([]);
  const [dbRuleId, setDbRuleId] = useState<string | null>(null);
  
  // Stats States
  const [totalDmsSent, setTotalDmsSent] = useState(0);
  const [executions, setExecutions] = useState(0);
  const [lastExecution, setLastExecution] = useState<string | null>(null);

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [showVariableDropdown, setShowVariableDropdown] = useState(false);
  
  // AI Enhance States
  const [aiTone, setAiTone] = useState("friendly");
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Chat Preview States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTypingInPreview, setIsTypingInPreview] = useState(false);
  const [simStep, setSimStep] = useState<"idle" | "bot-typing" | "sent">("sent");
  const [simLogs, setSimLogs] = useState<{ emoji: string; text: string; time: string }[]>([]);
  const [liveLogs, setLiveLogs] = useState<{ emoji: string; text: string; time: string }[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const variableDropdownRef = useRef<HTMLDivElement>(null);

  const loadDefaultSettings = () => {
    setEnabled(true);
    setWelcomeMessage(
      "Hey {{username}}! 👋\nThanks for stopping by! We're excited to have you here.\n\nChoose an option below to get started!"
    );
    setButtons([
      { id: "1", title: "Pricing", payload: "welcome_flow_click:pricing", response: "💰 Our plans start from just $9/month! Let me know if you would like a link to our plans page." },
      { id: "2", title: "Services", payload: "welcome_flow_click:services", response: "🚀 We provide Instagram automation, lead generation, and scheduling tools." },
      { id: "3", title: "Book Demo", payload: "welcome_flow_click:book_demo", response: "📅 Great! Click this link to schedule a 15-minute live demo with our team: reelflow.ai/demo" }
    ]);
    setTotalDmsSent(0);
    setExecutions(0);
    setLastExecution(null);
    setLiveLogs([]);
    setChatMessages([
      {
        id: "welcome-bot",
        sender: "bot",
        text: "", // replaced dynamically during render
        timestamp: new Date(),
      },
    ]);
  };

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
        const res = await fetch(`/api/welcome-flow?accountId=${encodeURIComponent(selectedAccountId)}`);
        const { data } = await res.json();

        if (data) {
          setDbRuleId(data.id);
          setEnabled(data.enabled ?? false);
          setWelcomeMessage(data.welcome_message ?? "");
          setButtons(Array.isArray(data.buttons) ? data.buttons : []);
          setTotalDmsSent(data.total_dms_sent ?? 0);
          setExecutions(data.executions ?? 0);
          setLastExecution(data.last_execution ?? null);
          setLiveLogs([]);
          setChatMessages([
            {
              id: "welcome-bot",
              sender: "bot",
              text: "", // replaced dynamically during render
              timestamp: new Date(),
            },
          ]);
        } else {
          setDbRuleId(null);
          loadDefaultSettings();
        }
      } catch (e) {
        console.error("Failed to fetch settings from DB", e);
        setDbRuleId(null);
        loadDefaultSettings();
      }
    };

    void loadSettings();
  }, [selectedAccountId]);

  // Fetch real-time logs from DB if dbRuleId exists
  useEffect(() => {
    if (!dbRuleId || selectedAccountId === "mock-default") {
      return;
    }

    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/automation-logs?automationId=${encodeURIComponent(dbRuleId)}&limit=15`);
        const { data } = await res.json();
        if (Array.isArray(data)) {
          const sortedData = [...data].reverse();
          const mappedLogs = sortedData.flatMap((log) => {
            const time = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            if (log.comment_text.startsWith("[Button Click] - ")) {
              const buttonLabel = log.comment_text.replace("[Button Click] - ", "");
              return [
                {
                  emoji: "🖱",
                  text: `User clicked button: "${buttonLabel}"`,
                  time,
                },
                {
                  emoji: "📤",
                  text: `Sending response for "${buttonLabel}"...`,
                  time,
                },
                {
                  emoji: log.dm_sent ? "✅" : "❌",
                  text: log.dm_sent ? `Response for "${buttonLabel}" sent!` : `Failed to send response: ${log.error_message || "Unknown error"}`,
                  time,
                }
              ];
            } else {
              const btnNames = buttons.map((b) => b.title).join(" | ");
              const steps = [
                {
                  emoji: "⚙️",
                  text: "Welcome Flow status: ACTIVE ✅",
                  time,
                },
                {
                  emoji: "👤",
                  text: `@user started following you / sent first DM`,
                  time,
                },
                {
                  emoji: "📋",
                  text: `Message: "${(welcomeMessage || "").substring(0, 60)}..."`,
                  time,
                },
                {
                  emoji: "🧩",
                  text: `Buttons: ${btnNames || "(none)"}`,
                  time,
                },
                {
                  emoji: "📤",
                  text: "Sending welcome text message...",
                  time,
                },
                {
                  emoji: log.dm_sent ? "✅" : "❌",
                  text: log.dm_sent ? "Welcome message sent successfully!" : `Failed to send welcome message: ${log.error_message || "Unknown error"}`,
                  time,
                }
              ];
              
              if (log.dm_sent && buttons.length > 0) {
                steps.push({
                  emoji: "📤",
                  text: `Sending quick reply buttons: ${btnNames}`,
                  time,
                });
                steps.push({
                  emoji: "✅",
                  text: "Quick reply buttons sent!",
                  time,
                });
                steps.push({
                  emoji: "🏁",
                  text: "Welcome Flow complete!",
                  time,
                });
              }
              return steps;
            }
          });
          setLiveLogs(mappedLogs);
        }
      } catch (err) {
        console.error("Error fetching live logs:", err);
      }
    };

    void fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [dbRuleId, selectedAccountId, welcomeMessage, buttons]);



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
    } catch (error: unknown) {
      console.error("AI enhancement failed:", error);
      setTimeout(() => {
        let enhancedText = "";
        const username = "{{username}}";
        if (aiTone === "professional") {
          enhancedText = `Hello ${username}. Thank you for connecting with us. We are pleased to welcome you to our community.\n\nCould you please let us know how we can assist you today?\n\nSelect an option below to proceed:`;
        } else if (aiTone === "excited") {
          enhancedText = `Hey there ${username}! 🎉 Oh my goodness, thank you so much for reaching out! We are absolutely THRILLED to have you here!\n\nTap one of the options below and let's get rolling! 👇✨`;
        } else if (aiTone === "creative") {
          enhancedText = `Welcome to our space, ${username}! 🎨 Thanks for starting this conversation!\n\nWe're crafting some magic. How would you like to explore with us today?\n\nClick a button below:`;
        } else if (aiTone === "urgent") {
          enhancedText = `Hi ${username}! ⏳ Thanks for stopping by! We have a quick limited-time event happening right now!\n\nChoose an option below to secure your spot:`;
        } else {
          enhancedText = `Hey ${username}! 😊 Thanks so much for messaging us! We love connecting with our community.\n\nLet us know how we can help you out today!\n\nJust tap an option below:`;
        }
        setWelcomeMessage(enhancedText.substring(0, 500));
        toast.info(`AI generated fallback (${aiTone} tone)`);
      }, 600);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Add welcome flow button
  const handleAddButton = () => {
    if (buttons.length >= 10) {
      toast.error("Instagram allows a maximum of 10 quick replies.");
      return;
    }

    const defaultTitle = `Option ${buttons.length + 1}`;
    const slug = defaultTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newBtn: WelcomeFlowButton = {
      id: `btn-${Date.now()}`,
      title: defaultTitle,
      payload: `welcome_flow_click:${slug}`,
      response: "Enter a custom response for this button."
    };

    setButtons((prev) => [...prev, newBtn]);
    toast.success("New button added! Customize it below.");
  };

  // Update button details
  const handleUpdateButton = (id: string, updates: Partial<WelcomeFlowButton>) => {
    setButtons((prev) =>
      prev.map((btn) => {
        if (btn.id === id) {
          const updated = { ...btn, ...updates };
          // If title was updated, auto-generate payload
          if (updates.title !== undefined) {
            const cleanSlug = updates.title
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '_')
              .substring(0, 30);
            updated.payload = `welcome_flow_click:${cleanSlug}`;
          }
          return updated;
        }
        return btn;
      })
    );
  };

  // Remove Button
  const handleRemoveButton = (id: string) => {
    setButtons((prev) => prev.filter((b) => b.id !== id));
    toast.info("Button removed");
  };

  // Save Settings
  const handleSaveSettings = async () => {
    if (!selectedAccountId) {
      toast.error("Please select an Instagram account first.");
      return;
    }
    if (selectedAccountId === "mock-default") {
      toast.error("Please connect a real Instagram account before saving.");
      return;
    }
    if (welcomeMessage.length > 500) {
      toast.error("Welcome message cannot exceed 500 characters.");
      return;
    }
    
    // Check if any button has an empty title or response
    const emptyBtn = buttons.find((b) => !b.title.trim() || !b.response.trim());
    if (emptyBtn) {
      toast.error("All buttons must have a title and custom response.");
      return;
    }

    setIsSaving(true);
    try {
      if (dbRuleId) {
        // PATCH update existing settings
        const res = await fetch(`/api/welcome-flow?accountId=${encodeURIComponent(selectedAccountId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: enabled,
            welcome_message: welcomeMessage,
            buttons: buttons,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Server error ${res.status}`);
        }
        const result = await res.json().catch(() => ({}));
        if (result.error) throw new Error(typeof result.error === "string" ? result.error : JSON.stringify(result.error));
        toast.success("Welcome Flow settings updated!");
      } else {
        // POST create new settings
        const res = await fetch("/api/welcome-flow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instagram_account_id: selectedAccountId,
            enabled: enabled,
            welcome_message: welcomeMessage,
            buttons: buttons,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Server error ${res.status}`);
        }
        const result = await res.json().catch(() => ({}));
        if (result.error) throw new Error(typeof result.error === "string" ? result.error : JSON.stringify(result.error));
        if (result.data?.id) {
          setDbRuleId(result.data.id);
        }
        toast.success("Welcome Flow settings saved successfully!");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Failed to save settings to DB:", msg);
      toast.error(msg || "Failed to save settings to the database.");
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

  const addLog = (emoji: string, text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSimLogs((prev) => [...prev, { emoji, text, time }]);
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleSimulateFollow = () => {
    setChatMessages([]);
    setSimStep("idle");
    setIsTypingInPreview(false);
    setSimLogs([]);

    const btnNames = buttons.map((b) => b.title).join(" | ");

    setTimeout(() => {
      if (!enabled) {
        addLog("⚙️", "Welcome Flow status: OFF ❌");
        addLog("⏹", "Welcome flow is disabled. No message sent.");
        return;
      }
      addLog("⚙️", "Welcome Flow status: ACTIVE ✅");

      setTimeout(() => {
        addLog("👤", "@user started following / sent first message");
        addLog("📋", `Message: "${(welcomeMessage || "").substring(0, 50)}..."`);
        addLog("🧩", `Buttons: ${btnNames || "(none)"}`);
        setSimStep("bot-typing");
        setIsTypingInPreview(true);

        setTimeout(() => {
          addLog("📤", "Sending welcome text message...");

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
            addLog("✅", "Welcome message sent successfully!");

            if (buttons.length > 0) {
              setTimeout(() => {
                addLog("📤", `Sending quick reply buttons: ${btnNames}`);
                setTimeout(() => {
                  addLog("✅", "Quick reply buttons sent!");
                  addLog("🏁", "Welcome Flow completed! Waiting for clicks...");
                }, 400);
              }, 300);
            } else {
              addLog("🏁", "Welcome Flow completed!");
            }
          }, 800);
        }, 500);
      }, 400);
    }, 300);
  };

  // Handle Quick Reply Click in simulator
  const handleQuickReplyClick = (button: WelcomeFlowButton) => {
    if (isTypingInPreview) return;

    addLog("🖱", `User clicked button: "${button.title}"`);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: button.title,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsTypingInPreview(true);
    addLog("📤", `Sending response for "${button.title}"...`);

    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `bot-reply-${Date.now()}`,
        sender: "bot",
        text: button.response || `Response to "${button.title}"`,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, replyMsg]);
      setIsTypingInPreview(false);
      addLog("✅", `Response for "${button.title}" sent!`);
    }, 1200);
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 pb-6 border-b border-slate-200/50">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Workflow className="text-purple-600 w-8 h-8" />
              Welcome Flow Builder
            </h1>
            <p className="text-slate-500 text-[14.5px] mt-1 font-medium">
              Create a custom greeting flow with buttons and interactive auto-responses.
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

        {/* Statistics Bar */}
        {selectedAccountId !== "mock-default" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <Send size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total DMs Sent</p>
                <p className="text-2xl font-bold text-slate-800">{totalDmsSent}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Executions</p>
                <p className="text-2xl font-bold text-slate-800">{executions}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Check size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Triggered</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">
                  {lastExecution ? new Date(lastExecution).toLocaleString() : "Never"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout: Controls & Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Configuration Forms */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-6 md:p-8 space-y-8">
              
              {/* 1. Toggle Switch section */}
              <div className="flex items-start justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1.5">
                  <h3 className="text-[16px] font-bold text-slate-900">Enable Welcome Flow</h3>
                  <p className="text-[13px] text-slate-400 font-medium">
                    Send this flow automatically when a user opens a DM with your account.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-[12.5px] font-bold uppercase tracking-wider transition-colors ${enabled ? "text-purple-600" : "text-slate-400"}`}>
                    {enabled ? "ON" : "OFF"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnabled(!enabled)}
                    className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      enabled ? "bg-purple-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        enabled ? "translate-x-5.5" : "translate-x-0"
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
                      The initial text message containing variables.
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
                    className="w-full min-h-[120px] resize-none outline-none border-none bg-transparent text-[14.5px] leading-relaxed text-slate-700"
                    maxLength={500}
                  />

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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:border-purple-300 hover:text-purple-600 disabled:opacity-50 rounded-lg transition-colors shadow-xs cursor-pointer"
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

              {/* 3. Welcome Flow Buttons Grid & Editor */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-[16px] font-bold text-slate-900">Flow Buttons & Responses</h3>
                    <p className="text-[13px] text-slate-400 font-medium">
                      Configure quick replies and their instant automated response text (Max 10).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddButton}
                    disabled={buttons.length >= 10}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-purple-200 hover:bg-purple-50 disabled:opacity-55 disabled:hover:bg-transparent text-purple-600 text-[13px] font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Plus size={14} />
                    Add Button
                  </button>
                </div>

                {buttons.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs font-semibold text-slate-400">No buttons configured. Welcome Flow will send text only.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {buttons.map((btn, idx) => (
                        <motion.div
                          key={btn.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/20 shadow-[0_1px_3px_rgba(0,0,0,0.01)] hover:border-slate-300 transition-colors space-y-3 relative group"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-slate-400 uppercase">
                              Button #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveButton(btn.id)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                              title="Delete Button"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Button Title */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Button Label (Max 20 chars)
                              </label>
                              <input
                                type="text"
                                value={btn.title}
                                onChange={(e) => handleUpdateButton(btn.id, { title: e.target.value.substring(0, 20) })}
                                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white outline-none focus:border-purple-400 text-[13px] font-semibold text-slate-700 transition-all"
                                placeholder="e.g. Services"
                                maxLength={20}
                              />
                            </div>

                            {/* Payload (Read-only, derived) */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                Payload
                                <span className="cursor-help" title="Automatically matches click inside Instagram webhook">
                                  <Info size={10} className="text-slate-300" />
                                </span>
                              </label>
                              <div className="w-full h-10 px-3 rounded-lg border border-slate-200/60 bg-slate-100 flex items-center text-[11px] font-mono text-slate-500 overflow-x-auto whitespace-nowrap">
                                {btn.payload}
                              </div>
                            </div>
                          </div>

                          {/* Custom Response Textarea */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              Automated DM Reply Content
                            </label>
                            <textarea
                              value={btn.response}
                              onChange={(e) => handleUpdateButton(btn.id, { response: e.target.value })}
                              className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 bg-white outline-none focus:border-purple-400 text-[13px] leading-relaxed text-slate-700 transition-all resize-none"
                              placeholder="Enter message sent when button clicked..."
                            />
                          </div>
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
                        <Workflow size={24} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold text-slate-400">Waiting for a follow or DM...</p>
                      </div>
                    </div>
                  )}

                  {(simStep === "bot-typing" || simStep === "sent") && (
                    <div className="text-center py-2">
                      <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500">
                        👤 @user started a new conversation
                      </span>
                    </div>
                  )}

                  {chatMessages.map((msg) => {
                    const isBot = msg.sender === "bot";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${isBot ? "self-start items-start" : "self-end items-end"}`}
                      >
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                            isBot
                              ? "bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                              : "bg-linear-to-br from-purple-600 to-indigo-600 text-white rounded-tr-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-left">{msg.id === "welcome-bot" ? getProcessedWelcomeMessage() : msg.text}</p>
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
                    {buttons.map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => handleQuickReplyClick(btn)}
                        disabled={isTypingInPreview}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-100 bg-purple-50/50 hover:bg-purple-100 text-purple-600 text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer active:scale-95 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                      >
                        <span>{btn.title}</span>
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
                    title="Simulate Welcome Flow Trigger"
                  >
                    <Plus size={12} className="mr-1" />
                    Simulate
                  </button>
                </div>

              </div>

            </div>

            {/* Live Activity Log Panel */}
            <div className="w-full max-w-[340px] mt-4">
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-700">Live Activity Log</span>
                  </div>
                  {selectedAccountId === "mock-default" && (
                    <button
                      type="button"
                      onClick={() => setSimLogs([])}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="max-h-[180px] overflow-y-auto p-3 space-y-1.5 no-scrollbar bg-slate-50/50">
                  {selectedAccountId === "mock-default" ? (
                    simLogs.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-3 font-medium">Click &quot;Simulate&quot; to see real-time preview logs</p>
                    ) : (
                      simLogs.map((log, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px]">
                          <span className="shrink-0">{log.emoji}</span>
                          <span className="text-slate-600 font-medium flex-1">{log.text}</span>
                          <span className="text-[9px] text-slate-400 font-mono shrink-0">{log.time}</span>
                        </div>
                      ))
                    )
                  ) : (
                    liveLogs.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-3 font-medium">No live activity logged yet. Send a DM to your connected account to trigger.</p>
                    ) : (
                      liveLogs.map((log, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px]">
                          <span className="shrink-0">{log.emoji}</span>
                          <span className="text-slate-600 font-medium flex-1">{log.text}</span>
                          <span className="text-[9px] text-slate-400 font-mono shrink-0">{log.time}</span>
                        </div>
                      ))
                    )
                  )}
                  <div ref={logEndRef} />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
