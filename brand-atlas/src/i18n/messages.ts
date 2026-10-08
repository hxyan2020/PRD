export type MessageKey =
  | "nav.home"
  | "nav.catalog"
  | "nav.scan"
  | "nav.about"
  | "nav.contact"
  | "nav.terms"
  | "nav.login"
  | "nav.logout"
  | "nav.signup"
  | "hero.brand"
  | "hero.headline"
  | "hero.blurb"
  | "hero.ctaScan"
  | "hero.ctaCatalog"
  | "catalog.title"
  | "catalog.all"
  | "catalog.scanCta"
  | "catalog.locked"
  | "catalog.unlocked"
  | "catalog.sneak"
  | "catalog.progress"
  | "scan.title"
  | "scan.blurb"
  | "scan.identify"
  | "scan.confirm"
  | "scan.upload"
  | "scan.camera"
  | "bingo.title"
  | "bingo.body"
  | "bingo.keep"
  | "auth.email"
  | "auth.password"
  | "auth.loginTitle"
  | "auth.signupTitle"
  | "unlocked.note"
  | "unlocked.saveNote"
  | "unlocked.share"
  | "unlocked.seenAt"
  | "footer.tagline";

const en: Record<MessageKey, string> = {
  "nav.home": "Home",
  "nav.catalog": "Catalogue",
  "nav.scan": "Scan",
  "nav.about": "About",
  "nav.contact": "Contact",
  "nav.terms": "Terms",
  "nav.login": "Log in",
  "nav.logout": "Log out",
  "nav.signup": "Sign up",
  "hero.brand": "Seen",
  "hero.headline": "Photograph the world. Unlock the catalogue.",
  "hero.blurb":
    "Cars, cigarettes, spirits, wine, sake, beer, coffee, tea, clothes, luxury, trees, flowers, animals, food — marks humans made and life still around. Spot one, confirm it, lift the greyscale.",
  "hero.ctaScan": "Take a picture",
  "hero.ctaCatalog": "Browse catalogue",
  "catalog.title": "Catalogue",
  "catalog.all": "All",
  "catalog.scanCta": "Scan to unlock",
  "catalog.locked": "Locked",
  "catalog.unlocked": "Unlocked",
  "catalog.sneak": "Sneak peek",
  "catalog.progress": "Progress",
  "scan.title": "Scan & unlock",
  "scan.blurb":
    "Choose categories, then photograph or upload. AI reads the logo / distinctive features and asks you to confirm.",
  "scan.identify": "Identify with AI",
  "scan.confirm": "Confirm selection",
  "scan.upload": "Upload image",
  "scan.camera": "Use camera",
  "bingo.title": "You unlocked {name}",
  "bingo.body": "Greyscale lifted. Colour cover restored in your catalogue.",
  "bingo.keep": "Keep exploring",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.loginTitle": "Log in",
  "auth.signupTitle": "Create account",
  "unlocked.note": "Your field note",
  "unlocked.saveNote": "Save note",
  "unlocked.share": "Copy permanent link",
  "unlocked.seenAt": "Seen at (UTC)",
  "footer.tagline":
    "Seen keeps a living catalogue of brands and living things still around. Photograph or upload → identify → unlock. Refreshed every week.",
};

