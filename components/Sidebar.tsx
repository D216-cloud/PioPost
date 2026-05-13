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
  LogOut
} from "lucide-react";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Create", icon: Sparkles, href: "/dashboard/create" },
  { label: "Series", icon: Layers, href: "/dashboard/series" },
  { label: "Videos", icon: Video, href: "/dashboard/videos" },
  { label: "Schedule", icon: Calendar, href: "/dashboard/schedule" },
  { label: "Guides", icon: BookOpen, href: "/dashboard/guides" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={`border-r border-slate-100 bg-white h-screen sticky top-0 flex flex-col transition-all duration-500 ease-in-out overflow-hidden z-50 ${isOpen ? 'w-64 p-6' : 'w-0 p-0 opacity-0 -translate-x-20'}`}>
      <div className={`flex items-center justify-between mb-12 px-2 transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <Sparkles size={20} className="fill-white/20" />
          </div>
          <h2 className="text-[24px] font-logo text-slate-900 pt-1 whitespace-nowrap">PinPost</h2>
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
  );
}
