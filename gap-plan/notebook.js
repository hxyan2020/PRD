(() => {
  const NOTES_KEY = "six-hours-notebook-v1";

  const TOPIC_RULES = [
    { re: /\b(value at risk|historical\s+var|parametric\s+var|\bvar\b|expected shortfall|\bes\b|kupiec|christoffersen|traffic.?light)\b/i, caption: "VaR, ES, and backtesting" },
    { re: /\b(greek|delta|gamma|vega|theta|rho|black.?scholes|put-call|option payoff)\b/i, caption: "Options, payoffs, and Greeks" },
    { re: /\b(basis|futures|contango|backwardation|hedge ratio|ewma|garch|volatility)\b/i, caption: "Basis, hedges, and volatility" },
    { re: /\b(margin|haircut|liquidation|maintenance margin|leverage|tier)\b/i, caption: "Margin, haircuts, and liquidation" },
    { re: /\b(threshold|false positive|alert|kri|risk appetite|parameter governance|maker.?checker)\b/i, caption: "Thresholds and parameter governance" },
    { re: /\b(roadmap|acceptance test|product metric|non-goal|discovery|adoption)\b/i, caption: "Risk product ownership" },
    { re: /\b(api|event-driven|kafka|system of record|rollback|observability|paging)\b/i, caption: "Risk platform and delivery" },
    { re: /\b(monte carlo|stress|liquidity add-on|correlation|calibration)\b/i, caption: "Stress testing and simulation" },
    { re: /\b(model validation|sr 11-7|challenger|model risk|limitations)\b/i, caption: "Model validation" },
    { re: /\b(precision|recall|classif|anomaly|isolation forest|\bmad\b|feature)\b/i, caption: "ML for risk alerts" },
    { re: /\b(rag|retrieval|citation|agent|tool.?call|guardrail|eval|nist)\b/i, caption: "AI engineering for risk" },
    { re: /\b(repo|securities lend|stock borrow|rehypothecation|prime broker|collateral)\b/i, caption: "Prime brokerage and financing" },
    { re: /\b(portfolio|cross-asset|sleeve|shock|funding)\b/i, caption: "Cross-asset portfolio risk" },
    { re: /\b(commercial|buyer|user research|go-to-market|revenue)\b/i, caption: "Commercial framing for risk product" },
  ];

  function loadNotes() {
    try {
      const parsed = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveNotes(notes) {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }

  function clipCaption(text, max = 72) {
    const clean = String(text).replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    return `${clean.slice(0, max - 1).trim()}…`;
  }

  function captionFor(text, meta = {}) {
    const body = String(text || "").trim();
    if (!body) return "Empty note";

    for (const rule of TOPIC_RULES) {
      if (rule.re.test(body)) {
        if (meta.fromTutor) return `${rule.caption} · from tutor`;
        if (meta.weekTitle) return `${rule.caption} · Week context`;
        return rule.caption;
      }
    }

    const openWeek = window.SixHours?.getOpenWeek?.();
    if (openWeek?.title) {
      const weekHit = openWeek.title
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 3)
        .some((token) => body.toLowerCase().includes(token));
      if (weekHit) {
        return clipCaption(`Week ${openWeek.n}: ${openWeek.title}`);
      }
    }

    const firstSentence = body.split(/(?<=[.!?])\s+/)[0] || body;
    const prefix = meta.fromTutor ? "Tutor note · " : meta.fromCourseware ? "Course note · " : "Note · ";
    return clipCaption(prefix + firstSentence);
  }

  function detectSource(node) {
    if (!node) return { fromTutor: false, fromCourseware: false };
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!el) return { fromTutor: false, fromCourseware: false };
    return {
      fromTutor: Boolean(el.closest("#tutor-sheet .tutor-msg, #tutor-quote")),
      fromCourseware: Boolean(el.closest(".courseware, .card, .note, .path-card")),
    };
  }

  function addNote(text, meta = {}) {
    const cleaned = String(text || "").replace(/\s+/g, " ").trim();
    if (cleaned.length < 3) throw new Error("Select a bit more text first.");
    if (cleaned.length > 4000) throw new Error("That selection is too long. Select a shorter passage.");

    const notes = loadNotes();
    const note = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: cleaned,
      caption: captionFor(cleaned, meta),
      createdAt: new Date().toISOString(),
      source: meta.fromTutor ? "tutor" : meta.fromCourseware ? "courseware" : "selection",
      week: window.SixHours?.getOpenWeek?.()?.n || null,
    };
    notes.push(note);
    saveNotes(notes);
    return note;
  }

  function deleteNote(id) {
    saveNotes(loadNotes().filter((note) => note.id !== id));
  }

  function chronologicalNotes() {
    return loadNotes()
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  function formatStamp(iso) {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderNotebookHtml() {
    const notes = chronologicalNotes();
    if (!notes.length) {
      return `<article class="note">
        <h2>Notebook</h2>
        <p>Select any text in the courseware or in the tutor chat, then tap <strong>Note</strong> on the floating bar. Notes are kept in time order on this phone.</p>
      </article>`;
    }

    const cards = notes
      .map(
        (note, index) => `<article class="note-card" data-note-id="${escapeHtml(note.id)}">
          <p class="note-index">Note ${index + 1} of ${notes.length}</p>
          <p class="note-stamp">${escapeHtml(formatStamp(note.createdAt))}</p>
          <h3 class="note-caption">${escapeHtml(note.caption)}</h3>
          <p class="note-body">${escapeHtml(note.text)}</p>
          <p class="note-meta">${escapeHtml(note.source)}${note.week ? ` · week ${note.week}` : ""}</p>
          <div class="card-actions">
            <button type="button" class="text-btn" data-copy-note="${escapeHtml(note.id)}">Copy</button>
            <button type="button" class="text-btn" data-delete-note="${escapeHtml(note.id)}">Delete</button>
          </div>
        </article>`
      )
      .join("");

    return `<article class="note">
        <h2>Notebook</h2>
        <p>${notes.length} note${notes.length === 1 ? "" : "s"}, oldest first. Select text anywhere in the plan or tutor to add more.</p>
      </article>
      <div class="stack">${cards}</div>`;
  }

  window.SixHoursNotebook = {
    addNote,
    deleteNote,
    loadNotes,
    chronologicalNotes,
    captionFor,
    detectSource,
    renderNotebookHtml,
    formatStamp,
  };
})();
