/*
 * Single HTTP surface for the app. Every request carries the session
 * cookie (credentials: "include"); a 401 while a user is already signed
 * in means the session died mid-use, so we broadcast "ep:session-expired"
 * for the shell to handle. A 401 on the login form must NOT trigger that,
 * which is why we track _isAuthenticated explicitly.
 */

export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

let _isAuthenticated = false;

export function setAuthenticated(value) {
  _isAuthenticated = Boolean(value);
}

function apiError(message, status) {
  const err = new Error(message);
  err.status = status;
  if (status === 401 && _isAuthenticated && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ep:session-expired"));
  }
  return err;
}

async function readError(res, fallback) {
  const body = await res.json().catch(() => ({}));
  return body.error || `${fallback} (${res.status})`;
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw apiError(await readError(res, "Request failed"), res.status);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw apiError(await readError(res, "Request failed"), res.status);
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw apiError(await readError(res, "Request failed"), res.status);
  return res.json();
}

export async function apiPostFile(path, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) throw apiError(await readError(res, "Upload failed"), res.status);
  return res.json();
}

export function exportToCsv(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const s = val === null || val === undefined ? "" : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Fetch wrapper that tracks loading/error state for a single resource. */
export async function safeGet(path) {
  try {
    return { data: await apiGet(path), error: null };
  } catch (err) {
    return { data: null, error: err.message || "Request failed" };
  }
}
