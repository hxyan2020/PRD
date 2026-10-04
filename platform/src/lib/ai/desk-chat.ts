import { PLATFORM_URLS } from "@/lib/docs/urls";
import type { UiLocale } from "@/lib/i18n";

export type DeskChatMessage = { role: "user" | "assistant"; content: string };

export type DeskChatSource = { title: string; href?: string };

export type DeskChatResult = {
  reply: string;
  sources: DeskChatSource[];
  suggestions: string[];
};

type Knowledge = {
  keys: string[];
  href?: string;
  en: { title: string; body: string };
  zh: { title: string; body: string };
};

const KNOWLEDGE: Knowledge[] = [
  {
    keys: ["monitor 2.0", "monitor-2", "m2-", "indicator", "監控"],
    href: "/admin/monitor-2",
    en: {
      title: "Monitor 2.0",
      body: "Monitor 2.0 is the upstream indicator catalogue (e.g. M2-MRG-014, M2-COPY-009, M2-MKT-INTEL). In this prototype the catalogue is seeded SQLite — Sync / Ack update local rows only. Live webhook + ticket write-back is roadmap RM-02.",
    },
    zh: {
      title: "Monitor 2.0",
      body: "Monitor 2.0 是上游指標目錄（如 M2-MRG-014、M2-COPY-009、M2-MKT-INTEL）。本原型是種子 SQLite — 同步／Ack 只改本機列。真實 webhook＋工單回寫是路線圖 RM-02。",
    },
  },
  {
    keys: ["lark", "messenger", "oc_risk", "webhook", "卡片", "互動"],
    href: "/admin/messenger",
    en: {
      title: "Demo Messenger / Lark",
      body: "Demo Messenger is an in-app Lark lookalike. Channel webhooks are mock URLs; POST /api/lark test_notify returns mock: true and writes audit only. Production interactive cards are RM-01. Ack / Escalate / maker-confirm already work locally.",
    },
    zh: {
      title: "示範 Messenger／Lark",
      body: "示範 Messenger 是站內 Lark 風格收件匣。頻道 Webhook 是模擬網址；POST /api/lark test_notify 回 mock: true 只寫稽核。正式互動卡片是 RM-01。Ack／升級／Maker 確認已可在本機走通。",
    },
  },
  {
    keys: ["executed_mock", "executed_after_approval", "intervention", "halt", "leverage", "dry-run", "干預", "停商品"],
    href: "/admin/interventions",
    en: {
      title: "Human intervention (mocked writes)",
      body: "Approve on Human Intervention logs spine/audit and marks EXECUTED_AFTER_APPROVAL — it does not call LP disable, symbol halt, group leverage or withdrawal pause. Non-human skill steps are EXECUTED_MOCK. Live adapters are RM-09 (UAT out of scope).",
    },
    zh: {
      title: "人工干預（模擬寫入）",
      body: "人工干預頁核准只寫脊柱／稽核並標 EXECUTED_AFTER_APPROVAL — 不會真的停 LP、停商品、收槓桿或暫停出金。非人工技能步驟是 EXECUTED_MOCK。真實適配是 RM-09（本輪 UAT 範圍外）。",
    },
  },
  {
    keys: ["challenger", "second-ai", "second ai", "second_opinion", "agree", "disagree", "partial", "挑戰"],
    href: "/admin/ai-analyses",
    en: {
      title: "Second-AI challenger",
      body: "BREACH/CRITICAL analyses open a challenger panel (setting ai.second_opinion_severity, default BREACH). Today it is a second heuristic in lib/ai/challenger.ts — same repo, not a second vendor. Verdicts AGREE / PARTIAL / DISAGREE. Independent model is RM-04.",
    },
    zh: {
      title: "第二 AI 挑戰者",
      body: "BREACH／CRITICAL 分析會開挑戰者面板（設定 ai.second_opinion_severity，預設 BREACH）。今日是 lib/ai/challenger.ts 的第二套啟發式 — 同一程式庫，不是第二供應商。裁決 AGREE／PARTIAL／DISAGREE。獨立模型是 RM-04。",
    },
  },
  {
    keys: ["rca", "matchskill", "skill", "playbook", "rag", "root cause", "根因", "技能"],
    href: "/admin/skills",
    en: {
      title: "Primary RCA (heuristic skill / RAG)",
      body: "Primary analysis matches a skill playbook (matchSkill) or retrieves RAG. There is no live LLM on this path. Confidence can hit 1.0 on a wording match. LLM + tools + eval harness is RM-03. Skills are SKILL.md-style playbooks — open Enter for the full page.",
    },
    zh: {
      title: "主 RCA（啟發式技能／RAG）",
      body: "主分析匹配技能劇本（matchSkill）或檢索 RAG。這條路徑沒有線上 LLM。用詞命中時信心可到 1.0。LLM＋工具＋評測架是 RM-03。技能是 SKILL.md 風格 — 點「進入」看完整頁。",
    },
  },
  {
    keys: ["maker", "checker", "dual", "soD", "ai admin", "change request", "雙人"],
    href: "/admin/ai-admin",
    en: {
      title: "Maker / checker",
      body: "AI Admin change requests need a maker and a different checker. In the prototype this is an in-app flag, not IdP identity (SSO is RM-05). The AI service role must never receive halt / close-only permissions — see AI Access Security.",
    },
    zh: {
      title: "Maker／Checker",
      body: "AI 管理的變更單需要 Maker 與另一位 Checker。原型裡這是應用內旗標，不是 IdP 身分（SSO 是 RM-05）。AI 服務角色永不可有停商品／只平倉權限 — 見 AI 存取安全。",
    },
  },
  {
    keys: ["risk123", "yan123", "sso", "scim", "persona", "login", "登入", "密碼"],
    href: "/admin/users",
    en: {
      title: "Demo login (not SSO)",
      body: "Login is cookie + demo passwords (risk123 personas, yan123 for demo platform owner). Corporate SSO + SCIM is RM-05 and out of this UAT window. Sign-in stays in this browser after refresh.",
    },
    zh: {
      title: "示範登入（不是 SSO）",
      body: "登入是 Cookie＋示範密碼（角色 risk123，示範平台負責人 yan123）。企業 SSO＋SCIM 是 RM-05，本輪 UAT 範圍外。重新整理後工作階段仍留在這個瀏覽器。",
    },
  },
  {
    keys: ["sqlite", "postgres", "vantage_risk.db", "better-sqlite3", "multi-instance", "備份"],
    href: "/admin/docs/urls",
    en: {
      title: "SQLite prototype store",
      body: "Persistence is one file: platform/data/vantage_risk.db (better-sqlite3). GitHub Pages cannot write it. Postgres + multi-instance is RM-06.",
    },
    zh: {
      title: "SQLite 原型庫",
      body: "持久化是單一檔 platform/data/vantage_risk.db（better-sqlite3）。GitHub Pages 不能寫庫。Postgres＋多實例是 RM-06。",
    },
  },
  {
    keys: ["shadow", "skill_certainty", "suggest", "auto-execute", "影子"],
    href: "/admin/dashboard",
    en: {
      title: "Shadow vs execute",
      body: "ai.skill_certainty_only defaults true. There is not yet a single Shadow banner (RM-11). Treat EXECUTED_MOCK as a log, not live containment.",
    },
    zh: {
      title: "影子 vs 執行",
      body: "ai.skill_certainty_only 預設 true。還沒有單一「影子」橫幅（RM-11）。請把 EXECUTED_MOCK 當成日誌，不是真實防損。",
    },
  },
  {
    keys: ["market intel", "m2-mkt-intel", "event_templates", "cpi", "情報"],
    href: "/admin/market-intel",
    en: {
      title: "Market intelligence scanner",
      body: "A 5-minute heuristic rotates EVENT_TEMPLATES. Findings can be synthetic. Indicator M2-MKT-INTEL counts hits. Licensed scored feeds are RM-15. Push format (i)–(vi) goes to oc_market_intelligence.",
    },
    zh: {
      title: "市場情報掃描",
      body: "每五分鐘啟發式輪轉 EVENT_TEMPLATES。發現可以是合成的。指標 M2-MKT-INTEL 計命中。授權評分饋送是 RM-15。推送格式（i）–（vi）進 oc_market_intelligence。",
    },
  },
  {
    keys: ["roadmap", "rm-0", "rm-1", "改進", "路線圖"],
    href: "/admin/docs/roadmap",
    en: {
      title: "Improvement roadmap",
      body: "Docs → Improvement Roadmap lists RM-01…15. Each card has Today / Build / Done when / skip risk. RM-05 (SSO) and RM-09 (live writes) are tagged UAT out of scope.",
    },
    zh: {
      title: "改進路線圖",
      body: "文件 → 改進路線圖列出 RM-01…15。每張卡有今日／要做／完成標準／不做風險。RM-05（SSO）與 RM-09（真實寫入）標為本輪 UAT 範圍外。",
    },
  },
  {
    keys: ["spine", "audit", "脊柱", "稽核"],
    href: "/admin/spine",
    en: {
      title: "Spine and audit",
      body: "The spine is the end-to-end event log: alarm → RCA → challenge → messenger → human gate → resolved. Audit Log is the immutable mutation trail. Timestamps exist; token cost / p95 RCA SLOs are RM-14.",
    },
    zh: {
      title: "脊柱與稽核",
      body: "脊柱是端到端事件：警報 → RCA → 挑戰 → Messenger → 人工關卡 → 結案。稽核日誌是不可變變更軌跡。有時間戳；token／RCA p95 SLO 是 RM-14。",
    },
  },
  {
    keys: ["a-book", "b-book", "abook", "hedge", "lp reject"],
    href: "/admin/skills",
    en: {
      title: "A-book / B-book / LP",
      body: "Skills may suggest A-book increase or LP disable. Those actions queue as human gates. They do not move the trading book in this prototype. Hedge coverage warn is typically <85% in the RAG playbook.",
    },
    zh: {
      title: "A-book／B-book／LP",
      body: "技能可能建議提高 A-book 或停用 LP。這些動作會進人工關卡。本原型不會真的動交易帳簿。RAG 劇本裡對沖覆蓋警告通常 <85%。",
    },
  },
  {
    keys: ["copy", "copier", "signal provider", "concentration", "跟單"],
    href: "/admin/skills",
    en: {
      title: "Copy-trading concentration",
      body: "M2-COPY-009 tracks top provider concentration. Known controls: per-provider copier caps, pause new copies, dual-control before lifting caps. Cascade risk if one provider holds too much copy equity.",
    },
    zh: {
      title: "跟單集中度",
      body: "M2-COPY-009 追蹤龍頭提供者集中度。已知控制：每提供者跟單上限、暫停新跟單、提高上限需雙人控制。單一提供者佔比過高會有連鎖風險。",
    },
  },
  {
    keys: ["hot wallet", "float", "withdrawal", "crypto", "熱錢包"],
    href: "/admin/monitor-2",
    en: {
      title: "Crypto hot-wallet float",
      body: "Hot float = hot balances / total custody. Warn ~15%, breach ~25%. Remediation in the playbook: cold sweep, pause large withdrawals — always a human gate in CRMP.",
    },
    zh: {
      title: "加密熱錢包浮額",
      body: "熱錢包浮額＝熱錢包／總保管。警告約 15%，違規約 25%。劇本處置：冷掃、暫停大額出金 — 在 CRMP 一律走人工關卡。",
    },
  },
  {
    keys: ["繁中", "zh-hant", "i18n", "translation", "locale"],
    href: "/admin/settings",
    en: {
      title: "Language (EN / 繁中)",
      body: "EN / 繁中 is stored in cookie crmp_ui_lang. Chrome (titles, buttons, badges) is translated. IDs, emails and permission codes stay Latin on purpose. Remaining narrative strings are RM-08.",
    },
    zh: {
      title: "語言（EN／繁中）",
      body: "EN／繁中存在 Cookie crmp_ui_lang。Chrome（標題、按鈕、徽章）已翻譯。編號、電子郵件、權限碼刻意維持拉丁字母。剩餘敘事字串是 RM-08。",
    },
  },
  {
    keys: ["demo platform owner", "haixiang.yan", "平台負責人", "owner"],
    href: "/admin/users",
    en: {
      title: "Demo platform owner",
      body: "The named owner of this desk and docs is demo platform owner (haixiang.yan@hytechc.com), password yan123. GitHub/Cursor login is an alias. This is a demo persona, not corporate SSO.",
    },
    zh: {
      title: "示範平台負責人",
      body: "本後台與文件的具名負責人是示範平台負責人（haixiang.yan@hytechc.com），密碼 yan123。GitHub／Cursor 登入是別名。這是示範角色，不是企業 SSO。",
    },
  },
  {
    keys: ["uat", "pass", "fail", "waive", "驗收"],
    href: "/admin/docs/uat",
    en: {
      title: "UAT checklist",
      body: "Docs → UAT is the Risk Owner script (UAT-01…). Exit: all Critical Pass; at most 2 High waivers with written acceptance. Do not Fail the prototype for missing live Lark writes or Okta.",
    },
    zh: {
      title: "UAT 清單",
      body: "文件 → UAT 是風險負責人劇本（UAT-01…）。退出：Critical 全過；High 豁免≤2 且書面接受。不要因為沒有真實 Lark 寫入或 Okta 就判原型 Fail。",
    },
  },
  {
    keys: ["blocklist", "ai access", "human-only", "close-only", "禁區"],
    href: "/admin/security/ai-access",
    en: {
      title: "AI access security",
      body: "The AI service role is blocked from halt / close-only / webhook secrets / the SQLite file. This selection chatbot is read-only: it explains, it cannot approve an intervention.",
    },
    zh: {
      title: "AI 存取安全",
      body: "AI 服務角色被擋住停商品／只平倉／Webhook 密鑰／SQLite 檔。這個劃選聊天機器人是唯讀：它解釋，不能核准干預。",
    },
  },
];

