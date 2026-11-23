
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import Referrals from "./pages/Referrals";
import Deadlines from "./pages/Deadlines";
import Assistant from "./pages/Assistant";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    <div className="min-h-screen flex bg-[#F4F6F5]">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="flex-1 min-w-0">
        <Navbar activePage={activePage} />

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
