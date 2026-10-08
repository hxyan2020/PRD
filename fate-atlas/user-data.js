/**
 * Per-user Fatum data: journal seals, rite collection, browsing history.
 * Guest (signed-out) data uses legacy keys; signed-in users get email-scoped bags.
 */
(function () {
  "use strict";

  const GUEST_JOURNAL = "fatum-atlas-journal-v1";
  const GUEST_COLLECTION = "fatum-atlas-collection-v1";
  const GUEST_HISTORY = "fatum-atlas-history-v1";
  const USER_PREFIX = "fatum-atlas-user-v1:";
  const HISTORY_LIMIT = 80;

  function emailKey(email) {
    return USER_PREFIX + String(email || "").toLowerCase();
  }

  function activeEmail() {
    const u = window.FatumAuth && window.FatumAuth.currentUser();
    return u ? u.email : null;
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

  function bagKey() {
    const email = activeEmail();
    return email ? emailKey(email) : null;
  }

  function loadBag() {
    const key = bagKey();
    if (!key) {
      return {
        journal: readJSON(GUEST_JOURNAL, []),
        collection: readJSON(GUEST_COLLECTION, []),
        history: readJSON(GUEST_HISTORY, []),
      };
    }
    const bag = readJSON(key, null);
    if (bag && typeof bag === "object") {
      return {
        journal: Array.isArray(bag.journal) ? bag.journal : [],
        collection: Array.isArray(bag.collection) ? bag.collection : [],
        history: Array.isArray(bag.history) ? bag.history : [],
      };
    }
    return { journal: [], collection: [], history: [] };
  }

  function saveBag(bag) {
    const key = bagKey();
    if (!key) {
      writeJSON(GUEST_JOURNAL, bag.journal || []);
      writeJSON(GUEST_COLLECTION, bag.collection || []);
      writeJSON(GUEST_HISTORY, bag.history || []);
      return;
    }
    writeJSON(key, {
      journal: bag.journal || [],
      collection: bag.collection || [],
      history: bag.history || [],
      updatedAt: new Date().toISOString(),
    });
  }

  function getJournal() {
    return loadBag().journal;
  }

  function setJournal(list) {
    const bag = loadBag();
    bag.journal = Array.isArray(list) ? list : [];
    saveBag(bag);
    document.dispatchEvent(
      new CustomEvent("fatum:journal-changed", { detail: { count: bag.journal.length } })
    );
  }

  function getCollection() {
    return loadBag().collection;
  }

  function setCollection(ids) {
    const bag = loadBag();
    bag.collection = Array.isArray(ids) ? ids : [];
    saveBag(bag);
    document.dispatchEvent(
      new CustomEvent("fatum:collection-changed", { detail: { count: bag.collection.length } })
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
    return loadBag().history;
  }

  function recordHistory(methodId, meta) {
    if (!methodId) return;
    const bag = loadBag();
    const next = {
      methodId: String(methodId),
      at: new Date().toISOString(),
      name: (meta && meta.name) || "",
    };
    const filtered = (bag.history || []).filter((h) => h.methodId !== methodId);
    filtered.unshift(next);
    bag.history = filtered.slice(0, HISTORY_LIMIT);
    saveBag(bag);
    document.dispatchEvent(
      new CustomEvent("fatum:history-changed", { detail: { count: bag.history.length } })
    );
  }

  function migrateGuestInto(email) {
    const key = emailKey(email);
    const existing = readJSON(key, null);
    const hasUserData =
      existing &&
      ((Array.isArray(existing.journal) && existing.journal.length) ||
        (Array.isArray(existing.collection) && existing.collection.length) ||
        (Array.isArray(existing.history) && existing.history.length));
    if (hasUserData) return false;

    const guest = {
      journal: readJSON(GUEST_JOURNAL, []),
      collection: readJSON(GUEST_COLLECTION, []),
      history: readJSON(GUEST_HISTORY, []),
    };
    const empty =
      !guest.journal.length && !guest.collection.length && !guest.history.length;
    if (empty) {
      writeJSON(key, {
        journal: [],
        collection: [],
        history: [],
        updatedAt: new Date().toISOString(),
      });
      return false;
    }
    writeJSON(key, {
      ...guest,
      updatedAt: new Date().toISOString(),
      migratedFromGuestAt: new Date().toISOString(),
    });
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
    GUEST_JOURNAL,
  };
})();
