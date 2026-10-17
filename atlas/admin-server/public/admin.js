const state = {
  user: null,
  page: 1,
  q: "",
  total: 0,
  selectedId: null,
  detail: null,
  locales: ["en"],
  /** @type {Record<string, object>} */
  localeOverlays: {},
  /** @type {Record<string, object>} */
  localeByCode: {},
  /** Locale currently shown in the overlay fields (not merely the <select>). */
  activeLocale: "",
  overlayKind: "curated",
  archetypeKey: null,
};

const $ = (id) => document.getElementById(id);

async function api(path, opts = {}) {
  const res = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function toast(msg, isError = false) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.toggle("error", isError);
  el.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add("hidden"), 3200);
}

function showLogin() {
  $("login-view").classList.remove("hidden");
  $("app-view").classList.add("hidden");
}

function showApp() {
  $("login-view").classList.add("hidden");
  $("app-view").classList.remove("hidden");
  $("whoami").textContent = ` · ${state.user}`;
}

async function boot() {
  try {
    const me = await api("/api/me");
    state.user = me.username;
    showApp();
    await loadLocales();
    await loadGames();
  } catch {
    showLogin();
  }
}

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("login-error").hidden = true;
  try {
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: $("login-user").value.trim(),
        password: $("login-pass").value,
      }),
    });
    state.user = data.username;
    showApp();
    await loadLocales();
    await loadGames();
  } catch (err) {
    $("login-error").hidden = false;
    $("login-error").textContent = err.message;
  }
});

$("btn-logout").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST", body: "{}" });
  state.user = null;
  showLogin();
});

function flagMarkup(meta) {
  if (meta?.iso) {
    return `<img class="locale-flag-img" src="/flags/${escapeHtml(meta.iso)}.svg" width="22" height="16" alt="" loading="lazy" decoding="async" onerror="this.style.display='none'" />`;
  }
  if (meta?.emblem) {
    return `<span class="locale-emblem">${escapeHtml(meta.emblem)}</span>`;
  }
  return `<span class="locale-emblem">🏳️</span>`;
}

function localeLabel(meta, code) {
  return `${meta?.nativeLabel || code} (${code})`;
}

function setLocaleTrigger(code) {
  const meta = state.localeByCode[code] || { nativeLabel: code };
  $("locale-trigger-flag").innerHTML = flagMarkup(meta);
  $("locale-trigger-text").textContent = localeLabel(meta, code);
  $("locale-select").value = code;
  for (const btn of $("locale-menu").querySelectorAll(".locale-option")) {
    btn.classList.toggle("active", btn.dataset.code === code);
  }
}

function closeLocaleMenu() {
  $("locale-menu").classList.add("hidden");
  $("locale-trigger").setAttribute("aria-expanded", "false");
}

function openLocaleMenu() {
  $("locale-menu").classList.remove("hidden");
  $("locale-trigger").setAttribute("aria-expanded", "true");
}

async function loadLocales() {
  const data = await api("/api/locales");
  state.locales = data.locales || ["en"];
  const catalog = data.catalog || [];
  state.localeByCode = Object.fromEntries(catalog.map((l) => [l.code, l]));
  const nonEn = data.overlayLocales || state.locales.filter((l) => l !== "en");
  const sel = $("locale-select");
  sel.innerHTML = nonEn
    .map((code) => `<option value="${escapeHtml(code)}">${escapeHtml(code)}</option>`)
    .join("");
  const menu = $("locale-menu");
  menu.innerHTML = nonEn
    .map((code) => {
      const meta = state.localeByCode[code] || { nativeLabel: code };
      return `<li role="option">
        <button type="button" class="locale-option" data-code="${escapeHtml(code)}">
          <span class="locale-flag">${flagMarkup(meta)}</span>
          <span class="locale-option-text">${escapeHtml(localeLabel(meta, code))}</span>
        </button>
      </li>`;
    })
    .join("");
  menu.querySelectorAll(".locale-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.code;
      if (!next || next === state.activeLocale) {
        closeLocaleMenu();
        return;
      }
      // Stash into the locale we were editing, then switch.
      stashLocaleOverlay(state.activeLocale);
      state.activeLocale = next;
      setLocaleTrigger(next);
      fillLocaleFields();
      closeLocaleMenu();
    });
  });
  state.activeLocale = nonEn[0] || "";
  if (state.activeLocale) setLocaleTrigger(state.activeLocale);
}

