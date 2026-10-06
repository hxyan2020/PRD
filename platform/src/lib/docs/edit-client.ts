import { isPublicSnapshot } from "@/lib/static-export";

export const DOC_EDIT_LS = "crmp_admin_doc_edits_v1";

export type AdminDocKey =
  | "TSD"
  | "PRD"
  | "USER_GUIDE"
  | "ECOSYSTEM"
  | "UAT"
  | "ROADMAP"
  | "URLS"
  | "OPEN_ISSUES"
  | "PROGRESS";

function slot(doc: string, locale: string) {
  return `${doc}::${locale}`;
}

function readAll(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DOC_EDIT_LS) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function readLocalDoc(doc: string, locale: string): string | null {
  const v = readAll()[slot(doc, locale)];
  return typeof v === "string" ? v : null;
}

export function writeLocalDoc(doc: string, locale: string, content: string) {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[slot(doc, locale)] = content;
  localStorage.setItem(DOC_EDIT_LS, JSON.stringify(all));
}

export function clearLocalDoc(doc: string, locale: string) {
  if (typeof window === "undefined") return;
  const all = readAll();
  delete all[slot(doc, locale)];
  localStorage.setItem(DOC_EDIT_LS, JSON.stringify(all));
}

export async function fetchDocOverlay(doc: string, locale: string): Promise<string | null> {
  const local = readLocalDoc(doc, locale);
  if (isPublicSnapshot()) return local;
  try {
    const res = await fetch(`/api/docs?key=${encodeURIComponent(doc)}&locale=${encodeURIComponent(locale)}`);
    if (!res.ok) return local;
    const data = (await res.json()) as { content?: string | null };
    if (typeof data.content === "string") {
      writeLocalDoc(doc, locale, data.content);
      return data.content;
    }
    return local;
  } catch {
    return local;
  }
}

export async function saveDocOverlay(
  doc: string,
  locale: string,
  content: string
): Promise<{ ok: boolean; localOnly: boolean; error?: string }> {
  writeLocalDoc(doc, locale, content);
  if (isPublicSnapshot()) return { ok: true, localOnly: true };
  try {
    const res = await fetch("/api/docs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: doc, locale, content }),
    });
    if (res.status === 404 || res.status === 405) return { ok: true, localOnly: true };
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, localOnly: true, error: data.error || "Save failed" };
    }
    return { ok: true, localOnly: false };
  } catch {
    return { ok: true, localOnly: true };
  }
}

export async function resetDocOverlay(doc: string, locale: string): Promise<{ ok: boolean; localOnly: boolean }> {
  clearLocalDoc(doc, locale);
  if (isPublicSnapshot()) return { ok: true, localOnly: true };
  try {
    const res = await fetch(`/api/docs?key=${encodeURIComponent(doc)}&locale=${encodeURIComponent(locale)}`, {
      method: "DELETE",
    });
    if (res.status === 404 || res.status === 405) return { ok: true, localOnly: true };
    return { ok: res.ok, localOnly: false };
  } catch {
    return { ok: true, localOnly: true };
  }
}
