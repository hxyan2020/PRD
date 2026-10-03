export const USERS_KEY = "canon.auth.users";
export const SESSION_KEY = "canon.auth.session";
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

function publicUser(record) {
  if (!record) return null;
  return {
    email: record.email,
    name: record.name || "",
    createdAt: record.createdAt || "",
  };
}

export function loadUsers(storage) {
  try {
    const raw = storeOf(storage)?.getItem?.(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === "object" && isValidEmail(item.email) && item.hash && item.salt)
      .map((item) => ({
        email: normalizeEmail(item.email),
        name: String(item.name || "").trim(),
        salt: String(item.salt),
        hash: String(item.hash),
        createdAt: String(item.createdAt || ""),
        updatedAt: String(item.updatedAt || item.createdAt || ""),
      }));
  } catch {
    return [];
  }
}

export function saveUsers(users, storage) {
  storeOf(storage)?.setItem?.(USERS_KEY, JSON.stringify(users));
  return users;
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

export async function createAccount({ email, password, name } = {}, storage) {
  if (!isValidEmail(email)) return fail("invalid_email");
  if (String(password || "").length < MIN_PASSWORD_LENGTH) return fail("short_password");
  const users = loadUsers(storage);
  const normalized = normalizeEmail(email);
  if (users.some((user) => user.email === normalized)) return fail("email_taken");
  const now = new Date().toISOString();
  const record = await setCredentials(
    {
      email: normalized,
      name: String(name || "").trim(),
      createdAt: now,
      updatedAt: now,
    },
    password,
  );
  saveUsers([...users, record], storage);
  setSessionEmail(normalized, storage);
  return ok(publicUser(record));
}

export async function login({ email, password } = {}, storage) {
  if (!isValidEmail(email)) return fail("invalid_email");
  if (String(password || "").length < MIN_PASSWORD_LENGTH) return fail("short_password");
  const record = findUser(email, storage);
  if (!record) return fail("no_account");
  const hash = await hashPassword(password, hexToBytes(record.salt));
  if (!timingSafeEqual(hash, record.hash)) return fail("bad_password");
  setSessionEmail(record.email, storage);
  return ok(publicUser(record));
}

export function logout(storage) {
  setSessionEmail("", storage);
  return { ok: true, error: "", user: null };
}

export async function changePassword({ currentPassword, newPassword } = {}, storage) {
  const session = getSessionEmail(storage);
  if (!session) return fail("not_signed_in");
  if (String(newPassword || "").length < MIN_PASSWORD_LENGTH) return fail("short_password");
  const users = loadUsers(storage);
  const index = users.findIndex((user) => user.email === session);
  if (index < 0) {
    setSessionEmail("", storage);
    return fail("not_signed_in");
  }
  const currentHash = await hashPassword(currentPassword, hexToBytes(users[index].salt));
  if (!timingSafeEqual(currentHash, users[index].hash)) return fail("bad_password");
  await setCredentials(users[index], newPassword);
  saveUsers(users, storage);
  return ok(publicUser(users[index]));
}

export async function resetPassword({ email, newPassword } = {}, storage) {
  if (!isValidEmail(email)) return fail("invalid_email");
  if (String(newPassword || "").length < MIN_PASSWORD_LENGTH) return fail("short_password");
  const users = loadUsers(storage);
  const index = users.findIndex((user) => user.email === normalizeEmail(email));
  if (index < 0) return fail("no_account");
  await setCredentials(users[index], newPassword);
  saveUsers(users, storage);
  setSessionEmail(users[index].email, storage);
  return ok(publicUser(users[index]));
}

export function updateProfileName(name, storage) {
  const session = getSessionEmail(storage);
  if (!session) return fail("not_signed_in");
  const users = loadUsers(storage);
  const index = users.findIndex((user) => user.email === session);
  if (index < 0) {
    setSessionEmail("", storage);
    return fail("not_signed_in");
  }
  users[index].name = String(name || "").trim();
  users[index].updatedAt = new Date().toISOString();
  saveUsers(users, storage);
  return ok(publicUser(users[index]));
}
