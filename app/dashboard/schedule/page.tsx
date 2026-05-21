"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Calendar as CalendarIcon,
  Video,
  Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";

export default function SchedulePage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", session.user.id);
      
      if (error) toast.error("Failed to load schedule");
      else setVideos(data || []);
      setLoading(false);
    };

    fetchVideos();

    const channel = supabase
      .channel('schedule-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos', filter: `user_id=eq.${session.user.id}` }, 
      (payload) => {
        if (payload.eventType === 'INSERT') setVideos(prev => [...prev, payload.new]);
        else if (payload.eventType === 'UPDATE') setVideos(prev => prev.map(v => v.id === payload.new.id ? payload.new : v));
        else if (payload.eventType === 'DELETE') setVideos(prev => prev.filter(v => v.id === payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
  };

  const isSelected = (day: number) => {
    return selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
  };

  const getVideosForDay = (day: number) => {
    return videos.filter(v => {
      const date = new Date(v.scheduled_at);
      return date.getDate() === day && date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
    });
  };

  const selectedDayVideos = videos.filter(v => {
    const date = new Date(v.scheduled_at);
    return date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
  }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-[95%] max-w-6xl px-4 md:px-8 pt-28 pb-16 md:pb-20 space-y-12 md:space-y-16 animate-in fade-in duration-700">
        {/* Header - Aligned with the provided image */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 tracking-tight">Schedule</h1>
            <p className="text-[14px] md:text-[16px] text-slate-500 font-medium">All your upcoming reel posts.</p>
          </div>
          <Link 
            href="/dashboard/create"
            className="w-full md:w-auto bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-6 py-3 rounded-xl text-[14px] md:text-[15px] font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            Create new reel
          </Link>
        </div>

        {/* Top Grid - Calendar & Day Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar Picker Card */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200/60 p-6 md:p-10 shadow-sm flex flex-col items-center">
            <div className="flex items-center justify-between w-full max-w-[300px] mb-8">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronLeft size={20} /></button>
              <div className="text-[16px] font-bold text-slate-900">{monthName} {currentDate.getFullYear()}</div>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronRight size={20} /></button>
            </div>
            
            <div className="grid grid-cols-7 w-full max-w-[300px] gap-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="h-10 flex items-center justify-center text-[13px] font-medium text-slate-300">{day}</div>
              ))}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const active = isSelected(day);
                const hasVideos = getVideosForDay(day).length > 0;
                
                return (
                  <button 
                    key={day}
                    onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    className={`h-10 w-full rounded-lg text-[14px] font-medium transition-all relative flex items-center justify-center
                      ${active ? 'bg-[#8B5CF6] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}
                      ${hasVideos && !active ? 'after:content-[""] after:absolute after:bottom-1 after:w-1 after:h-1 after:bg-[#8B5CF6] after:rounded-full' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Details Card */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200/60 p-6 md:p-8 shadow-sm flex flex-col space-y-6">
            <h3 className="text-[18px] font-bold text-slate-900 border-b border-slate-50 pb-4">
              {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
              {selectedDayVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-3">
                  <Video size={32} />
                  <p className="text-[14px] font-medium">No posts for this day</p>
                </div>
              ) : (
                selectedDayVideos.map(video => (
                  <div key={video.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 group hover:border-slate-200 transition-all">
                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-100">
                      <img src={video.thumbnail_url} className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-bold text-slate-900 truncate">{video.title}</h4>
                      <p className="text-[12px] text-slate-400 font-medium">{new Date(video.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-400">
                       {video.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Card - Upcoming Queue */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200/60 p-6 md:p-8 shadow-sm space-y-8">
           <div className="flex items-center gap-3 text-[#8B5CF6]">
              <CalendarIcon size={20} />
              <h3 className="text-[18px] font-bold text-slate-900">Upcoming queue</h3>
           </div>
           
           <div className="space-y-4">
              {videos.filter(v => new Date(v.scheduled_at) > new Date()).slice(0, 5).map(video => (
                <div key={video.id} className="flex items-center gap-6 p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                   <div className="w-20 aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-100">
                      <img src={video.thumbnail_url} className="w-full h-full object-cover opacity-80" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-[15px] font-bold text-slate-900 truncate">{video.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-slate-400">
                         <Clock size={12} />
                         <span className="text-[12px] font-medium">{new Date(video.scheduled_at).toLocaleDateString()} — {new Date(video.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                   </div>
                   <div className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500">
                      {video.status}
                   </div>
                </div>
              ))}
              {videos.length === 0 && (
                <div className="py-12 text-center text-slate-300">
                   <p className="text-[14px] font-medium">Your queue is empty. Start creating!</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
