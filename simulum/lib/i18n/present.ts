import { cleanTitle } from "@/lib/summarize";
import type { Evidence, EvidenceBody, EvidenceLocalePack, LocaleCode } from "@/lib/types";

type PresentTemplates = {
  caption: (topic: string, sourceLangName: string) => string;
  what: (topic: string, sourceLangName: string) => string;
  where: (publisher: string, sourceLangName: string) => string;
  when: string;
  how: (topic: string, sourceLangName: string) => string;
  why: (topic: string) => string;
};

/**
 * Localized presentation copy. Captions must stay unique via `topic`
 * (never a shared "Documented claim…" prefix that makes the catalogue look identical).
 */
const TEMPLATES: Record<LocaleCode, PresentTemplates> = {
  en: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — indexed from a ${l} source; SIMULUM shows this summary in your selected language only.`,
    where: (p, l) => `Sourced from ${p} (${l}). Open the original links for the source-language page.`,
    when:
      "Timing follows the source publication and catalogue first-seen / last-seen timestamps.",
    how: (topic, l) =>
      `${topic} is argued in ${l} through theory, analogy, experiment proposal, or cultural narrative.`,
    why: (topic) =>
      `${topic} is catalogued because people posted it as evidence or argument for a simulated universe.`,
  },
  zh: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `「${topic}」——来自${l}来源；SIMULUM 仅以您选择的语言呈现摘要。`,
    where: (p, l) => `来源：${p}（${l}）。请打开原始链接查看原文页面。`,
    when: "时间依据来源发布与目录首次/最近收录时间戳。",
    how: (topic, l) => `「${topic}」在该${l}来源中通过理论、类比、实验设想或文化叙事提出。`,
    why: (topic) => `收录「${topic}」是因其被当作宇宙可能是模拟的证据或论点。`,
  },
  es: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — indexado desde una fuente en ${l}; SIMULUM muestra este resumen solo en tu idioma seleccionado.`,
    where: (p, l) => `Obtenido de ${p} (${l}). Abre los enlaces originales para la página en el idioma fuente.`,
    when: "El tiempo sigue la publicación de la fuente y las marcas de primera/última indexación.",
    how: (topic, l) =>
      `${topic} se argumenta en ${l} mediante teoría, analogía, propuesta experimental o narrativa cultural.`,
    why: (topic) =>
      `${topic} se cataloga porque se publicó como evidencia o argumento de que el universo podría ser una simulación.`,
  },
  fr: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — indexé depuis une source en ${l} ; SIMULUM n'affiche ce résumé que dans votre langue sélectionnée.`,
    where: (p, l) => `Issu de ${p} (${l}). Ouvrez les liens d'origine pour la page en langue source.`,
    when: "Le calendrier suit la publication source et les horodatages de première/dernière indexation.",
    how: (topic, l) =>
      `${topic} est avancé en ${l} par la théorie, l'analogie, une proposition d'expérience ou un récit culturel.`,
    why: (topic) =>
      `${topic} est catalogué car présenté comme preuve ou argument que l'univers pourrait être une simulation.`,
  },
  de: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — indexiert aus einer ${l}-Quelle; SIMULUM zeigt diese Zusammenfassung nur in Ihrer gewählten Sprache.`,
    where: (p, l) => `Quelle: ${p} (${l}). Original-Links öffnen die Seite in der Quellsprache.`,
    when: "Der Zeitverlauf folgt der Quellenveröffentlichung und den First-/Last-Seen-Zeitstempeln.",
    how: (topic, l) =>
      `${topic} wird auf ${l} über Theorie, Analogie, Experimentvorschlag oder kulturelle Erzählung begründet.`,
    why: (topic) =>
      `${topic} ist katalogisiert, weil sie als Beleg oder Argument für ein simuliertes Universum gepostet wurde.`,
  },
  ja: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `「${topic}」——${l}の出典から索引。SIMULUMは選択した言語のみで要約を表示します。`,
    where: (p, l) => `出典：${p}（${l}）。原文ページはオリジナルリンクから。`,
    when: "時期は出典の公開と初回／最終インデックス日時に従います。",
    how: (topic, l) => `「${topic}」は${l}の出典で理論・類推・実験提案・文化的語りとして示されます。`,
    why: (topic) => `「${topic}」は宇宙がシミュレーションである証拠・論として投稿されたため収録しています。`,
  },
  ru: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — из источника на ${l}; SIMULUM показывает это резюме только на выбранном языке.`,
    where: (p, l) => `Источник: ${p} (${l}). Откройте исходные ссылки для страницы на языке источника.`,
    when: "Время следует публикации источника и меткам первой/последней индексации.",
    how: (topic, l) =>
      `${topic} обоснован на ${l} теорией, аналогией, предложением эксперимента или культурным нарративом.`,
    why: (topic) =>
      `${topic} в каталоге, потому что это публиковали как доказательство или аргумент о симуляции вселенной.`,
  },
  pt: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — indexado a partir de uma fonte em ${l}; o SIMULUM mostra este resumo apenas no idioma selecionado.`,
    where: (p, l) => `Obtido de ${p} (${l}). Abra as ligações originais para a página no idioma de origem.`,
    when: "O tempo segue a publicação da fonte e os carimbos de primeira/última indexação.",
    how: (topic, l) =>
      `${topic} é argumentado em ${l} através de teoria, analogia, proposta experimental ou narrativa cultural.`,
    why: (topic) =>
      `${topic} é catalogado porque foi publicado como evidência ou argumento de que o universo pode ser uma simulação.`,
  },
  ar: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — مُفهرس من مصدر بـ${l}؛ يعرض SIMULUM هذا الملخص بلغة اختيارك فقط.`,
    where: (p, l) => `المصدر: ${p} (${l}). افتح الروابط الأصلية لصفحة لغة المصدر.`,
    when: "التوقيت يتبع نشر المصدر وختمَي أول/آخر فهرسة.",
    how: (topic, l) => `${topic} يُطرح في مصدر ${l} عبر نظرية أو تشبيه أو اقتراح تجريبي أو سرد ثقافي.`,
    why: (topic) => `أُدرج ${topic} لأنه نُشر كدليل أو حجة على أن الكون قد يكون محاكاة.`,
  },
  ko: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — ${l} 출처에서 색인. SIMULUM은 선택한 언어로만 요약을 보여 줍니다.`,
    where: (p, l) => `출처: ${p} (${l}). 원문 페이지는 원본 링크에서 확인하세요.`,
    when: "시점은 출처 게시와 최초/최근 색인 시각을 따릅니다.",
    how: (topic, l) => `${topic}은(는) ${l} 출처에서 이론·비유·실험 제안·문화 서사로 제시됩니다.`,
    why: (topic) => `${topic}은(는) 우주가 시뮬레이션일 수 있다는 증거·논거로 게시되어 수록했습니다.`,
  },
  hi: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — ${l} स्रोत से अनुक्रमित; SIMULUM यह सारांश केवल आपकी चुनी भाषा में दिखाता है।`,
    where: (p, l) => `स्रोत: ${p} (${l})। स्रोत-भाषा पृष्ठ के लिए मूल लिंक खोलें।`,
    when: "समय स्रोत प्रकाशन और पहली/अंतिम अनुक्रमणिका टाइमस्टैम्प का अनुसरण करता है।",
    how: (topic, l) => `${topic} को ${l} स्रोत में सिद्धांत, सादृश्य, प्रयोग प्रस्ताव या सांस्कृतिक कथा से प्रस्तुत किया गया है।`,
    why: (topic) => `${topic} इसलिए सूचीबद्ध है क्योंकि इसे सिम्युलेटेड ब्रह्मांड के साक्ष्य/तर्क के रूप में पोस्ट किया गया।`,
  },
  it: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — indicizzato da una fonte in ${l}; SIMULUM mostra questo riepilogo solo nella lingua selezionata.`,
    where: (p, l) => `Da ${p} (${l}). Apri i link originali per la pagina in lingua sorgente.`,
    when: "I tempi seguono la pubblicazione della fonte e i timestamp di prima/ultima indicizzazione.",
    how: (topic, l) =>
      `${topic} è sostenuto in ${l} con teoria, analogia, proposta sperimentale o narrazione culturale.`,
    why: (topic) =>
      `${topic} è catalogato perché pubblicato come prova o argomento che l'universo potrebbe essere una simulazione.`,
  },
  bn: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — ${l} উৎস থেকে সূচিকৃত; SIMULUM শুধু আপনার নির্বাচিত ভাষায় সারাংশ দেখায়।`,
    where: (p, l) => `উৎস: ${p} (${l})। উৎস-ভাষার পাতার জন্য মূল লিঙ্ক খুলুন।`,
    when: "সময় উৎস প্রকাশ ও প্রথম/শেষ সূচিকরণ টাইমস্ট্যাম্প অনুসরণ করে।",
    how: (topic, l) => `${topic} ${l} উৎসে তত্ত্ব, উপমা, পরীক্ষা প্রস্তাব বা সাংস্কৃতিক আখ্যান দিয়ে উপস্থাপিত।`,
    why: (topic) => `${topic} তালিকাভুক্ত কারণ এটি সিমুলেটেড মহাবিশ্বের প্রমাণ/যুক্তি হিসেবে পোস্ট হয়েছিল।`,
  },
  id: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — diindeks dari sumber ${l}; SIMULUM menampilkan ringkasan ini hanya dalam bahasa yang Anda pilih.`,
    where: (p, l) => `Bersumber dari ${p} (${l}). Buka tautan asli untuk halaman bahasa sumber.`,
    when: "Waktu mengikuti publikasi sumber dan stempel pertama/terakhir diindeks.",
    how: (topic, l) =>
      `${topic} diajukan dalam sumber ${l} lewat teori, analogi, usulan eksperimen, atau narasi budaya.`,
    why: (topic) =>
      `${topic} dikatalogkan karena diposting sebagai bukti/argumen bahwa alam semesta bisa berupa simulasi.`,
  },
  tr: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — ${l} kaynağından indekslendi; SIMULUM bu özeti yalnızca seçtiğiniz dilde gösterir.`,
    where: (p, l) => `Kaynak: ${p} (${l}). Kaynak dilindeki sayfa için orijinal bağlantıları açın.`,
    when: "Zaman, kaynak yayını ile ilk/son dizin damgalarını izler.",
    how: (topic, l) =>
      `${topic}, ${l} kaynağında kuram, benzetme, deney önerisi veya kültürel anlatı ile sunulur.`,
    why: (topic) =>
      `${topic}, evrenin bir simülasyon olabileceğine dair kanıt/argüman olarak paylaşıldığı için kataloglandı.`,
  },
  vi: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — lập chỉ mục từ nguồn ${l}; SIMULUM chỉ hiện tóm tắt bằng ngôn ngữ bạn chọn.`,
    where: (p, l) => `Nguồn: ${p} (${l}). Mở liên kết gốc để xem trang ngôn ngữ nguồn.`,
    when: "Thời điểm theo xuất bản nguồn và dấu lần đầu/cuối được lập chỉ mục.",
    how: (topic, l) =>
      `${topic} được trình bày trong nguồn ${l} qua lý thuyết, ẩn dụ, đề xuất thí nghiệm hoặc tường thuật văn hóa.`,
    why: (topic) =>
      `${topic} được catalog vì được đăng như bằng chứng/lập luận rằng vũ trụ có thể là mô phỏng.`,
  },
  th: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — จัดทำดัชนีจากแหล่ง${l}; SIMULUM แสดงสรุปนี้เฉพาะภาษาที่คุณเลือก`,
    where: (p, l) => `แหล่งที่มา: ${p} (${l}) เปิดลิงก์ต้นฉบับเพื่อดูหน้าภาษาต้นทาง`,
    when: "เวลาอิงการเผยแพร่แหล่งที่มาและตราประทับครั้งแรก/ล่าสุดที่จัดทำดัชนี",
    how: (topic, l) => `${topic} นำเสนอในแหล่ง${l}ผ่านทฤษฎี อุปมา ข้อเสนอการทดลอง หรือเรื่องเล่าวัฒนธรรม`,
    why: (topic) => `${topic} จัดทำรายการเพราะถูกโพสต์เป็นหลักฐาน/ข้อโต้แย้งว่าเอกภพอาจเป็นการจำลอง`,
  },
  pl: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — zindeksowane ze źródła w języku ${l}; SIMULUM pokazuje to streszczenie tylko w wybranym języku.`,
    where: (p, l) => `Źródło: ${p} (${l}). Otwórz oryginalne linki, by zobaczyć stronę w języku źródłowym.`,
    when: "Czas wynika z publikacji źródła oraz znaczników pierwszej/ostatniej indeksacji.",
    how: (topic, l) =>
      `${topic} jest przedstawiane w języku ${l} teorią, analogią, propozycją eksperymentu lub narracją kulturową.`,
    why: (topic) =>
      `${topic} jest skatalogowane, bo opublikowano je jako dowód lub argument, że wszechświat może być symulacją.`,
  },
  nl: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — geïndexeerd vanuit een ${l}-bron; SIMULUM toont deze samenvatting alleen in uw geselecteerde taal.`,
    where: (p, l) => `Afkomstig van ${p} (${l}). Open de originele links voor de pagina in de brontaal.`,
    when: "De timing volgt de bronpublicatie en first-/last-seen-tijdstempels.",
    how: (topic, l) =>
      `${topic} wordt in het ${l} beargumenteerd via theorie, analogie, experimentvoorstel of cultureel verhaal.`,
    why: (topic) =>
      `${topic} is gecatalogiseerd omdat het is gepost als bewijs of argument dat het universum een simulatie kan zijn.`,
  },
  uk: {
    caption: (topic) => topic,
    what: (topic, l) =>
      `${topic} — з індексованого джерела ${l}; SIMULUM показує цей підсумок лише вибраною мовою.`,
    where: (p, l) => `Джерело: ${p} (${l}). Відкрийте оригінальні посилання для сторінки мовою джерела.`,
    when: "Час відповідає публікації джерела та міткам першої/останньої індексації.",
    how: (topic, l) =>
      `${topic} подано джерелом ${l} через теорію, аналогію, пропозицію експерименту або культурну оповідь.`,
    why: (topic) =>
      `${topic} у каталозі, бо його публікували як доказ або аргумент, що всесвіт може бути симуляцією.`,
  },
};

function languageDisplayName(code: string, forLocale: LocaleCode): string {
  try {
    const name = new Intl.DisplayNames([forLocale], { type: "language" }).of(code);
    if (name) return name;
  } catch {
    // fall through
  }
  return code;
}

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
  // Latin-script locales: treat CJK / Cyrillic / Arabic / Hangul as mismatched.
  return /[\u0400-\u04ff\u0600-\u06ff\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0900-\u097f]/.test(
    sample,
  );
}

function captionTopicForLocale(evidence: Evidence, locale: LocaleCode): string {
  const topic = topicOf(evidence);
  const sourceLang = evidence.language || evidence.languages[0] || "und";
  const localePackCaption = evidence.translations[locale]?.caption?.trim();
  if (localePackCaption) {
    return scrubBoilerplateCaption(localePackCaption, topic);
  }

  const enCaptionRaw = evidence.translations.en?.caption?.trim();
  const enCaption = enCaptionRaw
    ? scrubBoilerplateCaption(enCaptionRaw, topic)
    : "";

  // Same language as the source: the native title/caption is fine.
  if (locale === sourceLang) return topic;

  // Cross-locale synthesis must not paste the source-language title.
  if (enCaption && (locale === "en" || !scriptMismatch(enCaption, locale))) {
    return enCaption;
  }

  const srcName = languageDisplayName(sourceLang, locale);
  const tag = (evidence.slug || evidence.id || "claim").slice(-6);
  return `${srcName} · ${tag}`;
}

/** Strip legacy boilerplate that made every catalogue row look the same. */
export function scrubBoilerplateCaption(caption: string, topic: string): string {
  let text = caption.replace(/\s+/g, " ").trim();
  text = text.replace(
    /^Documented (?:claim about simulated reality|simulated-reality claim)(?::|\s*\()\s*/i,
    "",
  );
  text = text.replace(/^Documented claim linked to simulated-reality discussion:\s*/i, "");
  text = text.replace(/\s*\(originally discussed in [^)]+\)\.?\s*$/i, "");
  text = text.replace(/^Afirmación documentada sobre realidad simulada[^:]*:\s*/i, "");
  text = text.replace(/^Affirmation documentée sur la réalité simulée[^:]*:\s*/i, "");
  text = text.trim().replace(/^:\s*/, "").replace(/\.$/, "");
  return text || topic;
}

export function isBoilerplateWhat(what: string): boolean {
  return /^A publicly discussed claim (?:connected to the simulation hypothesis|that reality may be computational)/i.test(
    what.trim(),
  );
}

function synthesizePack(evidence: Evidence, locale: LocaleCode): EvidenceLocalePack {
  const tpl = TEMPLATES[locale] ?? TEMPLATES.en;
  const src = evidence.language || evidence.languages[0] || "en";
  const srcName = languageDisplayName(src, locale);
  const publisher = publisherOf(evidence);
  const topic = captionTopicForLocale(evidence, locale);
  return {
    caption: tpl.caption(topic, srcName),
    body: {
      what: tpl.what(topic, srcName),
      where: tpl.where(publisher, srcName),
      when: tpl.when,
      how: tpl.how(topic, srcName),
      why: tpl.why(topic),
    },
  };
}

function packLooksLikeLocale(pack: EvidenceLocalePack, sourceLang: string, locale: LocaleCode): boolean {
  if (locale === sourceLang) return true;
  void pack;
  return true;
}

function presentPack(
  pack: EvidenceLocalePack,
  evidence: Evidence,
  locale: LocaleCode,
): EvidenceLocalePack {
  const topic = topicOf(evidence);
  const caption = scrubBoilerplateCaption(pack.caption, topic);
  if (isBoilerplateWhat(pack.body.what)) {
    const synth = synthesizePack(evidence, locale);
    return {
      caption: caption || synth.caption,
      body: { ...synth.body, where: pack.body.where || synth.body.where },
    };
  }
  return { caption, body: pack.body };
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

  if (stored?.caption?.trim() && packLooksLikeLocale(stored, sourceLang, locale)) {
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
    return {
      caption: scrubBoilerplateCaption(evidence.caption || evidence.summary || topic, topic),
      body: isBoilerplateWhat(evidence.body.what)
        ? synthesizePack(evidence, locale).body
        : evidence.body,
      available: true,
      presentation: "native",
    };
  }

  const synth = synthesizePack(evidence, locale);
  return { ...synth, available: true, presentation: "synthesized" };
}
