"use client";

import { Sidebar } from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#03040b]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#a855f7] border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen bg-white dark:bg-[#03040b] overflow-hidden relative">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((v) => !v)}
      />
      <main className="flex-1 h-full overflow-y-auto flex flex-col relative w-full bg-slate-50 dark:bg-[#03040b]">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#080915] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 -ml-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              {/* @ts-ignore */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
          </div>
          <span className="font-black tracking-tight text-[17px] text-slate-900 dark:text-white">
            ReelFlow<span className="text-[#a855f7]">.</span>
          </span>
          <div className="w-8" /> {/* spacer for center alignment */}
        </div>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
