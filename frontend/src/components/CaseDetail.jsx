import { useEffect, useState } from "react";
import { History, Send } from "lucide-react";
import api, { errorMessage } from "../api";
import { useAuth } from "../useAuth";
import useApi from "../useApi";
import {
  CASE_CATEGORIES,
  CASE_STATUS,
  INCIDENT_TYPES,
  REFERRAL_STATUS,
  ROLE_LABELS,
  formatDate,
  labelFor,
  shortRef,
} from "../constants";
import {
  Badge,
  Button,
  ErrorBanner,
  Field,
  IdentityHidden,
  Loading,
  Modal,
  Select,
  Textarea,
} from "./ui";

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-slate-100 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="col-span-2 text-slate-800">{children}</dd>
    </div>
  );
}

function ReferForm({ caseItem, onDone }) {
  const { data: officers } = useApi("/api/referrals/officers/", []);
  const [receiver, setReceiver] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/api/referrals/", { case: caseItem.id, receiving_officer: receiver, reason });
      setReceiver("");
      setReason("");
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const options = officers.map((o) => ({
    value: o.id,
    label: `${o.institution || "No institution"}: ${[o.first_name, o.last_name].join(" ").trim() || o.username} (${ROLE_LABELS[o.role]})`,
  }));

  return (
    <form onSubmit={submit} className="space-y-3 bg-slate-50 rounded-lg p-4">
      <h3 className="font-semibold text-[#19324D] flex items-center gap-2"><Send size={16} /> Refer to a support service</h3>
      <ErrorBanner message={error} />
      <Field label="Send to">
        <Select value={receiver} onChange={(e) => setReceiver(e.target.value)} options={options} placeholder="Select institution and officer…" required />
      </Field>
      <Field label="Reason for referral" hint="The receiver sees this, the age band and the district. They see the name only after accepting.">
        <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required />
      </Field>
      <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send referral (SMS alert to receiver)"}</Button>
    </form>
  );
}

function AccessLog({ caseId }) {
  const [entries, setEntries] = useState(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    api
      .get(`/api/cases/${caseId}/access-log/`)
      .then(({ data }) => setEntries(data))
      .catch(() => setForbidden(true));
  }, [caseId]);

  if (forbidden) return null;
  if (!entries) return <Loading />;

  return (
    <div>
      <h3 className="font-semibold text-[#19324D] flex items-center gap-2 mb-2"><History size={16} /> Access history (audit log)</h3>
      <ul className="text-xs text-slate-600 max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg">
        {entries.map((entry) => (
          <li key={entry.id} className="px-3 py-2 flex justify-between gap-3">
            <span><strong>{entry.user || "system"}</strong> ({ROLE_LABELS[entry.user_role] || entry.user_role}): {entry.action.toLowerCase().replace("_", " ")}{entry.detail ? `, ${entry.detail}` : ""}</span>
            <span className="whitespace-nowrap text-slate-400">{formatDate(entry.created_at, true)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CaseDetail({ caseId, onClose, onChanged }) {
  const { user } = useAuth();
  const { data: caseItem, loading, error, reload } = useApi(`/api/cases/${caseId}/`);
  const { data: referrals, reload: reloadReferrals } = useApi("/api/referrals/", []);
  const [statusError, setStatusError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const caseReferrals = referrals.filter((r) => r.case === caseId);
  const canChangeStatus = caseItem && (user.role === "ADMIN" || caseItem.assigned_officer === user.id);
  const canRefer = caseItem?.identity_visible && ["ADMIN", "POLICE", "PSWO"].includes(user.role);

  async function changeStatus(status) {
    setStatusError("");
    try {
      await api.patch(`/api/cases/${caseId}/status/`, { status });
      reload();
      setRefreshKey((k) => k + 1);
      onChanged?.();
    } catch (err) {
      setStatusError(errorMessage(err));
    }
  }

  return (
    <Modal title={caseItem ? shortRef(caseItem.reference_number) : "Case"} onClose={onClose} wide>
      {loading && !caseItem ? (
        <Loading />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : (
        <div className="space-y-6">
          {!caseItem.identity_visible && <IdentityHidden />}
          <dl>
            <Row label="Category">{labelFor(CASE_CATEGORIES, caseItem.case_category)}</Row>
            <Row label="Incident type">{labelFor(INCIDENT_TYPES, caseItem.incident_type)}</Row>
            {caseItem.identity_visible ? (
              <>
                <Row label="Child">{caseItem.child_name}, age {caseItem.child_age}</Row>
                <Row label="Incident date">{formatDate(caseItem.incident_date)}</Row>
                <Row label="Description">{caseItem.description}</Row>
              </>
            ) : (
              <Row label="Age band">{caseItem.age_band}</Row>
            )}
            <Row label="District">{caseItem.district}</Row>
            <Row label="Status">
              {canChangeStatus ? (
                <select
                  value={caseItem.status}
                  onChange={(e) => changeStatus(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
                >
                  {Object.entries(CASE_STATUS).map(([value, [label]]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <Badge map={CASE_STATUS} value={caseItem.status} />
              )}
            </Row>
          </dl>
          <ErrorBanner message={statusError} />

          {caseReferrals.length > 0 && (
            <div>
              <h3 className="font-semibold text-[#19324D] mb-2">Referrals for this case</h3>
              <ul className="space-y-2">
                {caseReferrals.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border border-slate-100 rounded-lg px-3 py-2">
                    <span>{r.receiving_institution} ({r.receiving_officer_name}) · referred {formatDate(r.date_referred)}</span>
                    <Badge map={REFERRAL_STATUS} value={r.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {canRefer && (
            <ReferForm
              caseItem={caseItem}
              onDone={() => {
                reloadReferrals();
                setRefreshKey((k) => k + 1);
                onChanged?.();
              }}
            />
          )}

          <AccessLog key={refreshKey} caseId={caseId} />
        </div>
      )}
    </Modal>
  );
}

export default CaseDetail;
