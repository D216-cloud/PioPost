"use client";

import { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Lock, 
  ShieldCheck, 
  CreditCard,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  LogOut,
  ChevronRight,
  X
} from "lucide-react";
import { InstagramIcon as Instagram } from "@/components/icons";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

type ViewState = "loading" | "not_connected" | "success" | "settings";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [instagramAccount, setInstagramAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState("");

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchInstagram = async () => {
      try {
        const res = await fetch("/api/instagram-account");
        const { data } = await res.json();
        
        setInstagramAccount(data);
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
          setViewState("success");
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        } else if (!data) {
          setViewState("not_connected");
        } else {
          setViewState("settings");
        }
      } catch (err) {
        console.error("Failed to fetch instagram account:", err);
        setViewState("not_connected");
      } finally {
        setLoading(false);
      }
    };

    fetchInstagram();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('instagram_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instagram_accounts',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setInstagramAccount(null);
            setViewState("not_connected");
          } else {
            setInstagramAccount(payload.new);
            if (payload.eventType === 'INSERT') {
              setViewState("success");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const connectInstagram = async () => {
    setIsConnecting(true);
    setConnectionStep("Redirecting to Instagram...");
    window.location.href = "/api/auth/instagram/link";
  };

  const disconnectInstagram = async () => {
    if (!session?.user?.id) return;
    
    const { error } = await supabase
      .from("instagram_accounts")
      .delete()
      .eq("user_id", session.user.id);

    if (error) {
      toast.error("Failed to disconnect account");
      return;
    }

    setInstagramAccount(null);
    setViewState("not_connected");
    toast.success("Instagram account disconnected");
  };

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-[#2563EB] rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse text-sm">Initializing settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen overflow-y-auto bg-slate-50/50 pt-24 md:pt-20">
      <div className="w-[95%] md:max-w-5xl mx-auto px-4 md:px-8 pb-20">
        <AnimatePresence mode="wait">
          {/* STEP 1: NOT CONNECTED */}
          {viewState === "not_connected" && (
            <motion.div 
              key="not_connected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
            >
              <div className="text-center space-y-3">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                  Connect Your <span className="text-transparent bg-clip-text bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">Instagram</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-md mx-auto">
                  Automate your content strategy and reach more people by linking your professional account.
                </p>
              </div>

              <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" />
                
                <div className="flex flex-col items-center space-y-8">
                  <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[2px]">
                    <div className="w-full h-full rounded-[1.9rem] bg-white flex items-center justify-center">
                      <Instagram size={48} className="text-[#ee2a7b]" />
                    </div>
                  </div>

                  <div className="space-y-2 text-center">
                    <h3 className="text-xl font-bold text-slate-900">Instagram Business</h3>
                    <p className="text-slate-400 text-sm font-medium">Standard professional connection</p>
                  </div>

                  <button 
                    onClick={connectInstagram}
                    disabled={isConnecting}
                    className="w-full group relative flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all active:scale-[0.98] disabled:opacity-70"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Instagram size={24} />
                        <span>Link Account</span>
                        <ArrowRight size={20} className="absolute right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SUCCESS MODAL/CARD (MATCHING IMAGE) */}
          {viewState === "success" && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center min-h-[70vh] p-4"
            >
              <div className="bg-white w-full max-w-[420px] rounded-[3rem] p-10 shadow-[0_30px_70px_rgba(0,0,0,0.1)] text-center space-y-10 border border-slate-50 relative">
                {/* Checkmark Icon */}
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-[#4ADE80] rounded-full flex items-center justify-center shadow-2xl shadow-emerald-200 border-[8px] border-white ring-1 ring-slate-100">
                    <CheckCircle2 size={42} className="text-white" strokeWidth={3} />
                  </div>
                </div>
                
                <div className="space-y-10">
                  <h2 className="text-[28px] font-bold text-slate-900 tracking-tight leading-[1.2] px-2">
                    Account reconnected successfully!
                  </h2>

                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-14 h-14 rounded-full overflow-hidden ring-4 ring-slate-50 shadow-sm bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                        {instagramAccount?.profile_picture_url || instagramAccount?.username ? (
                          <img 
                            src={instagramAccount?.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${instagramAccount.username}`} 
                            alt="avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : "IG"}
                      </div>
                      <div>
                        <p className="text-[17px] font-bold text-slate-900 leading-tight mb-0.5">
                          {instagramAccount?.username || 'Connected Account'}
                        </p>
                        <p className="text-[13px] text-slate-400 font-semibold tracking-tight">
                          {instagramAccount ? "Account ready" : "Synchronizing..."}
                        </p>
                      </div>
                    </div>
                    <div className="w-7 h-7 bg-[#4ADE80] rounded-full flex items-center justify-center shadow-sm">
                      <CheckCircle2 size={16} className="text-white" strokeWidth={3} />
                    </div>
                  </div>

                  <button 
                    onClick={() => setViewState("settings")}
                    className="w-full py-5 border border-slate-200 rounded-[2rem] text-[16px] font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
                  >
                    Continue
                    <ChevronRight size={18} className="text-slate-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: FULL SETTINGS */}
          {viewState === "settings" && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1.5">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
                  <p className="text-slate-500 font-medium">Manage your personal details and app integrations.</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                   <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     Live Status
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                {/* Sidebar Navigation */}
                <nav className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 gap-2 md:gap-2 no-scrollbar">
                  {[
                    { label: "Overview", icon: SettingsIcon, active: true },
                    { label: "Connections", icon: ShieldCheck },
                    { label: "Profile", icon: User },
                    { label: "Billing", icon: CreditCard },
                    { label: "Notifications", icon: Bell },
                    { label: "Security", icon: Lock },
                  ].map(item => (
                    <button 
                      key={item.label}
                      className={`whitespace-nowrap flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[14px] font-bold transition-all ${item.active ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </button>
                  ))}
                </nav>

                <div className="md:col-span-3 space-y-10">
                  {/* Connected Accounts Section */}
                  <section id="instagram-section" className="bg-white rounded-[3rem] p-8 md:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f9ce34]/10 via-[#ee2a7b]/10 to-[#6228d7]/10 flex items-center justify-center text-[#ee2a7b]">
                          <Instagram size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Linked Accounts</h2>
                          <p className="text-sm text-slate-400 font-medium">Your connected social platforms</p>
                        </div>
                      </div>
                      <button 
                        onClick={connectInstagram}
                        className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-[#2563EB]"
                        title="Link another account"
                      >
                        <Plus size={24} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {instagramAccount ? (
                        <div className="p-6 md:p-8 rounded-[2.5rem] bg-slate-50/50 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                          <div className="flex items-center gap-6">
                            <div className="relative group">
                              <div className="absolute -inset-2 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-full blur-md opacity-20 group-hover:opacity-40 transition duration-500"></div>
                              <div className="relative w-20 h-20 rounded-full bg-white p-1 ring-1 ring-slate-100">
                                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={instagramAccount.profile_picture_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${instagramAccount.username}`} 
                                    alt="IG Avatar" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                 <div className="w-6 h-6 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-full flex items-center justify-center">
                                    <Instagram size={12} className="text-white" />
                                 </div>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">@{instagramAccount.username}</h3>
                                <div className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full flex items-center gap-1.5">
                                   <CheckCircle2 size={12} className="fill-emerald-600 text-white" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Automations</span>
                                    <span className="text-sm font-bold text-slate-700">0 Running</span>
                                 </div>
                                 <div className="w-px h-8 bg-slate-200" />
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform</span>
                                    <span className="text-sm font-bold text-slate-700">Instagram Biz</span>
                                 </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <div className="relative w-full sm:w-auto group/dropdown">
                              <button 
                                className="w-full px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                onClick={() => (document.getElementById('posts-dropdown') as any).classList.toggle('hidden')}
                              >
                                See all posts
                                <ChevronRight size={16} className="rotate-90" />
                              </button>
                              
                              {/* Mock Dropdown for Posts */}
                              <div id="posts-dropdown" className="hidden absolute right-0 top-full mt-4 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center justify-between mb-4 px-2">
                                  <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Recent Posts</span>
                                  <button onClick={() => (document.getElementById('posts-dropdown') as any).classList.add('hidden')}>
                                    <X size={14} className="text-slate-300 hover:text-slate-600" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-64 no-scrollbar">
                                  {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="aspect-square bg-slate-100 rounded-xl overflow-hidden group/item cursor-pointer">
                                      <img 
                                        src={`https://picsum.photos/seed/${i + 15}/200`} 
                                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform" 
                                      />
                                    </div>
                                  ))}
                                </div>
                                <button className="w-full mt-4 py-3 bg-slate-50 rounded-xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-colors">
                                  Load More
                                </button>
                              </div>
                            </div>

                            <button 
                              onClick={disconnectInstagram}
                              className="w-full sm:w-auto px-6 py-3.5 bg-red-50 text-red-600 rounded-2xl text-[13px] font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                              <LogOut size={16} />
                              Disconnect
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[3rem] space-y-4">
                          <p className="text-slate-400 font-medium">No accounts linked yet.</p>
                          <button 
                            onClick={() => setViewState("not_connected")}
                            className="text-[#2563EB] font-bold text-sm hover:underline"
                          >
                            Add Instagram Account
                          </button>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Profile Section */}
                  <section id="profile" className="bg-white rounded-[3rem] p-8 md:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-10">
                     <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <User size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Profile Details</h2>
                        <p className="text-sm text-slate-400 font-medium">How you appear on PinPost</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                        <input 
                          disabled 
                          value={session?.user?.email || ''} 
                          className="w-full bg-slate-50/50 border-slate-100 rounded-2xl px-6 py-4.5 text-sm font-bold text-slate-400"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Display Name</label>
                        <input 
                          defaultValue={session?.user?.name || ''} 
                          className="w-full bg-white border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-[#2563EB]/5 focus:border-[#2563EB] transition-all outline-none"
                        />
                      </div>
                    </div>
                    <button className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-sm hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                      Update Profile
                    </button>
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
