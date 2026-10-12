(() => {
  const toolbar = document.createElement("div");
  toolbar.id = "sel-toolbar";
  toolbar.className = "sel-toolbar";
  toolbar.hidden = true;
  toolbar.innerHTML = `
    <button type="button" class="sel-btn sel-ai-btn" data-sel-action="ai" aria-label="Ask AI about this selection">
      <span>AI</span>
    </button>
    <button type="button" class="sel-btn sel-note-btn" data-sel-action="note" aria-label="Save selection to notebook">
      <span>Note</span>
    </button>
  `;
  document.body.appendChild(toolbar);

  let pendingSelection = "";
  let pendingNode = null;
  let pendingRect = null;
  let hideTimer = 0;
  let placeTimer = 0;

  function hideToolbar() {
    toolbar.hidden = true;
  }

  function placeToolbar(rect) {
    const width = 120;
    const height = 48;
    const margin = 8;
    const tabbar = 76;
    let left = rect.left + rect.width / 2 - width / 2;
    let top = rect.top - height - margin;
    if (top < margin + 8) top = rect.bottom + margin;
    if (top + height > window.innerHeight - tabbar) {
      top = Math.max(margin, rect.top - height - margin);
    }
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
    toolbar.hidden = false;
  }

  function readSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return null;
    const text = selection.toString().replace(/\s+/g, " ").trim();
    if (text.length < 3 || text.length > 4000) return null;
    const anchor = selection.anchorNode;
    if (!anchor) return null;
    const node = anchor.nodeType === Node.ELEMENT_NODE ? anchor : anchor.parentElement;
    if (!node) return null;
    if (node.closest("#sel-toolbar") || node.closest(".tabbar")) return null;
    if (node.closest("textarea, input, button, label, .tutor-compose, .tutor-settings, .tutor-head")) {
      return null;
    }
    // Allow courseware pages and tutor message bodies/quotes — not the compose box.
    const allowed =
      node.closest("main, .top, .dock, .note, .card, .path-card, .source") ||
      node.closest("#tutor-quote") ||
      node.closest(".tutor-msg-body");
    if (!allowed) return null;
    let range;
    try {
      range = selection.getRangeAt(0);
    } catch (_) {
      return null;
    }
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;
    return { text, rect, node };
  }

  function refreshToolbar() {
    const found = readSelection();
    if (!found) {
      // Mobile browsers often clear the native selection quickly. Keep the last
      // good text and show the bar from the last rectangle so Note/AI stay tappable.
      if (pendingSelection && pendingRect) {
        placeToolbar(pendingRect);
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hideToolbar, 2200);
      } else if (!pendingSelection) {
        hideToolbar();
      }
      return;
    }
    pendingSelection = found.text;
    pendingNode = found.node;
    pendingRect = found.rect;
    placeToolbar(found.rect);
  }

  function toast(message) {
    const el = document.querySelector("#toast");
    if (!el) return;
    el.hidden = false;
    el.textContent = message;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      el.hidden = true;
    }, 2800);
  }

  document.addEventListener("selectionchange", () => {
    const found = readSelection();
    if (found) {
      pendingSelection = found.text;
      pendingNode = found.node;
      pendingRect = found.rect;
    }
    clearTimeout(placeTimer);
    placeTimer = setTimeout(refreshToolbar, 80);
  });

  document.addEventListener(
    "touchend",
    () => {
      const found = readSelection();
      if (found) {
        pendingSelection = found.text;
        pendingNode = found.node;
        pendingRect = found.rect;
      }
      clearTimeout(placeTimer);
      placeTimer = setTimeout(refreshToolbar, 200);
    },
    { passive: true }
  );

  document.addEventListener(
    "scroll",
    () => {
      if (toolbar.hidden && !pendingSelection) return;
      const found = readSelection();
      if (!found) {
        if (pendingSelection && pendingRect) placeToolbar(pendingRect);
        return;
      }
      pendingSelection = found.text;
      pendingNode = found.node;
      pendingRect = found.rect;
      placeToolbar(found.rect);
    },
    { passive: true, capture: true }
  );

  toolbar.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  toolbar.addEventListener("click", (event) => {
    const action = event.target.closest("[data-sel-action]")?.dataset.selAction;
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    const found = readSelection();
    const text = (found?.text || pendingSelection || "").trim();
    const node = found?.node || pendingNode;
    if (!text) return;

    if (action === "ai") {
      window.SixHoursTutor?.openSheet(text);
      hideToolbar();
      return;
    }

    if (action === "note") {
      try {
        const sourceMeta = window.SixHoursNotebook?.detectSource(node) || {};
        const note = window.SixHoursNotebook.addNote(text, sourceMeta);
        pendingSelection = "";
        pendingNode = null;
        pendingRect = null;
        hideToolbar();
        toast(`Saved to notebook · ${note.caption}`);
        if (window.SixHours?.getView?.() === "notebook") {
          window.SixHours.refresh?.();
        }
      } catch (error) {
        toast(error.message || "Could not save note.");
      }
    }
  });

  window.SixHoursSelection = {
    readSelection,
    hideToolbar,
    getPending: () => pendingSelection,
  };
})();
