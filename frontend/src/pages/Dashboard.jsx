
import {
  FolderOpen,
  ArrowLeftRight,
  Clock,
  CheckCircle,
} from "lucide-react";

import StatCard from "../components/StatCard";

const recentCases = [
  {
    id: "CASE-001",
    type: "Child Protection",
    status: "Under Review",
    institution: "Probation Office",
  },
  {
    id: "CASE-002",
    type: "Child Victim Support",
    status: "Referred",
    institution: "Child Protection Unit",
  },
  {
    id: "CASE-003",
    type: "Child in Conflict with the Law",
    status: "Open",
    institution: "Police",
  },
];

function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#19324D]">
          Welcome to Tuliwamu
        </h1>
        <p className="text-slate-500 mt-1">
          A coordinated approach to child protection and access to justice.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Cases"
          value="24"
          description="Illustrative demo figure"
          icon={FolderOpen}
        />

        <StatCard
          title="Active Referrals"
          value="12"
          description="Illustrative demo figure"
          icon={ArrowLeftRight}
        />

        <StatCard
          title="Upcoming Deadlines"
          value="5"
          description="Illustrative demo figure"
          icon={Clock}
        />

        <StatCard
          title="Resolved Cases"
          value="7"
          description="Illustrative demo figure"
          icon={CheckCircle}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl mt-8">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-[#19324D]">
            Recent Cases
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Sample records for the demonstration
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Case ID</th>
                <th className="px-6 py-4 font-medium">Case Type</th>
                <th className="px-6 py-4 font-medium">Institution</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>

            <tbody>
              {recentCases.map((caseItem) => (
                <tr key={caseItem.id} className="border-t border-slate-100">
                  <td className="px-6 py-4 font-medium text-[#19324D]">
                    {caseItem.id}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {caseItem.type}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {caseItem.institution}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-teal-50 text-teal-800 px-3 py-1 rounded-full text-xs">
                      {caseItem.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
