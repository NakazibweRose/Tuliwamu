
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import Referrals from "./pages/Referrals";
import Deadlines from "./pages/Deadlines";
import Assistant from "./pages/Assistant";
import api from "./api";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkAuthentication() {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        const response = await api.get("/api/accounts/profile/");
        setUser(response.data);
        setAuthenticated(true);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuthentication();
  }, []);

  function handleLogin(loginData) {
    setUser({ role: loginData.role });
    setAuthenticated(true);
  }

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");

    setUser(null);
    setAuthenticated(false);
    setActivePage("Dashboard");
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F5]">
        <p className="text-slate-500">Checking your session...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex bg-[#F4F6F5]">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="flex-1 min-w-0">
        <Navbar
          activePage={activePage}
          user={user}
          onLogout={handleLogout}
        />

        {activePage === "Dashboard" && <Dashboard />}
        {activePage === "Cases" && <Cases />}
        {activePage === "Referrals" && <Referrals />}
        {activePage === "Deadlines" && <Deadlines />}
        {activePage === "AI Legal Assistant" && <Assistant />}
      </main>
    </div>
  );
}

export default App;
