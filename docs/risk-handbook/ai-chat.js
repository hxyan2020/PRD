/* V-Exchange handbook AI: select text → sparkle → explain + follow-up chat. */
(function () {
  "use strict";

  var INDEX_URL = "./ai-index.json";
  var MODE_KEY = "risk-handbook-ai-mode";
  var EP_KEY = "risk-handbook-ai-endpoint";
  var KEY_KEY = "risk-handbook-ai-key";
  var DEFAULT_EP = "https://text.pollinations.ai/openai";
  var index = null;
  var messages = [];
  var lastSelection = "";
  var lastLang = "en";
  var busy = false;
  var selectTimer = null;

  var css = [
    "#rh-ai-root{z-index:10000;font-family:ui-sans-serif,system-ui,'Noto Sans SC',sans-serif}",
    "#rh-ai-spark{position:absolute;display:none;height:36px;padding:0 10px;gap:4px;border-radius:999px;border:1px solid #8f9d90;background:#dce4db;color:#3a433d;box-shadow:0 6px 18px rgba(28,25,22,.16);cursor:pointer;align-items:center;justify-content:center;z-index:90;font-size:12px;font-weight:750;letter-spacing:.02em;-webkit-tap-highlight-color:transparent}",
    "#rh-ai-spark svg{width:16px;height:16px;display:block}",
    "#rh-ai-spark:hover{background:#cfd9ce}",
    "#rh-ai-selbar{position:fixed;top:max(8px,env(safe-area-inset-top,0px));left:10px;right:10px;z-index:2147483000;display:none;align-items:center;gap:8px;min-height:48px;padding:10px 12px;border-radius:12px;background:#3f5348;color:#f6f3ee;box-shadow:0 10px 28px rgba(28,25,22,.28);font-size:15px;font-weight:700;line-height:1.25;cursor:pointer;-webkit-tap-highlight-color:transparent}",
    "#rh-ai-selbar.open{display:flex}",
    "#rh-ai-selbar svg{width:20px;height:20px;flex:none}",
    "#rh-ai-selbar-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "#rh-ai-selbar-go{flex:none;background:#dce4db;color:#1c1916;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:800}",
    "#rh-ai-fab{position:fixed;right:14px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:120;width:52px;height:52px;border-radius:999px;border:1px solid #8f9d90;background:#3f5348;color:#f6f3ee;cursor:pointer;box-shadow:0 10px 24px rgba(28,25,22,.18);display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent}",
    "#rh-ai-fab svg{width:22px;height:22px}",
    "#rh-ai-fab:hover{background:#2f4038}",
    "#rh-ai-panel{position:fixed;right:16px;bottom:76px;width:min(420px,calc(100vw - 24px));height:min(640px,calc(100vh - 100px));background:#fffcf7;border:1px solid #d8d0c4;border-radius:14px;box-shadow:0 18px 48px rgba(28,25,22,.18);display:none;flex-direction:column;overflow:hidden;z-index:2147483001}",
    "@media (max-width:800px),(pointer:coarse){#rh-ai-spark{display:none !important}#rh-ai-fab{bottom:calc(80px + env(safe-area-inset-bottom,0px));width:56px;height:56px}#rh-ai-panel{left:0;right:0;bottom:0;width:100%;height:min(88vh,720px);max-height:calc(100vh - 12px);border-radius:16px 16px 0 0}}",
    "#rh-ai-panel.open{display:flex}",
    "#rh-ai-panel header{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #d8d0c4;background:#f3efe6}",
    "#rh-ai-panel header strong{font-size:.92rem;flex:1}",
    "#rh-ai-panel header button{appearance:none;border:1px solid #d8d0c4;background:#fff;border-radius:7px;padding:4px 8px;cursor:pointer;font-size:.75rem;color:#3a433d}",
    "#rh-ai-quote{margin:0;padding:8px 12px;font-size:.8rem;color:#5b564e;background:#eef0eb;border-bottom:1px solid #d8d0c4;max-height:4.8em;overflow:auto}",
    "#rh-ai-quote:empty{display:none}",
    "#rh-ai-msgs{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:10px;background:#fffcf7}",
    ".rh-ai-msg{max-width:94%;padding:8px 10px;border-radius:10px;font-size:.86rem;line-height:1.45;white-space:pre-wrap}",
    ".rh-ai-msg.user{align-self:flex-end;background:#dce4db;color:#1c1916}",
    ".rh-ai-msg.bot{align-self:flex-start;background:#fff;border:1px solid #e4ddd2;color:#1c1916}",
    ".rh-ai-msg.bot a{color:#3f5348}",
    ".rh-ai-msg.err{border-color:#b08f88;background:#f6eeeb}",
    "#rh-ai-form{display:flex;gap:8px;padding:10px;border-top:1px solid #d8d0c4;background:#f6f3ee}",
    "#rh-ai-form textarea{flex:1;min-height:44px;max-height:96px;resize:vertical;border:1px solid #d8d0c4;border-radius:8px;padding:8px;font:inherit;font-size:.86rem;background:#fff}",
    "#rh-ai-form button{appearance:none;border:0;background:#3f5348;color:#fff;border-radius:8px;padding:0 12px;font-weight:650;cursor:pointer}",
    "#rh-ai-form button:disabled{opacity:.45;cursor:not-allowed}",
    "#rh-ai-settings{display:none;padding:8px 12px 10px;border-top:1px solid #d8d0c4;background:#f3efe6;font-size:.78rem;color:#5b564e}",
    "#rh-ai-settings.open{display:block}",
    "#rh-ai-settings label{display:block;margin:6px 0 3px}",
    "#rh-ai-settings input,#rh-ai-settings select{width:100%;padding:6px 8px;border:1px solid #d8d0c4;border-radius:6px;background:#fff}",
    "#rh-ai-hint{padding:2px 12px 8px;font-size:.72rem;color:#5b564e}"
  ].join("");

  var sparkSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3.5l1.1 3.4L16.5 8l-3.4 1.1L12 12.5l-1.1-3.4L7.5 8l3.4-1.1L12 3.5z"/><path d="M18.5 13.5l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6.6-1.8z"/><path d="M5.2 14.2c2.4 1.1 3.7 3.2 4.2 5.8"/></svg>';

  function currentLang() {
    var zh = document.getElementById("panel-zh");
    if (zh && !zh.hidden && zh.classList.contains("active")) return "zh";
    var tab = document.getElementById("tab-zh");
    if (tab && tab.getAttribute("aria-selected") === "true") return "zh";
    if ((location.hash || "").indexOf("zh") === 0) return "zh";
    return "en";
  }

  function t(en, zh) {
    return currentLang() === "zh" ? zh : en;
  }

  function inject() {
    if (document.getElementById("rh-ai-root")) return;
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    var root = document.createElement("div");
    root.id = "rh-ai-root";
    root.innerHTML =
      '<button type="button" id="rh-ai-spark" title="Ask AI / 问 AI" aria-label="Ask AI about selection">' + sparkSvg + "<span>AI</span></button>" +
      '<button type="button" id="rh-ai-selbar" aria-label="Ask AI about selected text">' + sparkSvg + '<span id="rh-ai-selbar-text">Ask AI</span><span id="rh-ai-selbar-go">Ask AI</span></button>' +
      '<button type="button" id="rh-ai-fab" title="Risk handbook AI" aria-label="Open handbook AI">' + sparkSvg + "</button>" +
      '<aside id="rh-ai-panel" aria-label="Handbook AI chat">' +
        "<header>" +
          "<strong>Handbook AI · 手册助手</strong>" +
          '<button type="button" id="rh-ai-gear">Settings</button>' +
          '<button type="button" id="rh-ai-clear">Clear</button>' +
          '<button type="button" id="rh-ai-close">Close</button>' +
        "</header>" +
        '<p id="rh-ai-quote"></p>' +
        '<div id="rh-ai-msgs"></div>' +
        '<p id="rh-ai-hint"></p>' +
        '<form id="rh-ai-form">' +
          '<textarea id="rh-ai-input" rows="2" placeholder="Ask a follow-up… / 继续追问…"></textarea>' +
          '<button type="submit" id="rh-ai-send">Send</button>' +
        "</form>" +
        '<div id="rh-ai-settings">' +
          "<label>Answer mode</label>" +
          '<select id="rh-ai-mode">' +
            '<option value="ai">AI + handbook retrieval</option>' +
            '<option value="local">Handbook only (offline)</option>' +
          "</select>" +
          "<label>Optional OpenAI-compatible endpoint</label>" +
          '<input id="rh-ai-ep" placeholder="' + DEFAULT_EP + '" />' +
          "<label>Optional API key (stored only in this browser)</label>" +
          '<input id="rh-ai-key" type="password" autocomplete="off" placeholder="leave blank for default AI" />' +
          "<p>Selected text and questions are sent to the AI provider unless you choose handbook-only. If the online model does not answer within a few seconds, the bot uses this handbook and the Cursor Phase 1 decisions instead.</p>" +
        "</div>" +
      "</aside>";
    document.body.appendChild(root);
    loadSettings();
    bind();
    loadIndex();
  }

  function loadSettings() {
    var mode = "ai";
    var ep = "";
    var key = "";
    try {
      mode = localStorage.getItem(MODE_KEY) || "ai";
      ep = localStorage.getItem(EP_KEY) || "";
      key = localStorage.getItem(KEY_KEY) || "";
    } catch (e) {}
    document.getElementById("rh-ai-mode").value = mode === "local" ? "local" : "ai";
    document.getElementById("rh-ai-ep").value = ep;
    document.getElementById("rh-ai-key").value = key;
  }

  function saveSettings() {
    try {
      localStorage.setItem(MODE_KEY, document.getElementById("rh-ai-mode").value);
      localStorage.setItem(EP_KEY, document.getElementById("rh-ai-ep").value.trim());
      localStorage.setItem(KEY_KEY, document.getElementById("rh-ai-key").value);
    } catch (e) {}
  }

  function loadIndex() {
    fetch(INDEX_URL, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("index " + r.status); return r.json(); })
      .then(function (data) {
        index = data;
        document.getElementById("rh-ai-hint").textContent = t(
          "On a phone: select text, then tap the green Ask AI bar at the top. Or tap the round AI button.",
          "手机：选中文字后点顶部绿色「问 AI」条，或点右下角圆形按钮。"
        );
      })
      .catch(function () {
        index = { chunks: [], briefing_en: "", briefing_zh: "" };
        document.getElementById("rh-ai-hint").textContent = t(
          "Knowledge index missing — AI will still try, with less grounding.",
          "知识索引未加载，回答可能不够贴手册。"
        );
      });
  }

  function isCoarsePointer() {
    try {
      return window.matchMedia && (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 800px)").matches);
    } catch (e) {
      return "ontouchstart" in window;
    }
  }

  function hideSelectionChrome() {
    var spark = document.getElementById("rh-ai-spark");
    var bar = document.getElementById("rh-ai-selbar");
    if (spark) spark.style.display = "none";
    if (bar) bar.classList.remove("open");
  }

  function placeSelectionChrome(text) {
    if (!text) {
      hideSelectionChrome();
      return;
    }
    var panel = document.getElementById("rh-ai-panel");
    if (panel && panel.classList.contains("open")) {
      hideSelectionChrome();
      return;
    }
    lastSelection = text;
    lastLang = currentLang();
    var bar = document.getElementById("rh-ai-selbar");
    var label = document.getElementById("rh-ai-selbar-text");
    var go = document.getElementById("rh-ai-selbar-go");
    var shown = text.length > 48 ? text.slice(0, 46) + "…" : text;
    if (label) label.textContent = t("Ask AI: ", "问 AI：") + shown;
    if (go) go.textContent = t("Ask AI", "问 AI");
    if (bar) bar.classList.add("open");
    var spark = document.getElementById("rh-ai-spark");
    if (!spark || isCoarsePointer()) return;
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    var rect = sel.getRangeAt(0).getBoundingClientRect();
    var top = rect.bottom + 8;
    if (top + 40 > window.innerHeight) top = Math.max(8, rect.top - 44);
    spark.style.display = "flex";
    spark.style.position = "fixed";
    spark.style.left = Math.min(window.innerWidth - 56, Math.max(8, rect.right + 6)) + "px";
    spark.style.top = Math.max(8, top) + "px";
  }

  function syncSelection() {
    var text = readSelection();
    if (!text) hideSelectionChrome();
    else placeSelectionChrome(text);
  }

  function bind() {
    var spark = document.getElementById("rh-ai-spark");
    var bar = document.getElementById("rh-ai-selbar");
    document.addEventListener("selectionchange", function () {
      clearTimeout(selectTimer);
      selectTimer = setTimeout(syncSelection, 220);
    });
    document.addEventListener("mouseup", function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest("#rh-ai-root")) return;
      clearTimeout(selectTimer);
      selectTimer = setTimeout(syncSelection, 80);
    });
    document.addEventListener("touchend", function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest("#rh-ai-root")) return;
      clearTimeout(selectTimer);
      selectTimer = setTimeout(syncSelection, 320);
    }, { passive: true });
    function askFromSelection(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var sel = lastSelection || readSelection();
      if (sel) openExplain(sel);
    }
    spark.addEventListener("pointerdown", function (ev) { ev.preventDefault(); ev.stopPropagation(); });
    spark.addEventListener("click", askFromSelection);
    bar.addEventListener("pointerdown", function (ev) { ev.preventDefault(); ev.stopPropagation(); });
    bar.addEventListener("click", askFromSelection);
    document.getElementById("rh-ai-fab").addEventListener("click", function () {
      hideSelectionChrome();
      openPanel(false);
    });
    document.getElementById("rh-ai-close").addEventListener("click", function () {
      document.getElementById("rh-ai-panel").classList.remove("open");
    });
    document.getElementById("rh-ai-clear").addEventListener("click", function () {
      busy = false;
      messages = [];
      lastSelection = "";
      document.getElementById("rh-ai-quote").textContent = "";
      document.getElementById("rh-ai-msgs").innerHTML = "";
      document.getElementById("rh-ai-send").disabled = false;
      greet();
    });
    document.getElementById("rh-ai-gear").addEventListener("click", function () {
      document.getElementById("rh-ai-settings").classList.toggle("open");
    });
    ["rh-ai-mode", "rh-ai-ep", "rh-ai-key"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", saveSettings);
    });
    document.getElementById("rh-ai-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var box = document.getElementById("rh-ai-input");
      var q = (box.value || "").trim();
      if (!q || busy) return;
      box.value = "";
      ask(q, false);
    });
    document.getElementById("rh-ai-input").addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        document.getElementById("rh-ai-form").dispatchEvent(new Event("submit", { cancelable: true }));
      }
    });
  }

  function readSelection() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) return "";
    var text = String(sel.toString() || "").replace(/\s+/g, " ").trim();
    if (text.length < 2 || text.length > 800) return "";
    var node = sel.anchorNode && sel.anchorNode.parentElement;
    if (!node) return "";
    if (node.closest("#rh-ai-root") || node.closest("textarea") || node.closest("input") || node.closest("button")) return "";
    return text;
  }

  function openPanel(fromSelection) {
    var panel = document.getElementById("rh-ai-panel");
    panel.classList.add("open");
    hideSelectionChrome();
    if (!messages.length) greet();
    if (!fromSelection) {
      var input = document.getElementById("rh-ai-input");
      if (input && !isCoarsePointer()) input.focus();
    }
  }

  function greet() {
    if (messages.length) return;
    addBot(t(
      "I am the V-Exchange risk handbook assistant. Highlight any term, SOP, or KRI and tap the sparkle, or type a question. I use this handbook, crypto-exchange risk practice, and the Cursor design decisions (Phase 1 = green perps / Perp Account / matching-risk-clearing; 2C via broker).",
      "我是 V-Exchange 风险手册助手。选中任何术语、SOP 或 KRI，点闪光图标即可讲解，也可直接提问。我依据本手册、加密交易所风控常识，以及 Cursor 里定下的范围（Phase 1 绿色 = 永续 / 永续账户 / 撮合·风控·清结算；2C 经经纪商）。"
    ));
  }

  function openExplain(text) {
    lastSelection = text;
    lastLang = currentLang();
    document.getElementById("rh-ai-quote").textContent = t("Selected: ", "选中：") + text;
    openPanel(true);
    var prompt = lastLang === "zh"
      ? "请用浅白中文解释手册里这段文字，并说明它在 Phase 1（V-Exchange 绿色范围）里意味着什么。若涉及 SOP/KRI，指出该怎么用。\n\n「" + text + "」"
      : "Explain this handbook passage in plain English for a BU PIC with little trading background. Say what it means for Phase 1 (V-Exchange green scope). If it is an SOP or KRI, say how to use it.\n\n\"" + text + "\"";
    ask(prompt, true, text);
  }

  function addUser(text) {
    messages.push({ role: "user", content: text });
    var div = document.createElement("div");
    div.className = "rh-ai-msg user";
    div.textContent = text;
    document.getElementById("rh-ai-msgs").appendChild(div);
    scrollMsgs();
  }

  function addBot(text, isErr) {
    messages.push({ role: "assistant", content: text });
    var div = document.createElement("div");
    div.className = "rh-ai-msg bot" + (isErr ? " err" : "");
    div.textContent = text;
    document.getElementById("rh-ai-msgs").appendChild(div);
    scrollMsgs();
  }

  function scrollMsgs() {
    var box = document.getElementById("rh-ai-msgs");
    box.scrollTop = box.scrollHeight;
  }

  function tokenize(s) {
    s = String(s || "").toLowerCase();
    var codes = s.match(/[a-z]{1,4}-?[a-z]?\d{1,2}|s\d{1,2}|§\s*\d+(?:\.\d+[a-z]?)?/gi) || [];
    var words = s.split(/[^\u4e00-\u9fff\w]+/).filter(function (w) { return w.length > 1; });
    var cjk = s.match(/[\u4e00-\u9fff]{2,8}/g) || [];
    return codes.concat(words).concat(cjk);
  }

  function retrieve(query, lang, k) {
    var chunks = (index && index.chunks) || [];
    var phrase = String(query || lastSelection || "").replace(/\s+/g, " ").trim();
    var phraseL = phrase.toLowerCase();
    var stop = {
      explain: 1, this: 1, handbook: 1, passage: 1, plain: 1, english: 1, little: 1,
      trading: 1, background: 1, what: 1, means: 1, for: 1, if: 1, how: 1, use: 1,
      the: 1, and: 1, with: 1, that: 1, you: 1, are: 1, about: 1, selected: 1,
      keep: 1, chatting: 1, does: 1, not: 1, from: 1, into: 1, only: 1
    };
    var tokens = tokenize(phraseL).filter(function (tok) { return tok.length > 1 && !stop[tok]; });
    var scored = [];
    for (var i = 0; i < chunks.length; i++) {
      var c = chunks[i];
      if (lang && c.lang && c.lang !== lang && c.lang !== "both") continue;
      var title = String(c.title || "");
      var titleL = title.toLowerCase();
      var hay = (title + "\n" + (c.text || "")).toLowerCase();
      var score = 0;
      if (phraseL.length >= 2) {
        if (titleL === phraseL) score += 80;
        else if (titleL.indexOf(phraseL) !== -1) score += 45;
        if (hay.indexOf(phraseL) !== -1) score += 30;
      }
      for (var j = 0; j < tokens.length; j++) {
        var tok = tokens[j];
        if (!tok) continue;
        if (hay.indexOf(tok) !== -1) score += tok.length > 4 ? 3 : 1;
        if (titleL.indexOf(tok) !== -1) score += 8;
      }
      if (c.kind === "glossary") score += 6;
      if (c.kind === "briefing") score += 4;
      if (score > 0) scored.push({ score: score, chunk: c });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    var out = [];
    var seen = {};
    for (var n = 0; n < scored.length && out.length < (k || 8); n++) {
      var id = scored[n].chunk.id || scored[n].chunk.title;
      if (seen[id]) continue;
      seen[id] = 1;
      out.push(scored[n].chunk);
    }
    if (!out.length) {
      for (var b = 0; b < chunks.length && out.length < 3; b++) {
        if (chunks[b].kind === "briefing" && (!lang || chunks[b].lang === lang || chunks[b].lang === "both")) out.push(chunks[b]);
      }
    }
    return out;
  }

  function stripMd(s) {
    return String(s || "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "").replace(/\s+/g, " ").trim();
  }

  function splitUnits(text) {
    return String(text || "")
      .replace(/([.!?。！？])\s+/g, "$1\n")
      .split(/\n+/)
      .map(function (u) { return stripMd(u); })
      .filter(function (u) { return u.length > 18; });
  }

  function extractHits(chunks, phrase, query) {
    var phraseL = String(phrase || query || "").replace(/\s+/g, " ").trim().toLowerCase();
    var qTokens = tokenize(query || phrase).filter(function (t) { return t.length > 1; });
    var hits = [];
    chunks.forEach(function (c) {
      var units = splitUnits((c.title ? c.title + ". " : "") + (c.text || ""));
      units.forEach(function (u) {
        var ul = u.toLowerCase();
        var score = 0;
        if (phraseL.length >= 2 && ul.indexOf(phraseL) !== -1) score += 20;
        for (var i = 0; i < qTokens.length; i++) {
          if (ul.indexOf(qTokens[i]) !== -1) score += qTokens[i].length > 4 ? 2 : 1;
        }
        if (c.kind === "glossary") score += 6;
        if (c.kind === "briefing") score += 3;
        if (score >= 4) hits.push({ score: score, text: u, title: c.title, kind: c.kind });
      });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    var out = [];
    var seen = {};
    for (var n = 0; n < hits.length && out.length < 5; n++) {
      var key = hits[n].text.slice(0, 80);
      if (seen[key]) continue;
      seen[key] = 1;
      out.push(hits[n]);
    }
    return out;
  }

  function contextBlock(chunks) {
    return chunks.map(function (c) {
      return "[" + (c.title || "note") + "]\n" + (c.text || "").slice(0, 1400);
    }).join("\n\n---\n\n");
  }

  function systemPrompt(lang) {
    var brief = (index && (lang === "zh" ? index.briefing_zh : index.briefing_en)) || "";
    var base = lang === "zh"
      ? "你是 Finprime V-Exchange 加密货币交易所风险管理手册助手，服务对象是几乎没有交易背景的业务单元负责人。用浅白中文。优先用提供的手册摘录和 Cursor 会话结论。数字是教学示例，不是已签字限额。不知道就说不知道，不要编造生产阈值。Phase 1（绿色）= 永续合约 + 永续账户（仅 USD/USDT）+ 撮合/风控强平/清结算。2C 经经纪商；2B = 经纪商 / 机构仅 API / 做市商。现货、USD 杠杆、跨币种/组合保证金、期权、理财、公众注册 = Phase 2+。"
      : "You are the Finprime V-Exchange crypto-exchange risk handbook assistant for BU PICs with little trading background. Use plain language. Prefer the supplied handbook excerpts and Cursor design decisions. Numbers are teaching examples, not signed Limit Book values. If it is not in the sources, say so — do not invent production thresholds. Phase 1 (green) = perpetual contracts + Perp Account (USD/USDT only) + matching / risk & liquidation / clearing. 2C enters through a broker. 2B = broker / institution API-only / MM. Spot, USD margin, cross-ccy/portfolio margin, options, wealth, public signup = Phase 2+.";
    return base + (brief ? "\n\n" + brief.slice(0, 3500) : "");
  }

  function localAnswer(query, chunks, lang) {
    var hits = extractHits(chunks, lastSelection, query);
    var bits = [];
    if (lastSelection && String(query).indexOf(lastSelection) !== -1) {
      bits.push(lang === "zh"
        ? "你选中的是「" + lastSelection + "」。按本手册和 Cursor 里定的 Phase 1（V-Exchange 绿色）范围，含义如下。"
        : "You highlighted \"" + lastSelection + "\". In this handbook and the Cursor Phase 1 (V-Exchange green) decisions, that means:");
    }
    var glossary = chunks.filter(function (c) { return c.kind === "glossary"; })[0];
    if (glossary) {
      bits.push(stripMd(glossary.text).slice(0, 420));
    }
    var briefingHit = hits.filter(function (h) { return h.kind === "briefing"; })[0];
    if (briefingHit && (!glossary || briefingHit.text.indexOf(stripMd(glossary.text).slice(0, 40)) === -1)) {
      bits.push((lang === "zh" ? "Cursor 会话结论： " : "From the Cursor design decisions: ") + briefingHit.text.slice(0, 420));
    }
    var bodyHits = hits.filter(function (h) { return h.kind !== "glossary"; }).slice(0, 3);
    if (bodyHits.length) {
      bits.push(lang === "zh" ? "手册里相关段落：" : "From the handbook:");
      bodyHits.forEach(function (h) {
        bits.push("• " + (h.title ? h.title + " — " : "") + h.text.slice(0, 320));
      });
    } else if (!glossary) {
      chunks.slice(0, 2).forEach(function (c) {
        var body = stripMd(c.text).slice(0, 360);
        if (body) bits.push((c.title ? c.title + "\n" : "") + body);
      });
    }
    if (!bits.length) {
      return lang === "zh"
        ? "手册索引里没有足够匹配。请换一个术语（例如 永续账户、ACC-01、PF-K01），或打开对应 SOP/KRI 卡片后再问。"
        : "I could not match enough handbook text. Try a term or code (for example Perp Account, ACC-01, PF-K01), or open the matching SOP/KRI card.";
    }
    bits.push(lang === "zh"
      ? "可继续问：这在 Phase 1 要不要做？谁是 A？对应哪份 SOP？红灯先做什么？"
      : "You can ask next: is this live in Phase 1? who is accountable (A)? which SOP? what to do on a red light?");
    return bits.join("\n\n");
  }

  function handbookFallback(query, chunks, lang, note) {
    var text;
    try {
      text = localAnswer(query, chunks, lang);
    } catch (e) {
      text = lang === "zh"
        ? "检索出错。请换一个术语再问，或点 Clear 后重试。"
        : "Lookup failed. Try another term, or Clear and ask again.";
    }
    if (!note) return text;
    return text + (lang === "zh"
      ? "\n\n（在线 AI 暂不可用，以上为手册检索说明。）"
      : "\n\n(Online AI was unavailable; this is the handbook retrieval explanation.)");
  }

  function ask(query, isExplain, selected) {
    if (busy) return;
    if (!isExplain) addUser(query);
    else addUser(t("Explain: ", "解释：") + (selected || lastSelection || query.slice(0, 80)));
    busy = true;
    document.getElementById("rh-ai-send").disabled = true;
    var lang = currentLang();
    var searchQ = isExplain
      ? (selected || lastSelection || query)
      : (query + " " + (lastSelection || "")).trim();
    var chunks = [];
    try {
      chunks = retrieve(searchQ, lang, 8);
    } catch (e) {
      chunks = [];
    }
    var modeEl = document.getElementById("rh-ai-mode");
    var mode = modeEl ? modeEl.value : "local";
    var thinking = document.createElement("div");
    thinking.className = "rh-ai-msg bot";
    thinking.id = "rh-ai-thinking";
    thinking.textContent = t("Looking it up in the handbook…", "正在对照手册检索…");
    document.getElementById("rh-ai-msgs").appendChild(thinking);
    scrollMsgs();

    var settled = false;
    var watchdog = null;
    var finish = function (text, err) {
      if (settled) return;
      settled = true;
      if (watchdog) clearTimeout(watchdog);
      var node = document.getElementById("rh-ai-thinking");
      if (node) node.remove();
      addBot(text, !!err);
      busy = false;
      document.getElementById("rh-ai-send").disabled = false;
    };

    watchdog = setTimeout(function () {
      finish(handbookFallback(query, chunks, lang, true), false);
    }, 5000);

    if (mode === "local") {
      finish(handbookFallback(query, chunks, lang, false), false);
      return;
    }

    callModel(query, chunks, lang).then(function (text) {
      finish(text || handbookFallback(query, chunks, lang, false), false);
    }).catch(function () {
      finish(handbookFallback(query, chunks, lang, true), false);
    });
  }

  function packedPrompt(query, chunks, lang) {
    var sys = systemPrompt(lang).slice(0, 1600);
    var ctx = contextBlock(chunks).slice(0, 2800);
    var hist = messages.slice(-6).map(function (m) {
      return (m.role === "user" ? "User: " : "Assistant: ") + String(m.content || "").slice(0, 600);
    }).join("\n");
    var tail = lang === "zh" ? "用浅白中文回答，先解释选中术语，再说明 Phase 1 是否适用。" : "Answer in plain English. Explain the selected term first, then say whether it is live in Phase 1.";
    return (sys + "\n\n" + (lang === "zh" ? "手册摘录：\n" : "Handbook excerpts:\n") + ctx + (hist ? "\n\nRecent chat:\n" + hist : "") + "\n\nQ: " + String(query).slice(0, 1200) + "\n" + tail);
  }

  function parseModelResponse(data) {
    if (typeof data === "string") {
      var s = data.trim();
      if (!s || s.charAt(0) === "{") {
        try { data = JSON.parse(s); } catch (e) { return s; }
      } else return s;
    }
    var msg = data.choices && data.choices[0] && (data.choices[0].message || data.choices[0]);
    if (msg && msg.content) return typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
    if (data.text) return data.text;
    if (data.response) return data.response;
    throw new Error("empty");
  }

  function raceTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error("timeout"));
      }, ms);
      Promise.resolve(promise).then(function (value) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(value);
      }, function (err) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  function callModel(query, chunks, lang) {
    var packed;
    try {
      packed = packedPrompt(query, chunks, lang);
    } catch (e) {
      return Promise.reject(e);
    }
    var payload = { model: "openai", messages: [{ role: "user", content: packed.slice(0, 6000) }] };
    var endpoint = (document.getElementById("rh-ai-ep").value || "").trim() || DEFAULT_EP;
    var key = (document.getElementById("rh-ai-key").value || "").trim();
    var headers = { "Content-Type": "application/json", Accept: "application/json, text/plain" };
    if (key) headers.Authorization = "Bearer " + key;
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var req = fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    });
    return raceTimeout(req, 4000).then(function (r) {
      if (!r || !r.ok) throw new Error("ai " + (r && r.status));
      var ct = (r.headers && r.headers.get("content-type")) || "";
      if (ct.indexOf("application/json") !== -1) return r.json().then(parseModelResponse);
      return r.text().then(parseModelResponse);
    }).then(function (text) {
      var out = String(text || "").trim();
      if (!out || /no space left|status":\s*500|"error"/i.test(out)) throw new Error("bad ai");
      return out;
    }).then(function (text) {
      return text;
    }, function (err) {
      try { if (ctrl) ctrl.abort(); } catch (e) {}
      throw err;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }

  function demoSelectPhrase(phrase) {
    var root = document.getElementById("panel-en") || document.querySelector(".preview") || document.body;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var idx = node.nodeValue.indexOf(phrase);
      if (idx === -1) continue;
      if (node.parentElement && node.parentElement.closest("#rh-ai-root")) continue;
      var range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + phrase.length);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      lastSelection = phrase;
      syncSelection();
      return true;
    }
    return false;
  }

  window.addEventListener("load", function () {
    var q = location.search || "";
    if (q.indexOf("ai-demo") === -1 && q.indexOf("ai-spark") === -1 && q.indexOf("ai-online") === -1) return;
    if (q.indexOf("ai-online") !== -1) {
      setTimeout(function () { openExplain("Perp Account"); }, 500);
      return;
    }
    try { document.getElementById("rh-ai-mode").value = "local"; } catch (e) {}
    setTimeout(function () {
      demoSelectPhrase("Perp Account") || demoSelectPhrase("永续账户");
      if (q.indexOf("ai-spark") !== -1) return;
      setTimeout(function () {
        var spark = document.getElementById("rh-ai-spark");
        if (spark && spark.style.display !== "none") spark.click();
        else openExplain("Perp Account");
        if (q.indexOf("ai-follow") === -1) return;
        setTimeout(function () {
          var box = document.getElementById("rh-ai-input");
          if (!box) return;
          box.value = currentLang() === "zh"
            ? "这在 Phase 1 是不是已经上线？2C 用户怎么开永续账户？"
            : "Is this live in Phase 1, and how do 2C users get a Perp Account?";
          document.getElementById("rh-ai-form").dispatchEvent(new Event("submit", { cancelable: true }));
        }, 900);
      }, 400);
    }, 500);
  });
})();
