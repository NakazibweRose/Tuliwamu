import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import api, { errorMessage } from "../api";
import { REPORT_CATEGORIES, REPORT_STATUS } from "../constants";
import { Badge, Button, Card, ErrorBanner, Field, Input, Select, Textarea } from "../components/ui";

const empty = { category: "", district: "", description: "", share: "no", contact_phone: "" };

function ReportConcern({ onBack }) {
  const [form, setForm] = useState(empty);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState(null);
  const [lookupError, setLookupError] = useState("");

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/api/public-reports/", {
        category: form.category,
        district: form.district,
        description: form.description,
        contact_phone: form.share === "yes" ? form.contact_phone : "",
      });
      setResult(data);
      setForm(empty);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function checkStatus(event) {
    event.preventDefault();
    setLookup(null);
    setLookupError("");
    try {
      const { data } = await api.get(`/api/public-reports/status/${encodeURIComponent(code.trim())}/`);
      setLookup(data);
    } catch (err) {
      setLookupError(err?.response?.status === 404 ? "No report found with that code." : errorMessage(err));
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F5] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#19324D]">
          <ArrowLeft size={16} /> Back to sign in
        </button>

        <div className="bg-[#19324D] text-white rounded-xl p-6">
          <h1 className="text-2xl font-bold">Report a concern about a child</h1>
          <p className="text-sm text-slate-300 mt-2">
            You do not need to give your name. Do not write the child's full name.
            If a child is in immediate danger, contact the nearest police station or call 116 (free child helpline).
          </p>
        </div>

        {result ? (
          <Card>
            <div className="p-6 space-y-3 text-center">
              <CheckCircle2 size={40} className="mx-auto text-[#367C78]" />
              <h2 className="text-lg font-semibold text-[#19324D]">Your report has been received</h2>
              <p className="text-sm text-slate-600">Keep this reference code to check its status:</p>
              <p className="text-2xl font-mono font-bold text-[#19324D]">{result.reference_code}</p>
              <Button variant="secondary" onClick={() => setResult(null)}>Make another report</Button>
            </div>
          </Card>
        ) : (
          <Card title="Your report">
            <form onSubmit={submit} className="p-5 space-y-4">
              <ErrorBanner message={error} />
              <Field label="What is the concern?">
                <Select name="category" value={form.category} onChange={update} options={REPORT_CATEGORIES} placeholder="Select…" required />
              </Field>
              <Field label="District">
                <Input name="district" value={form.district} onChange={update} maxLength={100} required />
              </Field>
              <Field label="Briefly describe what is happening" hint="Do not include the child's full name.">
                <Textarea name="description" value={form.description} onChange={update} maxLength={1000} required />
              </Field>
              <Field label="May an officer contact you for follow-up?">
                <Select
                  name="share"
                  value={form.share}
                  onChange={update}
                  options={[
                    { value: "no", label: "No, keep me anonymous" },
                    { value: "yes", label: "Yes, I will share my phone number" },
                  ]}
                />
              </Field>
              {form.share === "yes" && (
                <Field label="Phone number" hint="Only officers handling the report can see it.">
                  <Input name="contact_phone" value={form.contact_phone} onChange={update} maxLength={20} required />
                </Field>
              )}
              <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send report"}</Button>
            </form>
          </Card>
        )}

        <Card title="Check the status of a report">
          <form onSubmit={checkStatus} className="p-5 flex flex-col sm:flex-row gap-3">
            <Input placeholder="e.g. TUL-3F9A21C4D8E0" value={code} onChange={(e) => setCode(e.target.value)} required />
            <Button type="submit" variant="secondary">Check</Button>
          </form>
          <div className="px-5 pb-5 space-y-2">
            <ErrorBanner message={lookupError} />
            {lookup && (
              <p className="text-sm text-slate-600">
                <span className="font-mono">{lookup.reference_code}</span>: <Badge map={REPORT_STATUS} value={lookup.status} />
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ReportConcern;
