import { cleanTitle, isMostlyLatin, stripLanguageLabel } from "@/lib/summarize";
import type { Evidence, EvidenceBody, EvidenceLocalePack, LocaleCode } from "@/lib/types";

type PresentTemplates = {
  caption: (topic: string) => string;
  what: (topic: string) => string;
  where: (publisher: string) => string;
  when: string;
  how: (topic: string) => string;
  why: (topic: string) => string;
};

/**
 * Localized presentation copy. Captions stay unique via `topic`.
 * Visible text stays in one language — no source-language labels in UI copy.
 */
const TEMPLATES: Record<LocaleCode, PresentTemplates> = {
  en: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. This catalogue shows this summary in your selected language only.`,
    where: (p) => `Sourced from ${p}. Open the original links for the source page.`,
    when:
      "Timing follows the source publication and catalogue first-seen / last-seen timestamps.",
    how: (topic) =>
      `${topic} is argued through theory, analogy, experiment proposal, or cultural narrative.`,
    why: (topic) =>
      `${topic} is catalogued because people posted it as evidence or argument for a simulated universe.`,
  },
  zh: {
    caption: (topic) => topic,
    what: (topic) => `「${topic}」。本目录仅以您选择的语言呈现摘要。`,
    where: (p) => `来源：${p}。请打开原始链接查看原文页面。`,
    when: "时间依据来源发布与目录首次/最近收录时间戳。",
    how: (topic) => `「${topic}」通过理论、类比、实验设想或文化叙事提出。`,
    why: (topic) => `收录「${topic}」是因其被当作宇宙可能是模拟的证据或论点。`,
  },
  es: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. Este catálogo muestra este resumen solo en tu idioma seleccionado.`,
    where: (p) => `Obtenido de ${p}. Abre los enlaces originales para la página fuente.`,
    when: "El tiempo sigue la publicación de la fuente y las marcas de primera/última indexación.",
    how: (topic) =>
      `${topic} se argumenta mediante teoría, analogía, propuesta experimental o narrativa cultural.`,
    why: (topic) =>
      `${topic} se cataloga porque se publicó como evidencia o argumento de que el universo podría ser una simulación.`,
  },
  fr: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. Ce catalogue n'affiche ce résumé que dans votre langue sélectionnée.`,
    where: (p) => `Issu de ${p}. Ouvrez les liens d'origine pour la page source.`,
    when: "Le calendrier suit la publication source et les horodatages de première/dernière indexation.",
    how: (topic) =>
      `${topic} est avancé par la théorie, l'analogie, une proposition d'expérience ou un récit culturel.`,
    why: (topic) =>
      `${topic} est catalogué car présenté comme preuve ou argument que l'univers pourrait être une simulation.`,
  },
  de: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. Dieser Katalog zeigt diese Zusammenfassung nur in Ihrer gewählten Sprache.`,
    where: (p) => `Quelle: ${p}. Original-Links öffnen die Quellseite.`,
    when: "Der Zeitverlauf folgt der Quellenveröffentlichung und den First-/Last-Seen-Zeitstempeln.",
    how: (topic) =>
      `${topic} wird über Theorie, Analogie, Experimentvorschlag oder kulturelle Erzählung begründet.`,
    why: (topic) =>
      `${topic} ist katalogisiert, weil sie als Beleg oder Argument für ein simuliertes Universum gepostet wurde.`,
  },
  ja: {
    caption: (topic) => topic,
    what: (topic) =>
      `「${topic}」。このカタログは選択した言語のみで要約を表示します。`,
    where: (p) => `出典：${p}。原文ページはオリジナルリンクから。`,
    when: "時期は出典の公開と初回／最終インデックス日時に従います。",
    how: (topic) => `「${topic}」は理論・類推・実験提案・文化的語りとして示されます。`,
    why: (topic) =>
      `「${topic}」は宇宙がシミュレーションである証拠・論として投稿されたため収録しています。`,
  },
  ru: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. Этот каталог показывает это резюме только на выбранном языке.`,
    where: (p) => `Источник: ${p}. Откройте исходные ссылки для страницы источника.`,
    when: "Время следует публикации источника и меткам первой/последней индексации.",
    how: (topic) =>
      `${topic} обоснован теорией, аналогией, предложением эксперимента или культурным нарративом.`,
    why: (topic) =>
      `${topic} в каталоге, потому что это публиковали как доказательство или аргумент о симуляции вселенной.`,
  },
  pt: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. Este catálogo mostra este resumo apenas no idioma selecionado.`,
    where: (p) => `Obtido de ${p}. Abra as ligações originais para a página de origem.`,
    when: "O tempo segue a publicação da fonte e os carimbos de primeira/última indexação.",
    how: (topic) =>
      `${topic} é argumentado através de teoria, analogia, proposta experimental ou narrativa cultural.`,
    why: (topic) =>
      `${topic} é catalogado porque foi publicado como evidência ou argumento de que o universo pode ser uma simulação.`,
  },
  ar: {
    caption: (topic) => topic,
    what: (topic) => `${topic}. يعرض هذا الفهرس هذا الملخص بلغة اختيارك فقط.`,
    where: (p) => `المصدر: ${p}. افتح الروابط الأصلية لصفحة المصدر.`,
    when: "التوقيت يتبع نشر المصدر وختمَي أول/آخر فهرسة.",
    how: (topic) => `${topic} يُطرح عبر نظرية أو تشبيه أو اقتراح تجريبي أو سرد ثقافي.`,
    why: (topic) => `أُدرج ${topic} لأنه نُشر كدليل أو حجة على أن الكون قد يكون محاكاة.`,
  },
  ko: {
    caption: (topic) => topic,
    what: (topic) => `${topic}. 이 목록은 선택한 언어로만 요약을 보여 줍니다.`,
    where: (p) => `출처: ${p}. 원문 페이지는 원본 링크에서 확인하세요.`,
    when: "시점은 출처 게시와 최초/최근 색인 시각을 따릅니다.",
    how: (topic) => `${topic}은(는) 이론·비유·실험 제안·문화 서사로 제시됩니다.`,
    why: (topic) =>
      `${topic}은(는) 우주가 시뮬레이션일 수 있다는 증거·논거로 게시되어 수록했습니다.`,
  },
  hi: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. यह सूची यह सारांश केवल आपकी चुनी भाषा में दिखाता है।`,
    where: (p) => `स्रोत: ${p}। मूल लिंक से स्रोत पृष्ठ खोलें।`,
    when: "समय स्रोत प्रकाशन और पहली/अंतिम अनुक्रमणिका टाइमस्टैम्प का अनुसरण करता है।",
    how: (topic) =>
      `${topic} को सिद्धांत, सादृश्य, प्रयोग प्रस्ताव या सांस्कृतिक कथा से प्रस्तुत किया गया है।`,
    why: (topic) =>
      `${topic} इसलिए सूचीबद्ध है क्योंकि इसे सिम्युलेटेड ब्रह्मांड के साक्ष्य/तर्क के रूप में पोस्ट किया गया।`,
  },
  it: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. Questo catalogo mostra questo riepilogo solo nella lingua selezionata.`,
    where: (p) => `Da ${p}. Apri i link originali per la pagina sorgente.`,
    when: "I tempi seguono la pubblicazione della fonte e i timestamp di prima/ultima indicizzazione.",
    how: (topic) =>
      `${topic} è sostenuto con teoria, analogia, proposta sperimentale o narrazione culturale.`,
    why: (topic) =>
      `${topic} è catalogato perché pubblicato come prova o argomento che l'universo potrebbe essere una simulazione.`,
  },
  bn: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. এই তালিকা শুধু আপনার নির্বাচিত ভাষায় সারাংশ দেখায়।`,
    where: (p) => `উৎস: ${p}। মূল লিঙ্ক থেকে উৎস পাতা খুলুন।`,
    when: "সময় উৎস প্রকাশ ও প্রথম/শেষ সূচিকরণ টাইমস্ট্যাম্প অনুসরণ করে।",
    how: (topic) =>
      `${topic} তত্ত্ব, উপমা, পরীক্ষা প্রস্তাব বা সাংস্কৃতিক আখ্যান দিয়ে উপস্থাপিত।`,
    why: (topic) =>
      `${topic} তালিকাভুক্ত কারণ এটি সিমুলেটেড মহাবিশ্বের প্রমাণ/যুক্তি হিসেবে পোস্ট হয়েছিল।`,
  },
  id: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. Katalog ini menampilkan ringkasan ini hanya dalam bahasa yang Anda pilih.`,
    where: (p) => `Bersumber dari ${p}. Buka tautan asli untuk halaman sumber.`,
    when: "Waktu mengikuti publikasi sumber dan stempel pertama/terakhir diindeks.",
    how: (topic) =>
      `${topic} diajukan lewat teori, analogi, usulan eksperimen, atau narasi budaya.`,
    why: (topic) =>
      `${topic} dikatalogkan karena diposting sebagai bukti/argumen bahwa alam semesta bisa berupa simulasi.`,
  },
  tr: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. Bu katalog bu özeti yalnızca seçtiğiniz dilde gösterir.`,
    where: (p) => `Kaynak: ${p}. Kaynak sayfası için orijinal bağlantıları açın.`,
    when: "Zaman, kaynak yayını ile ilk/son dizin damgalarını izler.",
    how: (topic) =>
      `${topic}, kuram, benzetme, deney önerisi veya kültürel anlatı ile sunulur.`,
    why: (topic) =>
      `${topic}, evrenin bir simülasyon olabileceğine dair kanıt/argüman olarak paylaşıldığı için kataloglandı.`,
  },
  vi: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. Danh mục này chỉ hiện tóm tắt bằng ngôn ngữ bạn chọn.`,
    where: (p) => `Nguồn: ${p}. Mở liên kết gốc để xem trang nguồn.`,
    when: "Thời điểm theo xuất bản nguồn và dấu lần đầu/cuối được lập chỉ mục.",
    how: (topic) =>
      `${topic} được trình bày qua lý thuyết, ẩn dụ, đề xuất thí nghiệm hoặc tường thuật văn hóa.`,
    why: (topic) =>
      `${topic} được catalog vì được đăng như bằng chứng/lập luận rằng vũ trụ có thể là mô phỏng.`,
  },
  th: {
    caption: (topic) => topic,
    what: (topic) => `${topic}. แคตตาล็อกนี้แสดงสรุปนี้เฉพาะภาษาที่คุณเลือก`,
    where: (p) => `แหล่งที่มา: ${p} เปิดลิงก์ต้นฉบับเพื่อดูหน้าต้นทาง`,
    when: "เวลาอิงการเผยแพร่แหล่งที่มาและตราประทับครั้งแรก/ล่าสุดที่จัดทำดัชนี",
    how: (topic) =>
      `${topic} นำเสนอผ่านทฤษฎี อุปมา ข้อเสนอการทดลอง หรือเรื่องเล่าวัฒนธรรม`,
    why: (topic) =>
      `${topic} จัดทำรายการเพราะถูกโพสต์เป็นหลักฐาน/ข้อโต้แย้งว่าเอกภพอาจเป็นการจำลอง`,
  },
  pl: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. Ten katalog pokazuje to streszczenie tylko w wybranym języku.`,
    where: (p) => `Źródło: ${p}. Otwórz oryginalne linki, by zobaczyć stronę źródłową.`,
    when: "Czas wynika z publikacji źródła oraz znaczników pierwszej/ostatniej indeksacji.",
    how: (topic) =>
      `${topic} jest przedstawiane teorią, analogią, propozycją eksperymentu lub narracją kulturową.`,
    why: (topic) =>
      `${topic} jest skatalogowane, bo opublikowano je jako dowód lub argument, że wszechświat może być symulacją.`,
  },
  nl: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. Deze catalogus toont deze samenvatting alleen in uw geselecteerde taal.`,
    where: (p) => `Afkomstig van ${p}. Open de originele links voor de bronpagina.`,
    when: "De timing volgt de bronpublicatie en first-/last-seen-tijdstempels.",
    how: (topic) =>
      `${topic} wordt beargumenteerd via theorie, analogie, experimentvoorstel of cultureel verhaal.`,
    why: (topic) =>
      `${topic} is gecatalogiseerd omdat het is gepost als bewijs of argument dat het universum een simulatie kan zijn.`,
  },
  uk: {
    caption: (topic) => topic,
    what: (topic) =>
      `${topic}. Цей каталог показує цей підсумок лише вибраною мовою.`,
    where: (p) => `Джерело: ${p}. Відкрийте оригінальні посилання для сторінки джерела.`,
    when: "Час відповідає публікації джерела та міткам першої/останньої індексації.",
    how: (topic) =>
      `${topic} подано через теорію, аналогію, пропозицію експерименту або культурну оповідь.`,
    why: (topic) =>
      `${topic} у каталозі, бо його публікували як доказ або аргумент, що всесвіт може бути симуляцією.`,
  },
};

