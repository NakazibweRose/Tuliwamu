import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../useAuth";
import { errorMessage } from "../api";
import { Button, ErrorBanner, Field, Input } from "../components/ui";

const DEMO_USERS = ["police.wakiso", "pswo.wakiso", "legalaid", "support", "oversight", "admin"];

function Login({ onReportConcern }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(username, password);
    } catch (err) {
      setError(
        err?.response?.status === 401 ? "Incorrect username or password." : errorMessage(err)
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        <div className="bg-[#19324D] text-white rounded-xl p-6">
          <h1 className="text-2xl font-bold tracking-wide">Tuliwamu</h1>
          <p className="text-sm text-slate-300 mt-1">
            Secure coordination of child-sensitive referrals and support services.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#19324D]">Staff sign in</h2>
          <ErrorBanner message={error} />
          <Field label="Username">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </Field>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <p className="flex items-start gap-2 text-xs text-slate-500">
            <ShieldCheck size={16} className="shrink-0 text-[#367C78]" />
            Access is limited by role. Every view of a child's record is logged.
          </p>
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer">Demo accounts (fictional data)</summary>
            <p className="mt-2">
              Password <code>Tuliwamu2026!</code> for: {DEMO_USERS.map((u) => (
                <button type="button" key={u} onClick={() => setUsername(u)} className="underline mr-2">
                  {u}
                </button>
              ))}
            </p>
          </details>
        </form>

        <button
          onClick={onReportConcern}
          className="w-full bg-white border-2 border-[#367C78] text-[#367C78] rounded-xl p-4 text-sm font-semibold hover:bg-teal-50"
        >
          Report a concern about a child (no login, anonymous) →
        </button>
        <p className="text-center text-xs text-slate-500">
          No smartphone? Dial the Tuliwamu USSD code from any phone.
        </p>
      </div>
    </div>
  );
}

export default Login;
