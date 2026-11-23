
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="min-h-screen flex bg-[#F4F6F5]">
      <Sidebar />

      <main className="flex-1 min-w-0">
        <Navbar />
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
