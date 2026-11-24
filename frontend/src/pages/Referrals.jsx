
import { useEffect, useState } from "react";
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
import api from "../api";

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

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getErrorMessage(error) {
  const data = error.response?.data;

  if (typeof data === "string") return data;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => {
        const message = Array.isArray(messages)
          ? messages.join(", ")
          : typeof messages === "object"
            ? JSON.stringify(messages)
            : messages;

        return `${field}: ${message}`;
      })
      .join(" | ");
  }

  return error.message || "Something went wrong. Please try again.";
}

function formatCaseReference(reference) {
  if (!reference) return "—";

  return `CASE-${String(reference).slice(0, 8).toUpperCase()}`;
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatReferralId(id) {
  return `REF-${String(id).padStart(3, "0")}`;
}

function getOfficerName(officerId, officers) {
  const officer = officers.find(
    (item) => Number(item.id) === Number(officerId)
  );

  if (!officer) return officerId ? `Staff #${officerId}` : "—";

  const fullName = `${officer.first_name || ""} ${
    officer.last_name || ""
  }`.trim();

  return fullName || officer.username;
}

function Referrals() {
  const [cases, setCases] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [officers, setOfficers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);

  const [formData, setFormData] = useState({
    case: "",
    receiving_officer: "",
    referring_institution: "",
    receiving_institution: "",
    reason: "",
  });

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [referralResponse, caseResponse, staffResponse] =
        await Promise.all([
          api.get("/api/referrals/"),
          api.get("/api/cases/"),
          api.get("/api/accounts/staff/list/"),
        ]);

      setReferrals(getList(referralResponse.data));
      setCases(getList(caseResponse.data));

      const activeOfficers = getList(staffResponse.data).filter(
        (staff) =>
          staff.is_active &&
          ["POLICE", "PSWO", "LEGAL_AID"].includes(staff.role)
      );

      setOfficers(activeOfficers);
    } catch (requestError) {
      console.error("Failed to load referral data:", requestError);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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

    const caseReference = String(
      referral.case_reference || ""
    ).toLowerCase();

    const matchesSearch =
      String(referral.id).includes(search) ||
      caseReference.includes(search) ||
      String(referral.receiving_institution || "")
        .toLowerCase()
        .includes(search) ||
      String(referral.referring_institution || "")
        .toLowerCase()
        .includes(search);

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
      receiving_officer: "",
      referring_institution: "",
      receiving_institution: "",
      reason: "",
    });

    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!formData.case || !formData.receiving_officer) {
      setFormError("Please select a case and receiving officer.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/api/referrals/", {
        case: Number(formData.case),
        receiving_officer: Number(formData.receiving_officer),
        referring_institution: formData.referring_institution,
        receiving_institution: formData.receiving_institution,
        reason: formData.reason.trim(),
      });

      resetForm();
      setShowForm(false);

      await loadData();
    } catch (requestError) {
      console.error("Failed to create referral:", requestError);
      setFormError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
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
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 bg-[#367C78] hover:bg-[#286662] text-white px-5 py-3 rounded-lg text-sm font-medium transition"
        >
          <Plus size={18} />
          Create Referral
        </button>
      </div>

      {/* Loading and API errors */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          <p className="font-medium">Unable to load referral information.</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 underline font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Total Referrals</p>
            <ArrowLeftRight className="text-[#367C78]" size={21} />
          </div>
          <h2 className="text-3xl font-bold text-[#19324D] mt-4">
            {loading ? "—" : referrals.length}
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            All recorded referrals
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Pending</p>
            <Clock className="text-amber-600" size={21} />
          </div>
          <h2 className="text-3xl font-bold text-[#19324D] mt-4">
            {loading ? "—" : pendingCount}
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Awaiting a response
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Accepted</p>
            <Building2 className="text-blue-600" size={21} />
          </div>
          <h2 className="text-3xl font-bold text-[#19324D] mt-4">
            {loading ? "—" : acceptedCount}
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Received by institutions
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Completed</p>
            <CheckCircle className="text-emerald-600" size={21} />
          </div>
          <h2 className="text-3xl font-bold text-[#19324D] mt-4">
            {loading ? "—" : completedCount}
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Completed referrals
          </p>
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
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-10 text-sm text-slate-500"
                  >
                    Loading referrals...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredReferrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-sm font-medium text-[#19324D]">
                        {formatReferralId(referral.id)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatCaseReference(referral.case_reference)}
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
                            statusStyles[referral.status] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {statusLabels[referral.status] ||
                            referral.status}
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
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 text-xs text-slate-500">
          Showing {loading ? "—" : filteredReferrals.length} of{" "}
          {loading ? "—" : referrals.length} referrals
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

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <X className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {formError}
                </div>
              )}

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
                      {formatCaseReference(item.reference_number)}
                    </option>
                  ))}
                </select>

                {cases.length === 0 && (
                  <p className="text-xs text-amber-700 mt-2">
                    No registered cases are available to your account.
                  </p>
                )}
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
                  Receiving Officer
                </label>

                <select
                  name="receiving_officer"
                  value={formData.receiving_officer}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#367C78]/30"
                >
                  <option value="">Select receiving officer</option>

                  {officers.map((officer) => {
                    const name =
                      `${officer.first_name || ""} ${
                        officer.last_name || ""
                      }`.trim() || officer.username;

                    return (
                      <option key={officer.id} value={officer.id}>
                        {name} ({officer.role.replace("_", " ")})
                      </option>
                    );
                  })}
                </select>

                {officers.length === 0 && (
                  <p className="text-xs text-amber-700 mt-2">
                    No active Police, PSWO or Legal Aid staff accounts are available.
                  </p>
                )}
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
                  disabled={
                    submitting ||
                    cases.length === 0 ||
                    officers.length === 0
                  }
                  className="flex items-center gap-2 px-5 py-3 bg-[#367C78] hover:bg-[#286662] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
                >
                  <Send size={16} />
                  {submitting ? "Creating..." : "Create Referral"}
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
                  {formatReferralId(selectedReferral.id)}
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
                    statusStyles[selectedReferral.status] ||
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {statusLabels[selectedReferral.status] ||
                    selectedReferral.status}
                </span>
              </div>

              <div className="flex gap-3">
                <FileText className="text-[#367C78]" size={20} />
                <div>
                  <p className="text-xs text-slate-500">Case Reference</p>
                  <p className="text-sm font-medium text-[#19324D]">
                    {formatCaseReference(selectedReferral.case_reference)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Building2 className="text-[#367C78]" size={20} />
                <div>
                  <p className="text-xs text-slate-500">
                    Referring Institution
                  </p>
                  <p className="text-sm font-medium text-[#19324D]">
                    {selectedReferral.referring_institution}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Building2 className="text-[#367C78]" size={20} />
                <div>
                  <p className="text-xs text-slate-500">
                    Receiving Institution
                  </p>
                  <p className="text-sm font-medium text-[#19324D]">
                    {selectedReferral.receiving_institution}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500">Receiving Officer</p>
                <p className="text-sm font-medium text-[#19324D] mt-1">
                  {getOfficerName(
                    selectedReferral.receiving_officer,
                    officers
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Date Referred</p>
                <p className="text-sm font-medium text-[#19324D] mt-1">
                  {formatDate(selectedReferral.date_referred)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Reason for Referral
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  {selectedReferral.reason}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Institution Response
                </p>
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
