"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, Sparkles, Layout, MessageCircle, Repeat2, Heart, Share, MoreHorizontal, ChevronDown, Send, Save, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Platform = "all" | "instagram" | "linkedin" | "x" | "facebook" | "youtube";

const FORMATS = ["Square", "Portrait", "Story", "Reel", "Landscape"];

const PLATFORM_CONFIG = {
  instagram: { name: "Instagram", icon: "📸", maxChars: 2200 },
  linkedin: { name: "LinkedIn", icon: "💼", maxChars: 3000 },
  x: { name: "X", icon: "𝕏", maxChars: 280 },
  facebook: { name: "Facebook", icon: "📘", maxChars: 63206 },
  youtube: { name: "YouTube", icon: "▶️", maxChars: 5000 },
};

export function PostEditor() {
  const { data: session } = useSession();
  const router = useRouter();
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState<Platform>("all");
  const [format, setFormat] = useState("Square");
  const [saving, setSaving] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  
  const [enhancing, setEnhancing] = useState(false);
  const [aiOptions, setAiOptions] = useState<string[]>([]);

  // Inputs for testing preview mapping
  const [previewName, setPreviewName] = useState(session?.user?.name || "deepak maheta");
  const [previewHandle, setPreviewHandle] = useState("@" + (session?.user?.name?.toLowerCase().replace(/\s+/g, "_") || "deepak_maheta"));

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleEnhance = async () => {
    if (!text.trim()) return;
    setEnhancing(true);
    setAiOptions([]);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      
      if (data.error) {
        alert("Gemini API Error: " + data.error);
      } else if (data.options) {
        setAiOptions(data.options);
      }
    } catch (e: any) {
      console.error(e);
      alert("Failed to connect to the enhancement API.");
    } finally {
      setEnhancing(false);
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      const formatKey = format === "Square" ? "post_square" : format === "Portrait" ? "post_portrait" : format === "Story" ? "story" : "post_square";
      
      const { data: draft, error: draftError } = await supabase.from("drafts").insert({
        user_id: session.user.id,
        title: text ? text.slice(0, 30) + (text.length > 30 ? "..." : "") : "Untitled draft",
        text: text,
        format_key: formatKey,
      }).select().single();

      if (draftError) throw draftError;

      if (mediaFile && draft) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${draft.id}_${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("draft-media")
          .upload(filePath, mediaFile);

        if (uploadError) throw uploadError;

        await supabase.from("draft_media").insert({
          draft_id: draft.id,
          storage_path: filePath,
          file_type: mediaFile.type.startsWith("video/") ? "video" : "image",
          sort_order: 0,
          uploaded: true
        });
      }

      router.push("/dashboard");
    } catch (e) {
      console.error("Error saving draft:", e);
      alert("Failed to save draft. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const renderPlatformCard = (key: string) => {
    const pText = text || "Write your post here...";
    const pName = previewName;
    const pHandle = previewHandle;
    const pImage = session?.user?.image || "";
    const isReels = format === "Reels";

    let content = null;

    if (key === "instagram") {
      if (isReels) {
        content = (
          <div className="relative w-full aspect-[9/16] bg-gradient-to-b from-[#2b1834] to-[#120716] overflow-hidden text-white font-sans rounded-b-xl sm:rounded-b-none">
            {mediaPreview && (
              <img src={mediaPreview} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Media" />
            )}
            <div className="absolute top-4 left-4 font-bold text-[18px] z-10 drop-shadow-md">Reels</div>
            <div className="absolute top-4 right-4 z-10 drop-shadow-md"><ImageIcon size={24} className="text-white"/></div>
            
            <div className="absolute bottom-20 right-4 flex flex-col items-center gap-5 z-10 drop-shadow-md">
              <div className="flex flex-col items-center gap-1">
                <Heart size={28} className="text-white" />
                <span className="text-[13px] font-medium">12.4K</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <MessageCircle size={28} className="text-white" />
                <span className="text-[13px] font-medium">320</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Send size={28} className="text-white" />
                <span className="text-[13px] font-medium">Share</span>
              </div>
              <MoreHorizontal size={24} className="text-white mt-2" />
            </div>

            <div className="absolute bottom-4 left-4 right-16 z-10 drop-shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden">
                  {pImage ? <img src={pImage} alt="User" /> : <UserIcon className="w-full h-full text-slate-800 p-1.5" />}
                </div>
                <span className="text-[14px] font-bold text-white">{pHandle.replace("@", "")}</span>
                <button className="border border-white/60 rounded-md px-3 py-1 text-[12px] font-bold hover:bg-white/10 backdrop-blur-sm">Follow</button>
              </div>
              <p className="text-[14px] line-clamp-2 text-white mb-2">{pText}</p>
              <div className="flex items-center gap-2 text-[12px] font-medium">
                <span className="text-[14px]">♫</span>
                <span>Original audio · {pName}</span>
              </div>
            </div>
          </div>
        );
      } else {
        content = (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
                  {pImage ? <img src={pImage} alt="User" /> : <UserIcon className="w-full h-full text-slate-400 p-1.5" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-slate-900">{pHandle.replace("@", "")}</span>
                  <span className="text-[12px] text-slate-500">Original audio</span>
                </div>
              </div>
              <MoreHorizontal className="text-slate-900 h-5 w-5" />
            </div>

            {mediaPreview ? (
              <div className="w-full bg-slate-100 aspect-square rounded-sm overflow-hidden mb-4">
                <img src={mediaPreview} className="w-full h-full object-cover" alt="Media" />
              </div>
            ) : (
               <div className="w-full aspect-square bg-slate-50 rounded-sm mb-4"></div>
            )}

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4 text-slate-900">
                <Heart size={24} />
                <MessageCircle size={24} />
                <Send size={24} />
              </div>
              <Save size={24} />
            </div>
            
            <p className="text-[14px] font-bold text-slate-900 mb-1">1,284 likes</p>
            <p className="text-[14px] text-slate-900 leading-tight">
              <span className="font-bold mr-1">{pHandle.replace("@", "")}</span>
              {pText}
            </p>
            <p className="text-[13px] text-slate-500 mt-1">View all 32 comments</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">2 HOURS AGO</p>
          </div>
        );
      }
    } else if (key === "linkedin") {
      content = (
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                 {pImage ? <img src={pImage} alt="User" /> : <UserIcon className="w-full h-full text-slate-400 p-2" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-slate-900">{pName}</span>
                <span className="text-[13px] text-slate-500">{pHandle.replace("@", "")}</span>
                <span className="text-[12px] text-slate-500 flex items-center gap-1">2h • 🌐</span>
              </div>
            </div>
            <MoreHorizontal className="text-slate-500 h-5 w-5" />
          </div>
          <div className="text-[14px] text-slate-900 mb-4 whitespace-pre-wrap">{pText}</div>
          {mediaPreview && (
            <div className={`w-full bg-slate-100 rounded-sm overflow-hidden mb-4 flex justify-center ${isReels ? "aspect-[9/16] bg-black" : ""}`}>
              <img src={mediaPreview} className={`w-full object-cover ${isReels ? "h-full" : "h-auto"}`} alt="Media" />
            </div>
          )}
          <div className="flex items-center justify-between text-[12px] text-slate-500 border-b border-slate-100 pb-3 mb-2">
             <div className="flex items-center gap-1">
               <span className="bg-blue-600 text-white rounded-full p-1"><Heart size={10} fill="white" /></span>
               <span>128</span>
             </div>
             <span>24 comments • 6 reposts</span>
          </div>
          <div className="flex items-center justify-between text-slate-500 text-[14px] font-semibold px-2 py-2">
            <button className="flex items-center gap-2"><Heart size={18}/> Like</button>
            <button className="flex items-center gap-2"><MessageCircle size={18}/> Comment</button>
            <button className="flex items-center gap-2"><Repeat2 size={18}/> Repost</button>
            <button className="flex items-center gap-2"><Send size={18}/> Send</button>
          </div>
        </div>
      );
    } else if (key === "x") {
      content = (
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                {pImage ? <img src={pImage} alt="User" /> : <UserIcon className="w-full h-full text-slate-400 p-2" />}
              </div>
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1">
                  <span className="text-[15px] font-bold text-slate-900">{pName}</span>
                  <span className="text-[#1d9bf0]">✓</span>
                  <span className="text-[14px] text-slate-500">{pHandle} · 1h</span>
                </div>
              </div>
            </div>
            <MoreHorizontal className="text-slate-400 h-5 w-5" />
          </div>
          <div className="text-[15px] text-slate-900 mb-3 whitespace-pre-wrap">{pText}</div>
          {mediaPreview && (
            <div className={`w-full rounded-2xl overflow-hidden border border-slate-200 mb-4 ${isReels ? "aspect-[9/16] bg-black flex justify-center" : ""}`}>
              <img src={mediaPreview} className={`w-full object-cover ${isReels ? "h-full" : "h-auto"}`} alt="Media" />
            </div>
          )}
          <div className="flex items-center justify-between text-slate-500 text-[14px] pr-12">
            <div className="flex items-center gap-2"><MessageCircle size={18}/> 24</div>
            <div className="flex items-center gap-2"><Repeat2 size={18}/> 12</div>
            <div className="flex items-center gap-2"><Heart size={18}/> 248</div>
            <Share size={18}/>
          </div>
        </div>
      );
    } else if (key === "facebook") {
      content = (
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                {pImage ? <img src={pImage} alt="User" /> : <UserIcon className="w-full h-full text-slate-400 p-2" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-slate-900">{pName}</span>
                <span className="text-[12px] text-slate-500 flex items-center gap-1">Just now • 🌐</span>
              </div>
            </div>
            <MoreHorizontal className="text-slate-500 h-5 w-5" />
          </div>
          <div className="text-[15px] text-slate-900 mb-3 whitespace-pre-wrap">{pText}</div>
          {mediaPreview && (
             <div className={`w-full bg-slate-100 mb-4 ${isReels ? "aspect-[9/16] bg-black flex justify-center" : ""}`}>
               <img src={mediaPreview} className={`w-full object-cover ${isReels ? "h-full" : "h-auto"}`} alt="Media" />
             </div>
          )}
          <div className="flex items-center justify-between text-[13px] text-slate-500 border-b border-slate-100 pb-3 mb-2">
             <div className="flex items-center gap-1.5">
               <span className="bg-blue-600 text-white rounded-full p-1"><Heart size={10} fill="white" /></span>
               <span>328</span>
             </div>
             <span>42 comments • 8 shares</span>
          </div>
          <div className="flex items-center justify-around text-slate-500 text-[14px] font-semibold py-1">
            <button className="flex items-center gap-2"><Heart size={18}/> Like</button>
            <button className="flex items-center gap-2"><MessageCircle size={18}/> Comment</button>
            <button className="flex items-center gap-2"><Share size={18}/> Share</button>
          </div>
        </div>
      );
    } else if (key === "youtube") {
      if (isReels) {
        content = (
          <div className="relative w-full aspect-[9/16] bg-gradient-to-b from-[#3b0909] to-[#0f0202] overflow-hidden text-white font-sans rounded-b-xl sm:rounded-b-none">
            {mediaPreview && (
              <img src={mediaPreview} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Media" />
            )}
            <div className="absolute top-4 left-4 font-bold text-[18px] z-10 drop-shadow-md">Shorts</div>
            <div className="absolute top-4 right-4 z-10 drop-shadow-md"><Layout size={24} className="text-white"/></div>
            
            <div className="absolute bottom-20 right-4 flex flex-col items-center gap-5 z-10 drop-shadow-md">
              <div className="flex flex-col items-center gap-1">
                <Heart size={28} className="text-white" />
                <span className="text-[13px] font-medium">8.2K</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Heart size={28} className="text-white rotate-180" />
                <span className="text-[13px] font-medium">Dislike</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <MessageCircle size={28} className="text-white" />
                <span className="text-[13px] font-medium">412</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Share size={28} className="text-white" />
                <span className="text-[13px] font-medium">Share</span>
              </div>
              <MoreHorizontal size={24} className="text-white mt-2" />
            </div>

            <div className="absolute bottom-4 left-4 right-16 z-10 drop-shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden">
                  {pImage ? <img src={pImage} alt="User" /> : <UserIcon className="w-full h-full text-slate-800 p-1.5" />}
                </div>
                <span className="text-[14px] font-bold text-white">{pHandle}</span>
                <button className="bg-red-600 rounded-full px-4 py-1.5 text-[13px] font-bold ml-1">Subscribe</button>
              </div>
              <p className="text-[14px] line-clamp-2 text-white mb-2">{pText}</p>
            </div>
          </div>
        );
      } else {
        content = (
          <div>
            {mediaPreview ? (
               <div className="w-full aspect-video bg-black flex items-center justify-center relative">
                 <img src={mediaPreview} className="w-full h-full object-cover opacity-80" alt="Video cover" />
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-16 h-16 border-2 border-white rounded-full flex items-center justify-center pl-1 backdrop-blur-sm bg-black/20">
                     <Layout size={32} className="text-white" />
                   </div>
                 </div>
               </div>
            ) : (
              <div className="w-full aspect-video bg-black flex items-center justify-center">
                 <Layout size={64} className="text-white/20" />
              </div>
            )}
          </div>
        );
      }
    }

    return (
      <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-fit w-full">
        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-[14px] font-bold text-slate-800">
            {PLATFORM_CONFIG[key as keyof typeof PLATFORM_CONFIG].icon}
            {PLATFORM_CONFIG[key as keyof typeof PLATFORM_CONFIG].name}{isReels && (key === "instagram" ? " · Reel" : key === "youtube" ? " · Short" : "")}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {isReels ? (key === "x" ? "720x1280" : "1080x1920") : key === "youtube" ? "1280x720" : key === "x" ? "1080x1080" : key === "facebook" ? "1080x1080" : key === "linkedin" ? "1200x1200" : "1080x1080"}
          </span>
        </div>
        {content}
      </div>
    );
  };

  const platformsToRender = activeTab === "all" ? Object.keys(PLATFORM_CONFIG) : [activeTab];

  return (
    <div className="flex min-h-screen lg:h-screen w-full flex-col bg-white lg:overflow-hidden text-slate-900 font-sans">
      
      {/* Top Header */}
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-200 px-4 sm:px-6 bg-white z-20 shadow-sm sticky top-0 lg:relative">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
            <ArrowLeft size={20} />
          </Link>
          <span className="logo-script text-[22px] sm:text-[26px]">PinPost</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
          <div className="flex items-center gap-2 bg-slate-50 pl-1.5 sm:pl-2 pr-3 sm:pr-4 py-1.5 rounded-full border border-slate-100">
            <div className="h-6 w-6 rounded-full bg-[#0096d6]/10 text-[#0096d6] flex items-center justify-center text-[12px] font-bold">
              {session?.user?.email?.[0]?.toUpperCase() || "A"}
            </div>
            <span className="text-[12px] sm:text-[13px] font-semibold text-slate-600 hidden sm:block">{session?.user?.email || "amitmaheta2007@gmail.com"}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="w-full lg:w-[400px] xl:w-[500px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col h-auto lg:h-full lg:overflow-y-auto custom-scrollbar p-4 sm:p-6">
          <h2 className="text-[16px] font-bold mb-4 text-slate-800">Compose</h2>
          
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
              {session?.user?.image ? <img src={session.user.image} alt="User" /> : <UserIcon className="w-full h-full text-slate-400 p-1.5" />}
            </div>
            <input 
              value={previewName}
              onChange={(e) => setPreviewName(e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-slate-200 px-2 sm:px-3 py-2 text-[12px] sm:text-[13px] font-medium focus:outline-none focus:border-[#0096d6]"
            />
            <input 
              value={previewHandle}
              onChange={(e) => setPreviewHandle(e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-slate-200 px-2 sm:px-3 py-2 text-[12px] sm:text-[13px] font-medium focus:outline-none focus:border-[#0096d6]"
            />
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your post here..."
            className="w-full h-[120px] sm:h-[140px] resize-none rounded-xl border border-slate-200 p-4 text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0096d6] focus:ring-1 focus:ring-[#0096d6] transition-all mb-3 shadow-sm"
          />

          <div className="flex justify-end mb-5">
            <button 
              onClick={handleEnhance}
              disabled={enhancing || !text.trim()}
              className="flex items-center gap-1.5 text-[12px] font-bold text-[#0096d6] border border-[#0096d6]/30 bg-[#0096d6]/5 rounded-lg px-3 py-2 hover:bg-[#0096d6]/10 transition-colors disabled:opacity-50"
            >
              <Sparkles size={14} /> {enhancing ? "Generating..." : "Enhance with AI"}
            </button>
          </div>



          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center justify-between border border-slate-200 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5">
                <span className="text-[12px] sm:text-[13px] font-medium text-slate-600 truncate mr-1">{config.name}</span>
                <span className="text-[11px] sm:text-[12px] font-semibold text-slate-400 shrink-0">{text.length}/{config.maxChars}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-5">
            <button 
              onClick={() => setFormat("Square")}
              className={`flex-1 rounded-xl border py-2.5 text-[13px] font-bold transition-all ${
                format === "Square" 
                  ? "border-[#0096d6] bg-[#0096d6]/10 text-[#0096d6]" 
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Square (1:1)
            </button>
            <button 
              onClick={() => setFormat("Reels")}
              className={`flex-1 rounded-xl border py-2.5 text-[13px] font-bold transition-all ${
                format === "Reels" 
                  ? "border-[#0096d6] bg-[#0096d6]/10 text-[#0096d6]" 
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Reels (9:16)
            </button>
          </div>

          <label className="flex items-center justify-center gap-2 w-full border border-slate-200 border-dashed rounded-xl py-4 sm:py-5 cursor-pointer hover:bg-slate-50 transition-colors text-slate-600 text-[13px] sm:text-[14px] font-bold">
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
            <ImageIcon size={18} /> Add images or video
          </label>
        </div>

        {/* Right Preview Area */}
        <div className="flex-1 flex flex-col bg-[#f0f8ff] h-auto lg:h-full lg:overflow-hidden">
          
          {/* Tabs */}
          <div className="flex items-center gap-4 sm:gap-6 px-4 sm:px-10 pt-4 sm:pt-6 pb-2 bg-[#f0f8ff] overflow-x-auto whitespace-nowrap scrollbar-hide">
            {(["all", ...Object.keys(PLATFORM_CONFIG)] as Platform[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 shrink-0 text-[13px] sm:text-[14px] font-bold capitalize transition-all border-b-2 ${
                  activeTab === tab 
                    ? "text-[#0096d6] border-[#0096d6]" 
                    : "text-slate-500 border-transparent hover:text-slate-800"
                }`}
              >
                {tab === "all" ? (
                  <span className={`${activeTab === "all" ? "bg-[#0096d6] text-white" : "bg-slate-200 text-slate-600"} px-4 py-1.5 rounded-full text-[12px] sm:text-[13px] font-bold transition-colors`}>All</span>
                ) : (
                  PLATFORM_CONFIG[tab as keyof typeof PLATFORM_CONFIG].name
                )}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-10">
            <div className={`grid gap-6 sm:gap-8 ${activeTab === "all" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 max-w-2xl mx-auto"}`}>
              {platformsToRender.map(renderPlatformCard)}
            </div>
          </div>

        </div>
      </div>

      {/* AI Options Modal */}
      {aiOptions.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={18} className="text-[#0096d6]"/> Choose an AI variation
              </h3>
              <button onClick={() => setAiOptions([])} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
              {aiOptions.map((opt, i) => (
                <div 
                  key={i} 
                  onClick={() => { setText(opt); setAiOptions([]); }}
                  className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] leading-relaxed text-slate-700 cursor-pointer hover:border-[#0096d6] hover:bg-[#0096d6]/5 hover:shadow-md transition-all whitespace-pre-wrap"
                >
                  {opt}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button onClick={() => setAiOptions([])} className="px-5 py-2 text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
