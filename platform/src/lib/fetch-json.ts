/**
 * Safe response helpers for desk buttons.
 * GitHub Pages has no live /api — POSTs often return HTML 404/405, which
 * must never be passed to Response.json() unguarded.
 */
import { isPublicSnapshot } from "@/lib/static-export";

export function isApiUnavailableStatus(status: number) {
  return status === 404 || status === 405 || status === 501;
}

export function pagesMutationHint(zh: boolean) {
  return zh
    ? "公開 GitHub Pages 快照無法呼叫即時 /api（會回傳 HTML）。此處已改為本機示範；寫入請用 localhost:3000。"
    : "Public GitHub Pages snapshot cannot call live /api (returns HTML). Running a local demo here — use localhost:3000 for writes.";
}

export function pagesReadOnlyHint(zh: boolean) {
  return zh
    ? "公開快照為唯讀 — 此按鈕需本機 localhost 管理台才會持久寫入。"
    : "Public snapshot is read-only — this button needs the localhost admin to persist.";
}

export type JsonReadResult<T = Record<string, unknown>> = {
  ok: boolean;
  status: number;
  data: T;
  /** True when body was not JSON (HTML error page, empty, etc.). */
  nonJson: boolean;
  apiUnavailable: boolean;
};

/** Parse JSON without throwing on HTML / empty bodies. */
export async function readResponseJson<T = Record<string, unknown>>(
  res: Response
): Promise<JsonReadResult<T>> {
  const status = res.status;
  const apiUnavailable = isApiUnavailableStatus(status);
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  let text = "";
  try {
    text = await res.text();
  } catch {
    return {
      ok: res.ok,
      status,
      data: {} as T,
      nonJson: true,
      apiUnavailable,
    };
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      ok: res.ok,
      status,
      data: {} as T,
      nonJson: true,
      apiUnavailable: apiUnavailable || !res.ok,
    };
  }
  const looksHtml =
    trimmed.startsWith("<") ||
    ct.includes("text/html") ||
    /^<!doctype/i.test(trimmed);
  if (looksHtml) {
    return {
      ok: false,
      status,
      data: {} as T,
      nonJson: true,
      apiUnavailable: true,
    };
  }
  try {
    const data = JSON.parse(trimmed) as T;
    return {
      ok: res.ok,
      status,
      data,
      nonJson: false,
      apiUnavailable,
    };
  } catch {
    return {
      ok: false,
      status,
      data: {} as T,
      nonJson: true,
      apiUnavailable: apiUnavailable || !res.ok,
    };
  }
}

/**
 * POST JSON to a desk API. On public snapshot (or HTML 404/405) returns
 * apiUnavailable without throwing a JSON parse error.
 */
export async function postDeskJson<T = Record<string, unknown>>(
  path: string,
  body: Record<string, unknown>,
  init?: RequestInit
): Promise<JsonReadResult<T> & { skippedPublic: boolean }> {
  if (isPublicSnapshot()) {
    return {
      ok: false,
      status: 0,
      data: {} as T,
      nonJson: false,
      apiUnavailable: true,
      skippedPublic: true,
    };
  }
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      body: JSON.stringify(body),
      credentials: init?.credentials ?? "include",
      ...init,
    });
    const parsed = await readResponseJson<T>(res);
    return { ...parsed, skippedPublic: false };
  } catch {
    return {
      ok: false,
      status: 0,
      data: {} as T,
      nonJson: true,
      apiUnavailable: true,
      skippedPublic: false,
    };
  }
}
