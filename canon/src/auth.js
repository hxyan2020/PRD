export const USERS_KEY = "canon.auth.users";
export const SESSION_KEY = "canon.auth.session";
export const AUTH_API_PATH = "/api/auth";
export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PBKDF2_ITERATIONS = 100_000;

function storeOf(storage) {
  return storage || globalThis.localStorage;
}

export function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_RE.test(normalizeEmail(email));
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const clean = String(hex || "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function timingSafeEqual(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

async function hashPassword(password, saltBytes) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    material,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

function newSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt;
}

export function publicUser(record) {
  if (!record) return null;
  return {
    email: record.email,
    name: record.name || "",
    createdAt: record.createdAt || "",
  };
}

export function sanitizeUser(item) {
  if (!item || typeof item !== "object") return null;
  if (!isValidEmail(item.email) || !item.hash || !item.salt) return null;
  return {
    email: normalizeEmail(item.email),
    name: String(item.name || "").trim(),
    salt: String(item.salt),
    hash: String(item.hash),
    createdAt: String(item.createdAt || ""),
    updatedAt: String(item.updatedAt || item.createdAt || ""),
  };
}

export function sanitizeUsers(parsed) {
  if (!Array.isArray(parsed)) return [];
  return parsed.map(sanitizeUser).filter(Boolean);
}

