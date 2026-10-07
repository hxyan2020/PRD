/**
 * Fate Journal — persist readings in localStorage with
 * auto-generated titles and timestamps.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "fatum-atlas-journal-v1";

  function escapeHTML(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function saveAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    document.dispatchEvent(new CustomEvent("fatum:journal-changed", { detail: { count: list.length } }));
  }

  function formatStamp(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function shortDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function clip(str, n) {
    const s = String(str || "").replace(/\s+/g, " ").trim();
    if (s.length <= n) return s;
    return s.slice(0, n - 1).trimEnd() + "…";
  }

  /**
   * Auto title from reading + method context.
   * Examples:
   *   "兑 / 乾 · Bagua · Oct 7"
   *   "ENTP — Debater · Career"
   *   "战车 · 节制 · 审判 · Tarot"
   *   "Water Monkey · Leo · Bazi"
   */
  function autoTitle(entryBase) {
    const method = entryBase.methodName || "Reading";
    const r = entryBase.reading || {};
    const when = shortDate(entryBase.createdAt);
    const kind = r.kind || entryBase.kind || "";

    if (kind === "bagua") {
      const core = clip(r.title || "Hexagram", 36);
      return `${core} · 八卦 · ${when}`;
    }
    if (kind === "tarot") {
      const names = (r.drawn || [])
        .map((c) => c.nameZh || c.name)
        .filter(Boolean)
        .slice(0, 3);
      const core = names.length ? names.join(" · ") : clip(r.title, 40);
      return `${core} · 塔罗 · ${when}`;
    }
    if (kind === "mbti") {
      const type = (r.title || "").split("—")[0].trim() || "MBTI";
      const focus = entryBase.focus ? ` · ${clip(entryBase.focus, 24)}` : "";
      return `${type}${focus} · ${when}`;
    }

    // Generic readings
    const headline = clip(r.title || r.omen || method, 42);
    const q = entryBase.question ? ` · ${clip(entryBase.question, 28)}` : "";
    return `${headline}${q} · ${when}`;
  }

  function collect(payload) {
    const createdAt = new Date().toISOString();
    const base = {
      id: `j-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt,
      methodId: payload.methodId || "",
      methodName: payload.methodName || "Fate reading",
      kind: payload.kind || payload.reading?.kind || "generic",
      question: payload.question || "",
      focus: payload.focus || "",
      reading: payload.reading || {},
      photoDataUrl: payload.photoDataUrl || payload.reading?.photoDataUrl || "",
    };
    base.title = autoTitle(base);

    // Store a lean snapshot (drop huge nested objects if any)
    const leanReading = {
      kind: base.reading.kind,
      title: base.reading.title,
      omen: base.reading.omen,
      verdict: base.reading.verdict,
      counsel: base.reading.counsel,
      timing: base.reading.timing,
      details: base.reading.details || [],
      symbol: base.reading.symbol,
      tone: base.reading.tone,
      disclaimer: base.reading.disclaimer,
      drawn: base.reading.drawn
        ? base.reading.drawn.map((c) => ({
            name: c.name,
            nameZh: c.nameZh,
            reversed: !!c.reversed,
          }))
        : undefined,
      type: base.reading.type,
      photoSubject: base.reading.photoSubject || null,
    };
    // Keep compressed photo on the entry (not duplicated inside reading to save space)
    if (base.photoDataUrl && base.photoDataUrl.length > 900000) {
      // Too large for comfortable localStorage — drop image, keep text
      base.photoDataUrl = "";
      leanReading.details = (leanReading.details || []).concat([
        "Photo was too large to store in the journal; text of the reading was kept.",
      ]);
    }
    base.reading = leanReading;

    const list = loadAll();
    list.unshift(base);
    saveAll(list);
    return base;
  }

  function remove(id) {
    const list = loadAll().filter((e) => e.id !== id);
    saveAll(list);
    return list;
  }

  function clearAll() {
    saveAll([]);
  }

  function get(id) {
    return loadAll().find((e) => e.id === id) || null;
  }

  function renderJournalList(container) {
    if (!container) return;
    const list = loadAll();
    const countEl = document.getElementById("journal-count");
    if (countEl) countEl.textContent = String(list.length);

    if (!list.length) {
      container.innerHTML = `
        <p class="journal-empty">
          No entries yet. Finish a reading and press <strong>Save to journal</strong> to collect it here.
        </p>`;
      return;
    }

    container.innerHTML = list
      .map((e) => {
        const verdict = clip(e.reading?.verdict || e.reading?.omen || "", 140);
        const thumb = e.photoDataUrl
          ? `<div class="journal-entry__thumb"><img src="${e.photoDataUrl}" alt="" /></div>`
          : "";
        return `<article class="journal-entry" data-id="${escapeHTML(e.id)}">
          <div class="journal-entry__row">
            ${thumb}
            <div class="journal-entry__main">
              <header class="journal-entry__head">
                <h3 class="journal-entry__title">${escapeHTML(e.title)}</h3>
                <time class="journal-entry__time" datetime="${escapeHTML(e.createdAt)}">${escapeHTML(formatStamp(e.createdAt))}</time>
              </header>
              <p class="journal-entry__method">${escapeHTML(e.methodName)}</p>
              ${e.question ? `<p class="journal-entry__q">Q: ${escapeHTML(e.question)}</p>` : ""}
              <p class="journal-entry__verdict">${escapeHTML(verdict)}</p>
              <div class="journal-entry__actions">
                <button type="button" class="btn btn--ghost btn--small studio__btn-muted" data-journal-view="${escapeHTML(e.id)}">Open</button>
                <button type="button" class="btn btn--ghost btn--small studio__btn-muted" data-journal-delete="${escapeHTML(e.id)}">Remove</button>
              </div>
            </div>
          </div>
        </article>`;
      })
      .join("");
  }

  function renderEntryDetail(entry) {
    if (!entry) return "";
    const r = entry.reading || {};
    return `
      <p class="studio__eyebrow">Journal entry</p>
      <h3 class="studio__heading">${escapeHTML(entry.title)}</h3>
      <p class="reading__omen"><time datetime="${escapeHTML(entry.createdAt)}">${escapeHTML(formatStamp(entry.createdAt))}</time> · ${escapeHTML(entry.methodName)}</p>
      ${entry.photoDataUrl ? `<div class="reading-photo"><img src="${entry.photoDataUrl}" alt="Saved photo for this reading" /></div>` : ""}
      ${entry.question ? `<p class="studio__copy"><strong>Question:</strong> ${escapeHTML(entry.question)}</p>` : ""}
      ${entry.focus ? `<p class="studio__copy"><strong>Focus:</strong> ${escapeHTML(entry.focus)}</p>` : ""}
      <p class="reading__verdict">${escapeHTML(r.verdict || "")}</p>
      <p class="reading__omen">${escapeHTML(r.omen || "")}</p>
      <ul class="reading__details">${(r.details || []).map((d) => `<li>${escapeHTML(d)}</li>`).join("")}</ul>
      ${r.counsel ? `<div class="reading__block"><h4>Counsel</h4><p>${escapeHTML(r.counsel)}</p></div>` : ""}
      ${r.timing ? `<div class="reading__block"><h4>Timing</h4><p>${escapeHTML(r.timing)}</p></div>` : ""}
      <div class="advisory advisory--compact">
        <p class="advisory__eyebrow">Accuracy advisory</p>
        <p class="advisory__body">Saved for reflection. Readings may be inaccurate. No method predicts black swan events that can change everything at once.</p>
      </div>
    `;
  }

  window.FatumJournal = {
    loadAll,
    collect,
    remove,
    clearAll,
    get,
    autoTitle,
    formatStamp,
    renderJournalList,
    renderEntryDetail,
    STORAGE_KEY,
  };
})();
