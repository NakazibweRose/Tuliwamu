
import { useState } from "react";
import {
  Search,
  Plus,
  Eye,
  X,
  ArrowLeftRight,
  Clock,
  CheckCircle,
  Building2,
  FileText,
  Send,
} from "lucide-react";

// Temporary demo cases.
// These will eventually come from GET /api/cases/
const demoCases = [
  { id: 1, reference: "TUL-001" },
  { id: 2, reference: "TUL-002" },
  { id: 3, reference: "TUL-003" },
];

const initialReferrals = [
  {
    id: 1,
    case: 1,
    case_reference: "TUL-001",
    referring_institution: "Police Child and Family Protection Unit",
    receiving_institution: "Probation and Social Welfare Office",
    date_referred: "2026-11-18",
    status: "ACCEPTED",
    reason: "Follow-up and child protection assessment",
    response_notes: "Referred for assessment and further support.",
  },
  {
    id: 2,
    case: 2,
    case_reference: "TUL-002",
    referring_institution: "Probation and Social Welfare Office",
    receiving_institution: "Legal Aid Provider",
    date_referred: "2026-11-20",
    status: "PENDING",
    reason: "Legal assistance and guidance",
    response_notes: "",
  },
  {
    id: 3,
    case: 3,
    case_reference: "TUL-003",
    referring_institution: "Police Child and Family Protection Unit",
    receiving_institution: "Healthcare Facility",
    date_referred: "2026-11-21",
    status: "COMPLETED",
    reason: "Further assessment and follow-up",
    response_notes: "Referral process completed.",
  },
];

const institutions = [
  "Police Child and Family Protection Unit",
  "Probation and Social Welfare Office",
  "Legal Aid Provider",
  "Healthcare Facility",
  "Child Protection Organisation",
];

const statusLabels = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-teal-50 text-teal-700",
  REJECTED: "bg-red-50 text-red-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
};