function pageHint(path: string, zh: boolean): { title: string; href: string; blurb: string } | null {
  const item =
    PLATFORM_URLS.filter((u) => u.path.startsWith("/admin"))
      .sort((a, b) => b.path.length - a.path.length)
      .find((u) => path === u.path || path.startsWith(`${u.path}/`)) ??
    PLATFORM_URLS.find((u) => u.path === "/admin");
  if (!item) return null;
  const blurb = zh
    ? `你正在「${item.title}」（${item.path}）。劃選的文字會用這一頁的上下文解釋。`
    : `You are on ${item.title} (${item.path}). The selection is explained in this page’s context.`;
  return { title: item.title, href: item.path, blurb };
}

function scoreEntry(hay: string, entry: Knowledge): number {
  let s = 0;
  for (const k of entry.keys) {
    const key = k.toLowerCase();
    if (key.length <= 3) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(hay)) s += 1;
    } else if (hay.includes(key)) {
      s += key.length > 8 ? 2 : 1;
    }
  }
  return s;
}

function detectIntent(q: string): "where" | "live" | "how" | "who" | "explain" {
  const x = q.toLowerCase();
  if (/(where|which page|href|去哪|哪一頁|連結)/i.test(x)) return "where";
  if (/(live|real|mock|demo|production|正式|模擬|示範|真的)/i.test(x)) return "live";
  if (/(how|click|step|怎麼|如何|步驟)/i.test(x)) return "how";
  if (/(who|owner|role|誰|角色)/i.test(x)) return "who";
  return "explain";
}

