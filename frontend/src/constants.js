export const ROLE_LABELS = {
  ADMIN: "Administrator",
  POLICE: "Police Officer (CFPU)",
  PSWO: "Probation & Social Welfare Officer",
  LEGAL_AID: "Legal Aid Provider",
  SERVICE_PROVIDER: "Support Service Provider",
  OVERSIGHT: "Oversight / M&E",
};

export const CASE_CATEGORIES = [
  { value: "CHILD_PROTECTION", label: "Child Protection / Child Victim" },
  { value: "CHILD_IN_CONFLICT_WITH_LAW", label: "Child in Conflict with the Law" },
];

export const INCIDENT_TYPES = {
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

export const CASE_STATUS = {
  NEW: ["New", "bg-blue-50 text-blue-700"],
  UNDER_REVIEW: ["Under Review", "bg-amber-50 text-amber-700"],
  ACTIVE: ["Active", "bg-teal-50 text-teal-700"],
  CLOSED: ["Closed", "bg-slate-100 text-slate-600"],
};

export const REFERRAL_STATUS = {
  PENDING: ["Pending", "bg-amber-50 text-amber-700"],
  ACCEPTED: ["Accepted", "bg-blue-50 text-blue-700"],
  IN_PROGRESS: ["In Progress", "bg-teal-50 text-teal-700"],
  COMPLETED: ["Completed", "bg-emerald-50 text-emerald-700"],
  REJECTED: ["Rejected", "bg-rose-50 text-rose-700"],
};

// Mirrors the backend state machine.
export const NEXT_REFERRAL_STATUS = {
  PENDING: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  REJECTED: [],
};

export const REPORT_CATEGORIES = [
  { value: "PROTECTION", label: "Child protection concern" },
  { value: "NEGLECT", label: "Neglect" },
  { value: "VIOLENCE", label: "Violence or abuse" },
  { value: "OTHER", label: "Other" },
];

export const REPORT_STATUS = {
  RECEIVED: ["Received", "bg-blue-50 text-blue-700"],
  UNDER_REVIEW: ["Under Review", "bg-amber-50 text-amber-700"],
  REFERRED: ["Referred", "bg-teal-50 text-teal-700"],
  CLOSED: ["Closed", "bg-slate-100 text-slate-600"],
};

export function labelFor(list, value) {
  const flat = Array.isArray(list) ? list : Object.values(list).flat();
  return flat.find((item) => item.value === value)?.label || value;
}

export function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function shortRef(uuid) {
  return uuid ? `CASE-${String(uuid).slice(0, 8).toUpperCase()}` : "—";
}