function publisherOf(evidence: Evidence): string {
  return evidence.sources[0]?.publisher || evidence.sources[0]?.url || "the open web";
}

function topicOf(evidence: Evidence): string {
  return cleanTitle(evidence.title || evidence.caption || "Untitled claim");
}

/** Rough check: does this string look incompatible with the UI locale script? */
function scriptMismatch(text: string, locale: LocaleCode): boolean {
  const sample = text.slice(0, 48);
  if (!sample.trim()) return false;
  if (locale === "zh" || locale === "ja" || locale === "ko") {
    return !/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(sample);
  }
  if (locale === "ar") return !/[\u0600-\u06ff]/.test(sample);
  if (locale === "ru" || locale === "uk") return !/[\u0400-\u04ff]/.test(sample);
  if (locale === "hi" || locale === "bn") {
    return !/[\u0900-\u097f\u0980-\u09ff]/.test(sample);
  }
  if (locale === "th") return !/[\u0e00-\u0e7f]/.test(sample);
  return /[\u0400-\u04ff\u0600-\u06ff\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0900-\u097f]/.test(
    sample,
  );
}

/** True when text is the wrong language for the UI (script OR foreign Latin in English UI). */
function wrongLanguageForUi(
  text: string,
  locale: LocaleCode,
  sourceLang?: string,
): boolean {
  if (scriptMismatch(text, locale)) return true;
  if (locale !== "en" || !sourceLang || sourceLang === "en") return false;
  const sample = text.slice(0, 160);
  // Seeded English claim sentences are fine even when the source is non-English.
  if (
    /\b(simulation|simulated|universe|reality|ancestor|catalogued|claim|odds|civilizations?)\b/i.test(
      sample,
    ) &&
    !/\b(simulación|hypothèse|hipótese|simulationshypothese|universo como|réalité simulée)\b/i.test(
      sample,
    )
  ) {
    return false;
  }
  return /\b(el|la|los|las|une|des|les|der|die|das|und|für|sur|avec|como|del|des|hypothèse|simulación|hipótese|wirklichkeit|réalité)\b/i.test(
    sample,
  );
}

