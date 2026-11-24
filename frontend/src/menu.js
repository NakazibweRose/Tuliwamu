import {
  ArrowLeftRight,
  BarChart3,
  Clock,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  Users,
} from "lucide-react";

const STAFF = ["ADMIN", "POLICE", "PSWO", "LEGAL_AID", "SERVICE_PROVIDER"];

// Which pages each role can open. The backend enforces the same rules.
export const MENU = [
  { name: "Dashboard", icon: LayoutDashboard, roles: STAFF },
  { name: "Public Reports", icon: Inbox, roles: ["ADMIN", "POLICE", "PSWO"] },
  { name: "Cases", icon: FolderOpen, roles: STAFF },
  { name: "Referrals", icon: ArrowLeftRight, roles: STAFF },
  { name: "Follow-ups", icon: Clock, roles: STAFF },
  { name: "Statistics", icon: BarChart3, roles: ["ADMIN", "OVERSIGHT"] },
  { name: "Staff & Institutions", icon: Users, roles: ["ADMIN"] },
];

export function menuFor(role) {
  return MENU.filter((item) => item.roles.includes(role));
}
