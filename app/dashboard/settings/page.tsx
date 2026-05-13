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
  }, [session?.user?.id]);

  const connectInstagram = () => {
    // In a real app, this redirects to Instagram OAuth
    // window.location.href = `/api/public/instagram/auth`;
    toast.info("Redirecting to Instagram OAuth...");
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-12 space-y-12 animate-in fade-in duration-700">
      <div className="space-y-1">
        <h1 className="text-[32px] font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-[15px] text-slate-500 font-medium">Manage your account and platform connections.</p>
      </div>

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
              {instagramAccount ? (
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
                  <button className="text-[12px] font-bold text-slate-400 hover:text-red-500 transition-all uppercase tracking-widest">Disconnect</button>
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
  );
}