$("locale-trigger").addEventListener("click", (e) => {
  e.preventDefault();
  const open = !$("locale-menu").classList.contains("hidden");
  if (open) closeLocaleMenu();
  else openLocaleMenu();
});

document.addEventListener("click", (e) => {
  const picker = $("locale-picker");
  if (!picker || picker.contains(e.target)) return;
  closeLocaleMenu();
});

async function loadGames() {
  const data = await api(
    `/api/games?q=${encodeURIComponent(state.q)}&page=${state.page}&limit=40`,
  );
  state.total = data.total;
  const list = $("game-list");
  list.innerHTML = "";
  for (const g of data.games) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "game-item" + (g.id === state.selectedId ? " active" : "");
    btn.innerHTML = `<strong>${escapeHtml(g.name)}</strong><small>${escapeHtml(g.category)} · ${escapeHtml(g.originCountry)}${g.hasTutorial ? " · ▶" : ""}</small>`;
    btn.addEventListener("click", () => openGame(g.id));
    list.appendChild(btn);
  }
  const pages = Math.max(1, Math.ceil(state.total / 40));
  $("page-info").textContent = `${state.total} games · ${state.page}/${pages}`;
  $("prev-page").disabled = state.page <= 1;
  $("next-page").disabled = state.page >= pages;
}

let searchTimer;
$("search").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.q = e.target.value.trim();
    state.page = 1;
    loadGames();
  }, 250);
});
$("prev-page").addEventListener("click", () => {
  if (state.page > 1) {
    state.page -= 1;
    loadGames();
  }
});
$("next-page").addEventListener("click", () => {
  state.page += 1;
  loadGames();
});

