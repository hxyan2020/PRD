import { withBase } from "./base-path";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error?: string; fallback: boolean };

/** JSON fetch that treats missing APIs (static hosts) as a localStorage fallback. */
export async function tryApiJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(withBase(path), init);
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return { ok: false, status: res.status, fallback: true };
    }
    const data = (await res.json()) as T & { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: data.error,
        fallback: res.status === 404 || res.status === 405,
      };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, status: 0, fallback: true };
  }
}
