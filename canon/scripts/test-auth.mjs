import assert from "node:assert/strict";
import {
  MIN_PASSWORD_LENGTH,
  SESSION_KEY,
  USERS_KEY,
  applyAuthAction,
  changePassword,
  createAccount,
  credentialsFromForm,
  getCurrentUser,
  isValidEmail,
  loadUsers,
  login,
  logout,
  normalizeEmail,
  resetPassword,
  setAuthRemote,
  syncSessionToRemote,
  updateProfileName,
} from "../src/auth.js";
import { createAuthHandler } from "../api/auth.js";

function memoryStore() {
  return {
    data: new Map(),
    getItem(key) {
      return this.data.has(key) ? this.data.get(key) : null;
    },
    setItem(key, value) {
      this.data.set(key, String(value));
    },
    removeItem(key) {
      this.data.delete(key);
    },
  };
}

function memoryRemote() {
  let users = [];
  const handler = async (payload) => {
    const result = await applyAuthAction(users, payload);
    users = result.users;
    return { ok: result.ok, error: result.error, user: result.user, record: result.ok ? result.record : undefined };
  };
  handler.users = () => users;
  return handler;
}

assert.equal(normalizeEmail("  Ada@Example.COM "), "ada@example.com");
assert.equal(isValidEmail("ada@example.com"), true);
assert.equal(isValidEmail("not-an-email"), false);
assert.equal(MIN_PASSWORD_LENGTH, 8);

const autofill = new FormData();
autofill.set("email", "filled@example.com");
autofill.set("password", "autofilled-pass");
const filled = credentialsFromForm(autofill, { email: "", password: "" });
assert.equal(filled.email, "filled@example.com");
assert.equal(filled.password, "autofilled-pass");

const store = memoryStore();
assert.equal(getCurrentUser(store), null);

const short = await createAccount({ email: "ada@example.com", password: "short" }, store);
assert.equal(short.ok, false);
assert.equal(short.error, "short_password");

const badEmail = await createAccount({ email: "ada", password: "long-enough" }, store);
assert.equal(badEmail.ok, false);
assert.equal(badEmail.error, "invalid_email");

const created = await createAccount(
  { email: "Ada@Example.com", password: "canon-pass-1", name: " Ada Lovelace " },
  store,
);
assert.equal(created.ok, true);
assert.equal(created.user.email, "ada@example.com");
assert.equal(created.user.name, "Ada Lovelace");
assert.equal(getCurrentUser(store).email, "ada@example.com");
assert.ok(!JSON.stringify(loadUsers(store)).includes("canon-pass-1"));
assert.ok(store.getItem(USERS_KEY));
assert.ok(store.getItem(SESSION_KEY));

const taken = await createAccount({ email: "ada@example.com", password: "canon-pass-2" }, store);
assert.equal(taken.ok, false);
assert.equal(taken.error, "email_taken");

logout(store);
assert.equal(getCurrentUser(store), null);

const missing = await login({ email: "nope@example.com", password: "canon-pass-1" }, store);
assert.equal(missing.ok, false);
assert.equal(missing.error, "no_account");

const wrong = await login({ email: "ada@example.com", password: "canon-pass-x" }, store);
assert.equal(wrong.ok, false);
assert.equal(wrong.error, "bad_password");
assert.equal(getCurrentUser(store), null);

const signedIn = await login({ email: "ADA@example.com", password: "canon-pass-1" }, store);
assert.equal(signedIn.ok, true);
assert.equal(signedIn.user.name, "Ada Lovelace");

const badCurrent = await changePassword({ currentPassword: "nope-nope", newPassword: "canon-pass-2" }, store);
assert.equal(badCurrent.ok, false);
assert.equal(badCurrent.error, "bad_password");

const changed = await changePassword({ currentPassword: "canon-pass-1", newPassword: "canon-pass-2" }, store);
assert.equal(changed.ok, true);

logout(store);
const oldPass = await login({ email: "ada@example.com", password: "canon-pass-1" }, store);
assert.equal(oldPass.ok, false);
assert.equal(oldPass.error, "bad_password");

