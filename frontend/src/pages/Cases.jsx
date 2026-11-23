
import { useState } from "react";
import {
  Search,
  Plus,
  Eye,
  X,
} from "lucide-react";

// Temporary fictional records.
// These will eventually come from GET /api/cases/
const initialCases = [
  {
    id: 1,
    reference_number: "TUL-001",
    case_category: "CHILD_PROTECTION",
    child_name: "Demo Child A",
    child_age: 12,
    incident_type: "ABUSE",
    district: "Kampala",
    incident_date: "2026-11-18",
    description:
      "A reported child protection concern requiring assessment and follow-up.",
    status: "UNDER_REVIEW",
  },
  {
    id: 2,
    reference_number: "TUL-002",
    case_category: "CHILD_PROTECTION",
    child_name: "Demo Child B",
    child_age: 14,
    incident_type: "NEGLECT",
    district: "Wakiso",
    incident_date: "2026-11-19",
    description:
      "A reported neglect concern referred for further assessment.",
    status: "ACTIVE",
  },
  {
    id: 3,
    reference_number: "TUL-003",
    case_category: "CHILD_IN_CONFLICT_WITH_LAW",
    child_name: "Demo Child C",
    child_age: 16,
    incident_type: "THEFT",
    district: "Mukono",
    incident_date: "2026-11-20",
    description:
      "An alleged theft matter awaiting initial review.",
    status: "NEW",
  },
];

const caseCategories = [
  {
    value: "CHILD_PROTECTION",
    label: "Child Protection / Child Victim",
  },
  {
    value: "CHILD_IN_CONFLICT_WITH_LAW",
    label: "Child in Conflict with the Law",
  },
];

const incidentTypes = {
  CHILD_PROTECTION: [
    { value: "ABUSE", label: "Abuse" },
    { value: "NEGLECT", label: "Neglect" },
    { value: "EXPLOITATION", label: "Exploitation" },
    { value: "VIOLENCE", label: "Violence" },
    { value: "OTHER", label: "Other" },
  ],
  CHILD_IN_CONFLICT_WITH_LAW: [
    { value: "THEFT", label: "Alleged Theft" },
    { value: "ASSAULT", label: "Alleged Assault" },
    { value: "DRUG_RELATED", label: "Drug-related Allegation" },
    { value: "PROPERTY_DAMAGE", label: "Alleged Property Damage" },
    { value: "OTHER", label: "Other" },
  ],
};

const statusLabels = {
  NEW: "New",
  UNDER_REVIEW: "Under Review",
  ACTIVE: "Active",
  CLOSED: "Closed",
};

const statusStyles = {
  NEW: "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-teal-50 text-teal-700",
  CLOSED: "bg-slate-100 text-slate-600",
};

