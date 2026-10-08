/**
 * Per-user Fatum data: journal seals, rite collection, browsing history.
 * Guest (signed-out) uses legacy keys; signed-in users get email-scoped keys.
 */
(function () {
  "use strict";

  const GUEST_JOURNAL = "fatum-atlas-journal-v1";
  const GUEST_COLLECTION = "fatum-atlas-collection-v1";
  const GUEST_HISTORY = "fatum-atlas-history-v1";
  const HISTORY_LIMIT = 80;

  function activeEmail() {
    const u = window.FatumAuth && window.FatumAuth.currentUser();
    return u ? u.email : null;
  }

  function keysFor(email) {
    if (!email) {
      return {
        journal: GUEST_JOURNAL,
        collection: GUEST_COLLECTION,
        history: GUEST_HISTORY,
      };
    }
    const id = String(email).toLowerCase();
    return {
      journal: `fatum-atlas-journal-v1:${id}`,
      collection: `fatum-atlas-collection-v1:${id}`,
      history: `fatum-atlas-history-v1:${id}`,
    };
  }

  function activeKeys() {
    return keysFor(activeEmail());
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getJournal() {
    const list = readJSON(activeKeys().journal, []);
    return Array.isArray(list) ? list : [];
  }

  function setJournal(list) {
    const next = Array.isArray(list) ? list : [];
    writeJSON(activeKeys().journal, next);
    document.dispatchEvent(
      new CustomEvent("fatum:journal-changed", { detail: { count: next.length } })
    );
  }

  function getCollection() {
    const list = readJSON(activeKeys().collection, []);
    return Array.isArray(list) ? list : [];
  }

  function setCollection(ids) {
    const next = Array.isArray(ids) ? ids : [];
    writeJSON(activeKeys().collection, next);
    document.dispatchEvent(
      new CustomEvent("fatum:collection-changed", { detail: { count: next.length } })
    );
  }

  function toggleCollection(methodId) {
    if (!methodId) return false;
    const list = getCollection().slice();
    const i = list.indexOf(methodId);
    if (i >= 0) list.splice(i, 1);
    else list.unshift(methodId);
    setCollection(list);
    return list.indexOf(methodId) >= 0;
  }

  function inCollection(methodId) {
    return getCollection().indexOf(methodId) >= 0;
  }

  function getHistory() {
    const list = readJSON(activeKeys().history, []);
    return Array.isArray(list) ? list : [];
  }

  function recordHistory(methodId, meta) {
    if (!methodId) return;
    const next = {
      methodId: String(methodId),
      at: new Date().toISOString(),
      name: (meta && meta.name) || "",
    };
    const filtered = getHistory().filter((h) => h.methodId !== methodId);
    filtered.unshift(next);
    writeJSON(activeKeys().history, filtered.slice(0, HISTORY_LIMIT));
    document.dispatchEvent(
      new CustomEvent("fatum:history-changed", {
        detail: { count: Math.min(filtered.length, HISTORY_LIMIT) },
      })
    );
  }

  function migrateGuestInto(email) {
    if (!email) return false;
    const userKeys = keysFor(email);
    const existingJournal = readJSON(userKeys.journal, []);
    const existingCollection = readJSON(userKeys.collection, []);
    const existingHistory = readJSON(userKeys.history, []);
    const hasUserData =
      (Array.isArray(existingJournal) && existingJournal.length) ||
      (Array.isArray(existingCollection) && existingCollection.length) ||
      (Array.isArray(existingHistory) && existingHistory.length);
    if (hasUserData) return false;

    const guestJournal = readJSON(GUEST_JOURNAL, []);
    const guestCollection = readJSON(GUEST_COLLECTION, []);
    const guestHistory = readJSON(GUEST_HISTORY, []);
    const empty =
      !(Array.isArray(guestJournal) && guestJournal.length) &&
      !(Array.isArray(guestCollection) && guestCollection.length) &&
      !(Array.isArray(guestHistory) && guestHistory.length);
    if (empty) return false;

    writeJSON(userKeys.journal, guestJournal);
    writeJSON(userKeys.collection, guestCollection);
    writeJSON(userKeys.history, guestHistory);
    return true;
  }

  function onSignedIn(email, opts) {
    if (opts && opts.migrateGuest) migrateGuestInto(email);
    document.dispatchEvent(new CustomEvent("fatum:userdata-ready", { detail: { email } }));
  }

  function onSignedOut() {
    document.dispatchEvent(new CustomEvent("fatum:userdata-ready", { detail: { email: null } }));
  }

  window.FatumUserData = {
    getJournal,
    setJournal,
    getCollection,
    setCollection,
    toggleCollection,
    inCollection,
    getHistory,
    recordHistory,
    onSignedIn,
    onSignedOut,
    migrateGuestInto,
    keysFor,
    GUEST_JOURNAL,
  };
})();
