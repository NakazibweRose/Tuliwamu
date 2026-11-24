import { useState } from "react";
import { FolderPlus } from "lucide-react";
import api, { errorMessage } from "../api";
import useApi from "../useApi";
import {
  CASE_CATEGORIES,
  INCIDENT_TYPES,
  REPORT_CATEGORIES,
  REPORT_STATUS,
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
} from "../components/ui";

const STATUS_OPTIONS = Object.entries(REPORT_STATUS).map(([value, [label]]) => ({ value, label }));

function ConvertModal({ report, onClose, onDone }) {
  const [form, setForm] = useState({
    case_category: "",
    incident_type: "",
    child_name: "",
    child_age: "",
    incident_date: new Date().toISOString().slice(0, 10),
  });
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
      const { data } = await api.post(`/api/public-reports/${report.id}/convert/`, form);
      onDone(data.case);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Convert ${report.reference_code} into a protected case`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
          <p><strong>{labelFor(REPORT_CATEGORIES, report.category)}</strong> · {report.district}</p>
          <p className="mt-1">{report.description}</p>
        </div>
        <p className="text-xs text-slate-500">
          District and description are copied from the report. Add what you have verified.
          Use fictional names in the demo.
        </p>
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
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create case"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function PublicReports({ onOpenCase }) {
  const [statusFilter, setStatusFilter] = useState("");
  const url = `/api/public-reports/${statusFilter ? `?status=${statusFilter}` : ""}`;
  const { data: reports, loading, error, reload } = useApi(url, []);
  const [converting, setConverting] = useState(null);
  const [actionError, setActionError] = useState("");

  async function setStatus(report, status) {
    setActionError("");
    try {
      await api.patch(`/api/public-reports/${report.id}/`, { status });
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  const columns = [
    { key: "reference_code", label: "Reference", render: (r) => <span className="font-mono font-medium text-[#19324D]">{r.reference_code}</span> },
    { key: "category", label: "Concern", render: (r) => r.category_display },
    { key: "district", label: "District" },
    { key: "description", label: "Description", render: (r) => <span className="line-clamp-2 min-w-64 block">{r.description}</span> },
    { key: "channel", label: "Channel" },
    { key: "contact", label: "Contact", render: (r) => r.contact_phone || <span className="text-slate-400">Anonymous</span> },
    { key: "created_at", label: "Received", render: (r) => <span className="whitespace-nowrap">{formatDate(r.created_at, true)}</span> },
    { key: "status", label: "Status", render: (r) => <Badge map={REPORT_STATUS} value={r.status} /> },
    {
      key: "actions",
      label: "Action",
      render: (r) =>
        r.case ? (
          <button onClick={() => onOpenCase(r.case)} className="text-[#367C78] font-medium whitespace-nowrap">
            View case
          </button>
        ) : r.status === "CLOSED" ? null : (
          <div className="flex flex-wrap gap-2">
            <Button className="!px-3 !py-1.5" onClick={() => setConverting(r)}>
              <FolderPlus size={15} /> Convert
            </Button>
            {r.status === "RECEIVED" && (
              <Button variant="secondary" className="!px-3 !py-1.5" onClick={() => setStatus(r, "UNDER_REVIEW")}>Review</Button>
            )}
            <Button variant="secondary" className="!px-3 !py-1.5" onClick={() => setStatus(r, "CLOSED")}>Close</Button>
          </div>
        ),
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Public Reports"
        subtitle="Anonymous concerns received by USSD and the web form. Triage them and convert genuine concerns into protected cases."
      />
      <ErrorBanner message={error || actionError} />
      <Card
        title="Triage inbox"
        actions={
          <div className="w-48">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} placeholder="All statuses" />
          </div>
        }
      >
        {loading ? <Loading /> : <Table columns={columns} rows={reports} empty="No reports." />}
      </Card>
      {converting && (
        <ConvertModal
          report={converting}
          onClose={() => setConverting(null)}
          onDone={(createdCase) => {
            setConverting(null);
            reload();
            onOpenCase(createdCase.id, `Case ${shortRef(createdCase.reference_number)} created.`);
          }}
        />
      )}
    </div>
  );
}

export default PublicReports;
