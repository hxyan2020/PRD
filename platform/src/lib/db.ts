import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { ensureAiSchema } from "@/lib/ai/schema";
import { ensureSpineSchema } from "@/lib/ai/spine-schema";
import { seedRagIfEmpty } from "@/lib/ai/seed-rag";
import { seedSkillsIfEmpty } from "@/lib/ai/skills";
import { seedDetectors } from "@/lib/ai/detectors";
import { seedDailyPerformance } from "@/lib/ai/daily";
import { ensureAiAdminSchema } from "@/lib/ai/admin-schema";
import { seedAiAdminIfEmpty } from "@/lib/ai/admin";
import { ensureRiskLogSchema, seedRiskLogIfEmpty } from "@/lib/ai/risk-log";
import { ensureMarketIntelSchema } from "@/lib/market-intel/schema";
import { ensureChallengerSchema } from "@/lib/ai/challenger";
import { ensureImprovementSchema } from "@/lib/ai/improvement";
import { seedAiAnalysesIfEmpty } from "@/lib/ai/seed-analyses";
import { ensureMessengerSchema, seedMessengerIfEmpty } from "@/lib/messenger/demo";
import { FORMER_OWNER_EMAILS, PLATFORM_OWNER } from "@/lib/platform-owner";
import { ensureDocEditsSchema } from "@/lib/docs/edit-store";
import { DEPARTMENT_LIST, ROLE_CHARTERS } from "@/lib/org-catalog";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "vantage_risk.db");