function Cases() {
  const [cases, setCases] = useState(initialCases);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const emptyForm = {
    case_category: "",
    child_name: "",
    child_age: "",
    incident_type: "",
    description: "",
    incident_date: "",
    district: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  const filteredCases = cases.filter((caseItem) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      caseItem.reference_number.toLowerCase().includes(search) ||
      caseItem.district.toLowerCase().includes(search) ||
      caseItem.incident_type.toLowerCase().includes(search) ||
      caseItem.case_category.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "ALL" || caseItem.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const newCount = cases.filter(
    (item) => item.status === "NEW"
  ).length;

  const activeCount = cases.filter(
    (item) => item.status === "ACTIVE"
  ).length;

  const underReviewCount = cases.filter(
    (item) => item.status === "UNDER_REVIEW"
  ).length;

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "case_category" ? { incident_type: "" } : {}),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const newCase = {
      id: Date.now(),
      reference_number: `DEMO-${String(cases.length + 1).padStart(3, "0")}`,
      ...formData,
      child_age: Number(formData.child_age),
      status: "NEW",
    };

    setCases((previous) => [newCase, ...previous]);
    setFormData(emptyForm);
    setShowForm(false);
  }

  function formatDate(date) {
    if (!date) return "—";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getCategoryLabel(value) {
    return (
      caseCategories.find((category) => category.value === value)?.label ||
      value
    );
  }

  function getIncidentLabel(value) {
    const allTypes = Object.values(incidentTypes).flat();

    return allTypes.find((type) => type.value === value)?.label || value;
  }

  return (
    <div className="p-8 space-y-7">
      {/* Page heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#19324D]">
            Case Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Register, review and monitor child protection and juvenile justice cases.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-[#367C78] hover:bg-[#2c6663] text-white px-5 py-3 rounded-lg text-sm font-medium"
        >
          <Plus size={18} />
          Register New Case
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">Total Cases</p>
          <p className="text-3xl font-bold text-[#19324D] mt-2">
            {cases.length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">New Cases</p>
          <p className="text-3xl font-bold text-[#19324D] mt-2">
            {newCount}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">Under Review</p>
          <p className="text-3xl font-bold text-[#19324D] mt-2">
            {underReviewCount}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">Active Cases</p>
          <p className="text-3xl font-bold text-[#19324D] mt-2">
            {activeCount}
          </p>
        </div>
      </div>

      {/* Cases table */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-[#19324D]">
            Registered Cases
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            View and monitor recorded cases.
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
              placeholder="Search by reference, district or incident..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#367C78]/30"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none"
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
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Reference</th>
                <th className="px-5 py-4 font-medium">Case Category</th>
                <th className="px-5 py-4 font-medium">Incident Type</th>
                <th className="px-5 py-4 font-medium">District</th>
                <th className="px-5 py-4 font-medium">Incident Date</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredCases.map((caseItem) => (
                <tr
                  key={caseItem.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-medium text-[#19324D]">
                    {caseItem.reference_number}
                  </td>

                  <td className="px-5 py-4 text-slate-600 min-w-52">
                    {getCategoryLabel(caseItem.case_category)}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {getIncidentLabel(caseItem.incident_type)}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {caseItem.district}
                  </td>

                  <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                    {formatDate(caseItem.incident_date)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusStyles[caseItem.status]
                      }`}
                    >
                      {statusLabels[caseItem.status]}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      title="View case"
                      onClick={() => setSelectedCase(caseItem)}
                      className="flex items-center gap-2 text-[#367C78] hover:text-[#19324D]"
                    >
                      <Eye size={18} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCases.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No cases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 text-xs text-slate-500">
          Showing {filteredCases.length} of {cases.length} cases
        </div>
      </div>

      {/* Case details modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-[#19324D]/40 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Case Reference
                </p>
                <h2 className="text-xl font-semibold text-[#19324D] mt-1">
                  {selectedCase.reference_number}
                </h2>
              </div>

              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#19324D]">
                  Case Information
                </h3>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusStyles[selectedCase.status]
                  }`}
                >
                  {statusLabels[selectedCase.status]}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Case Category</p>
                  <p className="text-sm font-medium text-[#19324D]">
                    {getCategoryLabel(selectedCase.case_category)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Incident Type</p>
                  <p className="text-sm font-medium text-[#19324D]">
                    {getIncidentLabel(selectedCase.incident_type)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Child's Name</p>
                  <p className="text-sm font-medium text-[#19324D]">
                    {selectedCase.child_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Child's Age</p>
                  <p className="text-sm font-medium text-[#19324D]">
                    {selectedCase.child_age} years
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">District</p>
                  <p className="text-sm font-medium text-[#19324D]">
                    {selectedCase.district}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Incident Date</p>
                  <p className="text-sm font-medium text-[#19324D]">
                    {formatDate(selectedCase.incident_date)}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h3 className="font-semibold text-[#19324D] mb-2">
                  Incident Description
                </h3>
                <p className="text-sm text-slate-600 leading-6">
                  {selectedCase.description || "No description available."}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-5 py-2.5 rounded-lg bg-[#19324D] text-white text-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register case modal */}
      {showForm && (
        <div className="fixed inset-0 bg-[#19324D]/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-[#19324D]">
                  Register a New Case
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter the relevant incident information.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="bg-teal-50 text-teal-900 p-3 rounded-lg text-sm">
                Use fictional information when testing this demonstration.
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Case Category
                </label>
                <select
                  name="case_category"
                  value={formData.case_category}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm"
                >
                  <option value="">Select case category</option>
                  {caseCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Incident Type
                </label>
                <select
                  name="incident_type"
                  value={formData.incident_type}
                  onChange={handleChange}
                  required
                  disabled={!formData.case_category}
                  className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {formData.case_category
                      ? "Select incident type"
                      : "Select a case category first"}
                  </option>

                  {(incidentTypes[formData.case_category] || []).map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Child's Name
                  </label>
                  <input
                    type="text"
                    name="child_name"
                    value={formData.child_name}
                    onChange={handleChange}
                    required
                    maxLength="150"
                    className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm"
                    placeholder="Enter child's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Child's Age
                  </label>
                  <input
                    type="number"
                    name="child_age"
                    min="0"
                    max="17"
                    value={formData.child_age}
                    onChange={handleChange}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm"
                    placeholder="Enter age"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Incident Date
                  </label>
                  <input
                    type="date"
                    name="incident_date"
                    value={formData.incident_date}
                    onChange={handleChange}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    District
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                    maxLength="100"
                    className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm"
                    placeholder="Enter district"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Incident Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm resize-y"
                  placeholder="Provide a brief description without unnecessary identifying details..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(emptyForm);
                    setShowForm(false);
                  }}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#367C78] hover:bg-[#2c6663] text-white text-sm font-medium"
                >
                  Save Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cases;
