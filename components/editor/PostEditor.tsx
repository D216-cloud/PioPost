"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Heart, MessageCircle, Send, Bookmark, ThumbsUp, Repeat2, 
  BarChart, Music, Upload, X, Check, ChevronDown, Sparkles, 
  Image as Photo, Share, MoreHorizontal, ArrowLeft 
} from 'lucide-react';
import { toast } from "sonner";

type Format = 'square' | 'portrait' | 'reels';
type PlatformId = 'instagram' | 'linkedin' | 'x' | 'facebook';

interface Profile {
  name: string;
  handle: string;
  bio: string;
  avatar?: string;
}

const sysFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const InstagramCard = ({ profile, caption, mediaUrl, format }: { profile: Profile, caption: string, mediaUrl: string, format: Format }) => {
  const isReels = format === 'reels';
  const ratioStr = format === 'square' ? '1/1' : format === 'portrait' ? '4/5' : '9/16';
  const maxH = format === 'square' ? '300px' : format === 'portrait' ? '340px' : '420px';

  if (isReels) {
    return (
      <div className="w-full max-w-[380px] bg-black text-white relative rounded-[3px] overflow-hidden" style={{ fontFamily: sysFont }}>
        <div className="w-full relative flex items-center justify-center bg-gray-900" style={{ aspectRatio: ratioStr, maxHeight: maxH }}>
          {mediaUrl ? (
            <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Media" />
          ) : (
            <div className="flex flex-col items-center opacity-50"><Photo size={32}/><span className="text-xs mt-2">No image</span></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent h-[45%] top-auto"></div>
          
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] p-[1px]">
              <div className="w-full h-full rounded-full border border-black bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center overflow-hidden">
                {profile.avatar ? (
                  <img src={profile.avatar} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  <span className="text-[10px] font-bold text-white">{profile.name.charAt(0) || 'U'}</span>
                )}
              </div>
            </div>
            <span className="text-[13px] font-semibold drop-shadow-md">{profile.handle || '@handle'}</span>
            <button className="border border-white/70 rounded px-2 py-0.5 text-[11px] font-semibold ml-1 bg-transparent drop-shadow-md">Follow</button>
          </div>

          <div className="absolute bottom-[60px] right-3 flex flex-col gap-4 items-center z-10 drop-shadow-md">
            <div className="flex flex-col items-center gap-1"><Heart size={24} /><span className="text-[11px] font-medium">8.4K</span></div>
            <div className="flex flex-col items-center gap-1"><MessageCircle size={24} className="transform scale-x-[-1]" /><span className="text-[11px] font-medium">247</span></div>
            <div className="flex flex-col items-center gap-1"><Share size={24} /><span className="text-[11px] font-medium">1.2K</span></div>
          </div>

          <div className="absolute bottom-4 left-4 right-16 flex flex-col gap-1.5 z-10 drop-shadow-md">
            <span className="text-[12px] font-semibold">{profile.handle || '@handle'}</span>
            <p className="text-[13px] line-clamp-2 leading-tight">{caption}</p>
            <div className="flex items-center gap-1.5 mt-1 opacity-80">
              <Music size={12} />
              <span className="text-[11px]">Original Audio · {profile.handle || '@handle'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[380px] bg-white border border-[#dbdbdb] rounded-[3px]" style={{ fontFamily: sysFont }}>
      <div className="h-[54px] px-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]">
            <div className="w-full h-full rounded-full border-[2px] border-white overflow-hidden bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-[10px] font-bold">
              {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="avatar" /> : profile.name.charAt(0) || 'U'}
            </div>
          </div>
          <span className="text-[13px] font-semibold text-gray-900">{(profile.handle || '@handle').replace('@', '')}</span>
        </div>
        <MoreHorizontal size={18} className="text-gray-900" />
      </div>
      
      <div className="w-full bg-gray-50 flex items-center justify-center overflow-hidden relative" style={{ aspectRatio: ratioStr, maxHeight: maxH }}>
         {mediaUrl ? (
            <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Media" />
          ) : (
            <div className="flex flex-col items-center text-gray-400"><Photo size={32}/><span className="text-xs mt-2">No image</span></div>
          )}
      </div>

      <div className="px-3 pt-3 pb-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-3">
            <Heart size={22} className="text-gray-900" />
            <MessageCircle size={22} className="text-gray-900 transform scale-x-[-1]" />
            <Share size={22} className="text-gray-900" />
          </div>
          <Bookmark size={22} className="text-gray-900" />
        </div>
        <div className="text-[13px] font-semibold mb-1">2,451 likes</div>
        <div className="text-[13px] leading-[18px]">
          <span className="font-semibold mr-1.5">{(profile.handle || '@handle').replace('@', '')}</span>
          <span>{caption}</span>
        </div>
        <div className="text-[12px] text-gray-500 mt-1.5">View all 48 comments</div>
        <div className="text-[10px] text-gray-400 uppercase mt-1">2 hours ago</div>
      </div>
    </div>
  );
};

const LinkedInCard = ({ profile, caption, mediaUrl, format }: { profile: Profile, caption: string, mediaUrl: string, format: Format }) => {
  const isReels = format === 'reels';
  const ratioStr = isReels ? '9/16' : '16/9';
  const maxH = isReels ? '380px' : '180px';

  return (
    <div className="w-full max-w-[380px] bg-white border border-[#e0e0e0] rounded-lg" style={{ fontFamily: sysFont }}>
      <div className="px-4 pt-3 pb-2 flex items-start gap-2">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0A66C2] to-blue-300 flex items-center justify-center shrink-0 overflow-hidden">
          {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="avatar" /> : <span className="text-white font-bold text-sm">{profile.name.charAt(0) || 'U'}</span>}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex justify-between items-start">
            <span className="text-[14px] font-semibold text-gray-900 truncate">{profile.name || 'User Name'}</span>
            <div className="flex items-center gap-1 shrink-0 text-gray-500">
              <span className="text-[#0A66C2] text-[13px] font-semibold cursor-pointer">+ Follow</span>
              <MoreHorizontal size={16} className="ml-1" />
            </div>
          </div>
          <span className="text-[11px] text-gray-500 truncate">{profile.bio || 'Bio'}</span>
          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
            <span>2h • 🌐 Public</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-2 text-[13px] leading-[1.55] text-gray-900 whitespace-pre-wrap">
        {caption.length > 150 ? (
          <>{caption.substring(0, 150)}<span className="text-[#0A66C2] hover:underline cursor-pointer">...see more</span></>
        ) : caption}
      </div>

      <div className="w-full bg-[#f3f2ef] flex items-center justify-center overflow-hidden relative" style={{ aspectRatio: ratioStr, maxHeight: maxH }}>
        {mediaUrl ? (
          <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Media" />
        ) : (
          <div className="flex flex-col items-center text-gray-400"><Photo size={32}/><span className="text-xs mt-2">No image</span></div>
        )}
      </div>

      <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center text-[11px] text-gray-500">
        <div className="flex items-center gap-1">
          <span>👍❤️🎉</span>
          <span>1,247</span>
        </div>
        <div>84 comments • 21 reposts</div>
      </div>

      <div className="px-2 py-1 flex items-center justify-around">
        {[
          { i: <ThumbsUp size={18} />, l: 'Like' },
          { i: <MessageCircle size={18} />, l: 'Comment' },
          { i: <Repeat2 size={18} />, l: 'Repost' },
          { i: <Send size={18} />, l: 'Send' }
        ].map(act => (
          <button key={act.l} className="flex flex-col items-center justify-center p-2 rounded hover:bg-[#f3f2ef] text-[#666666] gap-1 flex-1 transition-colors">
            {act.i}
            <span className="text-[12px] font-semibold">{act.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const XCard = ({ profile, caption, mediaUrl, format }: { profile: Profile, caption: string, mediaUrl: string, format: Format }) => {
  const ratioStr = format === 'square' ? '1/1' : format === 'portrait' ? '4/5' : '9/16';
  const maxH = format === 'square' ? '300px' : format === 'portrait' ? '340px' : '420px';

  return (
    <div className="w-full max-w-[380px] bg-black border border-[#2f3336] rounded-xl text-[#e7e9ea]" style={{ fontFamily: sysFont }}>
      <div className="p-3">
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shrink-0 flex items-center justify-center overflow-hidden">
            {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="avatar" /> : <span className="text-white font-bold">{profile.name.charAt(0) || 'U'}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1 text-[15px] truncate">
                <span className="font-bold text-white">{profile.name || 'User Name'}</span>
                <span className="text-[#1d9bf0] text-sm leading-none">✓</span>
                <span className="text-[#71767b] text-[13px]">{profile.handle || '@handle'} · 2h</span>
              </div>
              <MoreHorizontal size={16} className="text-[#71767b] ml-2" />
            </div>
            <div className="text-[15px] leading-[1.55] mt-0.5 whitespace-pre-wrap">{caption}</div>
          </div>
        </div>
      </div>
      
      <div className="mx-[14px] mb-3 rounded-xl border border-[#2f3336] bg-[#16181c] flex items-center justify-center overflow-hidden relative" style={{ aspectRatio: ratioStr, maxHeight: maxH }}>
        {mediaUrl ? (
          <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Media" />
        ) : (
          <div className="flex flex-col items-center text-[#71767b]"><Photo size={32}/><span className="text-xs mt-2">No image</span></div>
        )}
      </div>

      <div className="px-3 pb-3 flex justify-between items-center text-[#71767b]">
        <div className="flex items-center gap-1.5 hover:text-[#1d9bf0] hover:bg-[rgba(29,161,242,0.1)] rounded-full px-2 py-1 cursor-pointer transition-colors"><MessageCircle size={16} /><span className="text-[13px]">247</span></div>
        <div className="flex items-center gap-1.5 hover:text-[#00ba7c] hover:bg-[#00ba7c]/10 rounded-full px-2 py-1 cursor-pointer transition-colors"><Repeat2 size={16} /><span className="text-[13px]">1.2K</span></div>
        <div className="flex items-center gap-1.5 hover:text-[#f91880] hover:bg-[#f91880]/10 rounded-full px-2 py-1 cursor-pointer transition-colors"><Heart size={16} /><span className="text-[13px]">8.4K</span></div>
        <div className="flex items-center gap-1.5 hover:text-[#1d9bf0] hover:bg-[rgba(29,161,242,0.1)] rounded-full px-2 py-1 cursor-pointer transition-colors"><BarChart size={16} /><span className="text-[13px]">94.2K</span></div>
        <div className="hover:text-[#1d9bf0] hover:bg-[rgba(29,161,242,0.1)] rounded-full p-1 cursor-pointer transition-colors"><Bookmark size={16} /></div>
      </div>
    </div>
  );
};

const FacebookCard = ({ profile, caption, mediaUrl, format }: { profile: Profile, caption: string, mediaUrl: string, format: Format }) => {
  const ratioStr = format === 'square' ? '1/1' : format === 'portrait' ? '4/5' : '9/16';
  const maxH = format === 'square' ? '300px' : format === 'portrait' ? '340px' : '420px';

  return (
    <div className="w-full max-w-[380px] bg-white border border-[#ddd] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.08)] overflow-hidden" style={{ fontFamily: sysFont }}>
      <div className="px-4 pt-3 flex items-start gap-2 mb-1.5">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1877F2] to-[#42b0ff] shrink-0 flex items-center justify-center overflow-hidden">
           {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="avatar" /> : <span className="text-white font-bold">{profile.name.charAt(0) || 'U'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
             <span className="font-bold text-[#050505] text-[14px]">{profile.name || 'User Name'}</span>
             <MoreHorizontal size={18} className="text-[#65676b]" />
          </div>
          <div className="text-[12px] text-[#65676b]">2h • 🌐</div>
        </div>
      </div>

      <div className="px-4 pb-2.5 text-[14px] text-[#050505] leading-[1.6] whitespace-pre-wrap">{caption}</div>

      <div className="w-full bg-[#f0f2f5] flex items-center justify-center relative" style={{ aspectRatio: ratioStr, maxHeight: maxH }}>
         {mediaUrl ? (
            <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Media" />
          ) : (
            <div className="flex flex-col items-center text-gray-400"><Photo size={32}/><span className="text-xs mt-2">No image</span></div>
          )}
      </div>

      <div className="px-4 py-2.5 border-b border-[#e4e6eb] flex justify-between items-center text-[13px] text-[#65676b]">
        <div>👍❤️😂 3,821</div>
        <div>142 comments • 38 shares</div>
      </div>

      <div className="px-2 py-1 flex items-center justify-around">
        {[
          { i: <ThumbsUp size={18} />, l: 'Like' },
          { i: <MessageCircle size={18} />, l: 'Comment' },
          { i: <Share size={18} />, l: 'Share' }
        ].map(act => (
          <button key={act.l} className="flex items-center justify-center p-1.5 rounded hover:bg-[#f0f2f5] text-[#65676b] gap-2 flex-1 font-semibold text-[14px] transition-colors">
            {act.i}
            <span>{act.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
};


export function PostEditor() {
  const { data: session } = useSession();
  const user = session?.user;
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");

  const [state, setState] = useState({
    profile: { name: '', handle: '', bio: '', avatar: '' },
    caption: '',
    format: 'square' as Format,
    mediaUrl: '',
    mediaFile: null as File | null,
    platforms: ['instagram', 'linkedin', 'x', 'facebook'] as PlatformId[],
    aiTone: 'Professional'
  });

  useEffect(() => {
    if (!user?.id) return;
    
    // Fetch profile
    fetch(`/api/profile?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data?.data) {
          setState(s => ({
            ...s,
            profile: {
              ...s.profile,
              name: data.data.display_name || user.name || '',
              handle: data.data.handle || '',
              avatar: data.data.avatar_url || user.image || ''
            }
          }));
        } else {
          setState(s => ({
            ...s,
            profile: { ...s.profile, name: user.name || '', avatar: user.image || '' }
          }));
        }
      })
      .catch(console.error);

    // Fetch draft if exists
    if (draftId) {
      fetch(`/api/draft?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data?.data) {
            const draft = data.data.find((d: any) => d.id === draftId);
            if (draft) {
              setState(s => ({
                ...s,
                caption: draft.text || '',
                format: draft.format_key.replace('post_', '') as Format,
                mediaUrl: draft.thumbnailUrl || ''
              }));
            }
          }
        })
        .catch(console.error);
    }
  }, [user, draftId]);

  const [sectionsOpen, setSectionsOpen] = useState({
    profile: true,
    content: true,
    format: true,
    media: true,
    platforms: true
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePlatform = (id: PlatformId) => {
    setState(s => ({
      ...s,
      platforms: s.platforms.includes(id) 
        ? s.platforms.filter(p => p !== id) 
        : [...s.platforms, id]
    }));
  };

  const toggleSection = (key: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setState(s => ({ ...s, mediaUrl: url, mediaFile: file }));
    }
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: state.caption,
          tone: state.aiTone
        })
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const data = await response.json();
      if (data?.text) {
        setState(s => ({ ...s, caption: data.text }));
      } else if (data?.options && data.options.length > 0) {
        setState(s => ({ ...s, caption: data.options[0] }));
      }
    } catch (e) {
      console.error("AI Enhance failed:", e);
      setState(s => ({ ...s, caption: `[${s.aiTone} tone] ✨\n${s.caption}` }));
    } finally {
      setIsEnhancing(false);
      setIsAiModalOpen(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user?.id) return;
    if (!state.caption.trim()) {
      toast.error("Please add a caption before saving.");
      return;
    }
    try {
      const title = state.caption.length > 30 ? state.caption.substring(0, 30) + "..." : state.caption;
      
      let fetchOptions: RequestInit;
      
      if (state.mediaFile) {
        const formData = new FormData();
        formData.append("userId", user.id);
        formData.append("title", title);
        formData.append("text", state.caption);
        formData.append("format_key", `post_${state.format}`);
        formData.append("file", state.mediaFile);
        
        fetchOptions = { method: "POST", body: formData };
      } else {
        fetchOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            title,
            text: state.caption,
            format_key: `post_${state.format}`
          })
        };
      }

      const res = await fetch("/api/draft", fetchOptions);
      if (!res.ok) throw new Error("Failed to save draft");
      toast.success("Draft saved successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save draft.");
    }
  };

  const maxChars = 2200;
  const charsUsed = state.caption.length;
  const fillPct = Math.min(charsUsed / maxChars, 1);
  const ringColor = fillPct > 0.9 ? 'stroke-red-500' : fillPct > 0.7 ? 'stroke-amber-500' : 'stroke-green-500';
  const radius = 7;
  const circumference = 43.98;
  const strokeDashoffset = circumference - fillPct * circumference;

  const SectionHeader = ({ title, sectionKey }: { title: string, sectionKey: keyof typeof sectionsOpen }) => (
    <div 
      className="flex items-center justify-between py-3 cursor-pointer select-none"
      onClick={() => toggleSection(sectionKey)}
    >
      <span className="font-semibold text-[13px] text-gray-800">{title}</span>
      <ChevronDown 
        size={16} 
        className={`text-gray-400 transition-transform duration-200 ${sectionsOpen[sectionKey] ? 'rotate-180' : ''}`} 
      />
    </div>
  );

  return (
    <div className="flex flex-col w-full h-[100vh] overflow-hidden bg-[#fcfcfd] text-[14px] font-sans">
      
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md shrink-0">
        <nav className="flex w-full items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 transition-all shadow-sm group">
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/" className="logo-script text-[24px] text-slate-900">
              PinPost
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleSaveDraft} className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">Save Draft</button>
            <div className="flex items-center gap-2.5 bg-slate-50 pl-2 pr-5 py-1.5 rounded-full border border-slate-100 shadow-sm">
              <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[12px] font-bold uppercase shadow-sm">
                {user?.email?.[0] || "A"}
              </div>
              <span className="text-[13px] font-bold text-slate-600 truncate max-w-[150px]">{user?.email || "amitmaheta2007@gmail.com"}</span>
            </div>
          </div>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden w-full">
      
      {/* LEFT PANEL */}
      <div className="w-[272px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full z-10">
        <div className="h-14 border-b border-gray-200 flex items-center px-4 shrink-0 bg-white sticky top-0">
          <span className="font-bold text-[15px] text-gray-900">Post Editor</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          
          <SectionHeader title="Profile" sectionKey="profile" />
          {sectionsOpen.profile && (
            <div className="flex flex-col gap-3 pb-4">
              <input 
                type="text" 
                value={state.profile.name} 
                onChange={e => setState(s => ({ ...s, profile: { ...s.profile, name: e.target.value } }))}
                placeholder="Full name"
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:border-blue-500 transition-colors"
              />
              <input 
                type="text" 
                value={state.profile.handle} 
                onChange={e => setState(s => ({ ...s, profile: { ...s.profile, handle: e.target.value } }))}
                placeholder="@handle"
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:border-blue-500 transition-colors"
              />
              <input 
                type="text" 
                value={state.profile.bio} 
                onChange={e => setState(s => ({ ...s, profile: { ...s.profile, bio: e.target.value } }))}
                placeholder="Headline / bio"
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}
          <div className="border-b border-gray-100"></div>

          <SectionHeader title="Content" sectionKey="content" />
          {sectionsOpen.content && (
            <div className="pb-4 flex flex-col gap-2">
              <div className="relative">
                <textarea
                  value={state.caption}
                  onChange={e => setState(s => ({ ...s, caption: e.target.value }))}
                  placeholder="What do you want to share?"
                  rows={5}
                  maxLength={maxChars}
                  className="w-full border border-gray-200 rounded-md p-3 text-[13px] resize-none focus:outline-none focus:border-blue-500 transition-colors"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white px-1">
                  <span className="text-[10px] text-gray-400 font-medium">{maxChars - charsUsed}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" className="transform -rotate-90">
                    <circle cx="8" cy="8" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="2" />
                    <circle 
                      cx="8" cy="8" r={radius} fill="none" 
                      strokeWidth="2" 
                      className={`${ringColor} transition-all duration-300`}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
              <button
                disabled={!state.caption.trim()}
                onClick={() => setIsAiModalOpen(true)}
                className={`w-full py-2 rounded-md flex items-center justify-center gap-2 text-[13px] font-medium transition-colors ${
                  state.caption.trim() ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Sparkles size={14} /> Enhance with AI
              </button>
            </div>
          )}
          <div className="border-b border-gray-100"></div>

          <SectionHeader title="Format" sectionKey="format" />
          {sectionsOpen.format && (
            <div className="pb-4 grid grid-cols-3 gap-2">
              {[
                { id: 'square', label: 'Square', tw: 'w-4 h-4' },
                { id: 'portrait', label: 'Portrait', tw: 'w-3.5 h-[18px]' },
                { id: 'reels', label: 'Reels', tw: 'w-3 h-5' },
              ].map(fmt => {
                const isActive = state.format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setState(s => ({ ...s, format: fmt.id as Format }))}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-md border text-[11px] font-medium transition-colors ${
                      isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`border-[2px] rounded-[2px] ${fmt.tw} transition-colors ${isActive ? 'border-blue-500 bg-blue-100' : 'border-gray-400'}`}></div>
                    <span>{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="border-b border-gray-100"></div>

          <SectionHeader title="Media" sectionKey="media" />
          {sectionsOpen.media && (
            <div className="pb-4">
              <input type="file" ref={fileInputRef} onChange={handleMediaChange} accept="image/*,video/*" className="hidden" />
              {!state.mediaUrl ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-md py-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <Upload size={20} className="text-gray-400" />
                  <span className="text-[12px] text-gray-500 font-medium">Click to upload media</span>
                </div>
              ) : (
                <div className="relative w-full h-[100px] rounded-md overflow-hidden border border-gray-200 group">
                  <img src={state.mediaUrl} className="w-full h-full object-cover" alt="Uploaded" />
                  <button 
                    onClick={() => setState(s => ({ ...s, mediaUrl: '' }))}
                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="border-b border-gray-100"></div>

          <SectionHeader title="Platforms" sectionKey="platforms" />
          {sectionsOpen.platforms && (
            <div className="pb-4 flex flex-col gap-3">
              {[
                { id: 'instagram', label: 'Instagram', color: '#E1306C' },
                { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
                { id: 'x', label: 'X', color: '#888888' },
                { id: 'facebook', label: 'Facebook', color: '#1877F2' },
              ].map(plat => {
                const isActive = state.platforms.includes(plat.id as PlatformId);
                return (
                  <div key={plat.id} className="flex items-center justify-between cursor-pointer group" onClick={() => togglePlatform(plat.id as PlatformId)}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plat.color }}></div>
                      <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{plat.label}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isActive ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {isActive && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0 z-10 shrink-0">
          <button className="w-full bg-[#111827] hover:bg-black text-white font-medium py-2.5 rounded-md text-[13px] transition-all shadow-sm">
            Publish to {state.platforms.length} platform{state.platforms.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL - PREVIEWS */}
      <div className="flex-1 flex flex-col bg-[#f9fafb] relative overflow-hidden">
        
        <div className="h-14 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <h2 className="font-bold text-[14px] text-gray-900">Live Preview</h2>
            <span className="text-[11px] text-gray-500 capitalize">{state.format} · {state.format === 'square' ? '1:1' : state.format === 'portrait' ? '4:5' : '9:16'} · {state.platforms.length} platforms</span>
          </div>
          <div className="flex items-center gap-1.5">
            {state.platforms.map(p => (
              <span key={p} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-full capitalize border border-gray-200">
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            
            {state.platforms.includes('instagram') && (
              <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto">
                <div className="flex items-center gap-1.5 px-1">
                  <div className="w-2 h-2 rounded-full bg-[#E1306C]"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Instagram</span>
                </div>
                <InstagramCard profile={state.profile} caption={state.caption} mediaUrl={state.mediaUrl} format={state.format} />
              </div>
            )}
            
            {state.platforms.includes('linkedin') && (
              <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto">
                <div className="flex items-center gap-1.5 px-1">
                  <div className="w-2 h-2 rounded-full bg-[#0A66C2]"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">LinkedIn</span>
                </div>
                <LinkedInCard profile={state.profile} caption={state.caption} mediaUrl={state.mediaUrl} format={state.format} />
              </div>
            )}
            
            {state.platforms.includes('x') && (
              <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto">
                <div className="flex items-center gap-1.5 px-1">
                  <div className="w-2 h-2 rounded-full bg-[#888888]"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">X</span>
                </div>
                <XCard profile={state.profile} caption={state.caption} mediaUrl={state.mediaUrl} format={state.format} />
              </div>
            )}
            
            {state.platforms.includes('facebook') && (
              <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto">
                <div className="flex items-center gap-1.5 px-1">
                  <div className="w-2 h-2 rounded-full bg-[#1877F2]"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Facebook</span>
                </div>
                <FacebookCard profile={state.profile} caption={state.caption} mediaUrl={state.mediaUrl} format={state.format} />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-[2px] transition-all">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-5 w-full max-w-[320px] flex flex-col gap-4">
            <div>
              <h3 className="font-medium text-[14px] text-gray-900">Enhance with AI</h3>
              <p className="text-[12px] text-gray-500 mt-1">Select a tone to rewrite your caption.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {['Professional', 'Casual', 'Witty', 'Inspiring', 'Urgent', 'Storytelling'].map(tone => {
                const isActive = state.aiTone === tone;
                return (
                  <button
                    key={tone}
                    onClick={() => setState(s => ({ ...s, aiTone: tone }))}
                    className={`py-2 px-2 text-[12px] rounded-md border text-center transition-colors ${
                      isActive ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tone}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="flex-1 py-2 text-[13px] font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEnhance}
                disabled={isEnhancing}
                className="flex-1 py-2 text-[13px] font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-70 flex items-center justify-center transition-colors"
              >
                {isEnhancing ? 'Enhancing...' : 'Enhance caption'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