function stableTag(evidence: Evidence): string {
  const raw = (evidence.id || evidence.slug || "claim").replace(/[^a-zA-Z0-9]/g, "");
  return (raw.slice(0, 6) || "claim").toLowerCase();
}

/** Legacy synthesizer wrote "模拟主张 · eality" from slug tails — never show those. */
function isTagStyleClaimLabel(text: string): boolean {
  return /^(模拟主张|シミュレーション主張|시뮬레이션 주장|Simulation claim|Claim|ادعاء محاكاة|Утверждение|सिमुलेशन दावा|সিমুলেশন দাবি|ข้ออ้างจำลอง)\s*[·•\-–—]\s*[a-z0-9_-]{1,12}$/i.test(
    text.trim(),
  );
}

function fallbackClaimLabel(evidence: Evidence, locale: LocaleCode): string {
  const tag = stableTag(evidence);
  if (locale === "en") return `Simulation claim · ${tag}`;
  if (locale === "zh") return `模拟主张 · ${tag}`;
  if (locale === "ja") return `シミュレーション主張 · ${tag}`;
  if (locale === "ko") return `시뮬레이션 주장 · ${tag}`;
  if (locale === "ar") return `ادعاء محاكاة · ${tag}`;
  if (locale === "ru" || locale === "uk") return `Утверждение · ${tag}`;
  if (locale === "hi") return `सिमुलेशन दावा · ${tag}`;
  if (locale === "bn") return `সিমুলেশন দাবি · ${tag}`;
  if (locale === "th") return `ข้ออ้างจำลอง · ${tag}`;
  return `Claim · ${tag}`;
}

