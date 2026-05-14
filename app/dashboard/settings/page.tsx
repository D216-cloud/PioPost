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
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto px-8 py-20 space-y-16 animate-in fade-in duration-700">
        <div className="space-y-1">
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-[15px] text-slate-500 font-medium">Manage your account and platform connections.</p>
        </div>

        {/* Success Modal - Same to Same like image */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[480px] rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
              {/* Gradient Header */}
              <div className="h-48 bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-yellow-200 via-emerald-200 to-blue-300 relative flex items-center justify-center">
                 <div className="w-20 h-20 bg-[#4ADE80] rounded-full flex items-center justify-center shadow-lg border-4 border-white/50">
                    <CheckCircle2 size={40} className="text-white" />
                 </div>
              </div>
              
              <div className="p-10 text-center space-y-10">
                <div className="space-y-2">
                   <h2 className="text-[24px] font-bold text-slate-900 tracking-tight">Account reconnected successfully!</h2>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${instagramAccount?.username}`} alt="avatar" />
                      </div>
                      <div className="text-left">
                         <p className="text-[15px] font-bold text-slate-900">{instagramAccount?.username || 'deepak_maheta_01'}</p>
                         <p className="text-[12px] text-slate-400 font-medium">0 Automations</p>
                      </div>
                   </div>
                   <div className="w-6 h-6 bg-[#4ADE80] rounded-full flex items-center justify-center">
                      <CheckCircle2 size={14} className="text-white" />
                   </div>
                </div>

                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 border border-slate-200 rounded-full text-[15px] font-bold text-slate-900 hover:bg-slate-50 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <nav className="space-y-1">
          {[
            { label: "General", icon: User, active: true },
            { label: "Connections", icon: ShieldCheck },
            { label: "Billing", icon: CreditCard },
            { label: "Notifications", icon: Bell },
            { label: "Security", icon: Lock },
          ].map(item => (
            <button 
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold transition-all ${item.active ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="md:col-span-3 space-y-8">
          {/* Instagram Card - Simplified */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                <Instagram size={20} />
              </div>
              <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Instagram Connection</h2>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
              {isConnecting ? (
                <div className="text-center py-4 space-y-4 animate-in fade-in duration-500">
                  <div className="h-10 w-10 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-[15px] font-bold text-slate-900">Connecting Instagram...</p>
                    <p className="text-[13px] text-[#2563EB] font-bold uppercase tracking-wider animate-pulse">{connectionStep}</p>
                  </div>
                </div>
              ) : instagramAccount ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5">
                      <div className="w-full h-full rounded-full bg-white p-0.5">
                        <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                          <Instagram size={24} className="text-slate-400" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-900">@{instagramAccount.username || 'Connected Account'}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={disconnectInstagram} className="text-[12px] font-bold text-slate-400 hover:text-red-500 transition-all uppercase tracking-widest">Disconnect</button>
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
          <section id="profile" className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
             <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <User size={20} />
              </div>
              <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Profile Information</h2>
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
            <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[13px] font-bold hover:bg-black transition-all shadow-lg shadow-slate-900/10">
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
