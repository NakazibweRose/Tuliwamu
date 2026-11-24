import { useState } from "react";
import { Plus } from "lucide-react";
import api, { errorMessage } from "../api";
import { useAuth } from "../useAuth";
import useApi from "../useApi";
import { formatDate, shortRef } from "../constants";
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
  Textarea,
} from "../components/ui";

function isOverdue(followUp) {
  return !followUp.is_completed && new Date(`${followUp.due_date}T23:59:59`) < new Date();
}

function NewFollowUp({ onClose, onDone }) {
  const { user } = useAuth();
  const { data: referrals } = useApi("/api/referrals/", []);
  const [form, setForm] = useState({ referral: "", assigned_to: "", due_date: "", notes: "" });
  const [error, setError] = useState("");

  const selected = referrals.find((r) => String(r.id) === String(form.referral));
  const assignees = selected
    ? [
        { value: selected.receiving_officer, label: `${selected.receiving_officer_name} (receiver)` },
        ...(selected.receiving_officer !== user.id ? [{ value: user.id, label: "Me" }] : []),
      ]
    : [];

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await api.post("/api/referrals/follow-ups/", form);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal title="Schedule a follow-up" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner message={error} />
        <Field label="Referral">
          <Select
            value={form.referral}
            onChange={(e) => setForm({ ...form, referral: e.target.value, assigned_to: "" })}
            options={referrals
              .filter((r) => !["COMPLETED", "REJECTED"].includes(r.status))
              .map((r) => ({ value: r.id, label: `#${r.id} · ${shortRef(r.case_reference)} → ${r.receiving_institution}` }))}
            placeholder="Select…"
            required
          />
        </Field>
        <Field label="Assigned to">
          <Select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} options={assignees} placeholder="Select…" required />
        </Field>
        <Field label="Due date">
          <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
        </Field>
        <Field label="What should happen?">
          <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Schedule</Button>
        </div>
      </form>
    </Modal>
  );
}

function FollowUps() {
  const { user } = useAuth();
  const [overdueOnly, setOverdueOnly] = useState(false);
  const { data: followUps, loading, error, reload } = useApi(
    `/api/referrals/follow-ups/${overdueOnly ? "?overdue=true" : ""}`,
    []
  );
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState("");

  async function complete(followUp) {
    setActionError("");
    try {
      await api.patch(`/api/referrals/follow-ups/${followUp.id}/`, { is_completed: true });
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  const columns = [
    { key: "referral", label: "Referral", render: (f) => <span className="font-medium text-[#19324D]">#{f.referral}</span> },
    { key: "notes", label: "Task", render: (f) => <span className="block min-w-56">{f.notes || "—"}</span> },
    {
      key: "due",
      label: "Due",
      render: (f) => (
        <span className={`whitespace-nowrap ${isOverdue(f) ? "text-rose-700 font-medium" : ""}`}>
          {formatDate(f.due_date)} {isOverdue(f) && "⚠ Overdue"}
        </span>
      ),
    },
    {
      key: "state",
      label: "Status",
      render: (f) => (f.is_completed ? <span className="text-emerald-700">✓ Done {formatDate(f.completed_at)}</span> : "Open"),
    },
    {
      key: "action",
      label: "",
      render: (f) =>
        !f.is_completed && (f.assigned_to === user.id || user.role === "ADMIN") ? (
          <Button variant="secondary" className="!px-3 !py-1.5" onClick={() => complete(f)}>Mark done</Button>
        ) : null,
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Follow-ups"
        subtitle="Make sure no referred child is forgotten. Overdue follow-ups trigger an SMS reminder."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={18} /> Schedule follow-up
          </Button>
        }
      />
      <ErrorBanner message={error || actionError} />
      <Card
        title="Follow-up tasks"
        actions={
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
            Overdue only
          </label>
        }
      >
        {loading ? <Loading /> : <Table columns={columns} rows={followUps} empty="No follow-ups." />}
      </Card>
      {showForm && (
        <NewFollowUp
          onClose={() => setShowForm(false)}
          onDone={() => {
            setShowForm(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

export default FollowUps;