function Referrals() {
  const [cases] = useState(demoCases);
  const [referrals, setReferrals] = useState(initialReferrals);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);

  const [formData, setFormData] = useState({
    case: "",
    referring_institution: "",
    receiving_institution: "",
    reason: "",
  });

  const pendingCount = referrals.filter(
    (referral) => referral.status === "PENDING"
  ).length;

  const acceptedCount = referrals.filter(
    (referral) => referral.status === "ACCEPTED"
  ).length;

  const completedCount = referrals.filter(
    (referral) => referral.status === "COMPLETED"
  ).length;

  const filteredReferrals = referrals.filter((referral) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      String(referral.id).includes(search) ||
      referral.case_reference.toLowerCase().includes(search) ||
      referral.receiving_institution.toLowerCase().includes(search) ||
      referral.referring_institution.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "ALL" || referral.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setFormData({
      case: "",
      referring_institution: "",
      receiving_institution: "",
      reason: "",
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const selectedCase = cases.find(
      (item) => item.id === Number(formData.case)
    );

    if (!selectedCase) return;

    // This object follows the backend referral field names.
    const newReferral = {
      id: Date.now(),
      case: selectedCase.id,
      case_reference: selectedCase.reference,
      referring_institution: formData.referring_institution,
      receiving_institution: formData.receiving_institution,
      reason: formData.reason,
      status: "PENDING",
      response_notes: "",
      date_referred: new Date().toISOString(),
    };

    setReferrals((previous) => [newReferral, ...previous]);
    resetForm();
    setShowForm(false);
  }

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="p-8 space-y-7">
      {/* Page heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#19324D]">
            Referrals Management
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Coordinate case referrals between child protection and justice institutions.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-[#367C78] hover:bg-[#286662] text-white px-5 py-3 rounded-lg text-sm font-medium transition"
        >
          <Plus size={18} />
          Create Referral
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Total Referrals</p>
            <ArrowLeftRight className="text-[#367C78]" size={21} />
          </div>
          <h2 className="text-3xl font-bold text-[#19324D] mt-4">
            {referrals.length}
          </h2>
          <p className="text-xs text-slate-500 mt-2">All recorded referrals</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Pending</p>
            <Clock className="text-amber-600" size={21} />
          </div>
          <h2 className="text-3xl font-bold text-[#19324D] mt-4">
            {pendingCount}
          </h2>
          <p className="text-xs text-slate-500 mt-2">Awaiting a response</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Accepted</p>
            <Building2 className="text-blue-600" size={21} />
          </div>
          <h2 className="text-3xl font-bold text-[#19324D] mt-4">
            {acceptedCount}
          </h2>
          <p className="text-xs text-slate-500 mt-2">Received by institutions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Completed</p>
            <CheckCircle className="text-emerald-600" size={21} />
          </div>
          <h2 className="text-3xl font-bold text-[#19324D] mt-4">
            {completedCount}
          </h2>
          <p className="text-xs text-slate-500 mt-2">Completed referrals</p>
        </div>
      </div>

      {/* Referrals table */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-[#19324D]">
            Referral Records
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            View and track referrals sent to different institutions.
          </p>
        </div>

        <div className="p-5 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search referral, case or institution..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#367C78]/30"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#367C78]/30"
          >
            <option value="ALL">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-4">Referral ID</th>
                <th className="px-5 py-4">Case Reference</th>
                <th className="px-5 py-4">Receiving Institution</th>
                <th className="px-5 py-4">Date Referred</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredReferrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-medium text-[#19324D]">
                    REF-{String(referral.id).padStart(3, "0")}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {referral.case_reference}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 min-w-56">
                    {referral.receiving_institution}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {formatDate(referral.date_referred)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusStyles[referral.status]
                      }`}
                    >
                      {statusLabels[referral.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedReferral(referral)}
                      className="flex items-center gap-2 text-[#367C78] hover:text-[#19324D] text-sm font-medium"
                    >
                      <Eye size={17} />
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {filteredReferrals.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-10 text-sm text-slate-500"
                  >
                    No referrals found. Try another search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 text-xs text-slate-500">
          Showing {filteredReferrals.length} of {referrals.length} referrals
        </div>
      </div>

      {/* Create referral modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-[#19324D]">
                  Create New Referral
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Send a registered case to a responsible institution.
                </p>
              </div>
              <button onClick={() => setShowForm(false)}>
                <X className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Registered Case
                </label>
                <select
                  name="case"
                  value={formData.case}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#367C78]/30"
                >
                  <option value="">Select a registered case</option>
                  {cases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.reference}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  Only cases available to your account should appear here.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Referring Institution
                </label>
                <select
                  name="referring_institution"
                  value={formData.referring_institution}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#367C78]/30"
                >
                  <option value="">Select referring institution</option>
                  {institutions.map((institution) => (
                    <option key={institution} value={institution}>
                      {institution}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Receiving Institution
                </label>
                <select
                  name="receiving_institution"
                  value={formData.receiving_institution}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#367C78]/30"
                >
                  <option value="">Select receiving institution</option>
                  {institutions.map((institution) => (
                    <option key={institution} value={institution}>
                      {institution}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Referral
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Why is this case being referred?"
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#367C78]/30"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="px-5 py-3 border border-slate-200 rounded-lg text-sm text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-3 bg-[#367C78] hover:bg-[#286662] text-white rounded-lg text-sm font-medium"
                >
                  <Send size={16} />
                  Create Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Referral details modal */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-[#19324D]">
                  Referral Details
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  REF-{String(selectedReferral.id).padStart(3, "0")}
                </p>
              </div>
              <button onClick={() => setSelectedReferral(null)}>
                <X className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusStyles[selectedReferral.status]
                  }`}
                >
                  {statusLabels[selectedReferral.status]}
                </span>
              </div>

              <div className="flex gap-3">
                <FileText className="text-[#367C78]" size={20} />
                <div>
                  <p className="text-xs text-slate-500">Case Reference</p>
                  <p className="text-sm font-medium text-[#19324D]">
                    {selectedReferral.case_reference}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Building2 className="text-[#367C78]" size={20} />
                <div>
                  <p className="text-xs text-slate-500">Referring Institution</p>
                  <p className="text-sm font-medium text-[#19324D]">
                    {selectedReferral.referring_institution}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Building2 className="text-[#367C78]" size={20} />
                <div>
                  <p className="text-xs text-slate-500">Receiving Institution</p>
                  <p className="text-sm font-medium text-[#19324D]">
                    {selectedReferral.receiving_institution}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500">Date Referred</p>
                <p className="text-sm font-medium text-[#19324D] mt-1">
                  {formatDate(selectedReferral.date_referred)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Reason for Referral</p>
                <p className="text-sm text-slate-700 mt-1">
                  {selectedReferral.reason}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Institution Response</p>
                <p className="text-sm text-slate-700 mt-1">
                  {selectedReferral.response_notes ||
                    "No response recorded yet."}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedReferral(null)}
                className="px-5 py-2.5 bg-[#19324D] text-white rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Referrals;