/**
 * Prefer a source title written in the UI locale (e.g. Chinese Wikipedia title
 * when viewing in zh), so captions are not forced through English.
 */
function sameLocaleSourceTopic(evidence: Evidence, locale: LocaleCode): string {
  for (const source of evidence.sources || []) {
    if ((source.language || "").toLowerCase() !== locale) continue;
    const title = cleanTitle(source.title || "").trim();
    if (title && !scriptMismatch(title, locale) && !isTagStyleClaimLabel(title)) {
      return cleanVisibleText(title, locale);
    }
  }
  return "";
}

/**
 * Turn generic English-facing packs ("Simulation-hypothesis claim via Wikipedia (X)")
 * into a short phrase in the viewer's language.
 */
function localizeEnglishFacingCaption(caption: string, locale: LocaleCode): string {
  const m = caption.match(/^Simulation-hypothesis claim via\s+(.+)\s*$/i);
  if (!m) return "";
  let publisher = (m[1] || "").trim();
  let hint = "";
  // Outermost trailing "(…)" — handles nested titles like "Theia (pianeta ipotetico)".
  const paren = publisher.match(/^(.*?)\s*\((.+)\)\s*$/);
  if (paren) {
    publisher = paren[1].trim() || publisher;
    hint = paren[2].trim();
  }
  const topic = hint || publisher;
  const isWiki = /wikipedia/i.test(publisher);
  if (locale === "zh") {
    if (hint && isWiki) return `维基百科等来源中的模拟假说主张（${hint}）`;
    if (isWiki) return "维基百科等来源中的模拟假说主张";
    if (hint) return `${publisher}来源中的模拟假说主张（${hint}）`;
    return `${publisher || "网络"}来源中的模拟假说主张`;
  }
  if (locale === "ja") {
    return hint
      ? `シミュレーション仮説に関する主張（${hint}）`
      : `${publisher}におけるシミュレーション仮説の主張`;
  }
  if (locale === "ko") {
    return hint
      ? `시뮬레이션 가설 관련 주장（${hint}）`
      : `${publisher}의 시뮬레이션 가설 주장`;
  }
  if (locale === "es") {
    return `Afirmación sobre la hipótesis de simulación vía ${publisher}${hint ? ` (${hint})` : ""}`;
  }
  if (locale === "fr") {
    return `Affirmation sur l'hypothèse de simulation via ${publisher}${hint ? ` (${hint})` : ""}`;
  }
  if (locale === "de") {
    return `Simulationshypothese-Behauptung über ${publisher}${hint ? ` (${hint})` : ""}`;
  }
  if (locale === "ru") {
    return `Утверждение о гипотезе симуляции (${topic})`;
  }
  if (locale === "it") {
    return `Affermazione sull'ipotesi della simulazione via ${publisher}${hint ? ` (${hint})` : ""}`;
  }
  if (locale === "pt") {
    return `Afirmação sobre a hipótese da simulação via ${publisher}${hint ? ` (${hint})` : ""}`;
  }
  if (locale === "ar") {
    return `ادّعاء فرضية المحاكاة عبر ${publisher}${hint ? ` (${hint})` : ""}`;
  }
  return "";
}

