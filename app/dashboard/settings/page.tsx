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
  AlertCircle
} from "lucide-react";
import { InstagramIcon as Instagram } from "@/components/icons";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [instagramAccount, setInstagramAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState("");

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchInstagram = async () => {
      const { data } = await supabase
        .from("instagram_accounts")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      setInstagramAccount(data);
      setLoading(false);
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
          console.log('Change received!', payload);
          if (payload.eventType === 'DELETE') {
            setInstagramAccount(null);
          } else {
            setInstagramAccount(payload.new);
            if (payload.eventType === 'INSERT') {
              setShowSuccessModal(true);
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
    
    // Redirect to our real OAuth initiation route
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
    toast.success("Instagram account disconnected");
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setShowSuccessModal(true);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-white pt-24 md:pt-20">
      <div className="w-[95%] md:max-w-4xl mx-auto px-4 md:px-8 pb-20 space-y-12 md:space-y-16 animate-in fade-in duration-700">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-[14px] md:text-[15px] text-slate-500 font-medium">Manage your account and platform connections.</p>
        </div>

        {/* Success Modal - Exact Match to Image */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[420px] rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-500 text-center space-y-8">
              {/* Checkmark Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-[#4ADE80] rounded-full flex items-center justify-center shadow-lg border-[6px] border-white ring-1 ring-slate-100">
                  <CheckCircle2 size={36} className="text-white" strokeWidth={3} />
                </div>
              </div>
              
              <div className="space-y-8">
                <h2 className="text-[24px] font-bold text-slate-900 tracking-tight leading-tight px-4">
                  Account reconnected successfully!
                </h2>

                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-slate-50 shadow-sm">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${instagramAccount?.username || 'user'}`} 
                        alt="avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-slate-900 leading-none mb-1">
                        {instagramAccount?.username || 'deepak_maheta_01'}
                      </p>
                      <p className="text-[12px] text-slate-400 font-medium tracking-tight">0 Automations</p>
                    </div>
                  </div>
                  <div className="w-6 h-6 bg-[#4ADE80] rounded-full flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setShowSuccessModal(false);
                    document.getElementById('instagram-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-4 border border-slate-200 rounded-full text-[15px] font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        <nav className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 gap-2 md:gap-1 no-scrollbar">
          {[
            { label: "General", icon: User, active: true },
            { label: "Connections", icon: ShieldCheck },
            { label: "Billing", icon: CreditCard },
            { label: "Notifications", icon: Bell },
            { label: "Security", icon: Lock },
          ].map(item => (
            <button 
              key={item.label}
              className={`whitespace-nowrap flex items-center gap-3 px-5 md:px-4 py-2.5 md:py-3 rounded-xl text-[13px] md:text-[14px] font-bold transition-all ${item.active ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="md:col-span-3 space-y-8">
          {/* Instagram Card - Simplified */}
          <section id="instagram-section" className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6 md:space-y-8 scroll-mt-24">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                <Instagram size={20} />
              </div>
              <h2 className="text-[17px] md:text-[18px] font-bold text-slate-900 tracking-tight">Instagram Connection</h2>
            </div>

            <div className="p-6 md:p-8 rounded-3xl bg-slate-50 border border-slate-100">
              {isConnecting ? (
                <div className="text-center py-4 space-y-4 animate-in fade-in duration-500">
                  <div className="h-10 w-10 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-[15px] font-bold text-slate-900">Connecting Instagram...</p>
                    <p className="text-[13px] text-[#2563EB] font-bold uppercase tracking-wider animate-pulse">{connectionStep}</p>
                  </div>
                </div>
              ) : instagramAccount ? (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-2">
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <div className="absolute -inset-1.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                        <div className="relative w-20 h-20 rounded-full bg-white p-1">
                          <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/50 shadow-inner">
                            <img 
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${instagramAccount.username}`} 
                              alt="IG Avatar" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                           <div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center">
                              <Instagram size={10} className="text-white" />
                           </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[20px] font-bold text-slate-900 tracking-tight">@{instagramAccount.username}</h3>
                          <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full flex items-center gap-1">
                             <CheckCircle2 size={12} className="fill-blue-600 text-white" />
                             <span className="text-[10px] font-black uppercase tracking-tighter">Verified</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                              <span className="text-[13px] font-bold text-emerald-500 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Fully Connected
                              </span>
                           </div>
                           <div className="w-px h-8 bg-slate-200" />
                           <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Type</span>
                              <span className="text-[13px] font-bold text-slate-700">Business Account</span>
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                       <button 
                         onClick={disconnectInstagram}
                         className="flex-1 sm:flex-none px-6 py-3 rounded-2xl text-[13px] font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                       >
                         Disconnect
                       </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6 py-4">
                  <div className="space-y-1">
                    <p className="text-[15px] font-bold text-slate-900">No account connected</p>
                    <p className="text-[13px] text-slate-400 font-medium max-w-xs mx-auto">Auto-post scheduled reels by connecting your Instagram account.</p>
                  </div>
                  <button 
                    onClick={connectInstagram}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-3 rounded-2xl text-[13px] font-bold transition-all shadow-xl shadow-[#2563EB]/20 flex items-center gap-2 mx-auto"
                  >
                    <Instagram size={18} />
                    Connect Instagram
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Profile Card - Simplified */}
          <section id="profile" className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6 md:space-y-8">
             <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <User size={20} />
              </div>
              <h2 className="text-[17px] md:text-[18px] font-bold text-slate-900 tracking-tight">Profile Information</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                <input 
                  disabled 
                  value={session?.user?.email || ''} 
                  className="w-full bg-slate-50 border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Display Name</label>
                <input 
                  defaultValue={session?.user?.name || ''} 
                  className="w-full bg-slate-50 border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-[#2563EB]/5 focus:border-[#2563EB]/20 transition-all outline-none"
                />
              </div>
            </div>
            <button className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl text-[13px] font-bold hover:bg-black transition-all shadow-lg shadow-slate-900/10">
              Save Changes
            </button>
          </section>

          {/* Billing Section - Simplified */}
          <section id="billing" className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CreditCard size={20} />
              </div>
              <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Subscription & Billing</h2>
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
               <div className="space-y-1">
                  <p className="text-[14px] font-bold text-slate-900">Current Plan: Free Tier</p>
                  <p className="text-[12px] text-slate-400 font-medium">Next reset: 15 days</p>
               </div>
               <button className="text-[13px] font-bold text-[#2563EB] hover:underline">Upgrade Plan</button>
            </div>
          </section>

          {/* Notifications Section - Simplified */}
          <section id="notifications" className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Bell size={20} />
              </div>
              <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Notification Settings</h2>
            </div>

            <div className="space-y-4">
               {[
                 { label: "Email notifications for posted reels", checked: true },
                 { label: "Alerts for failed posts", checked: true },
                 { label: "Weekly analytics summary", checked: false },
               ].map((item, i) => (
                 <label key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
                    <span className="text-[14px] font-bold text-slate-600">{item.label}</span>
                    <input type="checkbox" defaultChecked={item.checked} className="w-5 h-5 rounded accent-[#2563EB]" />
                 </label>
               ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
);
}
