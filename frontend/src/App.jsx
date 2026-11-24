import { useState } from "react";
import { AuthProvider } from "./auth";
import { useAuth } from "./useAuth";
import { menuFor } from "./menu";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { Loading } from "./components/ui";
import Login from "./pages/Login";
import ReportConcern from "./pages/ReportConcern";
import Dashboard from "./pages/Dashboard";
import PublicReports from "./pages/PublicReports";
import Cases from "./pages/Cases";
import Referrals from "./pages/Referrals";
import FollowUps from "./pages/FollowUps";
import Stats from "./pages/Stats";
import Staff from "./pages/Staff";

function Workspace() {
  const { user, logout } = useAuth();
  const pages = menuFor(user.role).map((item) => item.name);
  const [activePage, setActivePage] = useState(pages[0]);
  const [focusCaseId, setFocusCaseId] = useState(null);

  function navigate(name) {
    setFocusCaseId(null);
    setActivePage(name);
  }

  function openCase(caseId) {
    setFocusCaseId(caseId);
    setActivePage("Cases");
  }

  const page = pages.includes(activePage) ? activePage : pages[0];

  return (
    <div className="min-h-screen flex bg-[#F4F6F5]">
      <Sidebar role={user.role} activePage={page} setActivePage={navigate} onLogout={logout} />
      <main className="flex-1 min-w-0">
        <Navbar activePage={page} user={user} />
        {page === "Dashboard" && <Dashboard setActivePage={navigate} />}
        {page === "Public Reports" && <PublicReports onOpenCase={openCase} />}
        {page === "Cases" && <Cases focusCaseId={focusCaseId} />}
        {page === "Referrals" && <Referrals />}
        {page === "Follow-ups" && <FollowUps />}
        {page === "Statistics" && <Stats />}
        {page === "Staff & Institutions" && <Staff />}
      </main>
    </div>
  );
}

function Root() {
  const { user, loading } = useAuth();
  const [publicPage, setPublicPage] = useState(false);

  if (loading) return <Loading label="Signing you in…" />;
  if (user) return <Workspace />;
  if (publicPage) return <ReportConcern onBack={() => setPublicPage(false)} />;
  return <Login onReportConcern={() => setPublicPage(true)} />;
}

function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

export default App;
