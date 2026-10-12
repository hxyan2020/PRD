const USERS_KEY = "seen.users.v1";
const SESSION_KEY = "seen.session.v1";

export interface UserAccount {
  email: string;
  /** SHA-256 hex of email|password */
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  email: string;
  loggedInAt: string;
  /** Persistent until explicit logOut(); never expires on its own. */
  remember: true;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readUsers(): Record<string, UserAccount> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}") as Record<
      string,
      UserAccount
    >;
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, UserAccount>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readRawSession(): { session: Session; needsUpgrade: boolean } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (!parsed || typeof parsed.email !== "string" || !parsed.email) return null;
    const session: Session = {
      email: parsed.email,
      loggedInAt:
        typeof parsed.loggedInAt === "string"
          ? parsed.loggedInAt
          : new Date().toISOString(),
      remember: true,
    };
    return {
      session,
      needsUpgrade: parsed.remember !== true,
    };
  } catch {
    return null;
  }
}

/**
 * Restore the persistent session.
 * Sessions live in localStorage and only end when logOut() runs — not on
 * refresh, tab close, or navigation.
 */
export function getSession(): Session | null {
  const restored = readRawSession();
  if (!restored) return null;

  const { session, needsUpgrade } = restored;
  const users = readUsers();
  if (!users[session.email]) {
    // Orphaned session (account removed) — force sign-out.
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  // Upgrade older session payloads so they stay remembered.
  if (needsUpgrade) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

function setSession(session: Session | null) {
  if (!session) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("seen:auth"));
}

function createSession(email: string): Session {
  return {
    email,
    loggedInAt: new Date().toISOString(),
    remember: true,
  };
}

export async function signUp(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  const users = readUsers();
  if (users[normalized]) return { ok: false, error: "That email is already registered." };
  const passwordHash = await sha256(`${normalized}|${password}`);
  users[normalized] = {
    email: normalized,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  writeUsers(users);
  setSession(createSession(normalized));
  return { ok: true };
}

export async function logIn(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  const users = readUsers();
  const user = users[normalized];
  if (!user) return { ok: false, error: "No account with that email." };
  const passwordHash = await sha256(`${normalized}|${password}`);
  if (passwordHash !== user.passwordHash) {
    return { ok: false, error: "Incorrect password." };
  }
  setSession(createSession(normalized));
  return { ok: true };
}

/** Only way to end a session — refresh / close tab / navigate do not log out. */
export function logOut() {
  setSession(null);
}

export function subscribeAuth(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener("seen:auth", handler);
  window.addEventListener("storage", handler);
  // Rehydrate after bfcache restore / tab focus so UI stays in sync.
  window.addEventListener("pageshow", handler);
  document.addEventListener("visibilitychange", handler);
  return () => {
    window.removeEventListener("seen:auth", handler);
    window.removeEventListener("storage", handler);
    window.removeEventListener("pageshow", handler);
    document.removeEventListener("visibilitychange", handler);
  };
}
