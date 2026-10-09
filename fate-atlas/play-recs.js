/**
 * Rotating Play-tab rite recommendations.
 * Fresh set per browser session and on each login; avoids recently shown rites.
 */
(function () {
  "use strict";

  const COUNT = 3;
  const SEEN_LIMIT = 72;
  const SESSION_MAX_MS = 12 * 60 * 60 * 1000;
  const GUEST_SEEN = "fatum-atlas-play-seen-v1";
  const SESSION_KEY = "fatum-play-recs-session-v1";
  const SESSION_OWNER = "fatum-play-recs-owner-v1";
  const SESSION_AT = "fatum-play-recs-at-v1";

  function activeEmail() {
    const u = window.FatumAuth && window.FatumAuth.currentUser && window.FatumAuth.currentUser();
    return u && u.email ? String(u.email).toLowerCase() : null;
  }

  function seenKey(email) {
    return email ? `${GUEST_SEEN}:${email}` : GUEST_SEEN;
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
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function readSessionJSON(key, fallback) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }

  function writeSessionJSON(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function allMethods() {
    const catalog = window.FATE_METHODS || [];
    const featured = window.FATE_FEATURED_METHODS || [];
    const byId = Object.create(null);
    catalog.forEach((m) => {
      if (m && m.id) byId[m.id] = m;
    });
    featured.forEach((m) => {
      if (m && m.id) byId[m.id] = Object.assign({}, byId[m.id] || {}, m);
    });
    return Object.keys(byId).map((id) => byId[id]);
  }

  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function getSeen(email) {
    const list = readJSON(seenKey(email), []);
    return Array.isArray(list) ? list.filter((id) => typeof id === "string") : [];
  }

  function pushSeen(email, ids) {
    const prev = getSeen(email);
    const next = ids.concat(prev.filter((id) => !ids.includes(id))).slice(0, SEEN_LIMIT);
    writeJSON(seenKey(email), next);
  }

  function pickDiverse(pool, count) {
    const picked = [];
    const usedContinents = new Set();
    const usedTypes = new Set();
    const rest = shuffle(pool);

    // Prefer guided rites first for nicer Play cards, then fill from the rest.
    const guided = rest.filter((m) => m.guided);
    const plain = rest.filter((m) => !m.guided);
    const ordered = guided.concat(plain);

    ordered.forEach((m) => {
      if (picked.length >= count) return;
      const continentOk = !usedContinents.has(m.continent) || usedContinents.size >= count;
      const typeOk = !usedTypes.has(m.type) || usedTypes.size >= count;
      if (continentOk && typeOk) {
        picked.push(m);
        if (m.continent) usedContinents.add(m.continent);
        if (m.type) usedTypes.add(m.type);
      }
    });

    ordered.forEach((m) => {
      if (picked.length >= count) return;
      if (!picked.some((p) => p.id === m.id)) picked.push(m);
    });

    return picked.slice(0, count);
  }

  function pickFresh(forceNew) {
    const email = activeEmail();
    const owner = email || "guest";
    const sessionOwner = sessionStorage.getItem(SESSION_OWNER);
    const sessionIds = readSessionJSON(SESSION_KEY, null);
    const sessionAt = Number(sessionStorage.getItem(SESSION_AT) || 0);
    const sessionFresh = sessionAt && Date.now() - sessionAt < SESSION_MAX_MS;

    if (
      !forceNew &&
      sessionFresh &&
      sessionOwner === owner &&
      Array.isArray(sessionIds) &&
      sessionIds.length === COUNT
    ) {
      const byId = Object.create(null);
      allMethods().forEach((m) => {
        byId[m.id] = m;
      });
      const cached = sessionIds.map((id) => byId[id]).filter(Boolean);
      if (cached.length === COUNT) return cached;
    }

    const methods = allMethods();
    if (!methods.length) return [];

    let seen = getSeen(email);
    let fresh = methods.filter((m) => !seen.includes(m.id));
    if (fresh.length < COUNT) {
      // Catalog exhausted — clear history and start a new cycle.
      seen = [];
      writeJSON(seenKey(email), []);
      fresh = methods.slice();
    }

    const picked = pickDiverse(fresh, COUNT);
    const ids = picked.map((m) => m.id);
    pushSeen(email, ids);
    writeSessionJSON(SESSION_KEY, ids);
    try {
      sessionStorage.setItem(SESSION_OWNER, owner);
      sessionStorage.setItem(SESSION_AT, String(Date.now()));
    } catch (_) {}

    document.dispatchEvent(
      new CustomEvent("fatum:play-recs-changed", { detail: { ids, email: owner } })
    );
    return picked;
  }

  function current() {
    return pickFresh(false);
  }

  function rotate() {
    return pickFresh(true);
  }

  function init() {
    document.addEventListener("fatum:auth-changed", (e) => {
      const action = e.detail && e.detail.action;
      if (action === "login" || action === "register" || action === "logout") {
        // New identity → always show a fresh set.
        try {
          sessionStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(SESSION_OWNER);
          sessionStorage.removeItem(SESSION_AT);
        } catch (_) {}
        pickFresh(true);
      }
    });
  }

  window.FatumPlayRecs = {
    current,
    rotate,
    count: COUNT,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
