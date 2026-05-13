"use client";

import { Sidebar } from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PanelLeftOpen, Search, Plus } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar - Handles its own internal visibility but needs the state */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className={`flex-1 h-full overflow-y-auto relative transition-all duration-500 ease-in-out`}>
        {/* Floating Toggle Pill (Shows when sidebar is closed) */}
        <div className={`fixed top-6 left-6 z-[60] flex items-center gap-4 transition-all duration-500 ease-in-out ${!isSidebarOpen ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-10 scale-90 pointer-events-none'}`}>
           <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
             <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
           </div>
           
           <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-full px-5 py-2.5 shadow-sm hover:shadow-md transition-all">
              <button onClick={() => setIsSidebarOpen(true)} className="text-slate-900 hover:text-[#2563EB] transition-colors">
                 <PanelLeftOpen size={20} />
              </button>
              <div className="w-[1px] h-4 bg-slate-200" />
              <button className="text-slate-400 hover:text-slate-900 transition-colors">
                 <Plus size={18} />
              </button>
           </div>
        </div>
        
        {children}
      </main>
    </div>
  );
}