function englishFallbackCaption(evidence: Evidence): string {
  const topic = topicOf(evidence);
  const enCaptionRaw = evidence.translations.en?.caption?.trim();
  if (enCaptionRaw) {
    const cleaned = cleanVisibleText(scrubBoilerplateCaption(enCaptionRaw, topic), "en");
    // Reject EN packs that still embed source-script titles.
    if (cleaned && !scriptMismatch(cleaned, "en") && !isTagStyleClaimLabel(cleaned)) {
      return cleaned;
    }
  }
  if (isMostlyLatin(topic) && !scriptMismatch(topic, "en")) {
    return cleanVisibleText(stripLanguageLabel(topic), "en");
  }
  return "";
}

function captionTopicForLocale(evidence: Evidence, locale: LocaleCode): string {
  const topic = topicOf(evidence);
  const sourceLang = evidence.language || evidence.languages[0] || "und";

  const localePackCaption = evidence.translations[locale]?.caption?.trim();
  if (localePackCaption) {
    const cleaned = cleanVisibleText(
      scrubBoilerplateCaption(localePackCaption, topic),
      locale,
    );
    // Accept locale pack when scripts match — but never legacy slug-tail labels.
    if (
      cleaned &&
      !scriptMismatch(cleaned, locale) &&
      !isTagStyleClaimLabel(cleaned)
    ) {
      return cleaned;
    }
  }

  // Same language as the source: native title is fine when scripts match.
  if (
    locale === sourceLang &&
    !scriptMismatch(topic, locale) &&
    !isTagStyleClaimLabel(topic)
  ) {
    return cleanVisibleText(topic, locale);
  }

  // Prefer a source already written in the UI locale (e.g. zh.wikipedia title).
  const localizedSource = sameLocaleSourceTopic(evidence, locale);
  if (localizedSource) return localizedSource;

  const enCaption = englishFallbackCaption(evidence);

  // English UI: never keep foreign / wrong-script headlines.
  if (locale === "en") {
    if (enCaption && !wrongLanguageForUi(enCaption, "en", sourceLang)) return enCaption;
    return fallbackClaimLabel(evidence, locale);
  }

  // Localize generic English-facing Wikipedia packs into the UI language.
  if (enCaption) {
    const localizedFacing = localizeEnglishFacingCaption(enCaption, locale);
    if (localizedFacing) return localizedFacing;
    // Real English claim sentences stay as lingua franca (never slug fragments).
    return enCaption;
  }

  return fallbackClaimLabel(evidence, locale);
}

