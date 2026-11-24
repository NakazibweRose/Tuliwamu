
import { useEffect, useState } from "react";
import {
  FolderOpen,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import StatCard from "../components/StatCard";
import api from "../api";

function Dashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/cases/");

      const data = response.data;
      const caseList = Array.isArray(data)
        ? data
        : data.results || [];

      setCases(caseList);
    } catch (err) {
      console.error("Dashboard cases error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to load dashboard statistics."
      );
    } finally {
      setLoading(false);
    }
  };

  const totalCases = cases.length;

  const newCases = cases.filter(
    (item) => item.status === "NEW"
  ).length;

  const underReviewCases = cases.filter(
    (item) => item.status === "UNDER_REVIEW"
  ).length;

  const activeCases = cases.filter(
    (item) => item.status === "ACTIVE"
  ).length;

  const resolvedCases = cases.filter(
    (item) => item.status === "CLOSED"
  ).length;

  const recentCases = [...cases]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0) -
        new Date(a.created_at || 0)
    )
    .slice(0, 5);

  const formatCaseType = (value) => {
    const labels = {
      CHILD_PROTECTION: "Child Protection",
      CHILD_IN_CONFLICT_WITH_LAW:
        "Child in Conflict with the Law",
    };

    return labels[value] || value?.replaceAll("_", " ") || "—";
  };

  const formatStatus = (value) => {
    const labels = {
      NEW: "New",
      UNDER_REVIEW: "Under Review",
      ACTIVE: "Active",
      CLOSED: "Closed",
    };

    return labels[value] || value || "—";
  };

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

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
          <button
            onClick={fetchCases}
            className="ml-auto underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Cases"
          value={loading ? "..." : totalCases}
          description="Registered cases"
          icon={FolderOpen}
        />

        <StatCard
          title="New Cases"
          value={loading ? "..." : newCases}
          description="Awaiting review"
          icon={AlertCircle}
        />

        <StatCard
          title="Under Review"
          value={loading ? "..." : underReviewCases}
          description="Currently being reviewed"
          icon={Clock}
        />

        <StatCard
          title="Resolved Cases"
          value={loading ? "..." : resolvedCases}
          description="Successfully closed"
          icon={CheckCircle}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl mt-8">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-[#19324D]">
            Recent Cases
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Latest cases retrieved from the database
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Case ID</th>
                <th className="px-6 py-4 font-medium">Case Type</th>
                <th className="px-6 py-4 font-medium">District</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    Loading cases...
                  </td>
                </tr>
              ) : recentCases.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    No cases have been registered yet.
                  </td>
                </tr>
              ) : (
                recentCases.map((caseItem) => (
                  <tr
                    key={caseItem.id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-6 py-4 font-medium text-[#19324D]">
                      {caseItem.reference_number
                        ? caseItem.reference_number.slice(0, 8).toUpperCase()
                        : caseItem.id}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {formatCaseType(caseItem.case_category)}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {caseItem.district || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span className="bg-teal-50 text-teal-800 px-3 py-1 rounded-full text-xs">
                        {formatStatus(caseItem.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
