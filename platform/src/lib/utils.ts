import { clsx, type ClassValue } from "clsx";
import { deptLabelI18n, type UiLocale } from "@/lib/i18n";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function severityClass(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "BREACH":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "WARN":
      return "bg-amber-100 text-amber-900 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function statusClass(status: string) {
  switch (status) {
    case "HEALTHY":
    case "ACTIVE":
    case "RESOLVED":
    case "CLOSED":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "WARN":
    case "ACKNOWLEDGED":
    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "BREACH":
    case "ESCALATED":
    case "OPEN":
      return "bg-orange-50 text-orange-800 border-orange-200";
    case "DISABLED":
    case "INACTIVE":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "PENDING_ADMIN":
    case "AWAITING_CHECKER":
    case "PENDING":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "PENDING_RO":
    case "AWAITING_HUMAN":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function deptLabel(code: string | null | undefined, locale: UiLocale = "en") {
  return deptLabelI18n(code, locale);
}