function lines(text) {
  return String(text || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function openGame(id) {
  state.selectedId = id;
  const data = await api(`/api/games/${encodeURIComponent(id)}`);
  state.detail = data;
  // Fresh copy from server — never reuse a previously corrupted in-memory pack.
  state.localeOverlays = structuredClone(data.localeOverlays || {});
  state.overlayKind = data.overlayKind || "curated";
  state.archetypeKey = data.archetypeKey || null;
  $("empty-editor").classList.add("hidden");
  $("editor-form").classList.remove("hidden");
  fillEditor(data);
  await loadGames();
}

function fillEditor(data) {
  const g = data.game;
  const t = data.tutorial || {};
  $("editor-title").textContent = g.name;
  $("editor-id").textContent = g.id;
  const form = $("editor-form");
  form.name.value = g.name || "";
  form.slug.value = g.slug || "";
  form.category.value = g.category || "";
  form.originCountry.value = g.originCountry || "";
  form.civilization.value = g.civilization || "";
  form.creationYear.value = g.creationYear || "";
  form.idealParticipants.value = g.idealParticipants || "";
  form.tags.value = (g.tags || []).join(", ");
  form.description.value = g.description || "";
  form.howToPlay.value = (g.howToPlay || []).join("\n");
  form.requirements.value = (g.requirements || []).join("\n");
  form.images.value = (g.images || []).join("\n");
  form.youtubeUrl.value = t.url || t.videoId || "";
  form.youtubeTitle.value = t.title || "";
  form.youtubeChannel.value = t.channelTitle || "";
  form.clearTutorial.checked = false;
  renderPreviews(g.images || []);

  if (state.overlayKind === "archetype") {
    $("overlay-kind").textContent = `Editing archetype pack “${state.archetypeKey}” — changes apply to every regional variant of this idea.`;
  } else {
    $("overlay-kind").textContent =
      "Editing curated locale pack for this catalog entry.";
  }

  // Keep picker + activeLocale aligned; default to first non-en locale.
  if (!state.activeLocale && $("locale-select").options.length) {
    state.activeLocale = $("locale-select").options[0].value;
  }
  if (state.activeLocale) setLocaleTrigger(state.activeLocale);
  fillLocaleFields();
}

function renderPreviews(images) {
  const box = $("image-previews");
  box.innerHTML = images
    .filter((u) => /^https?:\/\//.test(u))
    .slice(0, 8)
    .map((u) => `<img src="${escapeHtml(u)}" alt="" loading="lazy" />`)
    .join("");
}

$("editor-form").images.addEventListener("input", (e) => {
  renderPreviews(lines(e.target.value));
});

function readLocaleFieldsFromForm() {
  return {
    name: $("loc-name").value.trim(),
    description: $("loc-description").value.trim(),
    howToPlay: lines($("loc-howto").value),
    requirements: lines($("loc-req").value),
    idealParticipants: $("loc-participants").value.trim(),
  };
}

function fillLocaleFields() {
  const locale = state.activeLocale || $("locale-select").value;
  const o = state.localeOverlays[locale] || {};
  $("loc-name").value = o.name || "";
  $("loc-description").value = o.description || "";
  $("loc-howto").value = (o.howToPlay || []).join("\n");
  $("loc-req").value = (o.requirements || []).join("\n");
  $("loc-participants").value = o.idealParticipants || "";
}

/** Persist form fields into a specific locale key (must be the locale being left). */
function stashLocaleOverlay(locale) {
  if (!locale) return;
  const fields = readLocaleFieldsFromForm();
  const prev = state.localeOverlays[locale] || {};
  state.localeOverlays[locale] = {
    ...prev,
    ...fields,
    // Preserve win/rules arrays from server if the form doesn't edit them yet.
    howToWin: prev.howToWin || [],
    rulesNotToBreak: prev.rulesNotToBreak || [],
    variationNotes: prev.variationNotes || [],
  };
}

// Locale changes are handled by the custom picker buttons in loadLocales().

$("editor-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.selectedId) return;
  stashLocaleOverlay(state.activeLocale);
  const form = e.target;
  $("save-status").textContent = "Saving…";
  const images = lines(form.images.value);
  const patch = {
    overlayKind: state.overlayKind,
    archetypeKey: state.archetypeKey,
    game: {
      name: form.name.value.trim(),
      slug: form.slug.value.trim(),
      category: form.category.value.trim(),
      originCountry: form.originCountry.value.trim(),
      civilization: form.civilization.value.trim(),
      creationYear: form.creationYear.value.trim(),
      idealParticipants: form.idealParticipants.value.trim(),
      tags: form.tags.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      description: form.description.value.trim(),
      howToPlay: lines(form.howToPlay.value),
      requirements: lines(form.requirements.value),
      images,
    },
    curatedEn:
      state.overlayKind === "curated"
        ? {
            name: form.name.value.trim(),
            description: form.description.value.trim(),
            howToPlay: lines(form.howToPlay.value),
            requirements: lines(form.requirements.value),
            idealParticipants: form.idealParticipants.value.trim(),
          }
        : undefined,
    localeOverlays: state.localeOverlays,
  };
  if (form.clearTutorial.checked) {
    patch.tutorial = null;
  } else if (form.youtubeUrl.value.trim()) {
    patch.tutorial = {
      url: form.youtubeUrl.value.trim(),
      title: form.youtubeTitle.value.trim() || form.name.value.trim(),
      channelTitle: form.youtubeChannel.value.trim() || "Admin",
    };
  }
  try {
    const saved = await api(`/api/games/${encodeURIComponent(state.selectedId)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    state.detail = saved;
    state.localeOverlays = structuredClone(saved.localeOverlays || {});
    state.overlayKind = saved.overlayKind || state.overlayKind;
    state.archetypeKey = saved.archetypeKey || state.archetypeKey;
    fillEditor(saved);
    $("save-status").textContent = "Saved";
    toast("Game saved");
    await loadGames();
  } catch (err) {
    $("save-status").textContent = "";
    toast(err.message, true);
  }
});

$("btn-publish").addEventListener("click", async () => {
  if (!confirm("Rebuild all locale packs and deploy Ludus Atlas to GitHub Pages?"))
    return;
  $("btn-publish").disabled = true;
  $("publish-modal").classList.remove("hidden");
  $("publish-log").textContent = "Publishing…";
  try {
    const result = await api("/api/publish", {
      method: "POST",
      body: JSON.stringify({ deploy: true }),
    });
    $("publish-log").textContent = (result.logs || [])
      .concat(result.url ? [`Live: ${result.url}`] : [])
      .concat(result.error ? [`ERROR: ${result.error}`] : [])
      .join("\n");
    toast(result.ok ? "Publish complete" : "Publish finished with errors", !result.ok);
  } catch (err) {
    $("publish-log").textContent = err.message;
    toast(err.message, true);
  } finally {
    $("btn-publish").disabled = false;
  }
});

$("close-publish").addEventListener("click", () => {
  $("publish-modal").classList.add("hidden");
});

boot();
