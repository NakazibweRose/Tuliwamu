import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import api, { errorMessage } from "../api";
import { useAuth } from "../useAuth";
import useApi from "../useApi";
import CaseDetail from "../components/CaseDetail";
import {
  CASE_CATEGORIES,
  CASE_STATUS,
  INCIDENT_TYPES,
  formatDate,
  labelFor,
  shortRef,
} from "../constants";
import {
  Badge,
  Button,
  Card,
  ErrorBanner,
  Field,
  Input,
  Loading,
  Modal,
  PageHeader,
  Select,
  Table,
  Textarea,
} from "../components/ui";

const emptyForm = {
  case_category: "",
  incident_type: "",
  child_name: "",
  child_age: "",
  incident_date: "",
  district: "",
  description: "",
};

function RegisterCase({ onClose, onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(event) {
    const { name, value } = event.target;
    setForm((f) => ({ ...f, [name]: value, ...(name === "case_category" ? { incident_type: "" } : {}) }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { ...form };
      if (["POLICE", "PSWO"].includes(user.role)) payload.assigned_officer = user.id;
      const { data } = await api.post("/api/cases/", payload);
      onCreated(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Register new case" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-xs text-slate-500">Demo: use fictional details only (e.g. "Child X").</p>
        <ErrorBanner message={error} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Case category">
            <Select name="case_category" value={form.case_category} onChange={update} options={CASE_CATEGORIES} placeholder="Select…" required />
          </Field>
          <Field label="Incident type">
            <Select name="incident_type" value={form.incident_type} onChange={update} options={INCIDENT_TYPES[form.case_category] || []} placeholder="Select…" required />
          </Field>
          <Field label="Child's name">
            <Input name="child_name" value={form.child_name} onChange={update} required />
          </Field>
          <Field label="Age">
            <Input name="child_age" type="number" min="0" max="17" value={form.child_age} onChange={update} required />
          </Field>
          <Field label="Incident date">
            <Input name="incident_date" type="date" value={form.incident_date} onChange={update} required />
          </Field>
          <Field label="District">
            <Input name="district" value={form.district} onChange={update} required />
          </Field>
        </div>
        <Field label="Description">
          <Textarea name="description" value={form.description} onChange={update} required />
        </Field>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Register case"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Cases({ focusCaseId }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [openCase, setOpenCase] = useState(focusCaseId || null);

  const params = new URLSearchParams();
  if (query) params.set("search", query);
  if (status) params.set("status", status);
  const { data: cases, loading, error, reload } = useApi(`/api/cases/?${params}`, []);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const canRegister = ["ADMIN", "POLICE", "PSWO"].includes(user.role);

  const columns = [
    { key: "ref", label: "Reference", render: (c) => <span className="font-medium text-[#19324D] whitespace-nowrap">{shortRef(c.reference_number)}</span> },
    { key: "child", label: "Child", render: (c) => (c.identity_visible ? `${c.child_name} (${c.child_age})` : <span className="text-slate-400">🔒 Hidden · age {c.age_band}</span>) },
    { key: "category", label: "Category", render: (c) => labelFor(CASE_CATEGORIES, c.case_category) },
    { key: "incident", label: "Incident", render: (c) => labelFor(INCIDENT_TYPES, c.incident_type) },
    { key: "district", label: "District" },
    { key: "created", label: "Registered", render: (c) => <span className="whitespace-nowrap">{formatDate(c.created_at)}</span> },
    { key: "status", label: "Status", render: (c) => <Badge map={CASE_STATUS} value={c.status} /> },
    { key: "open", label: "", render: (c) => <button onClick={() => setOpenCase(c.id)} className="text-[#367C78] font-medium">Open</button> },
  ];

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Case Management"
        subtitle="You only see cases you registered, are assigned to, or have been referred."
        action={canRegister && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={18} /> Register new case
          </Button>
        )}
      />
      <ErrorBanner message={error} />
      <Card>
        <div className="p-5 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={canRegister ? "Search by name, district or description…" : "Search by district…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#367C78]/30"
            />
          </div>
          <div className="md:w-48">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={Object.entries(CASE_STATUS).map(([value, [label]]) => ({ value, label }))}
              placeholder="All statuses"
            />
          </div>
        </div>
        {loading ? <Loading /> : <Table columns={columns} rows={cases} empty="No cases to show." />}
      </Card>

      {showForm && (
        <RegisterCase
          onClose={() => setShowForm(false)}
          onCreated={(created) => {
            setShowForm(false);
            reload();
            setOpenCase(created.id);
          }}
        />
      )}
      {openCase && <CaseDetail caseId={openCase} onClose={() => setOpenCase(null)} onChanged={reload} />}
    </div>
  );
}

export default Cases;
