export function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `${formatNumber(Number(value) * 100, digits)}%`;
}

export function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? formatNumber(value) : formatNumber(value, 2);
  }
  return String(value);
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * "assignments_submitted_pct" → "Assignments submitted %" for chart axes
 * and tables. Keeps acronyms like GPA/LMS upper-cased.
 */
const ACRONYMS = new Set(["gpa", "lms", "id", "avg"]);
export function prettifyFeature(feature) {
  return String(feature)
    .split("_")
    .map((word) => {
      if (ACRONYMS.has(word.toLowerCase())) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function roleLabel(role) {
  const labels = {
    admin: "Administrator",
    teacher: "Teacher",
    student: "Student",
    analyst: "Analyst",
  };
  return labels[role] || role;
}

export function trendMeta(value) {
  if (value === "improving") return { label: "Improving", tone: "safe" };
  if (value === "declining") return { label: "Declining", tone: "risk" };
  return { label: "Holding steady", tone: "neutral" };
}