/** Lightweight translations — falls back to English for missing keys. */
const packs: Record<string, Partial<Record<MessageKey, string>>> = {
  en,
  "zh-Hans": {
    "nav.home": "首页",
    "nav.catalog": "图鉴",
    "nav.scan": "扫描",
    "nav.about": "关于",
    "nav.contact": "联系",
    "nav.terms": "条款",
    "nav.login": "登录",
    "nav.logout": "退出",
    "nav.signup": "注册",
    "hero.headline": "拍下世界，解锁图鉴。",
    "hero.ctaScan": "拍照",
    "hero.ctaCatalog": "浏览图鉴",
    "catalog.title": "图鉴",
    "catalog.progress": "进度",
    "catalog.sneak": "预览",
    "scan.title": "扫描解锁",
    "scan.identify": "AI 识别",
    "scan.confirm": "确认",
    "bingo.keep": "继续探索",
    "footer.tagline": "Seen：拍摄 → 识别 → 解锁。每周更新。",
  },
  "zh-Hant": {
    "nav.home": "首頁",
    "nav.catalog": "圖鑑",
    "nav.scan": "掃描",
    "nav.about": "關於",
    "nav.contact": "聯絡",
    "nav.terms": "條款",
    "nav.login": "登入",
    "nav.logout": "登出",
    "nav.signup": "註冊",
    "hero.headline": "拍下世界，解鎖圖鑑。",
    "hero.ctaScan": "拍照",
    "hero.ctaCatalog": "瀏覽圖鑑",
    "catalog.title": "圖鑑",
    "scan.title": "掃描解鎖",
    "scan.identify": "AI 辨識",
    "scan.confirm": "確認",
  },
  ja: {
    "nav.home": "ホーム",
    "nav.catalog": "図鑑",
    "nav.scan": "スキャン",
    "nav.about": "について",
    "nav.contact": "お問い合わせ",
    "nav.terms": "利用規約",
    "nav.login": "ログイン",
    "nav.logout": "ログアウト",
    "nav.signup": "登録",
    "hero.headline": "撮って、図鑑をアンロック。",
    "hero.ctaScan": "写真を撮る",
    "hero.ctaCatalog": "図鑑を見る",
    "catalog.title": "図鑑",
    "scan.title": "スキャン＆アンロック",
    "scan.identify": "AIで識別",
    "scan.confirm": "確定",
  },
  ko: {
    "nav.home": "홈",
    "nav.catalog": "도감",
    "nav.scan": "스캔",
    "nav.login": "로그인",
    "nav.logout": "로그아웃",
    "nav.signup": "가입",
    "hero.headline": "찍고, 도감을 잠금 해제하세요.",
    "scan.identify": "AI 식별",
    "scan.confirm": "확인",
  },
  es: {
    "nav.home": "Inicio",
    "nav.catalog": "Catálogo",
    "nav.scan": "Escanear",
    "nav.about": "Acerca de",
    "nav.contact": "Contacto",
    "nav.terms": "Términos",
    "nav.login": "Entrar",
    "nav.logout": "Salir",
    "nav.signup": "Registrarse",
    "hero.headline": "Fotografía el mundo. Desbloquea el catálogo.",
    "scan.identify": "Identificar con IA",
    "scan.confirm": "Confirmar",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.catalog": "Catalogue",
    "nav.scan": "Scanner",
    "nav.about": "À propos",
    "nav.contact": "Contact",
    "nav.terms": "Conditions",
    "nav.login": "Connexion",
    "nav.logout": "Déconnexion",
    "nav.signup": "S'inscrire",
    "hero.headline": "Photographiez le monde. Débloquez le catalogue.",
    "scan.identify": "Identifier avec l'IA",
    "scan.confirm": "Confirmer",
  },
  de: {
    "nav.home": "Start",
    "nav.catalog": "Katalog",
    "nav.scan": "Scannen",
    "nav.login": "Anmelden",
    "nav.logout": "Abmelden",
    "nav.signup": "Registrieren",
    "hero.headline": "Fotografiere die Welt. Schalte den Katalog frei.",
    "scan.identify": "Mit KI erkennen",
    "scan.confirm": "Bestätigen",
  },
  pt: {
    "nav.home": "Início",
    "nav.catalog": "Catálogo",
    "nav.scan": "Digitalizar",
    "nav.login": "Entrar",
    "nav.logout": "Sair",
    "nav.signup": "Criar conta",
    "hero.headline": "Fotografe o mundo. Desbloqueie o catálogo.",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.catalog": "الدليل",
    "nav.scan": "مسح",
    "nav.login": "تسجيل الدخول",
    "nav.logout": "خروج",
    "nav.signup": "إنشاء حساب",
    "hero.headline": "صوّر العالم. افتح الدليل.",
  },
  hi: {
    "nav.home": "होम",
    "nav.catalog": "कैटलॉग",
    "nav.scan": "स्कैन",
    "nav.login": "लॉग इन",
    "nav.signup": "साइन अप",
    "hero.headline": "दुनिया की तस्वीर लें। कैटलॉग अनलॉक करें।",
  },
  it: {
    "nav.home": "Home",
    "nav.catalog": "Catalogo",
    "nav.scan": "Scansiona",
    "nav.login": "Accedi",
    "nav.signup": "Registrati",
    "hero.headline": "Fotografa il mondo. Sblocca il catalogo.",
  },
  ru: {
    "nav.home": "Главная",
    "nav.catalog": "Каталог",
    "nav.scan": "Скан",
    "nav.login": "Вход",
    "nav.signup": "Регистрация",
    "hero.headline": "Сфотографируй мир. Открой каталог.",
  },
  th: {
    "nav.home": "หน้าแรก",
    "nav.catalog": "แคตตาล็อก",
    "nav.scan": "สแกน",
    "hero.headline": "ถ่ายภาพโลก ปลดล็อกแคตตาล็อก",
  },
  vi: {
    "nav.home": "Trang chủ",
    "nav.catalog": "Danh mục",
    "nav.scan": "Quét",
    "hero.headline": "Chụp thế giới. Mở khóa danh mục.",
  },
  id: {
    "nav.home": "Beranda",
    "nav.catalog": "Katalog",
    "nav.scan": "Pindai",
    "hero.headline": "Foto dunia. Buka katalog.",
  },
  tr: {
    "nav.home": "Ana sayfa",
    "nav.catalog": "Katalog",
    "nav.scan": "Tara",
    "hero.headline": "Dünyayı fotoğrafla. Kataloğu aç.",
  },
  nl: {
    "nav.home": "Home",
    "nav.catalog": "Catalogus",
    "nav.scan": "Scannen",
    "hero.headline": "Fotografeer de wereld. Ontgrendel de catalogus.",
  },
  pl: {
    "nav.home": "Start",
    "nav.catalog": "Katalog",
    "nav.scan": "Skanuj",
    "hero.headline": "Fotografuj świat. Odblokuj katalog.",
  },
  sv: {
    "nav.home": "Hem",
    "nav.catalog": "Katalog",
    "nav.scan": "Skanna",
    "hero.headline": "Fotografera världen. Lås upp katalogen.",
  },
};

export function translate(
  lang: string,
  key: MessageKey,
  vars?: Record<string, string>,
): string {
  const raw = packs[lang]?.[key] ?? en[key] ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, v),
    raw,
  );
}
