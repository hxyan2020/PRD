/**
 * Fatum Atlas auth — email/password accounts with persistent session.
 * Accounts and user data live in this browser (localStorage). Session
 * stays until the user explicitly signs out.
 */
(function () {
  "use strict";

  const ACCOUNTS_KEY = "fatum-atlas-accounts-v1";
  const SESSION_KEY = "fatum-atlas-session-v1";
  const ITERATIONS = 120000;

  function t(key, vars) {
    return window.FatumI18n ? window.FatumI18n.t(key, vars) : key;
  }

  function normalizeEmail(email) {
    return String(email || "")
      .trim()
      .toLowerCase();
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function loadAccounts() {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === "object" ? obj : {};
    } catch (_) {
      return {};
    }
  }

  function saveAccounts(map) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(map));
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const s = raw ? JSON.parse(raw) : null;
      if (!s || !s.email || !s.token) return null;
      const accounts = loadAccounts();
      if (!accounts[s.email] || accounts[s.email].token !== s.token) return null;
      return s;
    } catch (_) {
      return null;
    }
  }

  function saveSession(session) {
    if (!session) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function bufToB64(buf) {
    const bytes = new Uint8Array(buf);
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  function b64ToBuf(b64) {
    const s = atob(b64);
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return bytes.buffer;
  }

  async function deriveHash(password, saltB64) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: b64ToBuf(saltB64),
        iterations: ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    return bufToB64(bits);
  }

  function randomB64(bytes) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return bufToB64(arr);
  }

  function currentUser() {
    const s = loadSession();
    return s ? { email: s.email } : null;
  }

  function isSignedIn() {
    return !!currentUser();
  }

  function emit(type, detail) {
    document.dispatchEvent(new CustomEvent(type, { detail: detail || {} }));
  }

  async function register(email, password) {
    email = normalizeEmail(email);
    if (!validEmail(email)) {
      return { ok: false, error: "auth.error.email" };
    }
    if (!password || String(password).length < 8) {
      return { ok: false, error: "auth.error.passwordShort" };
    }
    const accounts = loadAccounts();
    if (accounts[email]) {
      return { ok: false, error: "auth.error.exists" };
    }
    const salt = randomB64(16);
    const hash = await deriveHash(password, salt);
    const token = randomB64(24);
    accounts[email] = {
      salt,
      hash,
      token,
      createdAt: new Date().toISOString(),
    };
    saveAccounts(accounts);
    saveSession({ email, token, signedInAt: new Date().toISOString() });
    if (window.FatumUserData) {
      window.FatumUserData.onSignedIn(email, { migrateGuest: true });
    }
    emit("fatum:auth-changed", { email, action: "register" });
    return { ok: true, email };
  }

  async function login(email, password) {
    email = normalizeEmail(email);
    if (!validEmail(email) || !password) {
      return { ok: false, error: "auth.error.credentials" };
    }
    const accounts = loadAccounts();
    const acct = accounts[email];
    if (!acct) return { ok: false, error: "auth.error.credentials" };
    const hash = await deriveHash(password, acct.salt);
    if (hash !== acct.hash) return { ok: false, error: "auth.error.credentials" };
    // Refresh session token so it stays valid across visits
    const token = randomB64(24);
    acct.token = token;
    acct.lastLoginAt = new Date().toISOString();
    accounts[email] = acct;
    saveAccounts(accounts);
    saveSession({ email, token, signedInAt: new Date().toISOString() });
    if (window.FatumUserData) {
      window.FatumUserData.onSignedIn(email, { migrateGuest: false });
    }
    emit("fatum:auth-changed", { email, action: "login" });
    return { ok: true, email };
  }

  function logout() {
    const prev = currentUser();
    saveSession(null);
    if (window.FatumUserData) window.FatumUserData.onSignedOut();
    emit("fatum:auth-changed", { email: null, action: "logout", previous: prev && prev.email });
  }

  window.FatumAuth = {
    register,
    login,
    logout,
    currentUser,
    isSignedIn,
    normalizeEmail,
    ACCOUNTS_KEY,
    SESSION_KEY,
  };
})();
