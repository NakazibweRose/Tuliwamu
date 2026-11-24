import { useState } from "react";
import { Plus } from "lucide-react";
import api, { errorMessage } from "../api";
import useApi from "../useApi";
import { ROLE_LABELS } from "../constants";
import {
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
} from "../components/ui";

const STAFF_ROLES = ["POLICE", "PSWO", "LEGAL_AID", "SERVICE_PROVIDER", "OVERSIGHT"].map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

const INSTITUTION_TYPES = [
  ["POLICE_CFPU", "Police Child & Family Protection Unit"],
  ["PROBATION_OFFICE", "Probation & Social Welfare Office"],
  ["LEGAL_AID", "Legal Aid Provider"],
  ["SERVICE_PROVIDER", "Support Service"],
  ["OVERSIGHT", "Oversight / M&E"],
  ["OTHER", "Other"],
].map(([value, label]) => ({ value, label }));

function NewStaff({ institutions, onClose, onDone }) {
  const [form, setForm] = useState({ username: "", first_name: "", last_name: "", password: "", role: "", institution: "", phone_number: "" });
  const [error, setError] = useState("");
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await api.post("/api/accounts/staff/", { ...form, institution: form.institution || null });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal title="Create staff account" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner message={error} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Username"><Input name="username" value={form.username} onChange={update} required /></Field>
          <Field label="Temporary password"><Input name="password" type="password" minLength={8} value={form.password} onChange={update} required /></Field>
          <Field label="First name"><Input name="first_name" value={form.first_name} onChange={update} /></Field>
          <Field label="Last name"><Input name="last_name" value={form.last_name} onChange={update} /></Field>
          <Field label="Role"><Select name="role" value={form.role} onChange={update} options={STAFF_ROLES} placeholder="Select…" required /></Field>
          <Field label="Institution">
            <Select name="institution" value={form.institution} onChange={update} options={institutions.map((i) => ({ value: i.id, label: i.name }))} placeholder="Select…" />
          </Field>
          <Field label="Phone (for SMS alerts)"><Input name="phone_number" value={form.phone_number} onChange={update} placeholder="+2567…" /></Field>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create account</Button>
        </div>
      </form>
    </Modal>
  );
}

function NewInstitution({ onClose, onDone }) {
  const [form, setForm] = useState({ name: "", institution_type: "", district: "", phone_number: "" });
  const [error, setError] = useState("");
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await api.post("/api/accounts/institutions/", form);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal title="Add institution" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner message={error} />
        <Field label="Name"><Input name="name" value={form.name} onChange={update} required /></Field>
        <Field label="Type"><Select name="institution_type" value={form.institution_type} onChange={update} options={INSTITUTION_TYPES} placeholder="Select…" required /></Field>
        <Field label="District"><Input name="district" value={form.district} onChange={update} required /></Field>
        <Field label="Phone"><Input name="phone_number" value={form.phone_number} onChange={update} /></Field>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add</Button>
        </div>
      </form>
    </Modal>
  );
}

function Staff() {
  const staff = useApi("/api/accounts/staff/list/", []);
  const institutions = useApi("/api/accounts/institutions/", []);
  const [modal, setModal] = useState(null);
  const [actionError, setActionError] = useState("");

  const institutionName = (id) => institutions.data.find((i) => i.id === id)?.name || "—";

  async function toggleActive(member) {
    setActionError("");
    try {
      await api.patch(`/api/accounts/staff/${member.id}/status/`, { is_active: !member.is_active });
      staff.reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  const staffColumns = [
    { key: "username", label: "Username", render: (s) => <span className="font-medium text-[#19324D]">{s.username}</span> },
    { key: "name", label: "Name", render: (s) => `${s.first_name} ${s.last_name}`.trim() || "—" },
    { key: "role", label: "Role", render: (s) => ROLE_LABELS[s.role] || s.role },
    { key: "institution", label: "Institution", render: (s) => institutionName(s.institution) },
    { key: "phone", label: "Phone", render: (s) => s.phone_number || "—" },
    {
      key: "active",
      label: "Access",
      render: (s) => (
        <Button variant={s.is_active ? "danger" : "secondary"} className="!px-3 !py-1.5" onClick={() => toggleActive(s)}>
          {s.is_active ? "Deactivate" : "Reactivate"}
        </Button>
      ),
    },
  ];

  const institutionColumns = [
    { key: "name", label: "Name", render: (i) => <span className="font-medium text-[#19324D]">{i.name}</span> },
    { key: "type", label: "Type", render: (i) => INSTITUTION_TYPES.find((t) => t.value === i.institution_type)?.label },
    { key: "district", label: "District" },
    { key: "phone_number", label: "Phone" },
  ];

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Staff & Institutions" subtitle="Only administrators can create accounts. Deactivating an account removes access immediately." />
      <ErrorBanner message={staff.error || institutions.error || actionError} />
      <Card title="Staff accounts" actions={<Button onClick={() => setModal("staff")}><Plus size={16} /> New account</Button>}>
        {staff.loading ? <Loading /> : <Table columns={staffColumns} rows={staff.data} />}
      </Card>
      <Card title="Institutions" actions={<Button onClick={() => setModal("institution")}><Plus size={16} /> Add institution</Button>}>
        {institutions.loading ? <Loading /> : <Table columns={institutionColumns} rows={institutions.data} />}
      </Card>
      {modal === "staff" && <NewStaff institutions={institutions.data} onClose={() => setModal(null)} onDone={() => { setModal(null); staff.reload(); }} />}
      {modal === "institution" && <NewInstitution onClose={() => setModal(null)} onDone={() => { setModal(null); institutions.reload(); }} />}
    </div>
  );
}

export default Staff;
