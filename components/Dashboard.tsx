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
  UserCircle
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
        const [profileRes, draftsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("drafts").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
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
          const typedDrafts = draftsRes.data as Draft[];
          setDrafts(typedDrafts);

          // Load first thumbnail for each draft (images first, then video still)
          const thumbs: DraftThumbnail[] = [];
          for (const d of typedDrafts) {
            // Try image first
            const { data: imageData } = await supabase
              .from("draft_media")
              .select("storage_path, file_type")
              .eq("draft_id", d.id)
              .eq("file_type", "image")
              .eq("uploaded", true)
              .order("sort_order", { ascending: true })
              .limit(1);

            if (!mounted) return;

            if (imageData && imageData.length > 0) {
              const { data: signedData } = await supabase.storage
                .from("draft-media")
                .createSignedUrl(imageData[0].storage_path, 3600);
              if (signedData?.signedUrl) {
                thumbs.push({ draftId: d.id, url: signedData.signedUrl, type: "image" });
                continue;
              }
            }

            // Fallback: try video and capture a still frame
            const { data: videoData } = await supabase
              .from("draft_media")
              .select("storage_path, file_type")
              .eq("draft_id", d.id)
              .eq("file_type", "video")
              .eq("uploaded", true)
              .order("sort_order", { ascending: true })
              .limit(1);

            if (!mounted) return;

            if (videoData && videoData.length > 0) {
              const { data: signedData } = await supabase.storage
                .from("draft-media")
                .createSignedUrl(videoData[0].storage_path, 3600);
              if (signedData?.signedUrl) {
                thumbs.push({ draftId: d.id, url: signedData.signedUrl, type: "video" });
              }
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
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: profile.display_name,
        handle: profile.handle,
        avatar_url: avatarPath,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
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

      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const storagePath = path;
      const signedUrl = await getSignedAvatarUrl(storagePath);
      setAvatarPath(storagePath);
      setProfile((p) => ({ ...p, avatar_url: signedUrl }));

      await supabase.from("profiles").upsert({
        id: user.id,
        avatar_url: storagePath,
        updated_at: new Date().toISOString(),
      });
      toast.success("Avatar uploaded!");
    } catch (e) {
      console.error("Failed to upload avatar", e);
      toast.error("Avatar upload failed");
    }
  }, [user, getSignedAvatarUrl]);

  const deleteDraft = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("drafts").delete().eq("id", id);
      if (error) throw error;
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      setThumbnails((prev) => prev.filter((t) => t.draftId !== id));
      toast.success("Draft deleted");
    } catch (e) {
      console.error("Failed to delete draft", e);
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="logo-script text-[28px] text-slate-900">PinPost</Link>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 pl-2 pr-4 py-1.5 rounded-full border border-slate-100">
          <div className="h-6 w-6 rounded-full bg-[#e1f5fe] text-[#0096d6] border border-[#b3e5fc] flex items-center justify-center text-[12px] font-bold uppercase">
            {user.email?.[0] || "A"}
          </div>
          <span className="text-[13px] font-semibold text-slate-600 truncate max-w-[150px]">{user.email || "amitmaheta2007@gmail.com"}</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 space-y-10 sm:space-y-12">
        {/* Welcome banner */}
        <section className="space-y-2">
          <h1 className="text-[32px] sm:text-[28px] font-bold tracking-tight text-slate-900">
            Welcome back, {firstName}
          </h1>
          <p className="text-[15px] sm:text-[15px] text-slate-500 leading-relaxed max-w-xl">
            Create, preview, and enhance your social media posts across Instagram, LinkedIn, X, and Facebook — all in one place.
          </p>
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            href="/editor"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-[#0096d6]/30 active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0096d6]/10 text-[#0096d6] transition-colors group-hover:bg-[#0096d6]/15">
              <PenLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">New post</p>
              <p className="text-xs text-slate-500 mt-0.5">Start composing</p>
            </div>
          </Link>
          <button
            onClick={() => {
              const el = document.getElementById("profile-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-[#0096d6]/30 active:scale-[0.98] text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0096d6]/10 text-[#0096d6] transition-colors group-hover:bg-[#0096d6]/15">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Edit profile</p>
              <p className="text-xs text-slate-500 mt-0.5">Name, handle, avatar</p>
            </div>
          </button>
          <Link
            href="/editor"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-[#0096d6]/30 active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0096d6]/10 text-[#0096d6] transition-colors group-hover:bg-[#0096d6]/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">AI enhance</p>
              <p className="text-xs text-slate-500 mt-0.5">Optimize your copy</p>
            </div>
          </Link>
          <Link
            href="/feed-preview"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-[#0096d6]/30 active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0096d6]/10 text-[#0096d6] transition-colors group-hover:bg-[#0096d6]/15">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Live feed preview</p>
              <p className="text-xs text-slate-500 mt-0.5">See it inside a real app</p>
            </div>
          </Link>
          <Link
            href="/automation"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-[#0096d6]/30 active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0096d6]/10 text-[#0096d6] transition-colors group-hover:bg-[#0096d6]/15">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Automation</p>
              <p className="text-xs text-slate-500 mt-0.5">Auto-DM on Instagram</p>
            </div>
          </Link>
          <Link
            href="/schedule"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-[#0096d6]/30 active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0096d6]/10 text-[#0096d6] transition-colors group-hover:bg-[#0096d6]/15">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Schedule content</p>
              <p className="text-xs text-slate-500 mt-0.5">Generate & autopost</p>
            </div>
          </Link>
          <Link
            href="/history"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-[#0096d6]/30 active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0096d6]/10 text-[#0096d6] transition-colors group-hover:bg-[#0096d6]/15">
              <HistoryIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Draft history</p>
              <p className="text-xs text-slate-500 mt-0.5">All your drafts</p>
            </div>
          </Link>
        </section>

        {/* Drafts section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your drafts</h2>
              <p className="text-[13px] text-slate-400 mt-0.5">
                {drafts.length === 0 ? "No saved drafts yet" : `${drafts.length} draft${drafts.length === 1 ? "" : "s"} saved`}
              </p>
            </div>
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0096d6] px-5 py-2.5 text-[14px] font-bold text-white transition-all hover:bg-[#0085bd] shadow-lg shadow-[#0096d6]/20"
            >
              <Plus size={18} />
              New post
            </Link>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0096d6] border-t-transparent" />
            </div>
          ) : drafts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mx-auto mb-3">
                <FileText className="h-7 w-7 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900">No drafts yet</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Create your first post to see how it looks across all platforms before publishing.
                </p>
              </div>
              <Button size="sm" variant="outline" className="mt-4 gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50" asChild>
                <Link href="/editor">
                  <Plus className="h-3.5 w-3.5" />
                  Create your first post
                </Link>
              </Button>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {drafts.slice(0, 4).map((draft) => {
                const format = FORMAT_PRESETS[draft.format_key];
                const thumb = getThumbnail(draft.id);
                return (
                  <Link
                    key={draft.id}
                    href={`/editor?draft=${draft.id}`}
                    className="group relative flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-[#0096d6]/30 active:scale-[0.99]"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-40 w-full bg-slate-50 overflow-hidden shrink-0">
                      {thumb ? (
                        thumb.type === "video" ? (
                          <VideoStill src={thumb.url} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <img
                            src={thumb.url}
                            alt="Draft preview"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon size={32} className="text-slate-300" />
                        </div>
                      )}
                      {format && (
                        <span className="absolute top-3 left-3 text-[10px] font-bold text-slate-700 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm">
                          {format.shortLabel}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate leading-tight">
                          {draft.title || "Untitled draft"}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {draft.text?.slice(0, 100) || "No content yet..."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <Clock size={12} />
                          {new Date(draft.updated_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteDraft(draft.id); }}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {drafts.length > 4 && (
              <div className="mt-6 text-center">
                <Link href="/history" className="text-[13px] font-bold text-[#0096d6] hover:underline">
                  View all {drafts.length} drafts →
                </Link>
              </div>
            )}
            </>
          )}
        </section>

        {/* Profile card */}
        <section id="profile-section" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Profile settings</h2>
            <span className="text-xs text-slate-400">· Shown in previews</span>
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { handleAvatarUpload(e.target.files); e.target.value = ""; }}
            />
            <div className="relative group">
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="h-20 w-20 shrink-0 rounded-full border-2 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden transition-all hover:border-[#0096d6]/40 hover:shadow-md active:scale-95"
                title="Upload profile image"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle size={32} className="text-slate-300" />
                )}
              </button>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-[#0096d6] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm pointer-events-none">
                <Plus size={12} />
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Display name</label>
                <input
                  value={profile.display_name}
                  onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0096d6]/20 focus:border-[#0096d6] transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Handle</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">@</span>
                  <input
                    value={profile.handle}
                    onChange={(e) => setProfile((p) => ({ ...p, handle: e.target.value.replace(/^@/, "") }))}
                    placeholder="handle"
                    className="w-full rounded-lg border border-slate-200 bg-white pl-7 pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0096d6]/20 focus:border-[#0096d6] transition-all"
                  />
                </div>
              </div>
              <button 
                onClick={saveProfile} 
                disabled={saving} 
                className="mt-1 inline-flex items-center justify-center rounded-lg bg-[#0096d6] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#0085bd] disabled:opacity-60 shadow-sm"
              >
                {saving ? "Saving…" : "Save profile"}
              </button>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <div className="text-center py-10">
           <button 
             onClick={() => signOut({ callbackUrl: "/" })}
             className="text-slate-400 hover:text-[#0096d6] text-[13px] font-medium transition-colors"
           >
             Sign out of your account
           </button>
        </div>
      </div>
    </div>
  );
}
