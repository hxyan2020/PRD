(() => {
  const SETTINGS_KEY = "six-hours-tutor-settings-v1";
  const HISTORY_KEY = "six-hours-tutor-history-v1";

  const sheet = document.createElement("div");
  sheet.id = "tutor-sheet";
  sheet.className = "tutor-sheet";
  sheet.hidden = true;
  sheet.innerHTML = `
    <div class="tutor-backdrop" data-tutor-close></div>
    <section class="tutor-panel" role="dialog" aria-modal="true" aria-labelledby="tutor-title">
      <header class="tutor-head">
        <div>
          <p class="tutor-kicker">Study tutor</p>
          <h2 id="tutor-title">Explain this</h2>
        </div>
        <div class="tutor-head-actions">
          <button type="button" class="icon-btn" id="tutor-settings-btn" aria-label="Tutor settings">⚙</button>
          <button type="button" class="icon-btn" data-tutor-close aria-label="Close tutor">✕</button>
        </div>
      </header>
      <p class="tutor-quote" id="tutor-quote" hidden></p>
      <div class="tutor-settings" id="tutor-settings" hidden>
        <p>Optional: add an OpenAI-compatible API key to use a live model. Leave blank to use the built-in tutor that explains from this courseware. The key stays in this browser only.</p>
        <label>API base URL
          <input id="tutor-base" type="url" placeholder="https://api.openai.com/v1" autocomplete="off">
        </label>
        <label>API key
          <input id="tutor-key" type="password" placeholder="sk-..." autocomplete="off">
        </label>
        <label>Model
          <input id="tutor-model" type="text" placeholder="gpt-4o-mini" autocomplete="off">
        </label>
        <div class="tutor-settings-actions">
          <button type="button" class="finish" id="tutor-save-settings">Save</button>
          <button type="button" class="text-btn" id="tutor-clear-settings">Clear key</button>
        </div>
      </div>
      <div class="tutor-messages" id="tutor-messages" aria-live="polite"></div>
      <form class="tutor-compose" id="tutor-form">
        <textarea id="tutor-input" rows="2" placeholder="Ask a follow-up…" enterkeyhint="send"></textarea>
        <button type="submit" class="finish" id="tutor-send">Ask</button>
      </form>
    </section>
  `;
  document.body.appendChild(sheet);

  const messagesEl = sheet.querySelector("#tutor-messages");
  const quoteEl = sheet.querySelector("#tutor-quote");
  const inputEl = sheet.querySelector("#tutor-input");
  const settingsEl = sheet.querySelector("#tutor-settings");
  const baseEl = sheet.querySelector("#tutor-base");
  const keyEl = sheet.querySelector("#tutor-key");
  const modelEl = sheet.querySelector("#tutor-model");

  let pendingSelection = "";
  let conversation = [];
  let busy = false;

  function loadSettings() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function saveSettings(next) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function getPlan() {
    return window.SixHours?.getPlan?.() || null;
  }

  function getOpenWeek() {
    return window.SixHours?.getOpenWeek?.() || null;
  }

  function tokenize(text) {
    return String(text)
      .toLowerCase()
      .split(/[^a-z0-9%/+.-]+/)
      .filter((token) => token.length > 2);
  }

  function gatherPassages(plan) {
    const passages = [];
    if (!plan?.weeks) return passages;
    for (const week of plan.weeks) {
      const push = (text, label) => {
        if (text && String(text).trim()) {
          passages.push({
            week: week.n,
            title: week.title,
            label,
            text: String(text).trim(),
          });
        }
      };
      push(week.goal, "goal");
      push(week.bigIdea, "big idea");
      for (const lesson of week.lessons || []) {
        push(lesson.title, "lesson title");
        for (const paragraph of lesson.body || []) push(paragraph, `lesson: ${lesson.title}`);
        if (lesson.example) {
          push(lesson.example.story, `example: ${lesson.example.title}`);
          push(lesson.example.takeaway, "takeaway");
        }
      }
      if (week.lab) {
        push(week.lab.goal, "lab goal");
        push(week.lab.why, "lab why");
        for (const step of week.lab.steps || []) push(step, "lab step");
      }
    }
    return passages;
  }

  function scorePassage(passage, tokens, openWeek) {
    const hay = passage.text.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (hay.includes(token)) score += token.length > 5 ? 2 : 1;
    }
    if (openWeek && passage.week === openWeek.n) score += 3;
    if (passage.label.startsWith("lesson")) score += 1;
    return score;
  }

  function relatedPassages(selection, limit = 4) {
    const plan = getPlan();
    const openWeek = getOpenWeek();
    const tokens = tokenize(selection);
    if (!plan || !tokens.length) return [];
    return gatherPassages(plan)
      .map((passage) => ({ ...passage, score: scorePassage(passage, tokens, openWeek) }))
      .filter((passage) => passage.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  function localExplain(selection, question) {
    const openWeek = getOpenWeek();
    const related = relatedPassages(`${selection || ""} ${question || ""}`, 5);
    const focus = (selection || question).trim();
    const lines = [];
    const followUp =
      question &&
      selection &&
      question.trim().toLowerCase() !== selection.trim().toLowerCase() &&
      !question.trim().toLowerCase().startsWith("explain this in plain english");

    lines.push(`Here is a clearer take on: “${focus}”`);
    lines.push("");

    if (followUp) {
      lines.push(`Your question: ${question.trim()}`);
      lines.push("");
    }

    lines.push("In plain English");
    if (followUp && /historical|parametric|vs|versus|difference/i.test(question)) {
      lines.push(
        "Historical VaR reads the actual past loss list and picks a quantile. Parametric VaR assumes a shape for returns, usually normal, and scales portfolio volatility by a z-factor. Same book, same day, different assumptions — so the numbers diverge, and the divergence itself is information."
      );
    } else if (related[0]) {
      const base = related[0].text;
      lines.push(
        `${focus} sits inside this idea: ${base.length > 420 ? `${base.slice(0, 420).trim()}…` : base}`
      );
    } else {
      lines.push(
        `${focus} is a piece of risk language. Treat it as a decision tool: what is being measured, what action it triggers, and who owns the call when the number moves.`
      );
    }
    lines.push("");

    lines.push("Why it matters in your work");
    lines.push(
      "In trading risk and risk product, a concept only earns its keep if it changes a control, a threshold, a parameter, or an escalation. Ask: if this idea is wrong, who loses money or trust first?"
    );
    if (openWeek) {
      lines.push(`You have Week ${openWeek.n} open (“${openWeek.title}”). Keep the explanation tied to that week’s deliverable, not to a general textbook tour.`);
    }
    lines.push("");

    if (related.length) {
      lines.push("From this courseware");
      for (const item of related.slice(0, 3)) {
        const snippet = item.text.length > 260 ? `${item.text.slice(0, 260).trim()}…` : item.text;
        lines.push(`• Week ${item.week} · ${item.title} · ${item.label}: ${snippet}`);
      }
      lines.push("");
    }

    lines.push("A simple check");
    lines.push(
      `Can you explain “${focus}” to a Head of Risk in two sentences without jargon, then name one control or metric that would move if the idea changed?`
    );
    lines.push("");
    lines.push("Ask me a follow-up — for example: a numeric example, the failure mode, or how this shows up in FX/CFD or crypto perps.");

    return lines.join("\n");
  }

  function systemPrompt(selection) {
    const openWeek = getOpenWeek();
    const related = relatedPassages(selection, 5)
      .map((item) => `Week ${item.week} (${item.title}) [${item.label}]: ${item.text}`)
      .join("\n\n");
    return [
      "You are a concise study tutor for a trading-risk and risk-product professional.",
      "Use plain English. Define jargon in one short line when you must use it.",
      "Prefer concrete numbers and risk-control implications over theory tours.",
      "Do not invent employer data. Use only the selected text, the user question, and the courseware excerpts.",
      openWeek ? `The learner currently has Week ${openWeek.n} open: ${openWeek.title}.` : "",
      selection ? `Selected text: ${selection}` : "",
      related ? `Courseware excerpts:\n${related}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  async function modelReply(selection, userText) {
    const settings = loadSettings();
    const key = (settings.key || "").trim();
    if (!key) return localExplain(selection, userText);

    const base = (settings.base || "https://api.openai.com/v1").replace(/\/$/, "");
    const model = settings.model || "gpt-4o-mini";
    const history = conversation
      .filter((item) => item.content !== "Thinking…")
      .map((item) => ({ role: item.role, content: item.content }));
    const messages = [{ role: "system", content: systemPrompt(selection) }, ...history];

    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Model error ${response.status}: ${detail.slice(0, 240)}`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("The model returned an empty answer.");
    return content;
  }

  function renderMessages() {
    messagesEl.innerHTML = conversation
      .map((item) => {
        const cls = item.role === "user" ? "is-user" : "is-bot";
        const label = item.role === "user" ? "You" : "Tutor";
        return `<article class="tutor-msg ${cls}"><p class="tutor-msg-label">${label}</p><div class="tutor-msg-body">${escapeHtml(item.content).replaceAll("\n", "<br>")}</div></article>`;
      })
      .join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function openSheet(selection) {
    pendingSelection = selection.trim();
    conversation = [];
    quoteEl.hidden = !pendingSelection;
    quoteEl.textContent = pendingSelection ? `Selected: “${pendingSelection}”` : "";
    settingsEl.hidden = true;
    settingsEl.setAttribute("hidden", "");
    sheet.hidden = false;
    document.body.classList.add("tutor-open");
    window.SixHoursSelection?.hideToolbar?.();
    renderMessages();
    const starter = pendingSelection
      ? `Explain this in plain English, with one concrete risk example: ${pendingSelection}`
      : "What should I focus on in the open week?";
    void ask(starter);
    setTimeout(() => inputEl.focus(), 50);
  }

  function closeSheet() {
    sheet.hidden = true;
    document.body.classList.remove("tutor-open");
  }

  async function ask(text) {
    const cleaned = String(text || "").trim();
    if (!cleaned || busy) return;
    busy = true;
    sheet.querySelector("#tutor-send").disabled = true;
    conversation.push({ role: "user", content: cleaned });
    const thinking = { role: "assistant", content: "Thinking…" };
    conversation.push(thinking);
    renderMessages();
    try {
      const answer = await modelReply(pendingSelection, cleaned);
      thinking.content = answer;
      try {
        localStorage.setItem(
          HISTORY_KEY,
          JSON.stringify({ selection: pendingSelection, conversation: conversation.slice(-12) })
        );
      } catch (_) {
        /* ignore quota */
      }
    } catch (error) {
      thinking.content = `${error.message}\n\nFalling back to the built-in tutor.\n\n${localExplain(pendingSelection, cleaned)}`;
    }
    renderMessages();
    busy = false;
    sheet.querySelector("#tutor-send").disabled = false;
  }

  sheet.addEventListener("click", (event) => {
    if (event.target.closest("[data-tutor-close]")) {
      closeSheet();
    }
  });

  sheet.querySelector("#tutor-settings-btn").addEventListener("click", () => {
    const settings = loadSettings();
    baseEl.value = settings.base || "https://api.openai.com/v1";
    keyEl.value = settings.key || "";
    modelEl.value = settings.model || "gpt-4o-mini";
    settingsEl.hidden = !settingsEl.hidden;
  });

  sheet.querySelector("#tutor-save-settings").addEventListener("click", () => {
    saveSettings({
      base: baseEl.value.trim() || "https://api.openai.com/v1",
      key: keyEl.value.trim(),
      model: modelEl.value.trim() || "gpt-4o-mini",
    });
    settingsEl.hidden = true;
    const note = document.createElement("article");
    note.className = "tutor-msg is-bot";
    note.innerHTML = `<p class="tutor-msg-label">Tutor</p><div class="tutor-msg-body">${
      keyEl.value.trim()
        ? "Saved. The next answer will use your model."
        : "Saved. The built-in courseware tutor stays on."
    }</div>`;
    messagesEl.appendChild(note);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });

  sheet.querySelector("#tutor-clear-settings").addEventListener("click", () => {
    saveSettings({});
    keyEl.value = "";
    baseEl.value = "https://api.openai.com/v1";
    modelEl.value = "gpt-4o-mini";
  });

  sheet.querySelector("#tutor-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const value = inputEl.value;
    inputEl.value = "";
    void ask(value);
  });

  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sheet.querySelector("#tutor-form").requestSubmit();
    }
  });

  window.SixHoursTutor = { openSheet, localExplain };
})();
