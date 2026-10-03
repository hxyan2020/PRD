import assert from "node:assert/strict";
import {
  MIN_PASSWORD_LENGTH,
  SESSION_KEY,
  USERS_KEY,
  changePassword,
  createAccount,
  getCurrentUser,
  isValidEmail,
  loadUsers,
  login,
  logout,
  normalizeEmail,
  resetPassword,
  updateProfileName,
} from "../src/auth.js";

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

assert.equal(normalizeEmail("  Ada@Example.COM "), "ada@example.com");
assert.equal(isValidEmail("ada@example.com"), true);
assert.equal(isValidEmail("not-an-email"), false);
assert.equal(MIN_PASSWORD_LENGTH, 8);

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

const renamed = updateProfileName("Countess", store);
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

console.log("auth tests ok");
