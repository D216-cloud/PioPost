"use client";

import {
  Calendar,
  ChevronDown,
  Bot,
  MessageCircle,
  Send,
  Radio,
  BarChart2,
  Settings,
  ChevronRight,
  ArrowUpRight,
  Edit3,
  Check,
  User,
  Star,
  Activity,
  Play
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function OverviewPage() {
  const { data: session } = useSession();
  const [automations, setAutomations] = useState([
    { id: 1, name: "Giveaway Campaign", trigger: "Keyword: giveaway", dmsSent: 452, status: "Active", active: true },
    { id: 2, name: "Link in Bio AutoDM", trigger: "Keyword: link", dmsSent: 320, status: "Active", active: true },
    { id: 3, name: "Reel Engagement", trigger: "Comment on Reel", dmsSent: 289, status: "Active", active: true },
    { id: 4, name: "Story Mention Auto Reply", trigger: "Story Mention", dmsSent: 189, status: "Active", active: true },
    { id: 5, name: "Welcome Message", trigger: "New Follower", dmsSent: 120, status: "Active", active: true },
  ]);

  const toggleAutomation = (id: number) => {
    setAutomations(prev =>
      prev.map(item =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    );
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-12">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 pt-8 flex flex-col gap-6">
        
        {/* ── Welcome Header & Date Range ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Welcome back, maheta! 👋
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Here's what's happening with your automations today.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-650 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer hover:bg-slate-50 transition-all">
            <Calendar size={14} className="text-slate-400" />
            <span>May 16 – May 22, 2025</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>
        </div>

        {/* ── FIRST ROW: 4 Metric Cards (Full Width) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Total DMs Sent */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[155px]">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <MessageCircle size={18} fill="currentColor" className="fill-blue-100" />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Total DMs Sent</span>
                <div className="flex items-center justify-end mt-1">
                  <span className="text-[24px] font-black text-slate-900">1,250</span>
                </div>
              </div>
            </div>
            {/* Empty space to preserve card height */}
            <div className="h-8" />
          </div>

          {/* Card 2: Active Automations */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[155px]">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Bot size={18} />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Active Automations</span>
                <div className="flex items-center justify-end mt-1">
                  <span className="text-[24px] font-black text-slate-900">24</span>
                </div>
              </div>
            </div>
            {/* Empty space to preserve card height */}
            <div className="h-8" />
          </div>

          {/* Card 3: Comments Triggered */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[155px]">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <MessageCircle size={18} className="fill-purple-100 text-purple-550" />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Comments Triggered</span>
                <div className="flex items-center justify-end mt-1">
                  <span className="text-[24px] font-black text-slate-900">3,890</span>
                </div>
              </div>
            </div>
            {/* Empty space to preserve card height */}
            <div className="h-8" />
          </div>

          {/* Card 4: Conversion Rate */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[155px]">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-550 shrink-0">
                <Activity size={18} />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Conversion Rate</span>
                <div className="flex items-center justify-end mt-1">
                  <span className="text-[24px] font-black text-slate-900">18.6%</span>
                </div>
              </div>
            </div>
            {/* Empty space to preserve card height */}
            <div className="h-8" />
          </div>

        </div>

        {/* ── SECOND ROW: Chart, Performance, Recent Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          
          {/* DMs Sent Overview Line Chart (Spans 2 columns) */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-900">DMs Sent Overview</h3>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-650 cursor-pointer">
                  <span>Last 7 Days</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
              </div>
              
              {/* SVG Line Chart */}
              <div className="relative pt-2">
                <svg className="w-full h-[180px]" viewBox="0 0 500 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-blue-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="180" x2="500" y2="180" stroke="#f1f5f9" strokeWidth="1" />
                  
                  {/* Area under curve */}
                  <path d="M 0 140 C 40 140, 43 100, 83 100 C 123 100, 126 120, 166 120 C 206 120, 210 80, 250 80 C 290 80, 293 108, 333 108 C 373 108, 376 68, 416 68 C 456 68, 460 40, 500 40 L 500 180 L 0 180 Z" fill="url(#chart-blue-grad)"/>
                  
                  {/* Main path */}
                  <path d="M 0 140 C 40 140, 43 100, 83 100 C 123 100, 126 120, 166 120 C 206 120, 210 80, 250 80 C 290 80, 293 108, 333 108 C 373 108, 376 68, 416 68 C 456 68, 460 40, 500 40" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"/>
                  
                  {/* Data Points */}
                  <circle cx="0" cy="140" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                  <circle cx="83" cy="100" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                  <circle cx="166" cy="120" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                  <circle cx="250" cy="80" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                  <circle cx="333" cy="108" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                  <circle cx="416" cy="68" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                  <circle cx="500" cy="40" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                </svg>
                
                {/* Axis values absolute positioning */}
                <div className="absolute top-2 left-0 text-[10px] text-slate-400 font-bold">400</div>
                <div className="absolute top-[42px] left-0 text-[10px] text-slate-400 font-bold">300</div>
                <div className="absolute top-[82px] left-0 text-[10px] text-slate-400 font-bold">200</div>
                <div className="absolute top-[122px] left-0 text-[10px] text-slate-400 font-bold">100</div>
                <div className="absolute top-[162px] left-0 text-[10px] text-slate-400 font-bold">0</div>
              </div>

              {/* X Axis labels */}
              <div className="flex justify-between mt-3 text-[10px] text-slate-450 font-semibold px-2">
                <span>May 16</span>
                <span>May 17</span>
                <span>May 18</span>
                <span>May 19</span>
                <span>May 20</span>
                <span>May 21</span>
                <span>May 22</span>
              </div>
            </div>
          </div>

          {/* Top Performing Automations (Spans 1 column) */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-5">Top Performing Automations</h3>
              <div className="space-y-4">
                
                <div className="flex items-center justify-between text-xs font-semibold text-slate-750">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Giveaway Campaign</span>
                  </div>
                  <span className="font-bold text-slate-900">452</span>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-750">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Link in Bio AutoDM</span>
                  </div>
                  <span className="font-bold text-slate-900">320</span>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-750">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                    <span>Reel Engagement</span>
                  </div>
                  <span className="font-bold text-slate-900">289</span>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-750">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Story Mention Auto Reply</span>
                  </div>
                  <span className="font-bold text-slate-900">189</span>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-750">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                    <span>Welcome Message</span>
                  </div>
                  <span className="font-bold text-slate-900">120</span>
                </div>

              </div>
            </div>
          </div>

          {/* Recent Activity (Spans 1 column) */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-5">Recent Activity</h3>
              <div className="space-y-4 text-xs font-semibold text-slate-750">
                
                {/* Activity 1 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                    <MessageCircle size={14} fill="currentColor" className="fill-blue-100" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 text-xs font-bold leading-tight">New DM sent</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">@johndoe</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold self-start whitespace-nowrap">2m ago</span>
                </div>

                {/* Activity 2 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                    <Bot size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 text-xs font-bold leading-tight">Automation triggered</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Giveaway Campaign</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold self-start whitespace-nowrap">5m ago</span>
                </div>

                {/* Activity 3 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                    <MessageCircle size={14} fill="currentColor" className="fill-purple-100" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 text-xs font-bold leading-tight">New comment</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">on your post</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold self-start whitespace-nowrap">8m ago</span>
                </div>

                {/* Activity 4 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-550 shrink-0 mt-0.5">
                    <Send size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 text-xs font-bold leading-tight">Story reply sent</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">@sarah_writes</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold self-start whitespace-nowrap">12m ago</span>
                </div>

                {/* Activity 5 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                    <MessageCircle size={14} fill="currentColor" className="fill-blue-100" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 text-xs font-bold leading-tight">New DM sent</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">@mike_ventures</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold self-start whitespace-nowrap">15m ago</span>
                </div>

              </div>
            </div>

            <button className="w-full border border-slate-200 bg-white hover:bg-slate-50 rounded-xl py-2.5 text-xs font-bold text-slate-650 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all mt-6">
              View All Activity
            </button>
          </div>

        </div>

        {/* ── THIRD ROW: Table and Account Summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          
          {/* Active Automations Table Section (Spans 3 columns) */}
          <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-900">Active Automations</h3>
              <Link href="/dashboard/automation" className="bg-slate-50 border border-slate-150 rounded-xl px-4 py-2 text-xs font-bold text-slate-650 hover:bg-slate-100 transition-all">
                View All
              </Link>
            </div>

            {/* Table wrapper */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3.5 pl-2">Automation Name</th>
                    <th className="pb-3.5">Trigger</th>
                    <th className="pb-3.5 text-center">DMs Sent</th>
                    <th className="pb-3.5 text-center">Status</th>
                    <th className="pb-3.5 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                  {automations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pl-2 font-bold text-slate-900">{item.name}</td>
                      <td className="py-4 text-slate-500">{item.trigger}</td>
                      <td className="py-4 text-center text-slate-900 font-bold">{item.dmsSent}</td>
                      <td className="py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {item.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 pr-2 text-right">
                        <div className="flex items-center justify-end gap-3.5">
                          <button className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                            <Edit3 size={14} />
                          </button>
                          {/* Toggle Switch */}
                          <button
                            onClick={() => toggleAutomation(item.id)}
                            className={`w-9 h-5 rounded-full relative transition-all duration-200 outline-none ${
                              item.active ? "bg-blue-600" : "bg-slate-200"
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all duration-200 ${
                              item.active ? "left-[18px]" : "left-[3px]"
                            }`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 self-center">
              <Link href="/dashboard/automation" className="inline-flex border border-slate-200 bg-white hover:bg-slate-50 rounded-xl px-5 py-2.5 text-xs font-bold text-slate-650 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all">
                View All Automations
              </Link>
            </div>
          </div>

          {/* Account Summary (Spans 1 column) */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-5">Account Summary</h3>
              <div className="space-y-4 text-xs font-bold text-slate-750">
                
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
                  <span className="text-slate-400">Connected Instagram</span>
                  <span className="text-slate-900">1</span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
                  <span className="text-slate-400">Followers</span>
                  <span className="text-slate-900">12.4K</span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
                  <span className="text-slate-400">Following</span>
                  <span className="text-slate-900">320</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Account Status</span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Connected</span>
                  </span>
                </div>

              </div>
            </div>

            <button className="w-full border border-slate-200 bg-white hover:bg-slate-50 rounded-xl py-2.5 text-xs font-bold text-slate-650 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all mt-6">
              Manage Account
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
