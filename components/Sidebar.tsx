import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  Plus,
  Video, 
  BookOpen, 
  Settings, 
  Layers,
  Sparkles,
  Calendar,
  LayoutDashboard,
  PanelLeftClose,
  Search,
  LogOut,
  Sliders
} from "lucide-react";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Create", icon: Sparkles, href: "/dashboard/create" },
  { label: "Control Post", icon: Sliders, href: "/dashboard/control-post" },
  { label: "Series", icon: Layers, href: "/dashboard/series" },
  { label: "Videos", icon: Video, href: "/dashboard/videos" },
  { label: "Schedule", icon: Calendar, href: "/dashboard/schedule" },
  { label: "Automation", icon: BookOpen, href: "/dashboard/automation" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`fixed md:sticky top-0 left-0 h-screen bg-white flex flex-col transition-all duration-500 ease-in-out overflow-hidden z-[110] border-r border-slate-100 ${isOpen ? 'w-64 p-6 shadow-2xl md:shadow-none' : 'w-0 p-0 opacity-0 -translate-x-20'}`}>
      <div className={`flex items-center justify-between mb-12 px-2 transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center">
          <Link href="/" className="text-[26px] font-logo font-bold tracking-tight text-slate-900 flex items-center">
            Pin<span className="text-[#2563EB]">Post</span>
            <span className="w-2 h-2 rounded-full bg-[#2563EB] ml-1 mt-2"></span>
          </Link>
        </div>
        <div className="flex items-center gap-2 shrink-0">
           <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-1">
              <PanelLeftClose size={18} />
           </button>
        </div>
      </div>
      
      <nav className={`space-y-1.5 flex-1 transition-all duration-500 delay-75 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href || "#"}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-bold transition-all ${
                active 
                  ? "bg-[#EFF6FF] text-[#2563EB]" 
                  : "text-[#64748B] hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
        
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-bold text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-all mt-4"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </nav>

      <div className={`mt-auto pt-6 transition-all duration-500 delay-100 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-[#EFF6FF] rounded-2xl p-4 border border-[#DBEAFE]">
          <p className="text-[12px] font-bold text-[#2563EB] uppercase tracking-wider mb-1">Current Plan</p>
          <p className="text-[14px] font-bold text-slate-900 mb-3">Free Tier</p>
          <button className="w-full bg-[#2563EB] text-white py-2 rounded-xl text-[12px] font-bold hover:bg-[#1D4ED8] transition-all">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
