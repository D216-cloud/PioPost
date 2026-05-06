import { CalendarDays, House, PlusCircle, UserRound } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: House },
  { label: "New Post", icon: PlusCircle },
  { label: "Scheduled Content", icon: CalendarDays },
  { label: "Profile", icon: UserRound },
];

export function Sidebar() {
  return (
    <aside className="glass m-3 rounded-3xl p-5 lg:m-5 lg:mr-0">
      <h2 className="logo-script text-3xl text-blue-600 dark:text-cyan-300">PinPost</h2>
      <nav className="mt-8 space-y-2">
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-muted transition-all hover:bg-blue-50 hover:text-foreground dark:hover:bg-slate-900"
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
