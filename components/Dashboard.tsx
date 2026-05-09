"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { 
  Plus, 
  Trash2, 
  FileText, 
  Clock, 
  Sparkles, 
  Image as ImageIcon, 
  PenLine, 
  Eye, 
  Video, 
  Zap, 
  Calendar, 
  History as HistoryIcon,
  UserCircle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import Image from "next/image";
import logoPinpost from "@/assets/logo-pinpost.png";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Mock Format Presets since they don't exist yet
const FORMAT_PRESETS: Record<string, { shortLabel: string }> = {
  post_square: { shortLabel: "Square" },
  post_portrait: { shortLabel: "Portrait" },
  story: { shortLabel: "Story" },
};

interface Draft {
  id: string;
  title: string;
  text: string;
  format_key: string;
  updated_at: string;
}

interface DraftThumbnail {
  draftId: string;
  url: string;
  type: "image" | "video";
}

interface Profile {
  display_name: string;
  handle: string;
  avatar_url: string;
}

function VideoStill({ src, className }: { src: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = src;

    const handleSeek = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCaptured(true);
      }
      video.remove();
    };

    video.addEventListener("seeked", handleSeek, { once: true });
    video.addEventListener("loadeddata", () => {
      video.currentTime = 0.5;
    }, { once: true });

    return () => {
      video.removeEventListener("seeked", handleSeek);
      video.remove();
    };
  }, [src]);

  return (
    <div className={`relative ${className || ""}`}>
      <canvas ref={canvasRef} className={`h-full w-full object-cover ${captured ? "" : "opacity-0"}`} />
      {!captured && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Video className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
      <div className="absolute bottom-1.5 left-1.5 rounded bg-foreground/60 px-1.5 py-0.5 text-[10px] font-mono text-background">
        Video
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const user = session?.user;
  const router = useRouter();
  
  const [profile, setProfile] = useState<Profile>({ display_name: "", handle: "", avatar_url: "" });
  const [avatarPath, setAvatarPath] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [thumbnails, setThumbnails] = useState<DraftThumbnail[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    (async () => {
      try {
        const profileFetch = await fetch(`/api/profile?userId=${user.id}`);
        const profileData = profileFetch.ok ? await profileFetch.json() : { data: null };

        const draftsFetch = await fetch(`/api/draft?userId=${user.id}`);
        const draftsData = draftsFetch.ok ? await draftsFetch.json() : { data: null };

        const [profileRes, draftsRes] = await Promise.all([
          Promise.resolve(profileData),
          Promise.resolve(draftsData),
        ]);

        if (!mounted) return;

        if (profileRes.data) {
          const rawPath = profileRes.data.avatar_url || "";
          setAvatarPath(rawPath);
          let avatarUrl = rawPath;
          if (avatarUrl && !avatarUrl.startsWith("http")) {
            const { data: signedData } = await supabase.storage
              .from("avatars")
              .createSignedUrl(avatarUrl, 3600);
            avatarUrl = signedData?.signedUrl || "";
          }
          setProfile({
            display_name: profileRes.data.display_name || "",
            handle: profileRes.data.handle || "",
            avatar_url: avatarUrl,
          });
        }

        if (draftsRes.data) {
          const typedDrafts = draftsRes.data as any[];
          setDrafts(typedDrafts);

          const thumbs: DraftThumbnail[] = [];
          for (const d of typedDrafts) {
            if (d.thumbnailUrl) {
              thumbs.push({ draftId: d.id, url: d.thumbnailUrl, type: d.thumbnailType });
            }
          }
          if (mounted) setThumbnails(thumbs);
        }
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        if (mounted) setLoadingData(false);
      }
    })();

    return () => { mounted = false; };
  }, [user]);

  const saveProfile = useCallback(async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          display_name: profile.display_name,
          handle: profile.handle,
          avatar_url: avatarPath,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Profile saved successfully!");
    } catch (e) {
      console.error("Failed to save profile", e);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }, [user, profile, avatarPath]);

  const getSignedAvatarUrl = useCallback(async (path: string): Promise<string> => {
    const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
    return data?.signedUrl || "";
  }, []);

  const handleAvatarUpload = useCallback(async (files: FileList | null) => {
    if (!files?.[0] || !user?.id) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);

      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const storagePath = path;
      const signedUrl = await getSignedAvatarUrl(storagePath);
      setAvatarPath(storagePath);
      setProfile((p) => ({ ...p, avatar_url: signedUrl }));

      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          display_name: profile.display_name,
          handle: profile.handle,
          avatar_url: storagePath,
        }),
      });
      toast.success("Avatar uploaded!");
    } catch (e) {
      console.error("Failed to upload avatar", e);
      toast.error("Avatar upload failed");
    }
  }, [user, getSignedAvatarUrl]);

  const deleteDraft = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/draft?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete draft");
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      setThumbnails((prev) => prev.filter((t) => t.draftId !== id));
      toast.success("Draft deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete draft");
    }
  }, []);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0096d6] border-t-transparent" />
      </div>
    );
  }

  const firstName = profile.display_name?.split(" ")[0] || user.name?.split(" ")[0] || "there";
  const getThumbnail = (draftId: string) => thumbnails.find((t) => t.draftId === draftId);

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex w-full max-w-7xl items-center px-8 py-4">
          <div className="flex-[0.5]">
            <Link href="/" className="logo-script text-[26px] text-slate-900">
              PinPost
            </Link>
          </div>
          <div className="flex flex-[0.5] items-center justify-end gap-4">
            <div className="flex items-center gap-2.5 bg-slate-50 pl-2 pr-5 py-1.5 rounded-full border border-slate-100">
              <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[12px] font-bold uppercase shadow-sm">
                {user.email?.[0] || "A"}
              </div>
              <span className="text-[13px] font-bold text-slate-600 truncate max-w-[150px]">{user.email || "amitmaheta2007@gmail.com"}</span>
            </div>
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16 space-y-12 sm:space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
        {/* Welcome banner */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-[36px] font-bold tracking-tight text-slate-900">
              Welcome back, {firstName}
            </h1>
            <p className="text-[17px] text-slate-500 leading-relaxed max-w-xl font-medium">
              Your command center for premium social media content.
            </p>
          </div>
          <Link
            href="/editor"
            className="group relative flex items-center gap-5 bg-slate-900 hover:bg-black text-white pl-6 pr-1.5 py-1.5 rounded-full text-[14px] font-bold transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl w-fit"
          >
            New Post
            <div className="bg-white p-1.5 rounded-full transition-transform group-hover:translate-x-0.5 shadow-sm">
              <Plus className="h-4 w-4 text-[#0ea5e9]" />
            </div>
          </Link>
        </section>

        {/* Quick actions - Minimalist */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Automation", href: "/automation", sub: "Auto-DM tools" },
            { label: "Smart Shorts", href: "/schedule", sub: "YouTube AI" },
            { label: "Live Preview", href: "/feed-preview", sub: "See in-app" },
            { label: "Schedule", href: "/schedule", sub: "Plan posts" },
          ].map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="group flex flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:border-[#0ea5e9]/30 active:scale-[0.98] text-center"
            >
              <p className="text-[15px] font-bold text-slate-900 group-hover:text-[#0ea5e9] transition-colors">{action.label}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{action.sub}</p>
            </Link>
          ))}
        </section>

        {/* Drafts section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Recent Drafts</h2>
              <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[11px] font-bold text-slate-500">{drafts.length}</span>
            </div>
            {drafts.length > 0 && (
              <Link href="/history" className="text-[13px] font-bold text-[#0ea5e9] hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0ea5e9] border-t-transparent" />
            </div>
          ) : drafts.length === 0 ? (
            <div className="rounded-[2.5rem] border border-dashed border-slate-200 bg-white py-24 text-center space-y-4 shadow-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 mx-auto border border-slate-100 shadow-inner">
                <FileText className="h-10 w-10 text-slate-300" />
              </div>
              <div className="space-y-2">
                <p className="text-[18px] font-bold text-slate-900">No saved drafts</p>
                <p className="text-[14px] text-slate-400 max-w-xs mx-auto font-medium">
                  Your creative journey starts here. Create your first post and see it across all platforms.
                </p>
              </div>
              <button 
                onClick={() => router.push("/editor")}
                className="mt-6 group relative inline-flex items-center gap-5 bg-slate-900 hover:bg-black text-white pl-6 pr-1.5 py-1.5 rounded-full text-[13px] font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                Create your first post
                <div className="bg-white p-1.5 rounded-full transition-transform group-hover:translate-x-0.5 shadow-sm">
                  <Plus className="h-3.5 w-3.5 text-[#0ea5e9]" />
                </div>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {drafts.slice(0, 3).map((draft) => {
                const format = FORMAT_PRESETS[draft.format_key];
                const thumb = getThumbnail(draft.id);
                return (
                  <Link
                    key={draft.id}
                    href={`/editor?draft=${draft.id}`}
                    className="group relative flex flex-col rounded-[2rem] border border-slate-100 bg-white overflow-hidden shadow-sm transition-all hover:shadow-2xl hover:border-[#0ea5e9]/20 active:scale-[0.99] border-transparent"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-48 w-full bg-slate-50 overflow-hidden shrink-0">
                      {thumb ? (
                        thumb.type === "video" ? (
                          <VideoStill src={thumb.url} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <img
                            src={thumb.url}
                            alt="Draft preview"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        )
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon size={40} className="text-slate-200" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {format && (
                        <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-700 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                          {format.shortLabel}
                        </span>
                      ) || (
                        <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-700 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                          Draft
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div className="min-w-0">
                        <p className="text-[16px] font-bold text-slate-900 truncate leading-tight group-hover:text-[#0ea5e9] transition-colors">
                          {draft.title || "Untitled draft"}
                        </p>
                        <p className="text-[13px] text-slate-500 line-clamp-2 mt-2 leading-relaxed font-medium">
                          {draft.text?.slice(0, 100) || "No content yet..."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-6">
                        <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          {new Date(draft.updated_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteDraft(draft.id); }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Profile card */}
        <section id="profile-section" className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0ea5e9]/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-[#0ea5e9]/10" />
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9]">
              <UserCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Profile Settings</h2>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Shown in previews</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { handleAvatarUpload(e.target.files); e.target.value = ""; }}
            />
            <div className="relative shrink-0">
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="h-24 w-24 rounded-[2rem] border-2 border-slate-50 bg-slate-50 flex items-center justify-center overflow-hidden transition-all hover:border-[#0ea5e9]/40 hover:shadow-xl hover:scale-105 active:scale-95 shadow-inner"
                title="Upload profile image"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle size={40} className="text-slate-300" />
                )}
              </button>
              <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-slate-900 text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg pointer-events-none group-hover:bg-[#0ea5e9] transition-colors">
                <Plus size={14} />
              </div>
            </div>

            <div className="flex-1 w-full space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 block">Display Name</label>
                  <input
                    value={profile.display_name}
                    onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-3.5 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all focus:border-[#0ea5e9]/30"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 block">Handle</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-300">@</span>
                    <input
                      value={profile.handle}
                      onChange={(e) => setProfile((p) => ({ ...p, handle: e.target.value.replace(/^@/, "") }))}
                      placeholder="username"
                      className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-10 pr-5 py-3.5 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all focus:border-[#0ea5e9]/30"
                    />
                  </div>
                </div>
              </div>
              <button 
                onClick={saveProfile} 
                disabled={saving} 
                className="group relative inline-flex items-center gap-5 bg-slate-900 hover:bg-black text-white pl-6 pr-1.5 py-1.5 rounded-full text-[13px] font-bold transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
                <div className="bg-white p-1.5 rounded-full transition-transform group-hover:translate-x-0.5 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#0ea5e9]" />
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <div className="text-center py-12">
           <button 
             onClick={() => signOut({ callbackUrl: "/" })}
             className="px-6 py-2 rounded-full border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 text-[13px] font-bold transition-all active:scale-95"
           >
             Sign out of your account
           </button>
        </div>
      </div>
    </div>
  );
}
