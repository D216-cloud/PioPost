"use client";

import { UserPlus, Sparkles, MessageSquare, Layers, TrendingUp, ChevronRight } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="relative mx-auto max-w-6xl px-6 md:px-8 pt-8 md:pt-24 pb-16 md:pb-20 space-y-10 animate-in fade-in duration-700">
      {/* Ambient glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-violet-100/30 blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 h-80 w-80 rounded-full bg-pink-100/20 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-center md:text-left mb-6">
        <div className="space-y-3">
          <h1 className="text-[32px] md:text-[52px] font-normal tracking-tight text-slate-900 leading-none">
            Performance <span className="text-[#a855f7] font-medium">Analytics</span>
          </h1>
          <p className="text-[14.5px] md:text-[16px] text-slate-500 font-medium max-w-xl leading-relaxed">
            Real-time insights into your engagement, growth, and automated DM conversions.
          </p>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="FOLLOWERS GROWTH"
          value="14,200"
          trend="+12.8%"
          trendUp={true}
          icon={UserPlus}
          iconColor="text-purple-500"
        />
        <StatCard
          title="ENGAGEMENT RATE"
          value="8.4%"
          trend="+2.3%"
          trendUp={true}
          icon={Sparkles}
          iconColor="text-pink-500"
        />
        <StatCard
          title="DM CONVERSION SPEED"
          value="3.2s"
          trend="-1.5s"
          trendUp={true} // Faster is better
          icon={MessageSquare}
          iconColor="text-orange-400"
        />
        <StatCard
          title="FUNNEL ACTIONS"
          value="1,424"
          trend="+420"
          trendUp={true}
          icon={Layers}
          iconColor="text-blue-500"
        />
      </div>

      {/* AI Advisor Banner */}
      <div className="bg-gradient-to-r from-[#faf5ff] to-[#fdf2f8] rounded-[24px] border border-purple-100 shadow-[0_4px_24px_rgba(168,85,247,0.04)] p-8 md:p-10 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#a855f7]/10 to-[#ec4899]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-[14px] bg-white shadow-sm flex items-center justify-center border border-purple-100 shrink-0">
            <Sparkles size={24} className="text-[#a855f7]" />
          </div>
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#a855f7]">
              ReelFlow AI Advisor Insights
            </h3>
            <h4 className="text-[20px] font-bold text-slate-900 leading-snug">
              Reels with captions under 8 words perform better.
            </h4>
            <p className="text-[14.5px] text-slate-600 leading-relaxed max-w-4xl">
              Analyzing your comment triggers indicates that punchy video headlines combined with brief calls-to-action (e.g., commenting "LINK") results in an <strong>84% reduction in drop-off</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* FOLLOWER GROWTH VECTOR */}
        <div className="bg-white rounded-[24px] border border-[#e4e4e7] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 flex flex-col">
          <div className="flex justify-between items-end mb-10">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-500">
              Follower Growth Vector
            </h3>
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Last 6 Hours
            </span>
          </div>

          <div className="flex-1 relative min-h-[220px] w-full flex flex-col justify-end">
            {/* Faux SVG Chart */}
            <svg viewBox="0 0 400 150" preserveAspectRatio="none" className="w-full h-full absolute inset-0 overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Fill Area */}
              <path 
                d="M 0,130 C 150,110 250,60 400,20 L 400,150 L 0,150 Z" 
                fill="url(#chartGradient)" 
              />
              
              {/* Line */}
              <path 
                d="M 0,130 C 150,110 250,60 400,20" 
                fill="none" 
                stroke="#a855f7" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />

              {/* Data points */}
              <circle cx="150" cy="110" r="5" fill="white" stroke="#a855f7" strokeWidth="3" />
              <circle cx="400" cy="20" r="6" fill="#a855f7" className="animate-pulse" />
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-wider relative z-10 pt-4 border-t border-slate-100/50 mt-auto -mb-2">
              <span>9:00 AM</span>
              <span className="pl-6">11:00 AM</span>
              <span>1:00 PM</span>
              <span>3:00 PM</span>
            </div>
          </div>
        </div>

        {/* TRIGGER DM FUNNEL CONVERSIONS */}
        <div className="bg-white rounded-[24px] border border-[#e4e4e7] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 flex flex-col">
          <div className="flex justify-between items-end mb-10">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-500">
              Trigger DM Funnel Conversions
            </h3>
            <span className="text-[11px] font-bold text-[#10b981] uppercase">
              88.4% Success
            </span>
          </div>

          <div className="space-y-8 mt-2">
            
            {/* Step 1 */}
            <div>
              <div className="flex justify-between text-[13.5px] font-bold text-slate-900 mb-3">
                <span>Keyword Comments Checked</span>
                <span>1,424</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#ec4899] to-[#f43f5e] w-full rounded-full" />
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <div className="flex justify-between text-[13.5px] font-bold text-slate-900 mb-3">
                <span>Automatic DMs Dispatched</span>
                <span className="text-slate-500 font-medium">1,259 (88.4%)</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] w-[88.4%] rounded-full relative">
                  <div className="absolute right-0 top-0 bottom-0 w-10 bg-white/20 blur-sm" />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex justify-between text-[13.5px] font-bold text-slate-900 mb-3">
                <span>Direct Asset Clicks / Leads</span>
                <span className="text-slate-500 font-medium">842 (66.8%)</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#10b981] to-[#34d399] w-[66.8%] rounded-full" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// Sub-component for the top stats cards
function StatCard({ 
  title, 
  value, 
  trend, 
  trendUp, 
  icon: Icon, 
  iconColor 
}: { 
  title: string, 
  value: string, 
  trend: string, 
  trendUp: boolean, 
  icon: any, 
  iconColor: string 
}) {
  return (
    <div className="bg-white rounded-[24px] border border-[#e4e4e7] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 flex flex-col relative overflow-hidden group hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between mb-8">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          {title}
        </h3>
        <Icon size={18} className={`${iconColor}`} />
      </div>
      
      <div className="flex items-end gap-3">
        <span className="text-[32px] font-normal tracking-tight text-slate-900 leading-none">
          {value}
        </span>
        <span className={`text-[13px] font-bold pb-1 ${trendUp ? "text-[#10b981]" : "text-rose-500"}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}
