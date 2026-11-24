import { ArrowLeftRight, Clock, FolderOpen, Inbox, ShieldCheck } from "lucide-react";
import { useAuth } from "../useAuth";
import useApi from "../useApi";
import StatCard from "../components/StatCard";
import { REFERRAL_STATUS, ROLE_LABELS, formatDate, shortRef } from "../constants";
import { Badge, Card, Loading, Table } from "../components/ui";

const INTAKE = ["ADMIN", "POLICE", "PSWO"];

function Dashboard({ setActivePage }) {
  const { user } = useAuth();
  const isIntake = INTAKE.includes(user.role);
  const cases = useApi("/api/cases/", []);
  const referrals = useApi("/api/referrals/", []);
  const followUps = useApi("/api/referrals/follow-ups/?overdue=true", []);
  const reports = useApi(isIntake ? "/api/public-reports/?status=RECEIVED" : null, []);

  const incomingPending = referrals.data.filter((r) => r.receiving_officer === user.id && r.status === "PENDING");
  const awaitingReply = referrals.data.filter((r) => r.referred_by === user.id && r.status === "PENDING");

  const count = (source, rows) => (source.loading ? "…" : rows.length);

  const cards = isIntake
    ? [
        { title: "New public reports", value: count(reports, reports.data), description: "Waiting for triage", icon: Inbox, page: "Public Reports" },
        { title: "My cases", value: count(cases, cases.data), description: "Registered by or assigned to you", icon: FolderOpen, page: "Cases" },
        { title: "Referrals awaiting reply", value: count(referrals, awaitingReply), description: "Sent, not yet acknowledged", icon: ArrowLeftRight, page: "Referrals" },
        { title: "Overdue follow-ups", value: count(followUps, followUps.data), description: "Past their due date", icon: Clock, page: "Follow-ups" },
      ]
    : [
        { title: "New referrals for you", value: count(referrals, incomingPending), description: "Accept or decline", icon: Inbox, page: "Referrals" },
        { title: "Cases referred to you", value: count(cases, cases.data), description: "Identity shown after you accept", icon: FolderOpen, page: "Cases" },
        { title: "All my referrals", value: count(referrals, referrals.data), description: "Any status", icon: ArrowLeftRight, page: "Referrals" },
        { title: "Overdue follow-ups", value: count(followUps, followUps.data), description: "Past their due date", icon: Clock, page: "Follow-ups" },
      ];

  const recent = referrals.data.slice(0, 6);

  return (
    <div className="p-8 space-y-7">
      <div className="bg-[#19324D] text-white rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.first_name || user.username}</h1>
          <p className="text-sm text-slate-300 mt-1">
            {ROLE_LABELS[user.role]}{user.institution ? ` · ${user.institution.name}` : ""}
          </p>
        </div>
        <p className="flex items-center gap-2 text-xs text-slate-300 max-w-sm">
          <ShieldCheck size={18} className="shrink-0" />
          You only see the records your role needs. Every view of a child's record is logged.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map(({ page, ...card }) => (
          <button key={card.title} onClick={() => setActivePage(page)} className="text-left">
            <StatCard {...card} />
          </button>
        ))}
      </div>

      <Card title="Latest referrals" subtitle="Most recent first">
        {referrals.loading ? (
          <Loading />
        ) : (
          <Table
            rows={recent}
            empty="No referrals yet."
            columns={[
              { key: "case", label: "Case", render: (r) => <span className="font-medium text-[#19324D]">{shortRef(r.case_reference)}</span> },
              { key: "to", label: "To", render: (r) => r.receiving_institution },
              { key: "date", label: "Referred", render: (r) => formatDate(r.date_referred) },
              { key: "status", label: "Status", render: (r) => <Badge map={REFERRAL_STATUS} value={r.status} /> },
            ]}
          />
        )}
      </Card>
    </div>
  );
}

export default Dashboard;