/** Strip legacy boilerplate that made every catalogue row look the same. */
export function scrubBoilerplateCaption(caption: string, topic: string): string {
  let text = caption.replace(/\s+/g, " ").trim();
  if (isTagStyleClaimLabel(text)) return topic;
  text = text.replace(
    /^Documented (?:claim about simulated reality|simulated-reality claim)(?::|\s*\()\s*/i,
    "",
  );
  text = text.replace(/^Documented claim linked to simulated-reality discussion:\s*/i, "");
  text = text.replace(/\s*\(originally discussed in [^)]+\)\.?\s*$/i, "");
  text = text.replace(/^Afirmación documentada sobre realidad simulada[^:]*:\s*/i, "");
  text = text.replace(/^Affirmation documentée sur la réalité simulée[^:]*:\s*/i, "");
  text = stripLanguageLabel(text);
  text = text.trim().replace(/^:\s*/, "").replace(/\.$/, "");
  if (isTagStyleClaimLabel(text)) return topic;
  return text || topic;
}

export function isBoilerplateWhat(what: string): boolean {
  return /^A publicly discussed claim (?:connected to the simulation hypothesis|that reality may be computational)/i.test(
    what.trim(),
  );
}

function cleanVisibleText(text: string, _locale: LocaleCode): string {
  let out = stripLanguageLabel(text);
  // Drop parenthetical ISO codes left in "Sourced from Wikipedia (zh)".
  out = out.replace(/\(\s*[a-z]{2}(?:-[a-z]+)?\s*\)/gi, "");
  out = out.replace(/\s{2,}/g, " ").replace(/\s+([.,;:])/g, "$1").trim();
  return out;
}

