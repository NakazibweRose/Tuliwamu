
import {
  LayoutDashboard,
  FolderOpen,
  ArrowLeftRight,
  Clock,
  MessageCircle,
  Bell,
  Settings,
  ShieldCheck,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Cases", icon: FolderOpen },
  { name: "Referrals", icon: ArrowLeftRight },
  { name: "Deadlines", icon: Clock },
  { name: "AI Legal Assistant", icon: MessageCircle },
];

function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-[#19324D] text-white flex flex-col shrink-0">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-[#367C78] p-2 rounded-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Tuliwamu</h1>
            <p className="text-xs text-slate-300">
              Child Protection & Justice
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-4 px-3">
          Main Menu
        </p>

        <div className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-left transition ${
                  index === 0
                    ? "bg-[#367C78] text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={19} />
                {item.name}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="px-4 py-5 border-t border-white/10 space-y-2">
        <button className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-300 hover:bg-white/10 rounded-lg">
          <Bell size={19} />
          Notifications
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-300 hover:bg-white/10 rounded-lg">
          <Settings size={19} />
          Settings
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
