/* Live in-browser Python IDE for weekly labs (Pyodide). */
(function () {
  const STORAGE_KEY = "six-hours-lab-code-v1";
  const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";

  let pyodidePromise = null;
  let pyodideReady = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
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

  function mountIde(root, weekN) {
    if (!root || root.dataset.mounted === "1") return;
    root.dataset.mounted = "1";
    const code = codeFor(weekN);
    root.innerHTML = `
      <div class="lab-ide-head">
        <div>
          <h4>Live lab IDE</h4>
          <p class="lab-ide-hint">Python in the browser. Edit, Run, see stdout. Code autosaves for this week.</p>
        </div>
        <div class="lab-ide-actions">
          <button type="button" class="lab-ide-run">Run</button>
          <button type="button" class="lab-ide-reset" title="Restore starter template">Reset</button>
        </div>
      </div>
      <label class="sr-only" for="lab-code-${weekN}">Lab code week ${weekN}</label>
      <textarea id="lab-code-${weekN}" class="lab-ide-code" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off">${escapeForTextarea(code)}</textarea>
      <pre class="lab-ide-out" aria-live="polite">Output appears here after you tap Run.</pre>
    `;

    const ta = root.querySelector(".lab-ide-code");
    const out = root.querySelector(".lab-ide-out");
    const runBtn = root.querySelector(".lab-ide-run");
    const resetBtn = root.querySelector(".lab-ide-reset");

    let saveTimer = null;
    ta.addEventListener("input", () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveCode(weekN, ta.value), 250);
    });

    resetBtn.addEventListener("click", () => {
      if (!confirm("Reset week " + weekN + " code to the starter template?")) return;
      ta.value = starterFor(weekN);
      saveCode(weekN, ta.value);
      out.textContent = "Starter restored. Tap Run when ready.";
      out.classList.remove("is-error", "is-ok");
    });

    runBtn.addEventListener("click", async () => {
      saveCode(weekN, ta.value);
      runBtn.disabled = true;
      out.classList.remove("is-error", "is-ok");
      out.textContent = "Starting…";
      try {
        const py = await ensurePyodide(out);
        out.textContent = "Running…";
        // Capture stdout/stderr into a buffer
        await py.runPythonAsync(`
import sys
from io import StringIO
_buf = StringIO()
sys.stdout = _buf
sys.stderr = _buf
`);
        try {
          await py.runPythonAsync(ta.value);
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

  function escapeForTextarea(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /** Call after a week detail is rendered into the DOM. */
  function bindLabIde(container) {
    const root = (container || document).querySelector("[data-lab-ide]");
    if (!root) return;
    const weekN = Number(root.getAttribute("data-lab-ide"));
    if (!weekN) return;
    mountIde(root, weekN);
  }

  window.SixHoursLabIde = { bindLabIde, ensurePyodide, starterFor };
})();
