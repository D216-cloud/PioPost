"use client";

import { Sidebar } from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PanelLeftOpen, Search, Plus } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-close sidebar on mobile on initial load or navigation
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        <div className={`fixed top-6 left-6 z-[60] flex items-center gap-4 transition-all duration-500 ease-in-out ${!isSidebarOpen ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-10 scale-90 pointer-events-none md:opacity-100 md:translate-x-0 md:scale-100 md:pointer-events-auto'}`}>
           <Link href="/" className="text-[26px] font-logo font-bold tracking-tight text-slate-900 flex items-center">
            Pin<span className="text-[#2563EB]">Post</span>
            <span className="w-2 h-2 rounded-full bg-[#2563EB] ml-1 mt-2"></span>
          </Link>
           
           <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-full px-5 py-2.5 shadow-sm hover:shadow-md transition-all">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-900 hover:text-[#2563EB] transition-colors">
                 <PanelLeftOpen size={20} className={`transition-transform duration-500 ${isSidebarOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className="w-[1px] h-4 bg-slate-200" />
              <button className="text-slate-400 hover:text-slate-900 transition-colors">
                 <Plus size={18} />
              </button>
           </div>
        </div>
        
        <div className={`transition-all duration-500 ${isSidebarOpen ? 'md:pl-0' : ''}`}>
           {children}
        </div>
      </main>
    </div>
  );
}