declare global {
  var __vantageRiskDb: Database.Database | undefined;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function createSchema(db: Database.Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      primary_responsibilities TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      department_code TEXT,
      permissions_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      department_code TEXT NOT NULL,
      mission TEXT NOT NULL,
      lark_chat_id TEXT,
      on_call_rotation TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role_code TEXT NOT NULL,
      department_code TEXT,
      team_id INTEGER,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      last_login_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS data_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT NOT NULL,
      owner_department TEXT NOT NULL,
      auth_type TEXT NOT NULL DEFAULT 'NONE',
      refresh_cadence TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      tags_json TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS risk_domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      owner_department TEXT NOT NULL,
      supporting_departments_json TEXT NOT NULL,
      product_coverage TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'ACTIVE'
    );

    CREATE TABLE IF NOT EXISTS monitor_indicators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitor_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      domain_code TEXT NOT NULL,
      product TEXT NOT NULL,
      threshold_warn REAL,
      threshold_breach REAL,
      unit TEXT,
      status TEXT NOT NULL DEFAULT 'HEALTHY',
      last_value REAL,
      last_checked_at TEXT,
      ticket_open_count INTEGER NOT NULL DEFAULT 0,
      paused INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS monitor_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id TEXT NOT NULL UNIQUE,
      indicator_id INTEGER NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      observed_value REAL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      monitor20_ticket_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      acknowledged_at TEXT,
      acknowledged_by INTEGER,
      FOREIGN KEY (indicator_id) REFERENCES monitor_indicators(id)
    );

    CREATE TABLE IF NOT EXISTS monitor_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL UNIQUE,
      alert_id INTEGER,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      severity TEXT NOT NULL,
      assignee_user_id INTEGER,
      department_code TEXT,
      lark_message_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      FOREIGN KEY (alert_id) REFERENCES monitor_alerts(id)
    );

    CREATE TABLE IF NOT EXISTS lark_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      chat_id TEXT NOT NULL UNIQUE,
      purpose TEXT NOT NULL,
      department_code TEXT,
      severity_min TEXT NOT NULL DEFAULT 'WARN',
      enabled INTEGER NOT NULL DEFAULT 1,
      webhook_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS escalation_routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      domain_code TEXT NOT NULL,
      severity TEXT NOT NULL,
      primary_team_id INTEGER NOT NULL,
      secondary_team_id INTEGER,
      lark_channel_id INTEGER,
      sla_minutes INTEGER NOT NULL,
      auto_actions_json TEXT NOT NULL DEFAULT '[]',
      requires_human INTEGER NOT NULL DEFAULT 1,
      enabled INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (primary_team_id) REFERENCES teams(id),
      FOREIGN KEY (secondary_team_id) REFERENCES teams(id),
      FOREIGN KEY (lark_channel_id) REFERENCES lark_channels(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER,
      actor_name TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_by INTEGER
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

const ROLE_DEFS: Array<[string, string, string, string | null, string[]]> = [
  [
    "SUPER_ADMIN",
    ROLE_CHARTERS.SUPER_ADMIN.name,
    ROLE_CHARTERS.SUPER_ADMIN.intro,
    ROLE_CHARTERS.SUPER_ADMIN.department,
    ["*"],
  ],
  [
    "RISK_OWNER",
    ROLE_CHARTERS.RISK_OWNER.name,
    ROLE_CHARTERS.RISK_OWNER.intro,
    "RISK_CONTROL",
    [
      "admin.access",
      "users.read",
      "users.manage",
      "teams.read",
      "teams.manage",
      "sources.manage",
      "sources.read",
      "monitor.manage",
      "monitor.read",
      "monitor.operate",
      "lark.manage",
      "lark.read",
      "escalation.manage",
      "escalation.read",
      "audit.read",
      "settings.manage",
      "risk.intervene",
      "dashboard.full",
      "rag.read",
      "rag.manage",
      "rag.approve",
      "skills.read",
      "skills.manage",
      "skills.approve",
      "ai.read",
      "ai.operate",
      "ai.admin",
      "ai.propose",
      "ai.approve",
      "detectors.read",
      "detectors.operate",
      "intervene.operate",
      "spine.read",
      "dashboard.read",
    ],
  ],
  [
    "RISK_ANALYST",
    ROLE_CHARTERS.RISK_ANALYST.name,
    ROLE_CHARTERS.RISK_ANALYST.intro,
    "RISK_CONTROL",
    [
      "admin.access",
      "users.read",
      "teams.read",
      "sources.read",
      "monitor.operate",
      "monitor.read",
      "lark.read",
      "escalation.read",
      "audit.read",
      "dashboard.full",
      "rag.read",
      "skills.read",
      "ai.read",
      "ai.operate",
      "ai.admin",
      "ai.propose",
      "detectors.read",
      "detectors.operate",
      "intervene.operate",
      "spine.read",
      "dashboard.read",
    ],
  ],
  [
    "OPS_LEAD",
    ROLE_CHARTERS.OPS_LEAD.name,
    ROLE_CHARTERS.OPS_LEAD.intro,
    "OPERATIONS",
    [
      "admin.access",
      "users.read",
      "teams.read",
      "sources.read",
      "monitor.operate",
      "monitor.read",
      "lark.manage",
      "lark.read",
      "escalation.read",
      "audit.read",
      "dashboard.ops",
      "rag.read",
      "skills.read",
      "ai.read",
      "detectors.read",
      "spine.read",
      "dashboard.read",
      "intervene.operate",
    ],
  ],
  [
    "OPS_ANALYST",
    ROLE_CHARTERS.OPS_ANALYST.name,
    ROLE_CHARTERS.OPS_ANALYST.intro,
    "OPERATIONS",
    [
      "admin.access",
      "sources.read",
      "monitor.operate",
      "monitor.read",
      "lark.read",
      "teams.read",
      "dashboard.ops",
      "rag.read",
      "ai.read",
      "detectors.read",
      "spine.read",
      "dashboard.read",
    ],
  ],
  [
    "AI_ENGINEER",
    ROLE_CHARTERS.AI_ENGINEER.name,
    ROLE_CHARTERS.AI_ENGINEER.intro,
    "AI",
    [
      "admin.access",
      "sources.manage",
      "sources.read",
      "monitor.read",
      "lark.read",
      "audit.read",
      "teams.read",
      "dashboard.ai",
      "models.manage",
      "rag.read",
      "rag.manage",
      "skills.read",
      "skills.manage",
      "ai.read",
      "ai.operate",
      "ai.admin",
      "ai.propose",
      "detectors.read",
      "detectors.operate",
      "spine.read",
      "dashboard.read",
      "intervene.operate",
    ],
  ],
  [
    "SYSTEM_ADMIN",
    ROLE_CHARTERS.SYSTEM_ADMIN.name,
    ROLE_CHARTERS.SYSTEM_ADMIN.intro,
    "SYSTEM",
    [
      "admin.access",
      "users.manage",
      "users.read",
      "teams.manage",
      "teams.read",
      "sources.manage",
      "sources.read",
      "monitor.manage",
      "monitor.read",
      "lark.manage",
      "lark.read",
      "escalation.manage",
      "escalation.read",
      "audit.read",
      "settings.manage",
      "dashboard.system",
      "rag.read",
      "skills.read",
      "ai.read",
      "detectors.read",
      "detectors.operate",
      "spine.read",
      "dashboard.read",
    ],
  ],
  [
    "VIEWER",
    ROLE_CHARTERS.VIEWER.name,
    ROLE_CHARTERS.VIEWER.intro,
    ROLE_CHARTERS.VIEWER.department,
    [
      "admin.access",
      "users.read",
      "teams.read",
      "sources.read",
      "monitor.read",
      "lark.read",
      "escalation.read",
      "dashboard.read",
      "rag.read",
      "skills.read",
      "ai.read",
      "detectors.read",
      "spine.read",
      "dashboard.read",
    ],
  ],
];

function syncRoles(db: Database.Database) {
  const upsert = db.prepare(
    `INSERT INTO roles (code, name, description, department_code, permissions_json)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       department_code = excluded.department_code,
       permissions_json = excluded.permissions_json`
  );
  for (const [code, name, description, department, perms] of ROLE_DEFS) {
    upsert.run(code, name, description, department, JSON.stringify(perms));
  }
}

function syncDepartments(db: Database.Database) {
  const upsert = db.prepare(
    `INSERT INTO departments (code, name, description, primary_responsibilities)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       primary_responsibilities = excluded.primary_responsibilities`
  );
  for (const d of DEPARTMENT_LIST) {
    upsert.run(d.code, d.name, d.mandate, JSON.stringify(d.owns.map((item) => item.title)));
  }
}

function seedIfEmpty(db: Database.Database) {
  syncRoles(db);
  syncDepartments(db);
  const userCount = db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number };
  if (userCount.c > 0) return;

  const insertTeam = db.prepare(
    `INSERT INTO teams (name, department_code, mission, lark_chat_id, on_call_rotation) VALUES (?, ?, ?, ?, ?)`
  );
  insertTeam.run(
    "Risk Control Desk",
    "RISK_CONTROL",
    "Real-time book risk, limit breaches, hedge coverage, intervention authority.",
    "oc_risk_control_desk",
    "Primary → Secondary → Risk Owner"
  );
  insertTeam.run(
    "Credit & Client Risk",
    "RISK_CONTROL",
    "Margin, stop-out, concentration, toxic flow and copy-trade cascade monitoring.",
    "oc_credit_client_risk",
    "Analyst → Risk Owner"
  );
  insertTeam.run(
    "Ops Funding & Recon",
    "OPERATIONS",
    "Deposit/withdrawal exceptions, EOD recon breaks, client case handling.",
    "oc_ops_funding_recon",
    "Ops Analyst → Ops Lead"
  );
  insertTeam.run(
    "AI Detection Lab",
    "AI",
    "Detectors, RCA narratives, alert prioritisation and model quality.",
    "oc_ai_detection_lab",
    "AI Engineer on-call"
  );
  insertTeam.run(
    "Trading Infra & Bridges",
    "SYSTEM",
    "Servers, oneZero bridges, LP endpoints, config control, kill-switches.",
    "oc_trading_infra",
    "System Admin → Infra Lead"
  );
  insertTeam.run(
    "Crypto Exchange Risk",
    "RISK_CONTROL",
    "Wallet float, order book integrity, liquidation engine and market abuse.",
    "oc_crypto_exchange_risk",
    "Crypto Risk Analyst → Risk Owner"
  );

  const insertUser = db.prepare(
    `INSERT INTO users (email, name, password, role_code, department_code, team_id, status) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`
  );
  insertUser.run("risk.owner@vantagemarkets.com", "Alex Chen", "risk123", "RISK_OWNER", "RISK_CONTROL", 1);
  insertUser.run("risk.analyst@vantagemarkets.com", "Priya Nair", "risk123", "RISK_ANALYST", "RISK_CONTROL", 2);
  insertUser.run("ops.lead@vantagemarkets.com", "Marcus Lee", "ops123", "OPS_LEAD", "OPERATIONS", 3);
  insertUser.run("ops.analyst@vantagemarkets.com", "Sofia Alvarez", "ops123", "OPS_ANALYST", "OPERATIONS", 3);
  insertUser.run("ai.engineer@vantagemarkets.com", "Jin Park", "ai123", "AI_ENGINEER", "AI", 4);
  insertUser.run("system.admin@vantagemarkets.com", "Noah Wright", "sys123", "SYSTEM_ADMIN", "SYSTEM", 5);
  insertUser.run("admin@vantagemarkets.com", "Platform Admin", "admin123", "SUPER_ADMIN", null, null);
  insertUser.run("viewer@vantagemarkets.com", "Board Viewer", "view123", "VIEWER", null, null);
  insertUser.run(PLATFORM_OWNER.email, PLATFORM_OWNER.name, PLATFORM_OWNER.password, PLATFORM_OWNER.role_code, PLATFORM_OWNER.department_code, 1);
  if (PLATFORM_OWNER.githubEmail.toLowerCase() !== PLATFORM_OWNER.email.toLowerCase()) {
    insertUser.run(PLATFORM_OWNER.githubEmail, PLATFORM_OWNER.name, PLATFORM_OWNER.password, PLATFORM_OWNER.role_code, PLATFORM_OWNER.department_code, 1);
  }

  const insertSource = db.prepare(
    `INSERT INTO data_sources (name, category, url, description, owner_department, auth_type, refresh_cadence, status, tags_json, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`
  );

  const sources: Array<[string, string, string, string, string, string, string, string, string]> = [
    ["Monitor 2.0", "INTERNAL_PLATFORM", "https://monitor.vantagemarkets.internal/2.0", "Existing risk indicator monitoring — warnings, alerts, ticket tracking.", "RISK_CONTROL", "SSO", "Real-time", '["alerts","tickets","indicators"]', "Primary upstream for indicator alerts; CRMP syncs tickets bi-directionally."],
    ["Lark Open API", "MESSAGING", "https://open.larksuite.com/document/", "Team messenger for escalation, on-call and incident rooms.", "SYSTEM", "APP_SECRET", "Event-driven", '["escalation","chatops"]', "Used for severity-routed notifications and dual-control approvals."],
    ["MetaTrader 4 Manager API", "INTERNAL_PLATFORM", "https://www.metatrader4.com/en/trading-platform", "MT4 positions, equity, margin and deal stream.", "SYSTEM", "VPN", "Tick / 1s", '["cfd","positions"]', "Bridge via trading servers / oneZero."],
    ["MetaTrader 5 Manager API", "INTERNAL_PLATFORM", "https://www.metatrader5.com/en/trading-platform", "MT5 multi-asset positions and deals.", "SYSTEM", "VPN", "Tick / 1s", '["cfd","positions"]', null as unknown as string],
    ["TradingView Market Data", "MARKET_DATA", "https://www.tradingview.com/", "Charts and reference pricing for verification.", "AI", "API_KEY", "1m", '["external","verification"]', "Used as secondary price truth for AI RCA."],
    ["Equinix / Trading Servers Status", "INTERNAL_PLATFORM", "https://www.vantagemarkets.com/en/about/our-trading-servers/", "Server topology and latency health context.", "SYSTEM", "INTERNAL", "1m", '["infra","latency"]', "Pairs with internal Prometheus / node exporters."],
    ["oneZero MT Bridge Metrics", "LP_LIQUIDITY", "https://www.onezero.com/", "LP aggregation, reject rates, fill quality.", "SYSTEM", "VPN", "Real-time", '["lp","bridge"]', "Critical for hedge coverage and toxic flow detection."],
    ["LP Price Feeds (Prime of Prime)", "LP_LIQUIDITY", "internal://lp-feeds", "Aggregated bank / non-bank LP quotes.", "SYSTEM", "VPN", "Tick", '["lp","pricing"]', "Compare vs client quotes for skew / stale detection."],
    ["Vantage Web Trading Ledger", "INTERNAL_PLATFORM", "internal://web-trading", "Browser platform orders and sessions.", "SYSTEM", "INTERNAL", "Real-time", '["cfd","orders"]', null as unknown as string],
    ["Vantage App Events", "INTERNAL_PLATFORM", "internal://vantage-app", "Mobile trading + copy-trade events.", "SYSTEM", "INTERNAL", "Real-time", '["copy-trading","mobile"]', "Includes signal provider / copier linkage."],
    ["Copy Trading Graph", "INTERNAL_PLATFORM", "internal://copy-trading", "Signal providers, copiers, allocation graph.", "RISK_CONTROL", "INTERNAL", "1m", '["copy-trading","cascade"]', "Cascade risk when top providers fail."],
    ["Crypto Matching Engine", "CRYPTO", "internal://crypto-exchange/matching", "Order book, trades, liquidations.", "SYSTEM", "INTERNAL", "Tick", '["crypto","exchange"]', "Exchange product stack."],
    ["Crypto Wallet Custody", "CRYPTO", "internal://crypto-exchange/wallets", "Hot/cold wallet balances and withdrawal queues.", "SYSTEM", "HSM", "1m", '["crypto","custody"]', "Hot wallet float risk."],
    ["CoinGecko / CoinMarketCap", "CRYPTO", "https://www.coingecko.com/en/api", "External crypto reference prices.", "AI", "API_KEY", "1m", '["external","crypto"]', "Verification feed for index/mark divergence."],
    ["Binance Public Market Data", "CRYPTO", "https://binance-docs.github.io/apidocs/spot/en/", "External crypto liquidity / funding reference.", "AI", "NONE", "1s–1m", '["external","crypto"]', "Not for execution — verification only."],
    ["Investing.com Economic Calendar", "NEWS_MACRO", "https://www.investing.com/economic-calendar/", "Macro event calendar for gap risk.", "RISK_CONTROL", "NONE", "Daily + intraday", '["macro","calendar"]', "Mirror into internal calendar service."],
    ["Vantage Economic Calendar", "NEWS_MACRO", "https://www.vantagemarkets.com/en/economic-calendar/", "First-party calendar surfaced to clients.", "OPERATIONS", "NONE", "Daily", '["macro"]', null as unknown as string],
    ["Reuters / Bloomberg headlines", "NEWS_MACRO", "vendor://news-wire", "Market-moving news for event risk windows.", "AI", "VENDOR", "Real-time", '["news","event-risk"]', "License-bound; store snapshots in evidence vault."],
    ["ASIC Regulatory Updates", "REGULATORY", "https://asic.gov.au/", "AU product / leverage rule changes.", "RISK_CONTROL", "NONE", "Daily", '["entity","asic"]', "Entity-aware limit packs."],
    ["FCA Handbook / Updates", "REGULATORY", "https://www.fca.org.uk/", "UK retail CFD rules and leverage caps.", "RISK_CONTROL", "NONE", "Daily", '["entity","fca"]', "Separate UK entity site."],
    ["VFSC Notices", "REGULATORY", "https://www.vfsc.vu/", "Vanuatu entity regulatory notices.", "RISK_CONTROL", "NONE", "Weekly", '["entity","vfsc"]', null as unknown as string],
    ["FSCA South Africa", "REGULATORY", "https://www.fsca.co.za/", "SA entity regulatory context.", "RISK_CONTROL", "NONE", "Weekly", '["entity","fsca"]', null as unknown as string],
    ["CIMA Cayman", "REGULATORY", "https://www.cima.ky/", "Cayman entity regulatory context.", "RISK_CONTROL", "NONE", "Weekly", '["entity","cima"]', null as unknown as string],
    ["Client CRM / KYC", "INTERNAL_PLATFORM", "internal://crm-kyc", "Client classification, KYC status, sanctions flags.", "OPERATIONS", "SSO", "Near real-time", '["kyc","aml"]', "Freeze / unblock decisions."],
    ["Payments & Rails", "INTERNAL_PLATFORM", "internal://payments", "Deposit/withdrawal rails, chargebacks.", "OPERATIONS", "SSO", "Real-time", '["funding","fraud"]', null as unknown as string],
    ["Promo / V-Points Engine", "INTERNAL_PLATFORM", "internal://promotions", "Deposit bonus, rewards, referral ledgers.", "OPERATIONS", "INTERNAL", "5m", '["promo","abuse"]', "Abuse detection inputs."],
    ["Trustpilot / Reputation", "REFERENCE", "https://www.trustpilot.com/", "Outage / pricing complaint early warning.", "OPERATIONS", "NONE", "Hourly", '["reputation"]', "Soft signal into Ops queue."],
    ["Vantage Help Center", "REFERENCE", "https://global.vantagehelpcenter.com/hc/en-us", "Internal/external support articles.", "OPERATIONS", "NONE", "On-demand", '["support"]', null as unknown as string],
    ["Scuderia Ferrari Partnership Page", "REFERENCE", "https://www.vantagemarkets.com/en/partnership/ferrari/", "Brand context — not a risk feed.", "OPERATIONS", "NONE", "Static", '["brand"]', "Reference only."],
    ["XAUUSD247 Specs", "REFERENCE", "https://www.vantagemarkets.com/en/commodities-trading/gold-trading/xauusd24-7/", "24/7 gold product rules, exposure limits.", "RISK_CONTROL", "NONE", "On change", '["product","gold247"]', "Net 15k / gross 30k lot limits."],
  ];

  for (const s of sources) {
    insertSource.run(s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8] ?? null);
  }

  const insertDomain = db.prepare(
    `INSERT INTO risk_domains (code, name, description, owner_department, supporting_departments_json, product_coverage, priority)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const domains = [
    ["MARKET_PRICING", "Market & Pricing Risk", "P&L, gaps, stale/crossed quotes, volatility and correlation.", "RISK_CONTROL", '["AI","SYSTEM"]', "CFD + Crypto", 1],
    ["CREDIT_CLIENT", "Credit & Client Risk", "Margin, stop-out, concentration, toxic flow, copy-trade cascade.", "RISK_CONTROL", '["OPERATIONS","AI"]', "CFD + Crypto", 1],
    ["LP_HEDGE", "Liquidity & Hedge Risk", "LP health, bridge fills, A/B book coverage.", "RISK_CONTROL", '["SYSTEM"]', "CFD", 1],
    ["PRODUCT_CONFIG", "Product & Trading Conditions", "Leverage, swaps, account-type mispricing, promo abuse.", "RISK_CONTROL", '["OPERATIONS","SYSTEM"]', "CFD + Crypto", 2],
    ["OPS_PROCESS", "Operational & Process Risk", "Funding, recon, overrides, incident runbooks.", "OPERATIONS", '["RISK_CONTROL","SYSTEM"]', "CFD + Crypto", 2],
    ["FRAUD_CONDUCT", "Fraud, Abuse & Conduct", "Multi-account, payment fraud, wash trading, collusion.", "RISK_CONTROL", '["OPERATIONS","AI"]', "CFD + Crypto", 1],
    ["TECH_INFRA", "Platform & Technology Risk", "Servers, feeds, APIs, wallets, kill-switches.", "SYSTEM", '["RISK_CONTROL","AI"]', "CFD + Crypto", 1],
    ["REG_CAPITAL", "Regulatory, Entity & Capital", "Entity-aware limits, segregation, capital thresholds.", "RISK_CONTROL", '["OPERATIONS"]', "CFD + Crypto", 2],
    ["MODEL_AI", "Model & AI Decision Risk", "Detector drift, false positives, explainability gates.", "AI", '["RISK_CONTROL"]', "Platform", 2],
    ["CRYPTO_EXCHANGE", "Crypto Exchange Stack", "Matching, liquidations, wallet float, market integrity.", "RISK_CONTROL", '["SYSTEM","AI"]', "Crypto Exchange", 1],
  ] as const;
  for (const d of domains) insertDomain.run(...d);

  const insertInd = db.prepare(
    `INSERT INTO monitor_indicators (monitor_id, name, domain_code, product, threshold_warn, threshold_breach, unit, status, last_value, last_checked_at, ticket_open_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`
  );
  for (const row of MONITOR_SEED_ROWS) {
    insertInd.run(
      row.monitor_id,
      row.name,
      row.domain_code,
      row.product,
      row.warn,
      row.breach,
      row.unit,
      row.status,
      row.last_value,
      row.tickets
    );
  }

  const insertAlert = db.prepare(
    `INSERT INTO monitor_alerts (alert_id, indicator_id, severity, title, message, observed_value, status, monitor20_ticket_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertAlert.run("ALT-1001", 2, "BREACH", "Margin utilisation spike", "128 accounts above 90% margin utilisation during US open.", 128, "OPEN", "TKT-88421");
  insertAlert.run("ALT-1002", 8, "BREACH", "Copy-trade concentration", "Single signal provider accounts for 31% of copy equity.", 31, "OPEN", "TKT-88430");
  insertAlert.run("ALT-1003", 6, "WARN", "Hot wallet float elevated", "Hot wallet float at 18.2% of total custody.", 18.2, "ACKNOWLEDGED", "TKT-88390");
  insertAlert.run("ALT-1004", 1, "WARN", "Equity drawdown rising", "Company CFD book drawdown at 3.4%.", 3.4, "OPEN", "TKT-88445");
  insertAlert.run("ALT-1005", 4, "WARN", "Hedge coverage below target", "Hedge coverage ratio at 82% (warn <85%).", 82, "OPEN", "TKT-88450");

  const insertTicket = db.prepare(
    `INSERT INTO monitor_tickets (ticket_id, alert_id, title, status, severity, assignee_user_id, department_code, lark_message_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertTicket.run("TKT-88421", 1, "Margin utilisation spike — US session", "ESCALATED", "BREACH", 2, "RISK_CONTROL", "om_lark_88421");
  insertTicket.run("TKT-88430", 2, "Copy provider concentration >25%", "IN_PROGRESS", "BREACH", 1, "RISK_CONTROL", "om_lark_88430");
  insertTicket.run("TKT-88390", 3, "Crypto hot wallet float", "IN_PROGRESS", "WARN", 6, "SYSTEM", "om_lark_88390");
  insertTicket.run("TKT-88445", 4, "CFD book drawdown warn", "OPEN", "WARN", 2, "RISK_CONTROL", null);
  insertTicket.run("TKT-88450", 5, "Hedge coverage warn", "OPEN", "WARN", 5, "SYSTEM", null);

  const insertLark = db.prepare(
    `INSERT INTO lark_channels (name, chat_id, purpose, department_code, severity_min, enabled, webhook_url)
     VALUES (?, ?, ?, ?, ?, 1, ?)`
  );
  insertLark.run("Risk Control Desk", "oc_risk_control_desk", "Primary risk escalations and interventions", "RISK_CONTROL", "WARN", "https://open.larksuite.com/hook/mock-risk-desk");
  insertLark.run("Ops War Room", "oc_ops_funding_recon", "Funding, recon and client ops incidents", "OPERATIONS", "WARN", "https://open.larksuite.com/hook/mock-ops");
  insertLark.run("AI Detection Alerts", "oc_ai_detection_lab", "Model alerts and RCA draft reviews", "AI", "INFO", "https://open.larksuite.com/hook/mock-ai");
  insertLark.run("Trading Infra P1", "oc_trading_infra", "Bridge/server/LP P1 pages", "SYSTEM", "BREACH", "https://open.larksuite.com/hook/mock-infra");
  insertLark.run("Crypto Exchange Risk", "oc_crypto_exchange_risk", "Wallet, liquidation and market integrity", "RISK_CONTROL", "WARN", "https://open.larksuite.com/hook/mock-crypto");
  insertLark.run("Executive Risk Bridge", "oc_exec_risk_bridge", "CRITICAL only — exec visibility", null, "CRITICAL", "https://open.larksuite.com/hook/mock-exec");

  const insertEsc = db.prepare(
    `INSERT INTO escalation_routes (name, domain_code, severity, primary_team_id, secondary_team_id, lark_channel_id, sla_minutes, auto_actions_json, requires_human, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
  );
  insertEsc.run("Margin breach → Risk Desk", "CREDIT_CLIENT", "BREACH", 2, 1, 1, 15, '["create_ticket","lark_notify","ai_rca"]', 1);
  insertEsc.run("LP reject storm", "LP_HEDGE", "CRITICAL", 5, 1, 4, 5, '["create_ticket","lark_notify","page_oncall","suggest_lp_disable"]', 1);
  insertEsc.run("Hot wallet float", "CRYPTO_EXCHANGE", "WARN", 6, 5, 5, 30, '["create_ticket","lark_notify"]', 1);
  insertEsc.run("Copy concentration", "CREDIT_CLIENT", "BREACH", 2, 1, 1, 20, '["create_ticket","lark_notify","ai_rca","suggest_copier_cap"]', 1);
  insertEsc.run("Feed stale quotes", "MARKET_PRICING", "BREACH", 5, 1, 4, 10, '["create_ticket","lark_notify","suggest_symbol_halt"]', 1);
  insertEsc.run("Funding exception surge", "OPS_PROCESS", "WARN", 3, null, 2, 45, '["create_ticket","lark_notify"]', 1);
  insertEsc.run("Model drift CRITICAL", "MODEL_AI", "CRITICAL", 4, 1, 3, 30, '["create_ticket","lark_notify","disable_detector_shadow"]', 1);

  const insertSetting = db.prepare(
    `INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)`
  );
  insertSetting.run("platform.name", "Vantage CRMP", "Centralised Risk Management Platform");
  insertSetting.run("platform.owner_name", PLATFORM_OWNER.name, "Named platform and documentation owner");
  insertSetting.run("platform.owner_email", PLATFORM_OWNER.email, "Platform owner contact");
  insertSetting.run("platform.docs_owner", PLATFORM_OWNER.name, "Owner of PRD, TSD, User Guide and UAT packs");
  insertSetting.run("monitor2.base_url", "https://monitor.vantagemarkets.internal/2.0", "Monitor 2.0 base URL");
  insertSetting.run("monitor2.sync_enabled", "true", "Bi-directional alert/ticket sync");
  insertSetting.run("lark.app_id", "cli_mock_vantage_crmp", "Lark app id (prototype)");
  insertSetting.run("lark.enabled", "true", "Enable Lark notifications");
  insertSetting.run("ai.rca_enabled", "true", "AI root-cause analysis on new breaches");
  insertSetting.run("ai.auto_on_alarm", "true", "Auto-trigger AI analysis when Monitor indicators alarm");
  insertSetting.run("ai.skill_certainty_only", "true", "Auto-execute skills only when conditions match with certainty");
  insertSetting.run("escalation.default_sla_minutes", "30", "Default SLA when route missing");
  insertSetting.run("products.coverage", "CFD,CryptoExchange", "Products in scope");

  const insertAudit = db.prepare(
    `INSERT INTO audit_logs (actor_user_id, actor_name, action, entity_type, entity_id, details_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  insertAudit.run(7, "Platform Admin", "SEED_DATABASE", "platform", "v1", JSON.stringify({ message: "Initial admin seed completed" }));
  insertAudit.run(1, "Alex Chen", "ACK_ALERT", "monitor_alert", "ALT-1003", JSON.stringify({ note: "Wallet team investigating cold sweep" }));
  insertAudit.run(6, "Noah Wright", "UPDATE_SETTING", "platform_settings", "monitor2.sync_enabled", JSON.stringify({ value: true }));
}

const MONITOR_SEED_ROWS: Array<{
  monitor_id: string;
  name: string;
  domain_code: string;
  product: string;
  warn: number;
  breach: number;
  unit: string;
  status: string;
  last_value: number;
  tickets: number;
}> = [
  { monitor_id: "M2-EQ-001", name: "Company Equity Drawdown", domain_code: "MARKET_PRICING", product: "CFD", warn: 3, breach: 5, unit: "%", status: "WARN", last_value: 3.4, tickets: 1 },
  { monitor_id: "M2-MRG-014", name: "Accounts >90% Margin Utilisation", domain_code: "CREDIT_CLIENT", product: "CFD", warn: 50, breach: 100, unit: "count", status: "BREACH", last_value: 128, tickets: 2 },
  { monitor_id: "M2-LP-022", name: "LP Reject Rate (oneZero)", domain_code: "LP_HEDGE", product: "CFD", warn: 2, breach: 5, unit: "%", status: "HEALTHY", last_value: 0.8, tickets: 0 },
  { monitor_id: "M2-HEDGE-007", name: "Hedge Coverage Ratio", domain_code: "LP_HEDGE", product: "CFD", warn: 85, breach: 70, unit: "%", status: "WARN", last_value: 82, tickets: 1 },
  { monitor_id: "M2-XAU-247", name: "XAUUSD247 Net Exposure", domain_code: "PRODUCT_CONFIG", product: "CFD", warn: 10000, breach: 15000, unit: "lots", status: "HEALTHY", last_value: 4200, tickets: 0 },
  { monitor_id: "M2-CRYPTO-WALLET", name: "Hot Wallet Float Ratio", domain_code: "CRYPTO_EXCHANGE", product: "Crypto", warn: 15, breach: 25, unit: "%", status: "WARN", last_value: 18.2, tickets: 1 },
  { monitor_id: "M2-CRYPTO-LIQ", name: "Liquidation Engine Backlog", domain_code: "CRYPTO_EXCHANGE", product: "Crypto", warn: 50, breach: 200, unit: "orders", status: "HEALTHY", last_value: 12, tickets: 0 },
  { monitor_id: "M2-COPY-009", name: "Top Signal Provider Copier Concentration", domain_code: "CREDIT_CLIENT", product: "CFD", warn: 15, breach: 25, unit: "%", status: "BREACH", last_value: 31, tickets: 1 },
  { monitor_id: "M2-FEED-003", name: "Stale Quote Symbols", domain_code: "MARKET_PRICING", product: "CFD", warn: 3, breach: 10, unit: "symbols", status: "HEALTHY", last_value: 1, tickets: 0 },
  { monitor_id: "M2-FRAUD-011", name: "Multi-account Cluster Score", domain_code: "FRAUD_CONDUCT", product: "CFD", warn: 0.7, breach: 0.85, unit: "score", status: "WARN", last_value: 0.74, tickets: 1 },
  { monitor_id: "M2-STOP-018", name: "Stop-out Count (5m window)", domain_code: "CREDIT_CLIENT", product: "CFD", warn: 20, breach: 40, unit: "count/5m", status: "HEALTHY", last_value: 8, tickets: 0 },
  { monitor_id: "M2-NBP-016", name: "Negative Balance Account Count", domain_code: "CREDIT_CLIENT", product: "CFD", warn: 2, breach: 5, unit: "accounts", status: "HEALTHY", last_value: 0, tickets: 0 },
  { monitor_id: "M2-SLIP-021", name: "Avg Client Slippage (majors, 15m)", domain_code: "MARKET_PRICING", product: "CFD", warn: 2, breach: 3.5, unit: "pips", status: "HEALTHY", last_value: 0.9, tickets: 0 },
  { monitor_id: "M2-BRIDGE-LAT", name: "Bridge Fill Latency p95", domain_code: "TECH_INFRA", product: "CFD", warn: 120, breach: 250, unit: "ms", status: "HEALTHY", last_value: 78, tickets: 0 },
  { monitor_id: "M2-ABOOK-008", name: "A-book Volume Ratio (session)", domain_code: "LP_HEDGE", product: "CFD", warn: 40, breach: 30, unit: "%", status: "HEALTHY", last_value: 52, tickets: 0 },
  { monitor_id: "M2-VAR-002", name: "1-day VaR Utilisation", domain_code: "MARKET_PRICING", product: "CFD", warn: 85, breach: 95, unit: "%", status: "HEALTHY", last_value: 71, tickets: 0 },
  { monitor_id: "M2-CORR-004", name: "Corr Matrix Drift vs Baseline", domain_code: "MARKET_PRICING", product: "CFD", warn: 0.2, breach: 0.35, unit: "Δρ", status: "HEALTHY", last_value: 0.11, tickets: 0 },
  { monitor_id: "M2-GAP-012", name: "Estimated Gap Exposure (USD)", domain_code: "PRODUCT_CONFIG", product: "CFD", warn: 1000000, breach: 2000000, unit: "USD", status: "HEALTHY", last_value: 420000, tickets: 0 },
  { monitor_id: "M2-SPREAD-005", name: "Spread vs Session Median Ratio", domain_code: "PRODUCT_CONFIG", product: "CFD", warn: 2, breach: 3, unit: "x", status: "HEALTHY", last_value: 1.1, tickets: 0 },
  { monitor_id: "M2-LEV-019", name: "New Accounts at Max Leverage (24h)", domain_code: "PRODUCT_CONFIG", product: "CFD", warn: 100, breach: 200, unit: "accounts", status: "HEALTHY", last_value: 64, tickets: 0 },
  { monitor_id: "M2-BONUS-013", name: "Bonus Converted to Cash (24h USD)", domain_code: "FRAUD_CONDUCT", product: "CFD", warn: 75000, breach: 150000, unit: "USD", status: "HEALTHY", last_value: 42000, tickets: 0 },
  { monitor_id: "M2-WD-015", name: "Withdrawal Volume (1h USD)", domain_code: "OPS_PROCESS", product: "CFD+Crypto", warn: 2000000, breach: 5000000, unit: "USD", status: "HEALTHY", last_value: 860000, tickets: 0 },
  { monitor_id: "M2-FUND-010", name: "Funding Exceptions (1h)", domain_code: "OPS_PROCESS", product: "CFD", warn: 30, breach: 80, unit: "count/h", status: "HEALTHY", last_value: 12, tickets: 0 },
  { monitor_id: "M2-PAY-017", name: "Payment Fraud Model Score", domain_code: "FRAUD_CONDUCT", product: "CFD", warn: 0.65, breach: 0.8, unit: "score", status: "HEALTHY", last_value: 0.41, tickets: 0 },
  { monitor_id: "M2-WASH-020", name: "Wash/Collusion Detection Score", domain_code: "FRAUD_CONDUCT", product: "CFD+Crypto", warn: 0.55, breach: 0.75, unit: "score", status: "HEALTHY", last_value: 0.22, tickets: 0 },
  { monitor_id: "M2-API-023", name: "Trading API Error Rate (5m)", domain_code: "TECH_INFRA", product: "CFD+Crypto", warn: 2, breach: 5, unit: "%", status: "HEALTHY", last_value: 0.3, tickets: 0 },
  { monitor_id: "M2-MODEL-006", name: "Detector Precision (7d rolling)", domain_code: "MODEL_AI", product: "CFD+Crypto", warn: 80, breach: 70, unit: "%", status: "HEALTHY", last_value: 86, tickets: 0 },
  { monitor_id: "M2-CAP-024", name: "Entity Capital Buffer Ratio", domain_code: "REG_CAPITAL", product: "CFD+Crypto", warn: 20, breach: 15, unit: "%", status: "HEALTHY", last_value: 28, tickets: 0 },
  { monitor_id: "M2-SEG-025", name: "Client Money Segregation Gap (USD)", domain_code: "REG_CAPITAL", product: "CFD", warn: 50000, breach: 250000, unit: "USD", status: "HEALTHY", last_value: 0, tickets: 0 },
  { monitor_id: "M2-CRYPTO-ORACLE", name: "Mark Price Oracle Lag", domain_code: "CRYPTO_EXCHANGE", product: "Crypto", warn: 1, breach: 2, unit: "seconds", status: "HEALTHY", last_value: 0.2, tickets: 0 },
  { monitor_id: "M2-CRYPTO-INS", name: "Insurance Fund Daily Drawdown", domain_code: "CRYPTO_EXCHANGE", product: "Crypto", warn: 4, breach: 8, unit: "%", status: "HEALTHY", last_value: 0.6, tickets: 0 },
  { monitor_id: "M2-CRYPTO-OI", name: "Top Account OI Share (per contract)", domain_code: "CRYPTO_EXCHANGE", product: "Crypto", warn: 20, breach: 35, unit: "%", status: "HEALTHY", last_value: 12, tickets: 0 },
  { monitor_id: "M2-CRYPTO-DEP", name: "Crypto Deposits (1h USD)", domain_code: "CRYPTO_EXCHANGE", product: "Crypto", warn: 3000000, breach: 8000000, unit: "USD", status: "HEALTHY", last_value: 1100000, tickets: 0 },
  { monitor_id: "M2-ARB-026", name: "Latency Arb Toxicity Score", domain_code: "CREDIT_CLIENT", product: "CFD", warn: 0.5, breach: 0.7, unit: "score", status: "HEALTHY", last_value: 0.18, tickets: 0 },
  { monitor_id: "M2-SWAP-027", name: "Symbols with Swap vs Benchmark Δ", domain_code: "PRODUCT_CONFIG", product: "CFD", warn: 5, breach: 10, unit: "symbols", status: "HEALTHY", last_value: 1, tickets: 0 },
  { monitor_id: "M2-MKT-INTEL", name: "Market Intelligence High-Impact Hits (5m)", domain_code: "MARKET_PRICING", product: "CFD+Crypto", warn: 1, breach: 3, unit: "hits/5m", status: "HEALTHY", last_value: 0, tickets: 0 },
  { monitor_id: "M2-PERP-BASIS", name: "Perp Mark–Index Basis", domain_code: "CRYPTO_EXCHANGE", product: "Crypto", warn: 25, breach: 60, unit: "bps", status: "HEALTHY", last_value: 12, tickets: 0 },
  { monitor_id: "M2-FUNDING-RATE", name: "Perp Funding Rate Abs (8h)", domain_code: "CRYPTO_EXCHANGE", product: "Crypto", warn: 0.15, breach: 0.5, unit: "%", status: "HEALTHY", last_value: 0.04, tickets: 0 },
  { monitor_id: "M2-STABLE-EXP", name: "Stablecoin Depeg Exposure (USD)", domain_code: "CRYPTO_EXCHANGE", product: "Crypto", warn: 500000, breach: 2000000, unit: "USD", status: "HEALTHY", last_value: 120000, tickets: 0 },
  { monitor_id: "M2-MT-DISC", name: "Trading Platform Disconnect Rate", domain_code: "TECH_INFRA", product: "CFD+Crypto", warn: 1, breach: 5, unit: "%", status: "HEALTHY", last_value: 0.2, tickets: 0 },
  { monitor_id: "M2-RECON-BRK", name: "Reconciliation Breaks (open)", domain_code: "OPS_PROCESS", product: "CFD+Crypto", warn: 5, breach: 20, unit: "count", status: "HEALTHY", last_value: 2, tickets: 0 },
  { monitor_id: "M2-KILL-COUNT", name: "Active Symbol Kill-Switches", domain_code: "TECH_INFRA", product: "CFD+Crypto", warn: 2, breach: 5, unit: "symbols", status: "HEALTHY", last_value: 0, tickets: 0 },
  { monitor_id: "M2-NEWS-GROSS", name: "Gross Notional into Tier-1 News (USD)", domain_code: "MARKET_PRICING", product: "CFD", warn: 50000000, breach: 120000000, unit: "USD", status: "HEALTHY", last_value: 18000000, tickets: 0 },
  { monitor_id: "M2-CHARGEBACK", name: "Payment Chargebacks (24h)", domain_code: "FRAUD_CONDUCT", product: "CFD", warn: 15, breach: 40, unit: "count/24h", status: "HEALTHY", last_value: 6, tickets: 0 },
  { monitor_id: "M2-IB-PAYOUT", name: "IB Rebate Anomaly Score", domain_code: "FRAUD_CONDUCT", product: "CFD", warn: 0.6, breach: 0.8, unit: "score", status: "HEALTHY", last_value: 0.21, tickets: 0 },
  { monitor_id: "M2-COPY-CHURN", name: "Copy Follower Net Exit (1h)", domain_code: "CREDIT_CLIENT", product: "CFD", warn: 12, breach: 25, unit: "%", status: "HEALTHY", last_value: 3.2, tickets: 0 },
];

function ensureExtraMonitors(db: Database.Database) {
  // Do not overwrite warn/breach on conflict — operators edit those live in Monitor 2.0.
  const upsert = db.prepare(
    `INSERT INTO monitor_indicators (monitor_id, name, domain_code, product, threshold_warn, threshold_breach, unit, status, last_value, last_checked_at, ticket_open_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
     ON CONFLICT(monitor_id) DO UPDATE SET
       name = excluded.name,
       domain_code = excluded.domain_code,
       product = excluded.product,
       unit = excluded.unit`
  );
  for (const row of MONITOR_SEED_ROWS) {
    upsert.run(
      row.monitor_id,
      row.name,
      row.domain_code,
      row.product,
      row.warn,
      row.breach,
      row.unit,
      row.status,
      row.last_value,
      row.tickets
    );
  }
}

function ensureUser(
  db: Database.Database,
  email: string,
  name: string,
  password: string,
  role: string,
  department: string | null,
  teamId: number | null
) {
  const existing = db
    .prepare(`SELECT id FROM users WHERE lower(email) = lower(?)`)
    .get(email) as { id: number } | undefined;
  if (!existing) {
    db.prepare(
      `INSERT INTO users (email, name, password, role_code, department_code, team_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`
    ).run(email, name, password, role, department, teamId);
  } else {
    db.prepare(
      `UPDATE users SET name = ?, password = ?, role_code = ?, department_code = ?, status = 'ACTIVE' WHERE id = ?`
    ).run(name, password, role, department, existing.id);
  }
}

function ensurePlatformOwner(db: Database.Database) {
  for (const former of FORMER_OWNER_EMAILS) {
    if (former.toLowerCase() === PLATFORM_OWNER.email.toLowerCase()) continue;
    const dest = db
      .prepare(`SELECT id FROM users WHERE lower(email) = lower(?)`)
      .get(PLATFORM_OWNER.email) as { id: number } | undefined;
    const src = db
      .prepare(`SELECT id FROM users WHERE lower(email) = lower(?)`)
      .get(former) as { id: number } | undefined;
    if (src && !dest) {
      db.prepare(`UPDATE users SET email = ? WHERE id = ?`).run(PLATFORM_OWNER.email, src.id);
    }
  }
  ensureUser(
    db,
    PLATFORM_OWNER.email,
    PLATFORM_OWNER.name,
    PLATFORM_OWNER.password,
    PLATFORM_OWNER.role_code,
    PLATFORM_OWNER.department_code,
    1
  );
  if (PLATFORM_OWNER.githubEmail.toLowerCase() !== PLATFORM_OWNER.email.toLowerCase()) {
    ensureUser(
      db,
      PLATFORM_OWNER.githubEmail,
      PLATFORM_OWNER.name,
      PLATFORM_OWNER.password,
      PLATFORM_OWNER.role_code,
      PLATFORM_OWNER.department_code,
      1
    );
  }
  const put = db.prepare(
    `INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, description = excluded.description, updated_at = datetime('now')`
  );
  put.run("platform.owner_name", PLATFORM_OWNER.name, "Named platform and documentation owner");
  put.run("platform.owner_email", PLATFORM_OWNER.email, "Platform owner contact");
  put.run("platform.docs_owner", PLATFORM_OWNER.name, "Owner of PRD, TSD, User Guide and UAT packs");
}

function ensureMonitorIndicatorColumns(db: Database.Database) {
  const cols = db.prepare(`PRAGMA table_info(monitor_indicators)`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === "paused")) {
    db.exec(`ALTER TABLE monitor_indicators ADD COLUMN paused INTEGER NOT NULL DEFAULT 0`);
  }
}

function ensureAiLayer(db: Database.Database) {
  ensureAiSchema(db);
  ensureSpineSchema(db);
  ensureAiAdminSchema(db);
  syncRoles(db);
  syncDepartments(db);
  ensureMonitorIndicatorColumns(db);
  ensureExtraMonitors(db);
  seedRagIfEmpty(db);
  seedSkillsIfEmpty(db);
  seedDetectors(db);
  seedDailyPerformance(db);
  seedAiAdminIfEmpty(db);
  ensureRiskLogSchema(db);
  seedRiskLogIfEmpty(db);
  ensureMarketIntelSchema(db);
  ensureChallengerSchema(db);
  ensureImprovementSchema(db);
  seedAiAnalysesIfEmpty(db);
  ensureMessengerSchema(db);
  seedMessengerIfEmpty(db);
  ensureDocEditsSchema(db);
  const upsert = db.prepare(
    `INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)
     ON CONFLICT(key) DO NOTHING`
  );
  upsert.run("ai.auto_on_alarm", "true", "Auto-trigger AI analysis when Monitor indicators alarm");
  upsert.run("ai.skill_certainty_only", "true", "Auto-execute skills only when conditions match with certainty");
  upsert.run(
    "ai.second_opinion_severity",
    "BREACH",
    "Minimum alert severity that triggers independent second AI challenger (WARN|BREACH|CRITICAL)"
  );
  upsert.run("detectors.auto_raise_alarms", "true", "Detectors raise Monitor alarms when warn/breach");
  upsert.run("market_intel.enabled", "true", "Enable 5-minute market intelligence scanner");
  upsert.run("market_intel.interval_minutes", "5", "Scan cadence in minutes");
  upsert.run("market_intel.lark_chat_id", "oc_market_intelligence", "Dedicated messenger group for intel pushes");
  upsert.run("platform.owner_name", PLATFORM_OWNER.name, "Named platform and documentation owner");
  upsert.run("platform.owner_email", PLATFORM_OWNER.email, "Platform owner contact");
  upsert.run("platform.docs_owner", PLATFORM_OWNER.name, "Owner of PRD, TSD, User Guide and UAT packs");
  ensurePlatformOwner(db);
  // Avoid static import cycle (scanner → getDb). Seed + scheduler via dynamic import.
  const skipScheduler =
    process.env.NEXT_PUBLIC_STATIC_EXPORT === "1" || process.env.STATIC_EXPORT === "1";
  void import("@/lib/market-intel/scanner")
    .then(({ seedMarketIntel, startMarketIntelScheduler }) => {
      seedMarketIntel(db);
      if (!skipScheduler) startMarketIntelScheduler();
    })
    .catch((e) => console.error("[market-intel] boot seed failed", e));
}

export function getDb() {
  if (global.__vantageRiskDb) {
    ensureAiLayer(global.__vantageRiskDb);
    return global.__vantageRiskDb;
  }
  ensureDataDir();
  const db = new Database(DB_PATH);
  createSchema(db);
  seedIfEmpty(db);
  ensureAiLayer(db);
  global.__vantageRiskDb = db;
  return db;
}

export function writeAudit(
  actor: { id?: number | null; name?: string | null } | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {}
) {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_logs (actor_user_id, actor_name, action, entity_type, entity_id, details_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(actor?.id ?? null, actor?.name ?? "system", action, entityType, entityId, JSON.stringify(details));
}