export function loadUsers(storage) {
  try {
    const raw = storeOf(storage)?.getItem?.(USERS_KEY);
    if (!raw) return [];
    return sanitizeUsers(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveUsers(users, storage) {
  storeOf(storage)?.setItem?.(USERS_KEY, JSON.stringify(users));
  return users;
}

function upsertLocal(record, storage) {
  const incoming = sanitizeUser(record);
  if (!incoming) return loadUsers(storage);
  const users = loadUsers(storage);
  const index = users.findIndex((user) => user.email === incoming.email);
  if (index < 0) return saveUsers([...users, incoming], storage);
  const next = users.slice();
  next[index] = incoming;
  return saveUsers(next, storage);
}

export function getSessionEmail(storage) {
  try {
    const raw = storeOf(storage)?.getItem?.(SESSION_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return normalizeEmail(parsed?.email || parsed);
  } catch {
    return "";
  }
}

export function setSessionEmail(email, storage) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    storeOf(storage)?.removeItem?.(SESSION_KEY);
    return "";
  }
  storeOf(storage)?.setItem?.(SESSION_KEY, JSON.stringify({ email: normalized }));
  return normalized;
}

export function getCurrentUser(storage) {
  const email = getSessionEmail(storage);
  if (!email) return null;
  return publicUser(loadUsers(storage).find((user) => user.email === email));
}

function findUser(email, storage) {
  const normalized = normalizeEmail(email);
  return loadUsers(storage).find((user) => user.email === normalized) || null;
}

function fail(error) {
  return { ok: false, error, user: null };
}

function ok(user) {
  return { ok: true, error: "", user };
}

async function setCredentials(record, password) {
  const salt = newSalt();
  record.salt = bytesToHex(salt);
  record.hash = await hashPassword(password, salt);
  record.updatedAt = new Date().toISOString();
  return record;
}

function formValue(data, fallback, ...keys) {
  for (const key of keys) {
    const value = data.get(key);
    if (value != null && String(value) !== "") return String(value);
  }
  for (const key of keys) {
    const value = fallback[key];
    if (value != null && String(value) !== "") return String(value);
  }
  return "";
}

export function credentialsFromForm(form, fallback = {}) {
  const data = form instanceof FormData ? form : new FormData(form);
  return {
    name: formValue(data, fallback, "name"),
    email: formValue(data, fallback, "email"),
    password: formValue(data, fallback, "password", "new-password"),
    confirm: formValue(data, fallback, "confirm-password", "confirm"),
    currentPassword: formValue(data, fallback, "current-password", "currentPassword"),
    newPassword: formValue(data, fallback, "new-password", "newPassword"),
  };
}

export async function applyAuthAction(users, payload = {}) {
  const action = String(payload.action || "");
  const list = Array.isArray(users) ? users : [];

  if (action === "create") {
    if (!isValidEmail(payload.email)) return { ok: false, error: "invalid_email", user: null, record: null, users: list };
    if (String(payload.password || "").length < MIN_PASSWORD_LENGTH) {
      return { ok: false, error: "short_password", user: null, record: null, users: list };
    }
    const normalized = normalizeEmail(payload.email);
    if (list.some((user) => user.email === normalized)) {
      return { ok: false, error: "email_taken", user: null, record: null, users: list };
    }
    const now = new Date().toISOString();
    const record = await setCredentials(
      {
        email: normalized,
        name: String(payload.name || "").trim(),
        createdAt: now,
        updatedAt: now,
      },
      payload.password,
    );
    return { ok: true, error: "", user: publicUser(record), record, users: [...list, record] };
  }

  if (action === "login") {
    if (!isValidEmail(payload.email)) return { ok: false, error: "invalid_email", user: null, record: null, users: list };
    if (String(payload.password || "").length < MIN_PASSWORD_LENGTH) {
      return { ok: false, error: "short_password", user: null, record: null, users: list };
    }
    const record = list.find((user) => user.email === normalizeEmail(payload.email)) || null;
    if (!record) return { ok: false, error: "no_account", user: null, record: null, users: list };
    const hash = await hashPassword(payload.password, hexToBytes(record.salt));
    if (!timingSafeEqual(hash, record.hash)) return { ok: false, error: "bad_password", user: null, record: null, users: list };
    return { ok: true, error: "", user: publicUser(record), record, users: list };
  }

  if (action === "ensure") {
    const incoming = sanitizeUser(payload.record);
    if (!incoming) return { ok: false, error: "invalid_email", user: null, record: null, users: list };
    const existing = list.find((user) => user.email === incoming.email);
    if (existing) return { ok: true, error: "", user: publicUser(existing), record: existing, users: list };
    return { ok: true, error: "", user: publicUser(incoming), record: incoming, users: [...list, incoming] };
  }

  if (action === "change") {
    const session = normalizeEmail(payload.email);
    if (!session) return { ok: false, error: "not_signed_in", user: null, record: null, users: list };
    if (String(payload.newPassword || "").length < MIN_PASSWORD_LENGTH) {
      return { ok: false, error: "short_password", user: null, record: null, users: list };
    }
    const index = list.findIndex((user) => user.email === session);
    if (index < 0) return { ok: false, error: "not_signed_in", user: null, record: null, users: list };
    const currentHash = await hashPassword(payload.currentPassword, hexToBytes(list[index].salt));
    if (!timingSafeEqual(currentHash, list[index].hash)) {
      return { ok: false, error: "bad_password", user: null, record: null, users: list };
    }
    const next = list.map((user, idx) => (idx === index ? { ...user } : user));
    await setCredentials(next[index], payload.newPassword);
    return { ok: true, error: "", user: publicUser(next[index]), record: next[index], users: next };
  }

  if (action === "updateName") {
    const session = normalizeEmail(payload.email);
    if (!session) return { ok: false, error: "not_signed_in", user: null, record: null, users: list };
    const index = list.findIndex((user) => user.email === session);
    if (index < 0) return { ok: false, error: "not_signed_in", user: null, record: null, users: list };
    const next = list.map((user, idx) =>
      idx === index
        ? { ...user, name: String(payload.name || "").trim(), updatedAt: new Date().toISOString() }
        : user,
    );
    return { ok: true, error: "", user: publicUser(next[index]), record: next[index], users: next };
  }

  if (action === "reset") {
    if (!isValidEmail(payload.email)) return { ok: false, error: "invalid_email", user: null, record: null, users: list };
    if (String(payload.newPassword || "").length < MIN_PASSWORD_LENGTH) {
      return { ok: false, error: "short_password", user: null, record: null, users: list };
    }
    const normalized = normalizeEmail(payload.email);
    const index = list.findIndex((user) => user.email === normalized);
    if (index < 0) return { ok: false, error: "no_account", user: null, record: null, users: list };
    const previousHash = String(payload.previousHash || "");
    if (!previousHash || !timingSafeEqual(previousHash, list[index].hash)) {
      return { ok: false, error: "no_account", user: null, record: null, users: list };
    }
    const next = list.map((user, idx) => (idx === index ? { ...user } : user));
    await setCredentials(next[index], payload.newPassword);
    return { ok: true, error: "", user: publicUser(next[index]), record: next[index], users: next };
  }

  return { ok: false, error: "unavailable", user: null, record: null, users: list };
}

function remoteFailed(remote) {
  return !remote || remote.error === "unavailable";
}

async function defaultRemote(payload) {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch(AUTH_API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.status === 404 || response.status === 405) return null;
    const data = await response.json().catch(() => null);
    if (!data || typeof data !== "object") return { ok: false, error: "unavailable" };
    return data;
  } catch {
    return null;
  }
}

let remoteHandler = defaultRemote;

export function setAuthRemote(handler) {
  remoteHandler = typeof handler === "function" ? handler : defaultRemote;
}

function finishLocal(result, storage) {
  if (!result.ok) return fail(result.error);
  saveUsers(result.users, storage);
  setSessionEmail(result.record.email, storage);
  return ok(result.user);
}

export async function createAccount({ email, password, name } = {}, storage) {
  const remote = await remoteHandler({ action: "create", email, password, name });
  if (remote?.ok && remote.record) {
    upsertLocal(remote.record, storage);
    setSessionEmail(remote.record.email, storage);
    return ok(publicUser(remote.record));
  }
  if (!remoteFailed(remote) && remote.error) return fail(remote.error);
  const result = await applyAuthAction(loadUsers(storage), { action: "create", email, password, name });
  const finished = finishLocal(result, storage);
  if (finished.ok) void remoteHandler({ action: "ensure", record: result.record });
  return finished;
}

export async function login({ email, password } = {}, storage) {
  const localUsers = loadUsers(storage);
  const local = findUser(email, storage);
  if (local) {
    const result = await applyAuthAction(localUsers, { action: "login", email, password });
    if (result.ok) {
      setSessionEmail(result.record.email, storage);
      void remoteHandler({ action: "ensure", record: result.record });
      return ok(result.user);
    }
    if (result.error !== "bad_password") return fail(result.error);
  }
  const remote = await remoteHandler({ action: "login", email, password });
  if (remote?.ok && remote.record) {
    upsertLocal(remote.record, storage);
    setSessionEmail(remote.record.email, storage);
    return ok(publicUser(remote.record));
  }
  if (!remoteFailed(remote) && remote.error) return fail(remote.error);
  return fail(local ? "bad_password" : "no_account");
}

export function logout(storage) {
  setSessionEmail("", storage);
  return { ok: true, error: "", user: null };
}

export async function changePassword({ currentPassword, newPassword } = {}, storage) {
  const session = getSessionEmail(storage);
  if (!session) return fail("not_signed_in");
  const result = await applyAuthAction(loadUsers(storage), {
    action: "change",
    email: session,
    currentPassword,
    newPassword,
  });
  const finished = finishLocal(result, storage);
  if (finished.ok) {
    const remote = await remoteHandler({
      action: "change",
      email: session,
      currentPassword,
      newPassword,
    });
    if (remoteFailed(remote) || remote?.error === "not_signed_in" || remote?.error === "no_account") {
      void remoteHandler({ action: "ensure", record: result.record });
    }
  }
  return finished;
}

export async function resetPassword({ email, newPassword } = {}, storage) {
  const local = findUser(email, storage);
  if (!local) return fail("no_account");
  const previousHash = local.hash;
  const result = await applyAuthAction(loadUsers(storage), {
    action: "reset",
    email,
    newPassword,
    previousHash,
  });
  const finished = finishLocal(result, storage);
  if (finished.ok) {
    void remoteHandler({ action: "reset", email, newPassword, previousHash });
  }
  return finished;
}

export async function updateProfileName(name, storage) {
  const session = getSessionEmail(storage);
  if (!session) return fail("not_signed_in");
  const result = await applyAuthAction(loadUsers(storage), { action: "updateName", email: session, name });
  const finished = finishLocal(result, storage);
  if (finished.ok) {
    const remote = await remoteHandler({ action: "updateName", email: session, name });
    if (remoteFailed(remote) || remote?.error === "not_signed_in" || remote?.error === "no_account") {
      void remoteHandler({ action: "ensure", record: result.record });
    }
  }
  return finished;
}

export async function syncSessionToRemote(storage) {
  const session = getSessionEmail(storage);
  if (!session) return { ok: false, error: "not_signed_in", user: null };
  const record = findUser(session, storage);
  if (!record) return { ok: false, error: "not_signed_in", user: null };
  const remote = await remoteHandler({ action: "ensure", record });
  if (remote?.ok && remote.record) upsertLocal(remote.record, storage);
  return { ok: true, error: "", user: publicUser(record) };
}
