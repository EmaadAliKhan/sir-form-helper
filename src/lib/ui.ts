export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

/** Compact centred input — no w-full (for DOB boxes). */
export const compactInputClass =
  "shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-2 text-center text-sm font-mono text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

export const dobDayMonthClass = `${compactInputClass} w-16`;
export const dobYearClass = `${compactInputClass} w-24`;

export const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export const sectionClass =
  "rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-slate-900";

export const sectionTitleClass = "mb-4 text-lg font-semibold text-slate-900";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50";

export const btnSuccess =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60";

export const btnSuccessSelected =
  "inline-flex min-h-11 cursor-default items-center justify-center rounded-md border-2 border-emerald-700 bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-900";

export const cardSelected =
  "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200";

export const rowSelected = "bg-emerald-50";

export const alertSuccess =
  "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900";

export const alertInfo =
  "rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900";

export const alertWarning =
  "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900";

export const alertError =
  "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900";

export function formatOptionalLabel(label: string, optional?: boolean) {
  return optional ? `${label} (optional)` : label;
}

export function parseDobParts(dob: string): { dd: string; mm: string; yyyy: string } {
  if (!dob.trim()) return { dd: "", mm: "", yyyy: "" };

  const slashParts = dob.split("/");
  if (slashParts.length >= 2) {
    return {
      dd: (slashParts[0] ?? "").replace(/\D/g, "").slice(0, 2),
      mm: (slashParts[1] ?? "").replace(/\D/g, "").slice(0, 2),
      yyyy: (slashParts[2] ?? "").replace(/\D/g, "").slice(0, 4),
    };
  }

  const digits = dob.replace(/\D/g, "");
  if (digits.length >= 8) {
    return {
      dd: digits.slice(0, 2),
      mm: digits.slice(2, 4),
      yyyy: digits.slice(4, 8),
    };
  }

  return { dd: "", mm: "", yyyy: digits.slice(0, 4) };
}

export function joinDobParts(dd: string, mm: string, yyyy: string): string {
  const d = dd.replace(/\D/g, "").slice(0, 2);
  const m = mm.replace(/\D/g, "").slice(0, 2);
  const y = yyyy.replace(/\D/g, "").slice(0, 4);
  if (!d && !m && !y) return "";
  return `${d}/${m}/${y}`;
}

/** Normalise to DD/MM/YYYY for PDF when day, month, and 4-digit year are present. */
export function formatDobForPdf(dob: string): string {
  const { dd, mm, yyyy } = parseDobParts(dob);
  if (dd.length === 2 && mm.length === 2 && yyyy.length === 4) {
    return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
  }
  return dob;
}
