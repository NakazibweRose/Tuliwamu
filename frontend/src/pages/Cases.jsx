
import { useState } from "react";
import {
  Search,
  Plus,
  Eye,
  X,
  FolderOpen,
} from "lucide-react";

const initialCases = [
  {
    reference: "TUL-001",
    childAge: 12,
    incidentType: "Abuse",
    district: "Kampala",
    date: "2026-11-18",
    description: "A reported child protection concern requiring assessment and follow-up.",
    status: "Under Review",
  },
  {
    reference: "TUL-002",
    childAge: 14,
    incidentType: "Neglect",
    district: "Wakiso",
    date: "2026-11-19",
    description: "A reported neglect concern referred for further assessment.",
    status: "Active",
  },
  {
    reference: "TUL-003",
    childAge: 10,
    incidentType: "Exploitation",
    district: "Mukono",
    date: "2026-11-20",
    description: "A reported exploitation concern awaiting initial review.",
    status: "New",
  },
];

const incidentTypes = [
  "Abuse",
  "Neglect",
  "Exploitation",
  "Violence",
  "Other",
];

function Cases() {
  const [cases, setCases] = useState(initialCases);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const [formData, setFormData] = useState({
    childAge: "",
    incidentType: "",
    description: "",
    incidentDate: "",
    district: "",
  });

  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch =
      caseItem.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.incidentType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || caseItem.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newCase = {
        reference: `DEMO-${String(cases.length + 1).padStart(3, "0")}`,
        childAge: formData.childAge,
        incidentType: formData.incidentType,
        district: formData.district,
        date: formData.incidentDate,
        description: formData.description,
        status: "New",
    };

    setCases((previous) => [newCase, ...previous]);

    setFormData({
      childAge: "",
      incidentType: "",
      description: "",
      incidentDate: "",
      district: "",
    });

    setShowForm(false);
  };

  const statusStyles = {
    New: "bg-blue-50 text-blue-700",
    "Under Review": "bg-amber-50 text-amber-700",
    Active: "bg-teal-50 text-teal-700",
    Closed: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#19324D]">
            Case Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Register, review and monitor child protection cases.
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">Total Cases</p>
          <p className="text-3xl font-bold text-[#19324D] mt-2">
            {cases.length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">New Cases</p>
          <p className="text-3xl font-bold text-[#19324D] mt-2">
            {cases.filter((item) => item.status === "New").length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">Active Cases</p>
          <p className="text-3xl font-bold text-[#19324D] mt-2">
            {cases.filter((item) => item.status === "Active").length}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by reference, district or incident..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#367C78]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-600 outline-none"
          >
            <option value="All">All statuses</option>
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Reference</th>
                <th className="px-6 py-4 font-medium">Incident Type</th>
                <th className="px-6 py-4 font-medium">District</th>
                <th className="px-6 py-4 font-medium">Date Reported</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredCases.map((caseItem) => (
                <tr
                  key={caseItem.reference}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-[#19324D]">
                    {caseItem.reference}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {caseItem.incidentType}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {caseItem.district}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {caseItem.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[caseItem.status]}`}>
                      {caseItem.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                    title="view case"
                    onClick={() => setSelectedCase(caseItem)}
                    className="text-[#367C78] hover:text-[#19324D]">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No cases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedCase && (
  <div className="fixed inset-0 bg-[#19324D]/40 flex items-center justify-center p-4 z-40">
    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Case Reference
          </p>
          <h2 className="text-xl font-semibold text-[#19324D] mt-1">
            {selectedCase.reference}
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

          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[selectedCase.status]}`}>
            {selectedCase.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-xs text-slate-500 mb-1">Incident Type</p>
            <p className="text-sm font-medium text-[#19324D]">
              {selectedCase.incidentType}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Child's Age</p>
            <p className="text-sm font-medium text-[#19324D]">
              {selectedCase.childAge} years
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
              {selectedCase.date}
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

        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Case Status</p>
          <p className="text-sm font-medium text-[#19324D]">
            {selectedCase.status}
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
      </div>

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
                  Incident Type
                </label>
                <select
                  name="incidentType"
                  value={formData.incidentType}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm"
                >
                  <option value="">Select incident type</option>
                  {incidentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Child's Age
                  </label>
                  <input
                    type="number"
                    name="childAge"
                    min="0"
                    max="17"
                    value={formData.childAge}
                    onChange={handleChange}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm"
                    placeholder="Enter age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Incident Date
                  </label>
                  <input
                    type="date"
                    name="incidentDate"
                    value={formData.incidentDate}
                    onChange={handleChange}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm"
                  />
                </div>
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
                  className="w-full border border-slate-200 rounded-lg px-3 py-3 text-sm"
                  placeholder="Enter district"
                />
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
                  onClick={() => setShowForm(false)}
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
