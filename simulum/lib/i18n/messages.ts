import type { LocaleCode } from "@/lib/types";

export type MessageKey =
  | "nav.home"
  | "nav.evidence"
  | "nav.categories"
  | "nav.scanLog"
  | "brand.tag"
  | "hero.kicker"
  | "hero.blurb"
  | "hero.counting"
  | "hero.languages"
  | "hero.lastScan"
  | "hero.jump"
  | "hero.categories"
  | "home.latest"
  | "home.latestBlurb"
  | "home.viewAll"
  | "home.categories"
  | "home.categoriesBlurb"
  | "evidence.title"
  | "evidence.blurb"
  | "evidence.empty"
  | "categories.title"
  | "categories.blurb"
  | "detail.sources"
  | "detail.languages"
  | "detail.firstSeen"
  | "detail.what"
  | "detail.where"
  | "detail.when"
  | "detail.how"
  | "detail.why"
  | "detail.images"
  | "detail.ratings"
  | "detail.expand"
  | "detail.collapse"
  | "detail.original"
  | "detail.related"
  | "detail.similarity"
  | "detail.sameCategory"
  | "detail.contentSimilar"
  | "detail.both"
  | "scanLog.title"
  | "scanLog.blurb"
  | "scanLog.schedule"
  | "scanLog.sourcesScanned"
  | "scanLog.relevant"
  | "scanLog.inserted"
  | "scanLog.merged"
  | "scanLog.empty"
  | "footer.note"
  | "lang.label";

type Dict = Record<MessageKey, string>;

const en: Dict = {
  "nav.home": "Home",
  "nav.evidence": "Catalogue",
  "nav.categories": "Categories",
  "nav.scanLog": "Scan log",
  "brand.tag": "evidence index",
  "hero.kicker": "Worldwide · multilingual · deduplicated",
  "hero.blurb":
    "Unique evidence people have posted that our universe is simulated — scanned across languages, merged when it is the same claim, counted when it is new.",
  "hero.counting": "unique evidence · and counting",
  "hero.languages": "languages indexed",
  "hero.lastScan": "last scan",
  "hero.jump": "Enter the catalogue",
  "hero.categories": "Explore categories",
  "home.latest": "Latest unique evidence",
  "home.latestBlurb":
    "New candidates are compared to the catalogue. Matches merge into existing entries; only distinct claims raise the count.",
  "home.viewAll": "View all →",
  "home.categories": "Categories",
  "home.categoriesBlurb": "One piece of evidence can sit in several categories at once.",
  "evidence.title": "Catalogue",
  "evidence.blurb":
    "unique claims after worldwide deduplication. Captions are summarised — not raw article text.",
  "evidence.empty": "No evidence in this language yet.",
  "categories.title": "Categories",
  "categories.blurb":
    "Evidence can belong to multiple categories. Counts show unique claims in each lane.",
  "detail.sources": "Sources",
  "detail.languages": "Languages",
  "detail.firstSeen": "First seen",
  "detail.what": "What",
  "detail.where": "Where",
  "detail.when": "When",
  "detail.how": "How",
  "detail.why": "Why",
  "detail.images": "Source imagery",
  "detail.ratings": "Evidence metrics",
  "detail.expand": "Show rating details",
  "detail.collapse": "Hide rating details",
  "detail.original": "Original links",
  "detail.related": "Related & similar evidence",
  "detail.similarity": "Similarity",
  "detail.sameCategory": "Same category",
  "detail.contentSimilar": "Content similar",
  "detail.both": "Same category + similar",
  "scanLog.title": "Scan log",
  "scanLog.blurb":
    "Each daily worldwide scan records how many sources were checked and how many were kept as relevant evidence.",
  "scanLog.schedule": "Daily schedule",
  "scanLog.sourcesScanned": "Sources scanned",
  "scanLog.relevant": "Relevant sourced",
  "scanLog.inserted": "New unique",
  "scanLog.merged": "Merged",
  "scanLog.empty": "No scan runs recorded yet.",
  "footer.note":
    "SIMULUM catalogues publicly discussed claims. Inclusion is not endorsement of truth.",
  "lang.label": "Language",
};

