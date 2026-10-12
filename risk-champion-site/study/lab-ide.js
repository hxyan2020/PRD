/* Live in-browser Python IDE for weekly labs (Pyodide + CodeMirror). */
(function () {
  const STORAGE_KEY = "six-hours-lab-code-v1";
  const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
  const CM_BASE = "https://cdn.jsdelivr.net/npm/codemirror@5.65.18";

  let pyodidePromise = null;
  let pyodideReady = null;
  let cmPromise = null;
  let activeFullscreen = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "1") resolve();
        else existing.addEventListener("load", () => resolve(), { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => {
        s.dataset.loaded = "1";
        resolve();
      };
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  }

  function loadStylesheet(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function ensureCodeMirror() {
    if (window.CodeMirror && window.CodeMirror.modes && window.CodeMirror.modes.python) {
      return Promise.resolve(window.CodeMirror);
    }
    if (!cmPromise) {
      cmPromise = (async () => {
        loadStylesheet(`${CM_BASE}/lib/codemirror.min.css`);
        await loadScript(`${CM_BASE}/lib/codemirror.min.js`);
        await loadScript(`${CM_BASE}/mode/python/python.min.js`);
        await loadScript(`${CM_BASE}/addon/edit/matchbrackets.min.js`);
        await loadScript(`${CM_BASE}/addon/edit/closebrackets.min.js`);
        return window.CodeMirror;
      })();
    }
    return cmPromise;
  }

  async function ensurePyodide(statusEl) {
    if (pyodideReady) return pyodideReady;
    if (!pyodidePromise) {
      pyodidePromise = (async () => {
        if (statusEl) statusEl.textContent = "Loading Python runtime (first run only)…";
        await loadScript(PYODIDE_URL);
        const pyodide = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
        });
        if (statusEl) statusEl.textContent = "Loading numpy (optional packages)…";
        try {
          await pyodide.loadPackage("numpy");
        } catch (_) {
          /* numpy optional */
        }
        if (statusEl) statusEl.textContent = "Ready.";
        return pyodide;
      })();
    }
    pyodideReady = await pyodidePromise;
    return pyodideReady;
  }

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function writeStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function starterFor(weekN) {
    const map = window.SixHoursLabStarters || {};
    return map[weekN] || `# Week ${weekN} lab\nprint("Edit this starter, then Run.")\n`;
  }

  function codeFor(weekN) {
    const store = readStore();
    if (typeof store[weekN] === "string" && store[weekN].length) return store[weekN];
    return starterFor(weekN);
  }

  function saveCode(weekN, code) {
    const store = readStore();
    store[weekN] = code;
    writeStore(store);
  }

  function escapeForTextarea(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function setFullscreen(root, on) {
    const fsBtn = root.querySelector(".lab-ide-fs");
    if (on) {
      if (activeFullscreen && activeFullscreen !== root) setFullscreen(activeFullscreen, false);
      root.classList.add("is-fullscreen");
      document.body.classList.add("lab-ide-fs-open");
      activeFullscreen = root;
      if (fsBtn) {
        fsBtn.textContent = "Exit full screen";
        fsBtn.setAttribute("aria-pressed", "true");
      }
      const cm = root._cm;
      if (cm) {
        requestAnimationFrame(() => {
          cm.refresh();
          cm.focus();
        });
      }
    } else {
      root.classList.remove("is-fullscreen");
      if (activeFullscreen === root) activeFullscreen = null;
      if (!document.querySelector(".lab-ide.is-fullscreen")) {
        document.body.classList.remove("lab-ide-fs-open");
      }
      if (fsBtn) {
        fsBtn.textContent = "Full screen";
        fsBtn.setAttribute("aria-pressed", "false");
      }
      const cm = root._cm;
      if (cm) requestAnimationFrame(() => cm.refresh());
    }
  }

  if (!window.__sixHoursLabIdeFsBound) {
    window.__sixHoursLabIdeFsBound = true;
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && activeFullscreen) {
        setFullscreen(activeFullscreen, false);
      }
    });
  }

  async function mountIde(root, weekN) {
    if (!root || root.dataset.mounted === "1") return;
    root.dataset.mounted = "1";
    const code = codeFor(weekN);
    root.id = root.id || `lab-ide-week-${weekN}`;
    root.innerHTML = `
      <p class="lab-ide-kicker">Live IDE · Week ${weekN}</p>
      <div class="lab-ide-head">
        <div>
          <h4>Run the lab here</h4>
          <p class="lab-ide-hint">In-browser Python (Pyodide) with syntax colour. Edit, tap <strong>Run</strong>, read stdout below. Autosaves on this device.</p>
        </div>
        <div class="lab-ide-actions">
          <button type="button" class="lab-ide-run">Run code</button>
          <button type="button" class="lab-ide-fs" aria-pressed="false" title="Expand the IDE">Full screen</button>
          <button type="button" class="lab-ide-reset" title="Restore starter template">Reset</button>
        </div>
      </div>
      <label class="sr-only" for="lab-code-${weekN}">Lab code week ${weekN}</label>
      <textarea id="lab-code-${weekN}" class="lab-ide-code" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off">${escapeForTextarea(code)}</textarea>
      <p class="lab-ide-out-label">Results</p>
      <pre class="lab-ide-out" aria-live="polite">Tap <strong>Run code</strong> — first run downloads the Python runtime (once), then prints output here.</pre>
    `;

    const ta = root.querySelector(".lab-ide-code");
    const out = root.querySelector(".lab-ide-out");
    const runBtn = root.querySelector(".lab-ide-run");
    const resetBtn = root.querySelector(".lab-ide-reset");
    const fsBtn = root.querySelector(".lab-ide-fs");

    let editor = null;
    let saveTimer = null;

    function getCode() {
      return editor ? editor.getValue() : ta.value;
    }

    function setCode(value) {
      if (editor) editor.setValue(value);
      else ta.value = value;
    }

    function scheduleSave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveCode(weekN, getCode()), 250);
    }

    ta.addEventListener("input", scheduleSave);

    try {
      const CodeMirror = await ensureCodeMirror();
      editor = CodeMirror.fromTextArea(ta, {
        mode: "python",
        theme: "lab-forest",
        lineNumbers: true,
        lineWrapping: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        matchBrackets: true,
        autoCloseBrackets: true,
        viewportMargin: Infinity,
      });
      root._cm = editor;
      editor.setSize("100%", "auto");
      editor.on("change", scheduleSave);
      requestAnimationFrame(() => editor.refresh());
    } catch (err) {
      console.warn("CodeMirror unavailable; plain editor kept.", err);
    }

    fsBtn.addEventListener("click", () => {
      setFullscreen(root, !root.classList.contains("is-fullscreen"));
    });

    resetBtn.addEventListener("click", () => {
      if (!confirm("Reset week " + weekN + " code to the starter template?")) return;
      setCode(starterFor(weekN));
      saveCode(weekN, getCode());
      out.textContent = "Starter restored. Tap Run when ready.";
      out.classList.remove("is-error", "is-ok");
    });

    runBtn.addEventListener("click", async () => {
      const source = getCode();
      saveCode(weekN, source);
      runBtn.disabled = true;
      out.classList.remove("is-error", "is-ok");
      out.textContent = "Starting…";
      try {
        const py = await ensurePyodide(out);
        out.textContent = "Running…";
        await py.runPythonAsync(`
import sys
from io import StringIO
_buf = StringIO()
sys.stdout = _buf
sys.stderr = _buf
`);
        try {
          await py.runPythonAsync(source);
          const text = await py.runPythonAsync("_buf.getvalue()");
          out.textContent = text && String(text).length ? String(text) : "(ran with no printed output)";
          out.classList.add("is-ok");
        } catch (err) {
          let captured = "";
          try {
            captured = String(await py.runPythonAsync("_buf.getvalue()"));
          } catch (_) {}
          const msg = (err && err.message) || String(err);
          out.textContent = (captured ? captured + "\n" : "") + msg;
          out.classList.add("is-error");
        } finally {
          await py.runPythonAsync(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);
        }
      } catch (err) {
        out.textContent = "Could not start the Python runtime.\n" + ((err && err.message) || err);
        out.classList.add("is-error");
      } finally {
        runBtn.disabled = false;
      }
    });
  }

  /** Call after a week detail is rendered into the DOM. */
  function bindLabIde(container) {
    const roots = (container || document).querySelectorAll("[data-lab-ide]");
    roots.forEach((root) => {
      const weekN = Number(root.getAttribute("data-lab-ide"));
      if (!weekN) return;
      mountIde(root, weekN);
    });
  }

  window.SixHoursLabIde = { bindLabIde, ensurePyodide, starterFor };
})();
