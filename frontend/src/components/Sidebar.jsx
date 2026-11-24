
import {
  LayoutDashboard,
  FolderOpen,
  ArrowLeftRight,
  Clock,
  MessageSquareText,
  Settings,
  Bell,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Cases", icon: FolderOpen },
  { name: "Referrals", icon: ArrowLeftRight },
  { name: "Deadlines", icon: Clock },
  { name: "AI Legal Assistant", icon: MessageSquareText },
];

function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="w-64 min-h-screen bg-[#19324D] text-white flex flex-col shrink-0">
      <div className="px-6 py-7 border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-wide">Tuliwamu</h1>
        <p className="text-xs text-slate-300 mt-1">
          Child Protection & Justice
        </p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.name;

          return (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-[#367C78] text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-5 border-t border-white/10 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300">
          <Bell size={18} />
          Notifications
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