const zh: Dict = {
  ...en,
  "nav.home": "首页",
  "nav.evidence": "目录",
  "nav.categories": "分类",
  "nav.scanLog": "扫描日志",
  "brand.tag": "证据索引",
  "hero.kicker": "全球 · 多语言 · 去重合并",
  "hero.blurb":
    "人们发布的、认为宇宙是模拟的独特证据——跨语言扫描，相同主张合并，新主张才计入。",
  "hero.counting": "独特证据 · 持续增加",
  "hero.languages": "种语言已索引",
  "hero.lastScan": "最近扫描",
  "hero.jump": "进入完整目录",
  "hero.categories": "浏览分类",
  "home.latest": "最新独特证据",
  "home.latestBlurb": "新候选会与目录比对；匹配则合并，仅新主张增加计数。",
  "home.viewAll": "查看全部 →",
  "home.categories": "分类",
  "home.categoriesBlurb": "同一证据可属于多个分类。",
  "evidence.title": "目录",
  "evidence.blurb": "条经全球去重后的独特主张。标题为摘要说明，而非原文照搬。",
  "evidence.empty": "该语言暂无证据。",
  "categories.title": "分类",
  "categories.blurb": "证据可属于多个分类；数字为各分类中的独特主张数。",
  "detail.sources": "来源",
  "detail.languages": "语言",
  "detail.firstSeen": "首次收录",
  "detail.what": "是什么",
  "detail.where": "在哪里",
  "detail.when": "何时",
  "detail.how": "如何论证",
  "detail.why": "为何收录",
  "detail.images": "来源图像",
  "detail.ratings": "证据指标",
  "detail.expand": "展开评分细节",
  "detail.collapse": "收起评分细节",
  "detail.original": "原始链接",
  "detail.related": "相关与相似证据",
  "detail.similarity": "相似度",
  "detail.sameCategory": "相同分类",
  "detail.contentSimilar": "内容相似",
  "detail.both": "同分类且相似",
  "scanLog.title": "扫描日志",
  "scanLog.blurb": "每日全球扫描记录检查了多少来源、保留了多少相关证据。",
  "scanLog.schedule": "每日计划",
  "scanLog.sourcesScanned": "已扫描来源",
  "scanLog.relevant": "相关收录",
  "scanLog.inserted": "新增独特",
  "scanLog.merged": "已合并",
  "scanLog.empty": "尚无扫描记录。",
  "footer.note": "SIMULUM 收录公开讨论中的主张，收录不等于认同其真实性。",
  "lang.label": "语言",
};

function localeOverlay(partial: Partial<Dict>): Dict {
  return { ...en, ...partial };
}

