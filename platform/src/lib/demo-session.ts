import { FORMER_OWNER_EMAILS, PLATFORM_OWNER } from "@/lib/platform-owner";
import type { RoleCode, DepartmentCode, SessionUser } from "@/lib/types";
import { isPublicSnapshot, publicBasePath } from "@/lib/static-export";

export const DEMO_SESSION_KEY = "crmp_demo_session_v1";
export const DEMO_SESSION_COOKIE = "crmp_demo_session";
export const DEMO_SESSION_EVENT = "crmp-demo-session";

export type DemoPersona = {
  email: string;
  password: string;
  name: string;
  role_code: RoleCode;
  department_code: DepartmentCode | null;
  labelEn: string;
  labelZh: string;
};

/** GitHub / Cursor login — same person as the named docs & platform owner. */
export const PERSONAL_ACCOUNT = {
  email: PLATFORM_OWNER.githubEmail,
  password: PLATFORM_OWNER.password,
  name: PLATFORM_OWNER.name,
  role_code: PLATFORM_OWNER.role_code,
  department_code: PLATFORM_OWNER.department_code,
};

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    email: PLATFORM_OWNER.email,
    password: PLATFORM_OWNER.password,
    name: PLATFORM_OWNER.name,
    role_code: PLATFORM_OWNER.role_code,
    department_code: PLATFORM_OWNER.department_code,
    labelEn: "demo platform owner",
    labelZh: "示範平台負責人",
  },
  {
    email: PERSONAL_ACCOUNT.email,
    password: PERSONAL_ACCOUNT.password,
    name: PERSONAL_ACCOUNT.name,
    role_code: PERSONAL_ACCOUNT.role_code,
    department_code: PERSONAL_ACCOUNT.department_code,
    labelEn: "GitHub / Cursor",
    labelZh: "GitHub／Cursor",
  },
  {
    email: "risk.owner@vantagemarkets.com",
    password: "risk123",
    name: "Alex Chen",
    role_code: "RISK_OWNER",
    department_code: "RISK_CONTROL",
    labelEn: "Risk Owner",
    labelZh: "風險負責人",
  },
  {
    email: "ops.lead@vantagemarkets.com",
    password: "ops123",
    name: "Marcus Lee",
    role_code: "OPS_LEAD",
    department_code: "OPERATIONS",
    labelEn: "Ops Lead",
    labelZh: "營運主管",
  },
  {
    email: "ai.engineer@vantagemarkets.com",
    password: "ai123",
    name: "Jin Park",
    role_code: "AI_ENGINEER",
    department_code: "AI",
    labelEn: "AI Engineer",
    labelZh: "AI 工程師",
  },
  {
    email: "system.admin@vantagemarkets.com",
    password: "sys123",
    name: "Noah Wright",
    role_code: "SYSTEM_ADMIN",
    department_code: "SYSTEM",
    labelEn: "System Admin",
    labelZh: "系統管理員",
  },
  {
    email: "admin@vantagemarkets.com",
    password: "admin123",
    name: "Platform Admin",
    role_code: "SUPER_ADMIN",
    department_code: null,
    labelEn: "Super Admin",
    labelZh: "超級管理員",
  },
  {
    email: "cs.lead@vantagemarkets.com",
    password: "cs123",
    name: "Maya Santos",
    role_code: "CS_LEAD",
    department_code: "CUSTOMER_SERVICE",
    labelEn: "CS Lead",
    labelZh: "客服主管",
  },
  {
    email: "cs.agent@vantagemarkets.com",
    password: "cs123",
    name: "Elena Rossi",
    role_code: "CS_AGENT",
    department_code: "CUSTOMER_SERVICE",
    labelEn: "CS Agent",
    labelZh: "客服專員",
  },
  {
    email: "tr.lead@vantagemarkets.com",
    password: "tr123",
    name: "Kenji Watanabe",
    role_code: "TR_LEAD",
    department_code: "TRADING",
    labelEn: "TR Lead",
    labelZh: "交易主管",
  },
  {
    email: "tr.dealer@vantagemarkets.com",
    password: "tr123",
    name: "Omar Haddad",
    role_code: "TR_DEALER",
    department_code: "TRADING",
    labelEn: "TR Dealer",
    labelZh: "交易員",
  },
];

export function personaToUser(p: DemoPersona, id = 9001): SessionUser {
  return {
    id,
    email: p.email,
    name: p.name,
    role_code: p.role_code,
    department_code: p.department_code,
    team_id: null,
    team_name: null,
  };
}

export function findPersona(email: string, password: string) {
  const needle = email.trim().toLowerCase();
  const hit = DEMO_PERSONAS.find((p) => p.email.toLowerCase() === needle && p.password === password);
  if (hit) return hit;
  if (
    FORMER_OWNER_EMAILS.some((e) => e.toLowerCase() === needle) &&
    password === PLATFORM_OWNER.password
  ) {
    return DEMO_PERSONAS[0];
  }
  return undefined;
}

export function defaultPersona() {
  return DEMO_PERSONAS[0];
}

function cookiePath() {
  if (typeof window === "undefined") return "/";
  if (window.location.pathname.includes("/PRD/crmp-admin")) return "/PRD/crmp-admin";
  return "/";
}

export function readDemoSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed?.email || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDemoSession(user: SessionUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
  document.cookie = `${DEMO_SESSION_COOKIE}=1; path=${cookiePath()}; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  window.dispatchEvent(new Event(DEMO_SESSION_EVENT));
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_SESSION_KEY);
  document.cookie = `${DEMO_SESSION_COOKIE}=; path=${cookiePath()}; max-age=0; samesite=lax`;
  window.dispatchEvent(new Event(DEMO_SESSION_EVENT));
}

/** Login lives under `/admin` so GitHub Pages never 404s (root `/login` leaves the snapshot). */
export function loginHref() {
  const suffix = "/admin/login";
  if (typeof window !== "undefined") {
    if (isPublicSnapshot()) {
      const base = publicBasePath() || "/PRD/crmp-admin";
      return `${base}${suffix}/`;
    }
    return suffix;
  }
  if (isPublicSnapshot() || process.env.NEXT_PUBLIC_STATIC_EXPORT === "1") {
    const base = publicBasePath() || "/PRD/crmp-admin";
    return `${base}${suffix}/`;
  }
  return suffix;
}

export async function signInPersona(persona: DemoPersona) {
  writeDemoSession(personaToUser(persona));
  if (typeof window === "undefined" || isPublicSnapshot()) return true;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: persona.email, password: persona.password }),
    });
    return res.ok || res.status === 404 || res.status === 405;
  } catch {
    return true;
  }
}
