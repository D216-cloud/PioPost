"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon, Upload, MessageCircle, Heart, Share, Repeat2, Bookmark, ThumbsUp, MoreHorizontal, X, BarChart, Sparkles, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const sysFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const MockInstaCard = ({ profile, caption, mediaUrl, isMock = false }: any) => (
  <div className="w-full bg-white border border-[#dbdbdb] rounded-[3px] mb-4 shadow-sm" style={{ fontFamily: sysFont }}>
    <div className="h-[54px] px-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]">
          <div className="w-full h-full rounded-full border-[2px] border-white overflow-hidden bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-[10px] font-bold">
             {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="avatar" /> : profile.name.charAt(0) || 'U'}
          </div>
        </div>
        <span className="text-[13px] font-semibold text-gray-900">{profile.handle.replace('@', '')}</span>
      </div>
      <MoreHorizontal size={18} className="text-gray-900" />
    </div>
    
    <div className="w-full bg-gray-50 flex items-center justify-center overflow-hidden relative" style={{ aspectRatio: '1/1' }}>
       {mediaUrl ? (
          <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Media" />
        ) : (
          <div className="flex flex-col items-center text-gray-400"><ImageIcon size={32}/><span className="text-xs mt-2 font-medium">No image</span></div>
        )}
    </div>

    <div className="px-3 pt-3 pb-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-3">
          <Heart size={22} className={`text-gray-900 transition-colors ${isMock ? '' : 'text-red-500 fill-red-500'}`} />
          <MessageCircle size={22} className="text-gray-900 transform scale-x-[-1]" />
          <Share size={22} className="text-gray-900" />
        </div>
        <Bookmark size={22} className="text-gray-900" />
      </div>
      <div className="text-[13px] font-semibold mb-1">{isMock ? '8,421' : '12'} likes</div>
      <div className="text-[13px] leading-[18px]">
        <span className="font-semibold mr-1.5">{profile.handle.replace('@', '')}</span>
        <span>{caption}</span>
      </div>
      <div className="text-[12px] text-gray-500 mt-1.5">View all comments</div>
      <div className="text-[10px] text-gray-400 uppercase mt-1 tracking-wide">{isMock ? '12 HOURS AGO' : 'JUST NOW'}</div>
    </div>
  </div>
);

const MockLinkedInCard = ({ profile, caption, mediaUrl, isMock = false }: any) => (
  <div className="w-full bg-white border border-[#e0e0e0] rounded-lg mb-4 shadow-sm" style={{ fontFamily: sysFont }}>
    <div className="px-4 pt-3 pb-2 flex items-start gap-2">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0A66C2] to-blue-300 flex items-center justify-center shrink-0 overflow-hidden">
        {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="avatar" /> : <span className="text-white font-bold text-sm">{profile.name.charAt(0) || 'U'}</span>}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex justify-between items-start">
          <span className="text-[14px] font-semibold text-gray-900 truncate">{profile.name}</span>
          <div className="flex items-center gap-1 shrink-0 text-gray-500">
            {isMock && <span className="text-[#0A66C2] text-[13px] font-semibold cursor-pointer hover:underline">+ Follow</span>}
            <MoreHorizontal size={16} className="ml-1" />
          </div>
        </div>
        <span className="text-[11px] text-gray-500 truncate">{isMock ? 'Content Creator | Strategist' : 'PinPost User'}</span>
        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
          <span>{isMock ? '5h' : 'Just now'} • 🌐 Public</span>
        </div>
      </div>
    </div>
    <div className="px-4 pb-2 text-[13px] leading-[1.55] text-gray-900 whitespace-pre-wrap">{caption}</div>
    <div className="w-full bg-[#f3f2ef] flex items-center justify-center overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
      {mediaUrl ? <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Media" /> : <div className="flex flex-col items-center text-gray-400"><ImageIcon size={32}/><span className="text-xs mt-2 font-medium">No image</span></div>}
    </div>
    <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center text-[11px] text-gray-500">
      <div className="flex items-center gap-1"><span>👍❤️🎉</span><span>{isMock ? '1,247' : '1'}</span></div>
      <div>{isMock ? '84 comments • 21 reposts' : '0 comments'}</div>
    </div>
    <div className="px-2 py-1 flex items-center justify-around">
      {[
        { i: <ThumbsUp size={18} className={isMock ? "" : "text-[#0A66C2]"} />, l: 'Like', active: !isMock },
        { i: <MessageCircle size={18} />, l: 'Comment' },
        { i: <Repeat2 size={18} />, l: 'Repost' },
        { i: <Send size={18} />, l: 'Send' }
      ].map(act => (
        <button key={act.l} className={`flex flex-col items-center justify-center p-2 rounded hover:bg-[#f3f2ef] gap-1 flex-1 transition-colors ${act.active ? 'text-[#0A66C2]' : 'text-[#666666]'}`}>
          {act.i}
          <span className="text-[12px] font-semibold">{act.l}</span>
        </button>
      ))}
    </div>
  </div>
);