const reset = await resetPassword({ email: "ada@example.com", newPassword: "canon-pass-3" }, store);
assert.equal(reset.ok, true);
assert.equal(getCurrentUser(store).email, "ada@example.com");

const renamed = await updateProfileName("Countess", store);
assert.equal(renamed.ok, true);
assert.equal(getCurrentUser(store).name, "Countess");

logout(store);
const afterReset = await login({ email: "ada@example.com", password: "canon-pass-3" }, store);
assert.equal(afterReset.ok, true);
assert.equal(afterReset.user.name, "Countess");

const other = memoryStore();
const guestReset = await resetPassword({ email: "ghost@example.com", newPassword: "canon-pass-9" }, other);
assert.equal(guestReset.ok, false);
assert.equal(guestReset.error, "no_account");

const unsigned = await changePassword({ currentPassword: "x", newPassword: "canon-pass-9" }, other);
assert.equal(unsigned.ok, false);
assert.equal(unsigned.error, "not_signed_in");

const remote = memoryRemote();
setAuthRemote(remote);
const deviceA = memoryStore();
const deviceB = memoryStore();
const shared = await createAccount(
  { email: "cross@example.com", password: "canon-pass-7", name: "Cross Device" },
  deviceA,
);
assert.equal(shared.ok, true);
assert.equal(getCurrentUser(deviceB), null);
const fromB = await login({ email: "cross@example.com", password: "canon-pass-7" }, deviceB);
assert.equal(fromB.ok, true);
assert.equal(fromB.user.name, "Cross Device");
assert.equal(getCurrentUser(deviceB).email, "cross@example.com");

logout(deviceB);
const deviceC = memoryStore();
const resetOnC = await resetPassword({ email: "cross@example.com", newPassword: "canon-pass-8" }, deviceC);
assert.equal(resetOnC.ok, false);
assert.equal(resetOnC.error, "no_account");

const stillA = await login({ email: "cross@example.com", password: "canon-pass-7" }, memoryStore());
assert.equal(stillA.ok, true);

const synced = await syncSessionToRemote(deviceA);
assert.equal(synced.ok, true);

setAuthRemote(null);

const users = [];
const handler = createAuthHandler({
  configured: () => true,
  loadUsers: async () => users,
  saveUsers: async (next) => {
    users.splice(0, users.length, ...next);
  },
});

const createdHttp = await invoke(handler, { action: "create", email: "api@example.com", password: "canon-pass-1", name: "Api" });
assert.equal(createdHttp.status, 200);
assert.equal(createdHttp.body.ok, true);
assert.equal(createdHttp.body.user.email, "api@example.com");
assert.ok(createdHttp.body.record.hash);
assert.ok(!JSON.stringify(createdHttp.body.user).includes(createdHttp.body.record.hash));

const loginHttp = await invoke(handler, { action: "login", email: "api@example.com", password: "canon-pass-1" });
assert.equal(loginHttp.body.ok, true);

const wrongHttp = await invoke(handler, { action: "login", email: "api@example.com", password: "nope-nope" });
assert.equal(wrongHttp.body.ok, false);
assert.equal(wrongHttp.body.error, "bad_password");
assert.equal(wrongHttp.body.record, undefined);

const method = await invoke(handler, { action: "login" }, "GET");
assert.equal(method.status, 405);

const down = createAuthHandler({ configured: () => false });
const unavailable = await invoke(down, { action: "login", email: "api@example.com", password: "canon-pass-1" });
assert.equal(unavailable.status, 503);
assert.equal(unavailable.body.error, "unavailable");

console.log("auth tests ok");

function invoke(handler, body, method = "POST") {
  return new Promise((resolve) => {
    const chunks = [];
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(key, value) {
        this.headers[key] = value;
      },
      end(text) {
        chunks.push(String(text || ""));
        resolve({
          status: this.statusCode,
          body: JSON.parse(chunks.join("") || "{}"),
        });
      },
    };
    void handler({ method, body }, res);
  });
}