const TABLES: Record<LocaleCode, Dict> = {
  en,
  zh,
  es: localeOverlay({
    "nav.home": "Inicio",
    "nav.evidence": "Catálogo",
    "nav.categories": "Categorías",
    "nav.scanLog": "Registro",
    "hero.jump": "Entrar al catálogo",
    "hero.counting": "evidencias únicas · y contando",
    "detail.what": "Qué",
    "detail.where": "Dónde",
    "detail.when": "Cuándo",
    "detail.how": "Cómo",
    "detail.why": "Por qué",
    "detail.original": "Enlaces originales",
    "detail.related": "Evidencia relacionada y similar",
    "detail.similarity": "Similitud",
    "lang.label": "Idioma",
  }),
  fr: localeOverlay({
    "nav.home": "Accueil",
    "nav.evidence": "Catalogue",
    "nav.categories": "Catégories",
    "nav.scanLog": "Journal",
    "hero.jump": "Entrer dans le catalogue",
    "hero.counting": "preuves uniques · et ça compte",
    "detail.what": "Quoi",
    "detail.where": "Où",
    "detail.when": "Quand",
    "detail.how": "Comment",
    "detail.why": "Pourquoi",
    "detail.original": "Liens d'origine",
    "detail.related": "Preuves liées et similaires",
    "detail.similarity": "Similarité",
    "lang.label": "Langue",
  }),
  de: localeOverlay({
    "nav.home": "Start",
    "nav.evidence": "Katalog",
    "nav.categories": "Kategorien",
    "nav.scanLog": "Scan-Protokoll",
    "hero.jump": "Zum Katalog",
    "hero.counting": "einzigartige Evidenz · und zählend",
    "detail.what": "Was",
    "detail.where": "Wo",
    "detail.when": "Wann",
    "detail.how": "Wie",
    "detail.why": "Warum",
    "detail.original": "Original-Links",
    "detail.related": "Verwandte & ähnliche Evidenz",
    "detail.similarity": "Ähnlichkeit",
    "lang.label": "Sprache",
  }),
  ja: localeOverlay({
    "nav.home": "ホーム",
    "nav.evidence": "カタログ",
    "nav.categories": "カテゴリ",
    "nav.scanLog": "スキャンログ",
    "hero.jump": "カタログへ",
    "hero.counting": "ユニークな証拠 · 増加中",
    "detail.what": "何を",
    "detail.where": "どこで",
    "detail.when": "いつ",
    "detail.how": "どのように",
    "detail.why": "なぜ",
    "detail.original": "元リンク",
    "detail.related": "関連・類似の証拠",
    "detail.similarity": "類似度",
    "lang.label": "言語",
  }),
  ru: localeOverlay({
    "nav.home": "Главная",
    "nav.evidence": "Каталог",
    "nav.categories": "Категории",
    "nav.scanLog": "Журнал сканирования",
    "hero.jump": "Открыть каталог",
    "hero.counting": "уникальных доказательств · и счёт идёт",
    "detail.what": "Что",
    "detail.where": "Где",
    "detail.when": "Когда",
    "detail.how": "Как",
    "detail.why": "Почему",
    "detail.original": "Исходные ссылки",
    "detail.related": "Связанные и похожие",
    "detail.similarity": "Сходство",
    "lang.label": "Язык",
  }),
  pt: localeOverlay({
    "nav.home": "Início",
    "nav.evidence": "Catálogo",
    "nav.categories": "Categorias",
    "nav.scanLog": "Registo",
    "hero.jump": "Entrar no catálogo",
    "detail.what": "O quê",
    "detail.where": "Onde",
    "detail.when": "Quando",
    "detail.how": "Como",
    "detail.why": "Porquê",
    "detail.original": "Ligações originais",
    "detail.related": "Evidência relacionada e semelhante",
    "lang.label": "Idioma",
  }),
  ar: localeOverlay({
    "nav.home": "الرئيسية",
    "nav.evidence": "الفهرس",
    "nav.categories": "التصنيفات",
    "nav.scanLog": "سجل الفحص",
    "hero.jump": "ادخل الفهرس",
    "detail.what": "ماذا",
    "detail.where": "أين",
    "detail.when": "متى",
    "detail.how": "كيف",
    "detail.why": "لماذا",
    "detail.original": "الروابط الأصلية",
    "detail.related": "أدلة ذات صلة ومشابهة",
    "detail.similarity": "التشابه",
    "lang.label": "اللغة",
  }),
  ko: localeOverlay({
    "nav.home": "홈",
    "nav.evidence": "목록",
    "nav.categories": "분류",
    "nav.scanLog": "스캔 로그",
    "hero.jump": "목록 열기",
    "detail.what": "무엇",
    "detail.where": "어디",
    "detail.when": "언제",
    "detail.how": "어떻게",
    "detail.why": "왜",
    "detail.original": "원본 링크",
    "detail.related": "관련·유사 증거",
    "detail.similarity": "유사도",
    "lang.label": "언어",
  }),
  hi: localeOverlay({
    "nav.home": "होम",
    "nav.evidence": "कैटलॉग",
    "nav.categories": "श्रेणियाँ",
    "nav.scanLog": "स्कैन लॉग",
    "hero.jump": "कैटलॉग खोलें",
    "detail.what": "क्या",
    "detail.where": "कहाँ",
    "detail.when": "कब",
    "detail.how": "कैसे",
    "detail.why": "क्यों",
    "detail.original": "मूल लिंक",
    "detail.related": "संबंधित और समान साक्ष्य",
    "detail.similarity": "समानता",
    "lang.label": "भाषा",
  }),
  it: localeOverlay({
    "nav.home": "Home",
    "nav.evidence": "Catalogo",
    "nav.categories": "Categorie",
    "nav.scanLog": "Registro scansioni",
    "hero.jump": "Entra nel catalogo",
    "detail.what": "Cosa",
    "detail.where": "Dove",
    "detail.when": "Quando",
    "detail.how": "Come",
    "detail.why": "Perché",
    "detail.original": "Link originali",
    "detail.related": "Prove correlate e simili",
    "detail.similarity": "Similarità",
    "lang.label": "Lingua",
  }),
};

export function t(locale: LocaleCode, key: MessageKey): string {
  return TABLES[locale]?.[key] ?? TABLES.en[key] ?? key;
}

export function assertAllLocalesHaveKeys(): string[] {
  const keys = Object.keys(en) as MessageKey[];
  const missing: string[] = [];
  for (const locale of Object.keys(TABLES) as LocaleCode[]) {
    for (const key of keys) {
      if (!TABLES[locale][key]) missing.push(`${locale}:${key}`);
    }
  }
  return missing;
}