const MockXCard = ({ profile, caption, mediaUrl, isMock = false }: any) => (
  <div className="w-full bg-black border border-[#2f3336] rounded-xl text-[#e7e9ea] mb-4 shadow-sm" style={{ fontFamily: sysFont }}>
    <div className="p-3">
      <div className="flex gap-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shrink-0 flex items-center justify-center overflow-hidden">
          {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="avatar" /> : <span className="text-white font-bold">{profile.name.charAt(0) || 'U'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1 text-[15px] truncate">
              <span className="font-bold text-white hover:underline cursor-pointer">{profile.name}</span>
              {isMock && <span className="text-[#1d9bf0] text-sm leading-none">✓</span>}
              <span className="text-[#71767b] text-[13px]">{profile.handle} · {isMock ? '3h' : 'now'}</span>
            </div>
            <MoreHorizontal size={16} className="text-[#71767b] ml-2" />
          </div>
          <div className="text-[15px] leading-[1.55] mt-0.5 whitespace-pre-wrap">{caption}</div>
        </div>
      </div>
    </div>
    <div className="mx-[14px] mb-3 rounded-xl border border-[#2f3336] bg-[#16181c] flex items-center justify-center overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
      {mediaUrl ? <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Media" /> : <div className="flex flex-col items-center text-[#71767b]"><ImageIcon size={32}/><span className="text-xs mt-2 font-medium">No image</span></div>}
    </div>
    <div className="px-3 pb-3 flex justify-between items-center text-[#71767b]">
      <div className="flex items-center gap-1.5 hover:text-[#1d9bf0] hover:bg-[rgba(29,161,242,0.1)] rounded-full px-2 py-1 cursor-pointer transition-colors"><MessageCircle size={16} /><span className="text-[13px]">{isMock ? '247' : '0'}</span></div>
      <div className="flex items-center gap-1.5 hover:text-[#00ba7c] hover:bg-[rgba(0,186,124,0.1)] rounded-full px-2 py-1 cursor-pointer transition-colors"><Repeat2 size={16} /><span className="text-[13px]">{isMock ? '1.2K' : '0'}</span></div>
      <div className={`flex items-center gap-1.5 hover:text-[#f91880] hover:bg-[rgba(249,24,128,0.1)] rounded-full px-2 py-1 cursor-pointer transition-colors ${isMock ? '' : 'text-[#f91880]'}`}><Heart size={16} className={isMock ? "" : "fill-[#f91880]"} /><span className="text-[13px]">{isMock ? '8.4K' : '1'}</span></div>
      <div className="flex items-center gap-1.5 hover:text-[#1d9bf0] hover:bg-[rgba(29,161,242,0.1)] rounded-full px-2 py-1 cursor-pointer transition-colors"><BarChart size={16} /><span className="text-[13px]">{isMock ? '94.2K' : '12'}</span></div>
      <div className="hover:text-[#1d9bf0] hover:bg-[rgba(29,161,242,0.1)] rounded-full p-1 cursor-pointer transition-colors"><Bookmark size={16} /></div>
    </div>
  </div>
);

const MockFacebookCard = ({ profile, caption, mediaUrl, isMock = false }: any) => (
  <div className="w-full bg-white border border-[#ddd] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.08)] overflow-hidden mb-4" style={{ fontFamily: sysFont }}>
    <div className="px-4 pt-3 flex items-start gap-2 mb-1.5">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1877F2] to-[#42b0ff] shrink-0 flex items-center justify-center overflow-hidden">
         {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="avatar" /> : <span className="text-white font-bold">{profile.name.charAt(0) || 'U'}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
           <span className="font-bold text-[#050505] text-[14px] hover:underline cursor-pointer">{profile.name}</span>
           <MoreHorizontal size={18} className="text-[#65676b]" />
        </div>
        <div className="text-[12px] text-[#65676b]">{isMock ? '4h' : 'Just now'} • 🌐</div>
      </div>
    </div>
    <div className="px-4 pb-2.5 text-[14px] text-[#050505] leading-[1.6] whitespace-pre-wrap">{caption}</div>
    <div className="w-full bg-[#f0f2f5] flex items-center justify-center relative" style={{ aspectRatio: '1/1' }}>
       {mediaUrl ? <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Media" /> : <div className="flex flex-col items-center text-gray-400"><ImageIcon size={32}/><span className="text-xs mt-2 font-medium">No image</span></div>}
    </div>
    <div className="px-4 py-2.5 border-b border-[#e4e6eb] flex justify-between items-center text-[13px] text-[#65676b]">
      <div>{isMock ? '👍❤️😂 3,821' : '👍 1'}</div>
      <div>{isMock ? '142 comments • 38 shares' : '0 comments'}</div>
    </div>
    <div className="px-2 py-1 flex items-center justify-around">
      {[
        { i: <ThumbsUp size={18} className={isMock ? "" : "text-[#1877F2]"} />, l: 'Like', active: !isMock },
        { i: <MessageCircle size={18} />, l: 'Comment' },
        { i: <Share size={18} />, l: 'Share' }
      ].map(act => (
        <button key={act.l} className={`flex items-center justify-center p-1.5 rounded hover:bg-[#f0f2f5] gap-2 flex-1 font-semibold text-[14px] transition-colors ${act.active ? 'text-[#1877F2]' : 'text-[#65676b]'}`}>
          {act.i}
          <span>{act.l}</span>
        </button>
      ))}
    </div>
  </div>
);

const mockData = {
  instagram: [
    { profile: { name: 'Sarah Jane', handle: '@sarahj', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' }, caption: 'Loving the vibe today! ✨ #summer', mediaUrl: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=600&h=600&fit=crop' },
    { profile: { name: 'Tech Insider', handle: '@techinsider', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' }, caption: 'New gadgets are rolling out next week. What are you most excited for? 🚀', mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=600&fit=crop' }
  ],
  linkedin: [
    { profile: { name: 'Alex Thompson', handle: '@alext', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' }, caption: 'Thrilled to announce my new position as Lead Designer! Looking forward to this new chapter. 🎉', mediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=337&fit=crop' },
    { profile: { name: 'Growth Hackers', handle: '@growth', avatar: '' }, caption: 'Here are 3 ways to optimize your conversion rate today.', mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=337&fit=crop' }
  ],
  x: [
    { profile: { name: 'Web Dev Daily', handle: '@webdev', avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&h=100&fit=crop' }, caption: 'The new JS framework is blazing fast. Have you tried it yet?', mediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=337&fit=crop' },
    { profile: { name: 'Creative Hub', handle: '@creative', avatar: '' }, caption: 'Check out this amazing UI design concept for a smart home app. Thoughts? 👇', mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=337&fit=crop' }
  ],
  facebook: [
    { profile: { name: 'Local News Network', handle: '@news', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' }, caption: 'Community events happening this weekend! Don\'t miss out.', mediaUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=600&fit=crop' },
    { profile: { name: 'Nature Photography', handle: '@nature', avatar: '' }, caption: 'Captured this beautiful sunset over the mountains. 🌄', mediaUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&h=600&fit=crop' }
  ]
};

export function FeedPreview() {
  const { data: session } = useSession();
  const user = session?.user;

  const [platform, setPlatform] = useState("instagram");
  const [caption, setCaption] = useState("Excited to share our newest project! 🚀");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [aiTone, setAiTone] = useState("Professional");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [dbProfile, setDbProfile] = useState<{name?: string, handle?: string, avatar?: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/profile?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data?.data) {
          setDbProfile({
            name: data.data.display_name,
            handle: data.data.handle,
            avatar: data.data.avatar_url
          });
        }
      })
      .catch(console.error);
  }, [user]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setMediaFile(file);
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
        body: JSON.stringify({ text: caption, tone: aiTone })
      });

      if (!response.ok) throw new Error(`API error ${response.status}`);

      const data = await response.json();
      if (data?.text) {
        setCaption(data.text);
      } else if (data?.options && data.options.length > 0) {
        setCaption(data.options[0]);
      }
    } catch (e) {
      console.error("AI Enhance failed:", e);
      setCaption(`[${aiTone} tone] ✨\n${caption}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user?.id) return;
    if (!caption.trim()) {
      toast.error("Please add a caption before saving.");
      return;
    }
    try {
      const title = caption.length > 30 ? caption.substring(0, 30) + "..." : caption;
      
      let fetchOptions: RequestInit;

      if (mediaFile) {
        const formData = new FormData();
        formData.append("userId", user.id);
        formData.append("title", title);
        formData.append("text", caption);
        formData.append("format_key", "post_square");
        formData.append("file", mediaFile);

        fetchOptions = { method: "POST", body: formData };
      } else {
        fetchOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            title,
            text: caption,
            format_key: 'post_square'
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

  const platforms = [
    { id: "instagram", name: "Instagram", color: "#E1306C" },
    { id: "linkedin", name: "LinkedIn", color: "#0A66C2" },
    { id: "x", name: "X (Twitter)", color: "#000000" },
    { id: "facebook", name: "Facebook", color: "#1877F2" }
  ];

  const profile = {
    name: dbProfile?.name || user?.name || "Your Name",
    handle: dbProfile?.handle || `@${(user?.name || "yourhandle").replace(/\s+/g, '').toLowerCase()}`,
    avatar: dbProfile?.avatar || user?.image || ""
  };

  const renderFeed = () => {
    const mocks = mockData[platform as keyof typeof mockData] || mockData.instagram;
    const CardComp = platform === 'instagram' ? MockInstaCard : platform === 'linkedin' ? MockLinkedInCard : platform === 'x' ? MockXCard : MockFacebookCard;

    return (
      <div className="flex flex-col items-center w-full pb-20">
        {/* Mock Post 1 */}
        <CardComp profile={mocks[0].profile} caption={mocks[0].caption} mediaUrl={mocks[0].mediaUrl} isMock={true} />
        
        {/* User Post */}
        <div className="relative w-full group my-2">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#0ea5e9]/20 to-purple-500/20 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
          
          {/* Label indicator */}
          <div className="absolute -left-14 top-1/2 -translate-y-1/2 flex items-center">
            <span className="bg-[#0ea5e9] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm rotate-[-90deg] uppercase tracking-widest whitespace-nowrap">Your Post</span>
          </div>
          
          <div className="relative transform transition-transform group-hover:scale-[1.01] duration-300">
             <CardComp profile={profile} caption={caption} mediaUrl={mediaUrl} isMock={false} />
          </div>
        </div>

        {/* Mock Post 2 */}
        <CardComp profile={mocks[1].profile} caption={mocks[1].caption} mediaUrl={mocks[1].mediaUrl} isMock={true} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 transition-all shadow-sm group">
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/" className="logo-script text-[26px] text-slate-900">
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

      <div className="mx-auto max-w-6xl px-6 py-12 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold text-slate-900 tracking-tight">Feed Preview</h1>
            <p className="text-[14px] text-slate-500 font-medium uppercase tracking-widest mt-1">See your post in the wild</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Controls - Left Side */}
          <div className="w-full lg:w-[400px] flex-shrink-0 space-y-8 sticky top-32">
            <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
              <h2 className="text-[18px] font-bold text-slate-900 mb-6">Setup Post</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Platform</label>
                  <div className="grid grid-cols-2 gap-3">
                    {platforms.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setPlatform(p.id)}
                        className={`flex items-center gap-2 py-3 px-4 rounded-xl border text-[13px] font-bold transition-all ${platform === p.id ? 'border-[#0ea5e9] bg-[#0ea5e9]/10 text-[#0ea5e9] shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></div>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Image</label>
                  <input type="file" ref={fileInputRef} onChange={handleMediaUpload} accept="image/*,video/*" className="hidden" />
                  {!mediaUrl ? (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-200 rounded-2xl py-8 flex flex-col items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-500"
                    >
                      <Upload size={24} />
                      <span className="text-[13px] font-bold">Upload Media</span>
                    </button>
                  ) : (
                    <div className="relative w-full h-[160px] rounded-2xl overflow-hidden border border-slate-200 group shadow-inner">
                      <img src={mediaUrl} className="w-full h-full object-cover" alt="Uploaded media" />
                      <button 
                        onClick={() => setMediaUrl('')}
                        className="absolute top-2 right-2 bg-slate-900/60 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Caption</label>
                    <select 
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="text-[11px] font-bold bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-2 py-1 outline-none focus:border-[#0ea5e9]/50"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Casual">Casual</option>
                      <option value="Witty">Witty</option>
                      <option value="Inspiring">Inspiring</option>
                    </select>
                  </div>
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    rows={4}
                    className="w-full border border-slate-200 rounded-2xl p-4 text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9]/30 transition-all bg-slate-50/50"
                  />
                  <button 
                    onClick={handleEnhance}
                    disabled={isEnhancing || !caption.trim()}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-[13px] font-bold hover:bg-black transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Sparkles size={16} className={isEnhancing ? "animate-pulse text-[#0ea5e9]" : "text-[#0ea5e9]"} />
                    {isEnhancing ? "Enhancing..." : "Enhance with AI"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feed Simulator - Right Side */}
          <div className="flex-1 flex justify-center w-full bg-slate-100/50 rounded-[3rem] py-10 px-4 sm:px-12 border border-slate-100/80 shadow-inner overflow-hidden relative">
            <div className="w-full max-w-[470px] space-y-6">
              
              {/* Sticky Platform Badge */}
              <div className="sticky top-0 z-20 flex justify-center mb-6 pointer-events-none pt-2">
                <span className="bg-slate-900/90 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg uppercase tracking-widest backdrop-blur-md">
                  {platforms.find(p => p.id === platform)?.name} Feed
                </span>
              </div>

              {/* Render Feed */}
              {renderFeed()}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
