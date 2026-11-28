import type { Evidence, EvidenceBody, EvidenceLocalePack, LocaleCode } from "@/lib/types";

type PresentTemplates = {
  caption: (sourceLangName: string) => string;
  what: (sourceLangName: string) => string;
  where: (publisher: string, sourceLangName: string) => string;
  when: string;
  how: (sourceLangName: string) => string;
  why: string;
};

/** Fully localized copy — never pastes source-language article text into another UI locale. */
const TEMPLATES: Record<LocaleCode, PresentTemplates> = {
  en: {
    caption: (l) => `Documented simulated-reality claim (originally discussed in ${l})`,
    what: (l) =>
      `A publicly discussed claim that reality may be computational or simulated. The source text was written in ${l}; SIMULUM shows this summary in your selected language only.`,
    where: (p, l) => `Sourced from ${p} (${l}). Open the original links for the source-language page.`,
    when:
      "Timing follows the source publication and catalogue first-seen / last-seen timestamps.",
    how: (l) =>
      `The ${l} source argues the claim through theory, analogy, experiment proposal, or cultural narrative.`,
    why: "Catalogued because people posted it as evidence or argument that the universe could be a simulation.",
  },
  zh: {
    caption: (l) => `已记录的模拟现实主张（原以${l}讨论）`,
    what: (l) =>
      `一项公开讨论的主张：现实可能是计算或模拟的。原文为${l}；SIMULUM 仅以您选择的语言呈现摘要。`,
    where: (p, l) => `来源：${p}（${l}）。请打开原始链接查看原文页面。`,
    when: "时间依据来源发布与目录首次/最近收录时间戳。",
    how: (l) => `该${l}来源通过理论、类比、实验设想或文化叙事提出主张。`,
    why: "因其被当作宇宙可能是模拟的证据或论点而收录。",
  },
  es: {
    caption: (l) => `Afirmación documentada sobre realidad simulada (discutida originalmente en ${l})`,
    what: (l) =>
      `Una afirmación pública de que la realidad podría ser computacional o simulada. El texto fuente está en ${l}; SIMULUM muestra este resumen solo en tu idioma seleccionado.`,
    where: (p, l) => `Obtenido de ${p} (${l}). Abre los enlaces originales para la página en el idioma fuente.`,
    when: "El tiempo sigue la publicación de la fuente y las marcas de primera/última indexación.",
    how: (l) =>
      `La fuente en ${l} argumenta la afirmación mediante teoría, analogía, propuesta experimental o narrativa cultural.`,
    why: "Se cataloga porque se publicó como evidencia o argumento de que el universo podría ser una simulación.",
  },
  fr: {
    caption: (l) => `Affirmation documentée sur la réalité simulée (discutée à l'origine en ${l})`,
    what: (l) =>
      `Une affirmation publique selon laquelle la réalité pourrait être computationnelle ou simulée. Le texte source est en ${l} ; SIMULUM n'affiche ce résumé que dans votre langue sélectionnée.`,
    where: (p, l) => `Issu de ${p} (${l}). Ouvrez les liens d'origine pour la page en langue source.`,
    when: "Le calendrier suit la publication source et les horodatages de première/dernière indexation.",
    how: (l) =>
      `La source en ${l} avance l'affirmation par la théorie, l'analogie, une proposition d'expérience ou un récit culturel.`,
    why: "Cataloguée car présentée comme preuve ou argument que l'univers pourrait être une simulation.",
  },
  de: {
    caption: (l) => `Dokumentierte Simulations-Realitäts-Behauptung (ursprünglich auf ${l} diskutiert)`,
    what: (l) =>
      `Eine öffentlich diskutierte Behauptung, dass die Realität rechnerisch oder simuliert sein könnte. Der Quelltext ist auf ${l}; SIMULUM zeigt diese Zusammenfassung nur in Ihrer gewählten Sprache.`,
    where: (p, l) => `Quelle: ${p} (${l}). Original-Links öffnen die Seite in der Quellsprache.`,
    when: "Der Zeitverlauf folgt der Quellenveröffentlichung und den First-/Last-Seen-Zeitstempeln.",
    how: (l) =>
      `Die ${l}-Quelle begründet die Behauptung über Theorie, Analogie, Experimentvorschlag oder kulturelle Erzählung.`,
    why: "Katalogisiert, weil sie als Beleg oder Argument dafür gepostet wurde, dass das Universum eine Simulation sein könnte.",
  },
  ja: {
    caption: (l) => `記録されたシミュレーション現実の主張（元は${l}で議論）`,
    what: (l) =>
      `現実が計算的／シミュレートされている可能性についての公開の主張です。原文は${l}で、SIMULUMは選択した言語のみで要約を表示します。`,
    where: (p, l) => `出典：${p}（${l}）。原文ページはオリジナルリンクから。`,
    when: "時期は出典の公開と初回／最終インデックス日時に従います。",
    how: (l) => `${l}の出典は理論・類推・実験提案・文化的語りで主張します。`,
    why: "宇宙がシミュレーションである証拠・論として投稿されたため収録しています。",
  },
  ru: {
    caption: (l) => `Задокументированное утверждение о симуляции реальности (изначально на ${l})`,
    what: (l) =>
      `Публичное утверждение, что реальность может быть вычислительной или симулированной. Исходный текст на ${l}; SIMULUM показывает это резюме только на выбранном языке.`,
    where: (p, l) => `Источник: ${p} (${l}). Откройте исходные ссылки для страницы на языке источника.`,
    when: "Время следует публикации источника и меткам первой/последней индексации.",
    how: (l) =>
      `Источник на ${l} обосновывает утверждение теорией, аналогией, предложением эксперимента или культурным нарративом.`,
    why: "В каталоге, потому что это публиковали как доказательство или аргумент, что вселенная может быть симуляцией.",
  },
  pt: {
    caption: (l) => `Afirmação documentada sobre realidade simulada (discutida originalmente em ${l})`,
    what: (l) =>
      `Uma afirmação pública de que a realidade pode ser computacional ou simulada. O texto fonte está em ${l}; o SIMULUM mostra este resumo apenas no idioma selecionado.`,
    where: (p, l) => `Obtido de ${p} (${l}). Abra as ligações originais para a página no idioma de origem.`,
    when: "O tempo segue a publicação da fonte e os carimbos de primeira/última indexação.",
    how: (l) =>
      `A fonte em ${l} argumenta a afirmação através de teoria, analogia, proposta experimental ou narrativa cultural.`,
    why: "Catalogada porque foi publicada como evidência ou argumento de que o universo pode ser uma simulação.",
  },
  ar: {
    caption: (l) => `زعم موثّق عن واقع مُحاكى (نوقش أصلًا بـ${l})`,
    what: (l) =>
      `زعم علني بأن الواقع قد يكون حوسبيًا أو مُحاكى. النص المصدر بـ${l}؛ يعرض SIMULUM هذا الملخص بلغة اختيارك فقط.`,
    where: (p, l) => `المصدر: ${p} (${l}). افتح الروابط الأصلية لصفحة لغة المصدر.`,
    when: "التوقيت يتبع نشر المصدر وختمَي أول/آخر فهرسة.",
    how: (l) => `مصدر ${l} يطرح الزعم عبر نظرية أو تشبيه أو اقتراح تجريبي أو سرد ثقافي.`,
    why: "أُدرج لأنه نُشر كدليل أو حجة على أن الكون قد يكون محاكاة.",
  },
  ko: {
    caption: (l) => `기록된 시뮬레이션 현실 주장 (원래 ${l}로 논의)`,
    what: (l) =>
      `현실이 계산적이거나 시뮬레이션일 수 있다는 공개 주장입니다. 원문은 ${l}이며, SIMULUM은 선택한 언어로만 요약을 보여 줍니다.`,
    where: (p, l) => `출처: ${p} (${l}). 원문 페이지는 원본 링크에서 확인하세요.`,
    when: "시점은 출처 게시와 최초/최근 색인 시각을 따릅니다.",
    how: (l) => `${l} 출처는 이론·비유·실험 제안·문화 서사로 주장을 펼칩니다.`,
    why: "우주가 시뮬레이션일 수 있다는 증거·논거로 게시되어 수록했습니다.",
  },
  hi: {
    caption: (l) => `प्रलेखित सिम्युलेटेड-रियलिटी दावा (मूल रूप से ${l} में चर्चा)`,
    what: (l) =>
      `एक सार्वजनिक दावा कि वास्तविकता कम्प्यूटेशनल या सिम्युलेटेड हो सकती है। स्रोत पाठ ${l} में है; SIMULUM यह सारांश केवल आपकी चुनी भाषा में दिखाता है।`,
    where: (p, l) => `स्रोत: ${p} (${l})। स्रोत-भाषा पृष्ठ के लिए मूल लिंक खोलें।`,
    when: "समय स्रोत प्रकाशन और पहली/अंतिम अनुक्रमणिका टाइमस्टैम्प का अनुसरण करता है।",
    how: (l) => `${l} स्रोत सिद्धांत, सादृश्य, प्रयोग प्रस्ताव या सांस्कृतिक कथा से दावा करता है।`,
    why: "इसलिए सूचीबद्ध क्योंकि इसे इस साक्ष्य/तर्क के रूप में पोस्ट किया गया कि ब्रह्मांड सिमुलेशन हो सकता है।",
  },
  it: {
    caption: (l) => `Affermazione documentata sulla realtà simulata (discussa originariamente in ${l})`,
    what: (l) =>
      `Un'affermazione pubblica secondo cui la realtà potrebbe essere computazionale o simulata. Il testo sorgente è in ${l}; SIMULUM mostra questo riepilogo solo nella lingua selezionata.`,
    where: (p, l) => `Da ${p} (${l}). Apri i link originali per la pagina in lingua sorgente.`,
    when: "I tempi seguono la pubblicazione della fonte e i timestamp di prima/ultima indicizzazione.",
    how: (l) =>
      `La fonte in ${l} sostiene l'affermazione con teoria, analogia, proposta sperimentale o narrazione culturale.`,
    why: "Catalogata perché pubblicata come prova o argomento che l'universo potrebbe essere una simulazione.",
  },
  bn: {
    caption: (l) => `নথিভুক্ত সিমুলেটেড-রিয়েলিটি দাবি (মূলে ${l}-এ আলোচিত)`,
    what: (l) =>
      `বাস্তবতা কম্পিউটেশনাল বা সিমুলেটেড হতে পারে—এমন একটি প্রকাশ্য দাবি। উৎস পাঠ ${l}-এ; SIMULUM শুধু আপনার নির্বাচিত ভাষায় সারাংশ দেখায়।`,
    where: (p, l) => `উৎস: ${p} (${l})। উৎস-ভাষার পাতার জন্য মূল লিঙ্ক খুলুন।`,
    when: "সময় উৎস প্রকাশ ও প্রথম/শেষ সূচিকরণ টাইমস্ট্যাম্প অনুসরণ করে।",
    how: (l) => `${l} উৎস তত্ত্ব, উপমা, পরীক্ষা প্রস্তাব বা সাংস্কৃতিক আখ্যান দিয়ে দাবি করে।`,
    why: "মহাবিশ্ব সিমুলেশন হতে পারে—এমন প্রমাণ/যুক্তি হিসেবে পোস্ট হওয়ায় তালিকাভুক্ত।",
  },
  id: {
    caption: (l) => `Klaim realitas tersimulasi terdokumentasi (aslinya dibahas dalam ${l})`,
    what: (l) =>
      `Klaim publik bahwa realitas mungkin komputasional atau tersimulasi. Teks sumber berbahasa ${l}; SIMULUM menampilkan ringkasan ini hanya dalam bahasa yang Anda pilih.`,
    where: (p, l) => `Bersumber dari ${p} (${l}). Buka tautan asli untuk halaman bahasa sumber.`,
    when: "Waktu mengikuti publikasi sumber dan stempel pertama/terakhir diindeks.",
    how: (l) =>
      `Sumber ${l} mengajukan klaim lewat teori, analogi, usulan eksperimen, atau narasi budaya.`,
    why: "Dikatalogkan karena diposting sebagai bukti/argumen bahwa alam semesta bisa berupa simulasi.",
  },
  tr: {
    caption: (l) => `Belgelenmiş simüle gerçeklik iddiası (özgün olarak ${l} dilinde tartışıldı)`,
    what: (l) =>
      `Gerçekliğin hesaplamalı veya simüle olabileceğine dair kamuya açık bir iddia. Kaynak metin ${l}; SIMULUM bu özeti yalnızca seçtiğiniz dilde gösterir.`,
    where: (p, l) => `Kaynak: ${p} (${l}). Kaynak dilindeki sayfa için orijinal bağlantıları açın.`,
    when: "Zaman, kaynak yayını ile ilk/son dizin damgalarını izler.",
    how: (l) =>
      `${l} kaynağı iddiayı kuram, benzetme, deney önerisi veya kültürel anlatı ile savunur.`,
    why: "Evrenin bir simülasyon olabileceğine dair kanıt/argüman olarak paylaşıldığı için kataloglandı.",
  },
  vi: {
    caption: (l) => `Tuyên bố thực tại mô phỏng đã ghi nhận (ban đầu thảo luận bằng ${l})`,
    what: (l) =>
      `Một tuyên bố công khai rằng thực tại có thể mang tính tính toán hoặc mô phỏng. Văn bản nguồn bằng ${l}; SIMULUM chỉ hiện tóm tắt bằng ngôn ngữ bạn chọn.`,
    where: (p, l) => `Nguồn: ${p} (${l}). Mở liên kết gốc để xem trang ngôn ngữ nguồn.`,
    when: "Thời điểm theo xuất bản nguồn và dấu lần đầu/cuối được lập chỉ mục.",
    how: (l) =>
      `Nguồn ${l} lập luận qua lý thuyết, ẩn dụ, đề xuất thí nghiệm hoặc tường thuật văn hóa.`,
    why: "Được catalog vì được đăng như bằng chứng/lập luận rằng vũ trụ có thể là mô phỏng.",
  },
  th: {
    caption: (l) => `ข้ออ้างเรื่องความเป็นจริงจำลองที่บันทึกไว้ (เดิมอภิปรายเป็น${l})`,
    what: (l) =>
      `ข้ออ้างสาธารณะว่าความเป็นจริงอาจเป็นการคำนวณหรือจำลอง ข้อความต้นทางเป็น${l}; SIMULUM แสดงสรุปนี้เฉพาะภาษาที่คุณเลือก`,
    where: (p, l) => `แหล่งที่มา: ${p} (${l}) เปิดลิงก์ต้นฉบับเพื่อดูหน้าภาษาต้นทาง`,
    when: "เวลาอิงการเผยแพร่แหล่งที่มาและตราประทับครั้งแรก/ล่าสุดที่จัดทำดัชนี",
    how: (l) => `แหล่ง${l}อ้างผ่านทฤษฎี อุปมา ข้อเสนอการทดลอง หรือเรื่องเล่าวัฒนธรรม`,
    why: "จัดทำรายการเพราะถูกโพสต์เป็นหลักฐาน/ข้อโต้แย้งว่าเอกภพอาจเป็นการจำลอง",
  },
  pl: {
    caption: (l) => `Udokumentowane twierdzenie o symulowanej rzeczywistości (pierwotnie po ${l})`,
    what: (l) =>
      `Publiczne twierdzenie, że rzeczywistość może być obliczeniowa lub symulowana. Tekst źródłowy jest w języku ${l}; SIMULUM pokazuje to streszczenie tylko w wybranym języku.`,
    where: (p, l) => `Źródło: ${p} (${l}). Otwórz oryginalne linki, by zobaczyć stronę w języku źródłowym.`,
    when: "Czas wynika z publikacji źródła oraz znaczników pierwszej/ostatniej indeksacji.",
    how: (l) =>
      `Źródło w języku ${l} argumentuje teorią, analogią, propozycją eksperymentu lub narracją kulturową.`,
    why: "Sklasyfikowane, bo opublikowano je jako dowód lub argument, że wszechświat może być symulacją.",
  },
  nl: {
    caption: (l) => `Gedocumenteerde claim over gesimuleerde realiteit (oorspronkelijk in het ${l})`,
    what: (l) =>
      `Een openbare claim dat de realiteit computationeel of gesimuleerd kan zijn. De brontekst is in het ${l}; SIMULUM toont deze samenvatting alleen in uw geselecteerde taal.`,
    where: (p, l) => `Afkomstig van ${p} (${l}). Open de originele links voor de pagina in de brontaal.`,
    when: "De timing volgt de bronpublicatie en first-/last-seen-tijdstempels.",
    how: (l) =>
      `De ${l}-bron beargumenteert de claim via theorie, analogie, experimentvoorstel of cultureel verhaal.`,
    why: "Gecatalogiseerd omdat het is gepost als bewijs of argument dat het universum een simulatie kan zijn.",
  },
  uk: {
    caption: (l) => `Задокументоване твердження про симульовану реальність (спочатку ${l})`,
    what: (l) =>
      `Публічне твердження, що реальність може бути обчислювальною або симульованою. Текст джерела ${l}; SIMULUM показує цей підсумок лише вибраною мовою.`,
    where: (p, l) => `Джерело: ${p} (${l}). Відкрийте оригінальні посилання для сторінки мовою джерела.`,
    when: "Час відповідає публікації джерела та міткам першої/останньої індексації.",
    how: (l) =>
      `Джерело ${l} обґрунтовує твердження теорією, аналогією, пропозицією експерименту або культурною оповіддю.`,
    why: "У каталозі, бо його публікували як доказ або аргумент, що всесвіт може бути симуляцією.",
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

function synthesizePack(evidence: Evidence, locale: LocaleCode): EvidenceLocalePack {
  const tpl = TEMPLATES[locale] ?? TEMPLATES.en;
  const src = evidence.language || evidence.languages[0] || "en";
  const srcName = languageDisplayName(src, locale);
  const publisher = publisherOf(evidence);
  return {
    caption: tpl.caption(srcName),
    body: {
      what: tpl.what(srcName),
      where: tpl.where(publisher, srcName),
      when: tpl.when,
      how: tpl.how(srcName),
      why: tpl.why,
    },
  };
}

function packLooksLikeLocale(pack: EvidenceLocalePack, sourceLang: string, locale: LocaleCode): boolean {
  // Stored pack for the source language should only be shown when UI locale matches that language.
  if (locale === sourceLang) return true;
  // Otherwise only accept packs explicitly stored under this locale key (caller checks key).
  void pack;
  return true;
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

  if (stored?.caption?.trim() && packLooksLikeLocale(stored, sourceLang, locale)) {
    // Guard: if this locale key somehow holds source-language text for a mismatched locale,
    // prefer synthesis. Heuristic: when locale !== sourceLang and stored equals primary caption
    // of a different language, synthesize instead.
    const primary = evidence.caption || evidence.summary;
    if (locale !== sourceLang && stored.caption === primary && primary.trim()) {
      const synth = synthesizePack(evidence, locale);
      return { ...synth, available: true, presentation: "synthesized" };
    }
    return {
      caption: stored.caption,
      body: stored.body,
      available: true,
      presentation: "stored",
    };
  }

  if (sourceLang === locale) {
    return {
      caption: evidence.caption || evidence.summary,
      body: evidence.body,
      available: true,
      presentation: "native",
    };
  }

  const synth = synthesizePack(evidence, locale);
  return { ...synth, available: true, presentation: "synthesized" };
}
