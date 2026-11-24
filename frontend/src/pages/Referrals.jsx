import { useState } from "react";
import api, { errorMessage } from "../api";
import { useAuth } from "../useAuth";
import useApi from "../useApi";
import CaseDetail from "../components/CaseDetail";
import { NEXT_REFERRAL_STATUS, REFERRAL_STATUS, formatDate, shortRef } from "../constants";
import {
  Badge,
  Button,
  Card,
  ErrorBanner,
  Field,
  Loading,
  Modal,
  PageHeader,
  Table,
  Textarea,
} from "../components/ui";

const ACTION_LABELS = {
  ACCEPTED: "Accept",
  REJECTED: "Decline",
  IN_PROGRESS: "Start work",
  COMPLETED: "Mark completed",
};

function StatusModal({ referral, nextStatus, onClose, onDone }) {
  const [notes, setNotes] = useState(referral.response_notes || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.patch(`/api/referrals/${referral.id}/`, { status: nextStatus, response_notes: notes });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`${ACTION_LABELS[nextStatus]}: referral #${referral.id}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {nextStatus === "ACCEPTED" && (
          <p className="text-sm text-slate-600 bg-teal-50 rounded-lg p-3">
            After you accept, you will see the child's identity and full case details.
            The referring officer is alerted by SMS.
          </p>
        )}
        <ErrorBanner message={error} />
        <Field label={nextStatus === "REJECTED" ? "Reason for declining (required)" : "Notes (optional)"}>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} required={nextStatus === "REJECTED"} />
        </Field>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={nextStatus === "REJECTED" ? "danger" : "primary"} disabled={busy}>
            {ACTION_LABELS[nextStatus]}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Referrals() {
  const { user } = useAuth();
  const { data: referrals, loading, error, reload } = useApi("/api/referrals/", []);
  const [tab, setTab] = useState(["LEGAL_AID", "SERVICE_PROVIDER"].includes(user.role) ? "incoming" : "all");
  const [action, setAction] = useState(null);
  const [openCase, setOpenCase] = useState(null);

  const incoming = referrals.filter((r) => r.receiving_officer === user.id);
  const sent = referrals.filter((r) => r.referred_by === user.id);
  const rows = tab === "incoming" ? incoming : tab === "sent" ? sent : referrals;

  const columns = [
    { key: "id", label: "#", render: (r) => <span className="font-medium text-[#19324D]">#{r.id}</span> },
    { key: "case", label: "Case", render: (r) => <button onClick={() => setOpenCase(r.case)} className="text-[#367C78] font-medium whitespace-nowrap">{shortRef(r.case_reference)}</button> },
    { key: "from", label: "From", render: (r) => <span className="block min-w-40">{r.referring_institution}<br /><span className="text-xs text-slate-400">{r.referred_by_name}</span></span> },
    { key: "to", label: "To", render: (r) => <span className="block min-w-40">{r.receiving_institution}<br /><span className="text-xs text-slate-400">{r.receiving_officer_name}</span></span> },
    { key: "reason", label: "Reason", render: (r) => <span className="block min-w-56">{r.reason}{r.response_notes && <span className="block text-xs text-slate-400 mt-1">Response: {r.response_notes}</span>}</span> },
    { key: "date", label: "Referred", render: (r) => <span className="whitespace-nowrap">{formatDate(r.date_referred, true)}</span> },
    { key: "status", label: "Status", render: (r) => <Badge map={REFERRAL_STATUS} value={r.status} /> },
    {
      key: "actions",
      label: "Action",
      render: (r) =>
        r.receiving_officer === user.id || user.role === "ADMIN" ? (
          <div className="flex gap-2 whitespace-nowrap">
            {NEXT_REFERRAL_STATUS[r.status].map((next) => (
              <Button
                key={next}
                variant={next === "REJECTED" ? "danger" : "primary"}
                className="!px-3 !py-1.5"
                onClick={() => setAction({ referral: r, next })}
              >
                {ACTION_LABELS[next]}
              </Button>
            ))}
          </div>
        ) : null,
    },
  ];

  const tabs = [
    ["all", `All (${referrals.length})`],
    ["incoming", `Received (${incoming.length})`],
    ["sent", `Sent (${sent.length})`],
  ];

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Referrals"
        subtitle="Child-sensitive referrals between police, probation, legal aid and support services. Every status change is recorded."
      />
      <ErrorBanner message={error} />
      <Card
        actions={
          <div className="flex gap-2" role="tablist">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`px-3 py-1.5 rounded-lg text-sm ${tab === key ? "bg-[#19324D] text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {label}
              </button>
            ))}
          </div>
        }
        title="Referral register"
      >
        {loading ? <Loading /> : <Table columns={columns} rows={rows} empty="No referrals here." />}
      </Card>
      {action && (
        <StatusModal
          referral={action.referral}
          nextStatus={action.next}
          onClose={() => setAction(null)}
          onDone={() => {
            setAction(null);
            reload();
          }}
        />
      )}
      {openCase && <CaseDetail caseId={openCase} onClose={() => { setOpenCase(null); reload(); }} />}
    </div>
  );
}

export default Referrals;
