import { AlertCircle, Loader2, X } from "lucide-react";

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#19324D]">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, subtitle, children, actions, className = "" }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl ${className}`}>
      {(title || actions) && (
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#19324D]">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Badge({ map, value }) {
  const [label, style] = map[value] || [value, "bg-slate-100 text-slate-600"];
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${style}`}>
      {label}
    </span>
  );
}

export function Button({ variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-[#367C78] hover:bg-[#2c6663] text-white",
    secondary: "border border-slate-200 text-slate-700 hover:bg-slate-50",
    danger: "border border-rose-200 text-rose-700 hover:bg-rose-50",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg px-4 py-3 text-sm">
      <AlertCircle size={18} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

export function Loading({ label = "Loading…" }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 p-5">
      <Loader2 size={18} className="animate-spin" /> {label}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="text-sm text-slate-500 p-5">{children}</p>;
}

export function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-start justify-center p-4 sm:py-12 overflow-y-auto">
      <div role="dialog" aria-modal="true" aria-label={title} className={`bg-white rounded-xl w-full ${wide ? "max-w-3xl" : "max-w-xl"} shadow-xl`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-[#19324D]">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#367C78]/30 bg-white";

export function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Input(props) {
  return <input className={inputClass} {...props} />;
}

export function Select({ options, placeholder, ...props }) {
  return (
    <select className={inputClass} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Textarea(props) {
  return <textarea className={inputClass} rows={4} {...props} />;
}

export function Table({ columns, rows, rowKey = "id", empty = "Nothing here yet." }) {
  if (!rows?.length) return <Empty>{empty}</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-5 py-3 font-medium whitespace-nowrap">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]} className="border-t border-slate-100 hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column.key} className="px-5 py-3 text-slate-600 align-top">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IdentityHidden() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-1">
      🔒 Identity hidden until you accept the referral
    </span>
  );
}
