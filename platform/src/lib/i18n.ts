export type UiLocale = "en" | "zh-Hant";

export const UI_LOCALE_COOKIE = "crmp_ui_lang";

const NAV_I18N: Record<string, { en: string; "zh-Hant": string }> = {
  "/admin": { en: "Admin Home", "zh-Hant": "管理首頁" },
  "/admin/dashboard": { en: "Daily Performance", "zh-Hant": "每日績效" },
  "/admin/risk-log": { en: "Risk Log Analytics", "zh-Hant": "風險日誌分析" },
  "/admin/market-intel": { en: "Market Intelligence", "zh-Hant": "市場情報" },
  "/admin/detectors": { en: "Detectors", "zh-Hant": "偵測器" },
  "/admin/alerts": { en: "Live Alerts", "zh-Hant": "即時警報" },
  "/admin/ai-analyses": { en: "AI Analyses", "zh-Hant": "AI 分析" },
  "/admin/ai-admin": { en: "AI Admin", "zh-Hant": "AI 管理" },
  "/admin/interventions": { en: "Human Intervention", "zh-Hant": "人工干預" },
  "/admin/spine": { en: "Spine Log", "zh-Hant": "脊柱日誌" },
  "/admin/rag": { en: "RAG Knowledge Base", "zh-Hant": "RAG 知識庫" },
  "/admin/skills": { en: "AI Skills", "zh-Hant": "AI 技能" },
  "/admin/docs/tsd": { en: "TSD", "zh-Hant": "技術規格 TSD" },
  "/admin/docs/prd": { en: "PRD", "zh-Hant": "產品需求 PRD" },
  "/admin/docs/user-guide": { en: "User Guide", "zh-Hant": "使用手冊" },
  "/admin/docs/uat": { en: "UAT Checklist", "zh-Hant": "UAT 清單" },
  "/admin/docs/ecosystem": { en: "Ecosystem Eval", "zh-Hant": "生態導入評估" },
  "/admin/docs/roadmap": { en: "Improvement Roadmap", "zh-Hant": "改進路線圖" },
  "/admin/docs/urls": { en: "URL Catalog", "zh-Hant": "網址目錄" },
  "/admin/messenger": { en: "Demo Messenger", "zh-Hant": "示範 Messenger" },
  "/admin/security/ai-access": { en: "AI Access Security", "zh-Hant": "AI 存取安全" },
  "/admin/departments": { en: "Departments", "zh-Hant": "部門" },
  "/admin/teams": { en: "Teams", "zh-Hant": "團隊" },
  "/admin/roles": { en: "Roles & Permissions", "zh-Hant": "角色與權限" },
  "/admin/users": { en: "Users", "zh-Hant": "使用者" },
  "/admin/risk-domains": { en: "Risk Domains", "zh-Hant": "風險領域" },
  "/admin/data-sources": { en: "Data Sources", "zh-Hant": "資料來源" },
  "/admin/monitor-2": { en: "Monitor 2.0", "zh-Hant": "Monitor 2.0" },
  "/admin/lark": { en: "Lark Integration", "zh-Hant": "Lark 整合" },
  "/admin/escalation": { en: "Escalation Routes", "zh-Hant": "升級路徑" },
  "/admin/audit": { en: "Audit Log", "zh-Hant": "稽核日誌" },
  "/admin/settings": { en: "Platform Settings", "zh-Hant": "平台設定" },
};

export function navLabel(href: string, locale: UiLocale, fallback: string) {
  return NAV_I18N[href]?.[locale] || fallback;
}

export function shellCopy(locale: UiLocale) {
  if (locale === "zh-Hant") {
    return {
      brandEyebrow: "Vantage Markets",
      brandTitle: "CRMP 管理後台",
      brandSub: "集中式風險管理平台",
      headerEyebrow: "管理控制平面",
      headerTitle: "風險 · 營運 · AI · 系統",
      messenger: "即時通訊",
      indicators: "指標",
      signOut: "登出",
      menu: "選單",
      language: "語言",
    };
  }
  return {
    brandEyebrow: "Vantage Markets",
    brandTitle: "CRMP Admin",
    brandSub: "Centralised Risk Management Platform",
    headerEyebrow: "Admin Control Plane",
    headerTitle: "Risk · Ops · AI · System",
    messenger: "Messenger",
    indicators: "Indicators",
    signOut: "Sign out",
    menu: "Menu",
    language: "Language",
  };
}
