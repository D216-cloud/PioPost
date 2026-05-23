"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { User, Mail, Calendar, Instagram, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [instagramAccounts, setInstagramAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (session?.user?.name) setDisplayName(session.user.name);
    fetch("/api/instagram-account")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setInstagramAccounts(Array.isArray(d.data) ? d.data : [d.data]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  const avatarUrl = session?.user?.image;
  const email = session?.user?.email;
  const initials = (session?.user?.name || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="relative mx-auto max-w-3xl px-6 md:px-8 pt-8 md:pt-20 pb-16 space-y-8 animate-in fade-in duration-500">

        {/* Ambient background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 h-72 w-72 rounded-full bg-violet-100/30 blur-[100px]" />
          <div className="absolute bottom-10 left-1/4 h-72 w-72 rounded-full bg-pink-100/20 blur-[100px]" />
        </div>

        {/* Header */}
        <div>
          <h1 className="text-[32px] md:text-[44px] font-normal tracking-tight text-slate-900 leading-none">
            Your <span className="text-[#a855f7] font-medium">Profile</span>
          </h1>
          <p className="text-[14px] text-slate-500 font-medium mt-2">
            Manage your personal information and connected accounts.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-[24px] border border-[#e4e4e7] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-[#a855f7]/10"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white text-3xl font-black">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4 text-center sm:text-left">
              {/* Name */}
              <div>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="text-[20px] font-bold text-slate-900 border border-slate-200 rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#a855f7]/20"
                    />
                    <button
                      onClick={() => { setEditingName(false); toast.success("Name updated!"); }}
                      className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => { setEditingName(false); setDisplayName(session?.user?.name || ""); }}
                      className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h2 className="text-[22px] font-bold text-slate-900">{displayName || "User"}</h2>
                    <button
                      onClick={() => setEditingName(true)}
                      className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Mail size={14} className="text-slate-400 shrink-0" />
                <span className="text-[14px] text-slate-500 font-medium">{email || "No email"}</span>
              </div>

              {/* Joined */}
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <span className="text-[14px] text-slate-500 font-medium">Member since {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Instagram Accounts */}
        <div className="space-y-4">
          <h3 className="text-[16px] font-bold text-slate-800">Connected Instagram Accounts</h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-[#a855f7] rounded-full animate-spin" />
            </div>
          ) : instagramAccounts.length > 0 ? (
            <div className="space-y-3">
              {instagramAccounts.map((account: any) => (
                <div
                  key={account.id}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#e4e4e7] shadow-sm"
                >
                  {account.profile_picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={account.profile_picture_url}
                      alt={account.username}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-pink-200"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center">
                      <Instagram size={20} className="text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-slate-900">@{account.username}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                    <Check size={12} className="text-emerald-600" />
                    <span className="text-[11px] font-bold text-emerald-600">Active</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 rounded-2xl border border-dashed border-slate-200 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                <User size={24} />
              </div>
              <p className="text-[14px] font-semibold text-slate-500">No Instagram account connected</p>
              <a
                href="/dashboard/settings"
                className="mt-3 text-[13px] font-bold text-[#a855f7] hover:text-[#9333ea] transition-colors"
              >
                Connect Now →
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
