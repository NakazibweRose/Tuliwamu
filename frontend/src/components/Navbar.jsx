
import { Bell, UserCircle } from "lucide-react";

function Navbar() {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div>
        <h2 className="text-xl font-semibold text-[#19324D]">
          Dashboard
        </h2>
        <p className="text-sm text-slate-500">
          Overview of child protection and justice activities
        </p>
      </div>

      <div className="flex items-center gap-5">
        <button className="text-slate-500 hover:text-[#367C78]">
          <Bell size={21} />
        </button>

        <div className="flex items-center gap-2">
          <UserCircle size={34} className="text-[#367C78]" />
          <div>
            <p className="text-sm font-medium text-[#19324D]">
              Officer
            </p>
            <p className="text-xs text-slate-500">
              Child Protection
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
