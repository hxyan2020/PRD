import { PLATFORM_OWNER } from "@/lib/platform-owner";
import type { RoleCode, DepartmentCode, SessionUser } from "@/lib/types";

export const DEMO_SESSION_KEY = "crmp_demo_session_v1";
export const DEMO_SESSION_COOKIE = "crmp_demo_session";

export type DemoPersona = {
  email: string;
  password: string;
  name: string;
  role_code: RoleCode;
  department_code: DepartmentCode | null;
  labelEn: string;
  labelZh: string;
};

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    email: PLATFORM_OWNER.email,
    password: PLATFORM_OWNER.password,
    name: PLATFORM_OWNER.name,
    role_code: PLATFORM_OWNER.role_code,
    department_code: PLATFORM_OWNER.department_code,
    labelEn: "Platform Owner",
    labelZh: "平台負責人",
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
  return DEMO_PERSONAS.find(
    (p) => p.email.toLowerCase() === email.trim().toLowerCase() && p.password === password
  );
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
  document.cookie = `${DEMO_SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_SESSION_KEY);
  document.cookie = `${DEMO_SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
