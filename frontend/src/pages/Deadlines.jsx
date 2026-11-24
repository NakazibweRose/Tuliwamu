
import { useEffect, useState } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  X,
  CalendarDays,
} from "lucide-react";
import api from "../api";

function getList(data) {
  if (Array.isArray(data)) return data;
  return data?.results || [];
}

function Deadlines() {
  const [deadlines, setDeadlines] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    referral: "",
    assigned_to: "",
    due_date: "",
    notes: "",
  });

  const today = new Date().toLocaleDateString("en-CA");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [followUpsResponse, referralsResponse, staffResponse] =
        await Promise.all([
          api.get("/api/referrals/follow-ups/"),
          api.get("/api/referrals/"),
          api.get("/api/accounts/staff/list/"),
        ]);

      setDeadlines(getList(followUpsResponse.data));
      setReferrals(getList(referralsResponse.data));
      setOfficers(getList(staffResponse.data));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Could not load follow-up records. Please check your connection and permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getReferral = (id) =>
    referrals.find((item) => String(item.id) === String(id));

  const getOfficer = (id) =>
    officers.find((item) => String(item.id) === String(id));

  const getStatus = (item) => {
    if (item.is_completed) return "Completed";
    if (item.due_date < today) return "Overdue";
    return "Upcoming";
  };

  const filteredDeadlines = deadlines.filter((item) => {
    const referral = getReferral(item.referral);
    const caseReference = referral?.case_reference || "";
    const matchesSearch =
      caseReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || getStatus(item) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const total = deadlines.length;
  const upcoming = deadlines.filter(
    (item) => getStatus(item) === "Upcoming"
  ).length;
  const overdue = deadlines.filter(
    (item) => getStatus(item) === "Overdue"
  ).length;
  const completed = deadlines.filter(
    (item) => item.is_completed
  ).length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.post("/api/referrals/follow-ups/", {
        referral: Number(formData.referral),
        assigned_to: Number(formData.assigned_to),
        due_date: formData.due_date,
        notes: formData.notes,
      });

      setFormData({
        referral: "",
        assigned_to: "",
        due_date: "",
        notes: "",
      });

      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(
        JSON.stringify(err.response?.data || "Could not save the follow-up.")
      );
    } finally {
      setSaving(false);
    }
  };

  const markComplete = async (id) => {
    setError("");

    try {
      await api.patch(`/api/referrals/follow-ups/${id}/`, {
        is_completed: true,
      });
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Could not update this follow-up."
      );
    }
  };

  const statusStyles = {
    Upcoming: "bg-blue-50 text-blue-700",
    Overdue: "bg-red-50 text-red-700",
    Completed: "bg-green-50 text-green-700",
  };

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#19324D]">
            Deadline Monitoring
          </h1>
          <p className="text-slate-500 mt-1">
            Monitor referral follow-ups and pending actions.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-[#367C78] text-white px-4 py-3 rounded-lg hover:bg-[#2d6865]"
        >
          <Plus size={18} />
          Add Deadline
        </button>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {[
          { title: "Total Deadlines", value: total, icon: CalendarDays },
          { title: "Upcoming", value: upcoming, icon: Clock },
          { title: "Overdue", value: overdue, icon: AlertTriangle },
          { title: "Completed", value: completed, icon: CheckCircle },
        ].map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">{card.title}</p>
                <Icon size={20} className="text-[#367C78]" />
              </div>
              <h2 className="text-3xl font-bold text-[#19324D] mt-4">
                {card.value}
              </h2>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-[#19324D]">
            Follow-up Records
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Live records from the Tuliwamu database.
          </p>
        </div>

        <div className="p-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by case or follow-up notes..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-2.5"
          >
            <option value="All">All statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Overdue">Overdue</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Case Reference</th>
                <th className="px-6 py-4 font-medium">Follow-up Action</th>
                <th className="px-6 py-4 font-medium">Assigned Officer</th>
                <th className="px-6 py-4 font-medium">Due Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10">
                    Loading follow-ups...
                  </td>
                </tr>
              ) : filteredDeadlines.length > 0 ? (
                filteredDeadlines.map((item) => {
                  const referral = getReferral(item.referral);
                  const officer = getOfficer(item.assigned_to);
                  const status = getStatus(item);

                  return (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-6 py-4 font-medium text-[#19324D]">
                        {referral?.case_reference
                          ? `CASE-${referral.case_reference.slice(0, 8)}`
                          : `Referral #${item.referral}`}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {item.notes || "Follow-up"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {officer
                          ? `${officer.first_name} ${officer.last_name}`.trim() ||
                            officer.username
                          : `Officer #${item.assigned_to}`}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {item.due_date}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${statusStyles[status]}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {!item.is_completed && (
                          <button
                            onClick={() => markComplete(item.id)}
                            className="text-[#367C78] hover:underline"
                          >
                            Mark complete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-500">
                    No matching follow-up records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#19324D]">
                Add Follow-up Deadline
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Referral
                </label>
                <select
                  required
                  value={formData.referral}
                  onChange={(event) =>
                    setFormData({ ...formData, referral: event.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg p-3"
                >
                  <option value="">Select a referral</option>
                  {referrals.map((referral) => (
                    <option key={referral.id} value={referral.id}>
                      {`Referral #${referral.id} — ${
                        referral.case_reference
                          ? referral.case_reference.slice(0, 8)
                          : "Case"
                      }`}
                    </option>
                  ))}
                </select>
                {referrals.length === 0 && (
                  <p className="text-xs text-amber-700 mt-1">
                    Create a referral before adding a follow-up.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Assign to Officer
                </label>
                <select
                  required
                  value={formData.assigned_to}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      assigned_to: event.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg p-3"
                >
                  <option value="">Select an officer</option>
                  {officers
                    .filter((officer) =>
                      ["POLICE", "PSWO", "LEGAL_AID"].includes(officer.role)
                    )
                    .map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {`${officer.first_name} ${officer.last_name}`.trim() ||
                          officer.username} ({officer.role})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  value={formData.due_date}
                  onChange={(event) =>
                    setFormData({ ...formData, due_date: event.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Follow-up Notes
                </label>
                <textarea
                  required
                  rows="3"
                  value={formData.notes}
                  onChange={(event) =>
                    setFormData({ ...formData, notes: event.target.value })
                  }
                  placeholder="Describe the follow-up action required"
                  className="w-full border border-slate-200 rounded-lg p-3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || referrals.length === 0 || officers.length === 0}
                  className="px-4 py-2 bg-[#367C78] text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Deadline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Deadlines;
