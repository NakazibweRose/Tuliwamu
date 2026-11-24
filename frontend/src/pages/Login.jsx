
import { useState } from "react";
import { ShieldCheck, Lock, User } from "lucide-react";
import api from "../api";

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setCredentials((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/token/", credentials);

      const { access, refresh, role } = response.data;

      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("userRole", role);

      onLogin(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Login failed. Check your username and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F5] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-[#367C78] p-4 rounded-2xl">
            <ShieldCheck size={34} className="text-white" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#19324D]">
            Welcome to Tuliwamu
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Sign in to access the child protection coordination platform.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-3.5 text-slate-400"
              />
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                required
                autoComplete="username"
                placeholder="Enter your username"
                className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#367C78]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-3.5 text-slate-400"
              />
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#367C78]"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#367C78] hover:bg-[#2c6663] disabled:opacity-60 text-white py-3 rounded-lg font-medium"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400 mt-7">
          Tuliwamu · Secure access for authorised users
        </p>
      </div>
    </div>
  );
}

export default Login;
