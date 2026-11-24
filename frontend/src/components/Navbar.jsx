import { UserCircle } from "lucide-react";
import { ROLE_LABELS } from "../constants";

function Navbar({ activePage, user }) {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div>
        <h2 className="text-xl font-semibold text-[#19324D]">{activePage}</h2>
        <p className="text-sm text-slate-500">Child protection and justice coordination</p>
      </div>

      <div className="flex items-center gap-2">
        <UserCircle size={34} className="text-[#367C78]" />
        <div>
          <p className="text-sm font-medium text-[#19324D]">
            {`${user.first_name} ${user.last_name}`.trim() || user.username}
          </p>
          <p className="text-xs text-slate-500">
            {ROLE_LABELS[user.role]}
            {user.institution ? ` · ${user.institution.name}` : ""}
          </p>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