export function answerDeskChat(input: {
  selection: string;
  question: string;
  pagePath: string;
  locale: UiLocale;
  ragSnippets?: Array<{ title: string; content: string }>;
  history?: DeskChatMessage[];
}): DeskChatResult {
  const zh = input.locale === "zh-Hant";
  const selection = input.selection.trim().slice(0, 1200);
  const question = input.question.trim().slice(0, 1200);
  const hay = `${selection} ${question} ${input.pagePath}`.toLowerCase();
  const ranked = KNOWLEDGE.map((e) => ({ e, s: scoreEntry(hay, e) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  const top = ranked.slice(0, 3).map((x) => x.e);
  const page = pageHint(input.pagePath || "/admin", zh);
  const intent = detectIntent(question);
  const sources: DeskChatSource[] = [];
  const bits: string[] = [];

  if (selection) {
    const q = selection.length > 220 ? `${selection.slice(0, 220)}…` : selection;
    bits.push(zh ? `你劃選的是：\n「${q}」` : `You selected:\n“${q}”`);
  }

  if (intent === "live") {
    bits.push(
      zh
        ? "這是原型：Lark 是 mock webhook、Monitor 同步不外呼、干預核准是 EXECUTED_MOCK／EXECUTED_AFTER_APPROVAL。真實寫入（RM-09）與正式 IdP（RM-05）不在本輪 UAT。"
        : "This is a prototype: Lark webhooks are mock, Monitor sync does not call out, and intervention approve is EXECUTED_MOCK / EXECUTED_AFTER_APPROVAL. Live writes (RM-09) and production IdP (RM-05) are out of this UAT window."
    );
  }

  if (top.length) {
    for (const e of top) {
      const copy = zh ? e.zh : e.en;
      bits.push(`**${copy.title}.** ${copy.body}`);
      if (e.href) sources.push({ title: copy.title, href: e.href });
    }
  } else {
    bits.push(
      zh
        ? "我沒有對到具名指標或設定鍵。下面用這一頁的上下文說明；也可以改劃選一個代碼（例如 M2-MRG-014、EXECUTED_MOCK、RM-01）再問一次。"
        : "I did not match a named indicator or setting key. I will use this page’s context. You can also select a code (e.g. M2-MRG-014, EXECUTED_MOCK, RM-01) and ask again."
    );
  }

  if (intent === "where" && (top[0]?.href || page)) {
    const href = top[0]?.href || page?.href;
    bits.push(zh ? `下一步：打開 ${href}。` : `Next: open ${href}.`);
  }

  if (intent === "how") {
    bits.push(
      zh
        ? "操作順序通常是：Monitor／警報 → AI 分析 → Messenger 卡片上 Ack 或升級 → 若需人工關卡則到人工干預核准（Maker）→ 必要時另一人 Checker。示範 Messenger 可在本頁完成這些按鈕。"
        : "Typical path: Monitor/alert → AI analysis → Ack or Escalate on the Messenger card → Human Intervention if gated (maker) → a different checker if required. Demo Messenger can complete those buttons on this desk."
    );
    sources.push({ title: zh ? "示範 Messenger" : "Demo Messenger", href: "/admin/messenger" });
  }

  if (intent === "who") {
    bits.push(
      zh
        ? "示範平台負責人：demo platform owner（haixiang.yan@hytechc.com／yan123）。風險負責人：risk.owner@vantagemarkets.com／risk123。Checker 應是另一個角色，不要同一人自核。"
        : "Demo platform owner: demo platform owner (haixiang.yan@hytechc.com / yan123). Risk Owner: risk.owner@vantagemarkets.com / risk123. Checker should be a different persona — do not self-approve."
    );
    sources.push({ title: zh ? "使用者" : "Users", href: "/admin/users" });
  }

  if (page) {
    bits.push(page.blurb);
    if (!sources.some((s) => s.href === page.href)) sources.push({ title: page.title, href: page.href });
  }

  if (input.ragSnippets?.length) {
    const snip = input.ragSnippets[0];
    const text = snip.content.replace(/\s+/g, " ").slice(0, 280);
    bits.push(zh ? `知識庫摘錄（${snip.title}）：${text}` : `RAG excerpt (${snip.title}): ${text}`);
    sources.push({ title: snip.title, href: "/admin/rag" });
  }

  bits.push(
    zh
      ? "我是後台劃選助理，只能解釋本 CRMP 原型，不能核准干預或改設定。可繼續追問。"
      : "I am the desk selection assistant. I explain this CRMP prototype; I cannot approve interventions or change settings. Ask a follow-up anytime."
  );

  const suggestions = zh
    ? ["這是正式環境還是示範？", "我該點哪一頁？", "核准之後真的會停商品嗎？"]
    : ["Is this live or a demo mock?", "Which page should I open?", "Does Approve actually halt symbols?"];

  return { reply: bits.join("\n\n"), sources: sources.slice(0, 5), suggestions };
}
