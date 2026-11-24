
import { Bell, UserCircle, LogOut } from "lucide-react";

function Navbar({ activePage, user, onLogout }) {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div>
        <h2 className="text-xl font-semibold text-[#19324D]">
          {activePage || "Dashboard"}
        </h2>

        <p className="text-sm text-slate-500">
          Child protection and justice coordination
        </p>
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          className="text-slate-500 hover:text-[#367C78]"
          aria-label="Notifications"
        >
          <Bell size={21} />
        </button>

        <div className="flex items-center gap-2">
          <UserCircle size={34} className="text-[#367C78]" />

          <div>
            <p className="text-sm font-medium text-[#19324D]">
              {user?.first_name || user?.username || "User"}
            </p>
            <p className="text-xs text-slate-500">
              {user?.role || "Authorised User"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          title="Sign out"
          className="text-slate-500 hover:text-red-600"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