function cleanBody(body: EvidenceBody, locale: LocaleCode): EvidenceBody {
  return {
    what: cleanVisibleText(body.what, locale),
    where: cleanVisibleText(body.where, locale),
    when: cleanVisibleText(body.when, locale),
    how: cleanVisibleText(body.how, locale),
    why: cleanVisibleText(body.why, locale),
  };
}

function synthesizePack(evidence: Evidence, locale: LocaleCode): EvidenceLocalePack {
  const tpl = TEMPLATES[locale] ?? TEMPLATES.en;
  const publisher = publisherOf(evidence);
  const topic = captionTopicForLocale(evidence, locale);
  return {
    caption: tpl.caption(topic),
    body: {
      what: tpl.what(topic),
      where: tpl.where(publisher),
      when: tpl.when,
      how: tpl.how(topic),
      why: tpl.why(topic),
    },
  };
}

function presentPack(
  pack: EvidenceLocalePack,
  evidence: Evidence,
  locale: LocaleCode,
): EvidenceLocalePack {
  const topic = captionTopicForLocale(evidence, locale);
  let caption = cleanVisibleText(scrubBoilerplateCaption(pack.caption, topic), locale);

  const sourceLang = evidence.language || evidence.languages[0] || "und";

  // Never keep a wrong-language or legacy slug-tail headline in the UI language.
  if (
    !caption ||
    isTagStyleClaimLabel(caption) ||
    wrongLanguageForUi(caption, locale, sourceLang)
  ) {
    caption = topic;
  }

  if (isBoilerplateWhat(pack.body.what)) {
    const synth = synthesizePack(evidence, locale);
    return {
      caption: caption || synth.caption,
      body: cleanBody({ ...synth.body, where: pack.body.where || synth.body.where }, locale),
    };
  }

  const body = cleanBody(pack.body, locale);
  // If stored "what" still mixes source language, or echoes legacy slug-tail labels, resynthesize.
  if (
    (locale !== evidence.language &&
      wrongLanguageForUi(body.what, locale, sourceLang)) ||
    isTagStyleClaimLabel(body.what) ||
    /模拟主张\s*[·•]/.test(body.what) ||
    /シミュレーション主張\s*[·•]/.test(body.what)
  ) {
    const synth = synthesizePack(evidence, locale);
    return { caption: caption || synth.caption, body: synth.body };
  }

  return { caption, body };
}

/**
 * Present evidence text only in the viewer's selected language.
 * Never surfaces source-language captions/summaries when the UI locale differs.
 */
export function presentEvidence(
  evidence: Evidence,
  locale: LocaleCode,
): {
  caption: string;
  body: EvidenceBody;
  available: boolean;
  presentation: "native" | "stored" | "synthesized";
} {
  const sourceLang = evidence.language || "en";
  const stored = evidence.translations[locale];
  const topic = topicOf(evidence);

  if (stored?.caption?.trim()) {
    const primary = evidence.caption || evidence.summary;
    if (locale !== sourceLang && stored.caption === primary && primary.trim()) {
      const synth = synthesizePack(evidence, locale);
      return { ...synth, available: true, presentation: "synthesized" };
    }
    const cleaned = presentPack(stored, evidence, locale);
    return {
      caption: cleaned.caption,
      body: cleaned.body,
      available: true,
      presentation: "stored",
    };
  }

  if (sourceLang === locale) {
    const caption = cleanVisibleText(
      scrubBoilerplateCaption(evidence.caption || evidence.summary || topic, topic),
      locale,
    );
    return {
      caption,
      body: isBoilerplateWhat(evidence.body.what)
        ? synthesizePack(evidence, locale).body
        : cleanBody(evidence.body, locale),
      available: true,
      presentation: "native",
    };
  }

  const synth = synthesizePack(evidence, locale);
  return { ...synth, available: true, presentation: "synthesized" };
}
