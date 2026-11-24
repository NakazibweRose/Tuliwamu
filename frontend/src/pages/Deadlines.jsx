
import { useState } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  X,
  CalendarDays,
} from "lucide-react";

const initialDeadlines = [
  {
    id: "DL-001",
    caseReference: "TUL-001",
    title: "Follow up on child protection referral",
    institution: "Probation and Social Welfare Office",
    dueDate: "2026-11-25",
    status: "Upcoming",
  },
  {
    id: "DL-002",
    caseReference: "TUL-002",
    title: "Review referral response",
    institution: "Police Child and Family Protection Unit",
    dueDate: "2026-11-20",
    status: "Overdue",
  },
  {
    id: "DL-003",
    caseReference: "TUL-003",
    title: "Confirm follow-up action",
    institution: "Legal Aid Provider",
    dueDate: "2026-11-19",
    status: "Completed",
  },
];

function Deadlines() {
  const [deadlines, setDeadlines] = useState(initialDeadlines);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    caseReference: "",
    title: "",
    institution: "",
    dueDate: "",
  });

  const filteredDeadlines = deadlines.filter((item) => {
    const matchesSearch =
      item.caseReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.institution.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const total = deadlines.length;
  const upcoming = deadlines.filter(
    (item) => item.status === "Upcoming"
  ).length;
  const overdue = deadlines.filter(
    (item) => item.status === "Overdue"
  ).length;
  const completed = deadlines.filter(
    (item) => item.status === "Completed"
  ).length;

  const handleSubmit = (event) => {
    event.preventDefault();

    const newDeadline = {
      id: `DL-${String(deadlines.length + 1).padStart(3, "0")}`,
      ...formData,
      status: "Upcoming",
    };

    setDeadlines((previous) => [...previous, newDeadline]);

    setFormData({
      caseReference: "",
      title: "",
      institution: "",
      dueDate: "",
    });

    setShowForm(false);
  };

  const updateStatus = (id, status) => {
    setDeadlines((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
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
            Monitor case follow-ups and important pending actions.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {[
          {
            title: "Total Deadlines",
            value: total,
            icon: CalendarDays,
          },
          {
            title: "Upcoming",
            value: upcoming,
            icon: Clock,
          },
          {
            title: "Overdue",
            value: overdue,
            icon: AlertTriangle,
          },
          {
            title: "Completed",
            value: completed,
            icon: CheckCircle,
          },
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
            Illustrative demonstration records, not statutory deadlines.
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
              placeholder="Search by case, action or institution..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-100"
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
                <th className="px-6 py-4 font-medium">Institution</th>
                <th className="px-6 py-4 font-medium">Due Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredDeadlines.length > 0 ? (
                filteredDeadlines.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-medium text-[#19324D]">
                      {item.caseReference}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.title}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.institution}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.dueDate}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${statusStyles[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.status !== "Completed" && (
                        <button
                          onClick={() =>
                            updateStatus(item.id, "Completed")
                          }
                          className="text-[#367C78] hover:underline"
                        >
                          Mark complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-10 text-slate-500"
                  >
                    No matching deadline records found.
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
                  Case Reference
                </label>
                <input
                  required
                  value={formData.caseReference}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      caseReference: event.target.value,
                    })
                  }
                  placeholder="e.g. TUL-004"
                  className="w-full border border-slate-200 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Follow-up Action
                </label>
                <input
                  required
                  value={formData.title}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      title: event.target.value,
                    })
                  }
                  placeholder="Describe the action required"
                  className="w-full border border-slate-200 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Responsible Institution
                </label>
                <input
                  required
                  value={formData.institution}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      institution: event.target.value,
                    })
                  }
                  placeholder="Enter institution"
                  className="w-full border border-slate-200 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      dueDate: event.target.value,
                    })
                  }
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
                  className="px-4 py-2 bg-[#367C78] text-white rounded-lg"
                >
                  Save Deadline
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
