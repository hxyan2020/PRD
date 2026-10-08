/**
 * Add detail.howToWin + detail.rulesNotToBreak to all UI packs.
 * Run: node scripts/patch-win-rules-ui-i18n.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packsDir = join(__dirname, "i18n-packs");

/** @type {Record<string, Record<string, string>>} */
const PATCH = {
  "zh-Hans": {
    "detail.howToWin": "如何获胜",
    "detail.rulesNotToBreak": "不可违反的规则",
    "chat.answer.howToPlay":
      "**{name}** — 玩法：\n{steps}\n\n**如何获胜**\n{howToWin}\n\n**不可违反的规则**\n{rules}\n\n理想参与者：{participants}。也可询问所需物品、变体或购买链接。",
  },
  "zh-Hant": {
    "detail.howToWin": "如何獲勝",
    "detail.rulesNotToBreak": "不可違反的規則",
    "chat.answer.howToPlay":
      "**{name}** — 玩法：\n{steps}\n\n**如何獲勝**\n{howToWin}\n\n**不可違反的規則**\n{rules}\n\n理想參與者：{participants}。也可詢問所需物品、變體或購買連結。",
  },
  ja: {
    "detail.howToWin": "勝ち方",
    "detail.rulesNotToBreak": "守るべきルール",
    "chat.answer.howToPlay":
      "**{name}** — 遊び方：\n{steps}\n\n**勝ち方**\n{howToWin}\n\n**守るべきルール**\n{rules}\n\n理想の参加者：{participants}。必要な物・変種・購入リンクも聞けます。",
  },
  ko: {
    "detail.howToWin": "이기는 방법",
    "detail.rulesNotToBreak": "지켜야 할 규칙",
    "chat.answer.howToPlay":
      "**{name}** — 플레이 방법:\n{steps}\n\n**이기는 방법**\n{howToWin}\n\n**지켜야 할 규칙**\n{rules}\n\n이상적인 참가자: {participants}. 준비물·변형·구매 링크도 물어보세요.",
  },
  es: {
    "detail.howToWin": "Cómo ganar",
    "detail.rulesNotToBreak": "Reglas que no se deben romper",
    "chat.answer.howToPlay":
      "**{name}** — cómo jugar:\n{steps}\n\n**Cómo ganar**\n{howToWin}\n\n**Reglas que no se deben romper**\n{rules}\n\nParticipantes ideales: {participants}. Pregunta por requisitos, variaciones o enlaces de compra si quieres.",
  },
  fr: {
    "detail.howToWin": "Comment gagner",
    "detail.rulesNotToBreak": "Règles à ne pas enfreindre",
    "chat.answer.howToPlay":
      "**{name}** — comment jouer :\n{steps}\n\n**Comment gagner**\n{howToWin}\n\n**Règles à ne pas enfreindre**\n{rules}\n\nParticipants idéaux : {participants}. Demandez exigences, variantes ou liens d’achat si vous voulez.",
  },
  de: {
    "detail.howToWin": "So gewinnt man",
    "detail.rulesNotToBreak": "Regeln, die man nicht brechen darf",
    "chat.answer.howToPlay":
      "**{name}** — so spielt man:\n{steps}\n\n**So gewinnt man**\n{howToWin}\n\n**Regeln, die man nicht brechen darf**\n{rules}\n\nIdeale Teilnehmer: {participants}. Frag nach Voraussetzungen, Varianten oder Kauf-Links.",
  },
  pt: {
    "detail.howToWin": "Como vencer",
    "detail.rulesNotToBreak": "Regras que não se podem quebrar",
    "chat.answer.howToPlay":
      "**{name}** — como jogar:\n{steps}\n\n**Como vencer**\n{howToWin}\n\n**Regras que não se podem quebrar**\n{rules}\n\nParticipantes ideais: {participants}. Pergunte por requisitos, variações ou ligações de compra se quiser.",
  },
  it: {
    "detail.howToWin": "Come si vince",
    "detail.rulesNotToBreak": "Regole da non infrangere",
    "chat.answer.howToPlay":
      "**{name}** — come si gioca:\n{steps}\n\n**Come si vince**\n{howToWin}\n\n**Regole da non infrangere**\n{rules}\n\nPartecipanti ideali: {participants}. Chiedi requisiti, varianti o link d’acquisto se vuoi.",
  },
  ru: {
    "detail.howToWin": "Как победить",
    "detail.rulesNotToBreak": "Правила, которые нельзя нарушать",
    "chat.answer.howToPlay":
      "**{name}** — как играть:\n{steps}\n\n**Как победить**\n{howToWin}\n\n**Правила, которые нельзя нарушать**\n{rules}\n\nИдеальные участники: {participants}. Спросите о требованиях, вариантах или ссылках на покупку.",
  },
  ar: {
    "detail.howToWin": "كيف تفوز",
    "detail.rulesNotToBreak": "قواعد لا تُكسر",
    "chat.answer.howToPlay":
      "**{name}** — طريقة اللعب:\n{steps}\n\n**كيف تفوز**\n{howToWin}\n\n**قواعد لا تُكسر**\n{rules}\n\nالمشاركون المثاليون: {participants}. اسأل عن المتطلبات أو التنويعات أو روابط الشراء.",
  },
  hi: {
    "detail.howToWin": "कैसे जीतें",
    "detail.rulesNotToBreak": "न तोड़ने वाले नियम",
    "chat.answer.howToPlay":
      "**{name}** — कैसे खेलें:\n{steps}\n\n**कैसे जीतें**\n{howToWin}\n\n**न तोड़ने वाले नियम**\n{rules}\n\nआदर्श प्रतिभागी: {participants}. आवश्यकताएँ, रूप या खरीद लिंक पूछ सकते हैं।",
  },
  tr: {
    "detail.howToWin": "Nasıl kazanılır",
    "detail.rulesNotToBreak": "Çiğnenmemesi gereken kurallar",
    "chat.answer.howToPlay":
      "**{name}** — nasıl oynanır:\n{steps}\n\n**Nasıl kazanılır**\n{howToWin}\n\n**Çiğnenmemesi gereken kurallar**\n{rules}\n\nİdeal katılımcılar: {participants}. Gereksinimler, çeşitler veya satın alma bağlantıları sorun.",
  },
  vi: {
    "detail.howToWin": "Cách thắng",
    "detail.rulesNotToBreak": "Luật không được phá",
    "chat.answer.howToPlay":
      "**{name}** — cách chơi:\n{steps}\n\n**Cách thắng**\n{howToWin}\n\n**Luật không được phá**\n{rules}\n\nNgười chơi lý tưởng: {participants}. Hỏi về yêu cầu, biến thể hoặc liên kết mua.",
  },
  th: {
    "detail.howToWin": "วิธีชนะ",
    "detail.rulesNotToBreak": "กฎที่ห้ามละเมิด",
    "chat.answer.howToPlay":
      "**{name}** — วิธีเล่น:\n{steps}\n\n**วิธีชนะ**\n{howToWin}\n\n**กฎที่ห้ามละเมิด**\n{rules}\n\nผู้เล่นที่เหมาะ: {participants} ถามของที่ต้องใช้ รูปแบบ หรือลิงก์ซื้อได้",
  },
  id: {
    "detail.howToWin": "Cara menang",
    "detail.rulesNotToBreak": "Aturan yang tidak boleh dilanggar",
    "chat.answer.howToPlay":
      "**{name}** — cara bermain:\n{steps}\n\n**Cara menang**\n{howToWin}\n\n**Aturan yang tidak boleh dilanggar**\n{rules}\n\nPeserta ideal: {participants}. Tanya persyaratan, variasi, atau tautan pembelian jika mau.",
  },
  nl: {
    "detail.howToWin": "Hoe te winnen",
    "detail.rulesNotToBreak": "Regels die je niet mag breken",
    "chat.answer.howToPlay":
      "**{name}** — hoe te spelen:\n{steps}\n\n**Hoe te winnen**\n{howToWin}\n\n**Regels die je niet mag breken**\n{rules}\n\nIdeale deelnemers: {participants}. Vraag om eisen, varianten of koopkoppelingen.",
  },
  pl: {
    "detail.howToWin": "Jak wygrać",
    "detail.rulesNotToBreak": "Zasady, których nie wolno łamać",
    "chat.answer.howToPlay":
      "**{name}** — jak grać:\n{steps}\n\n**Jak wygrać**\n{howToWin}\n\n**Zasady, których nie wolno łamać**\n{rules}\n\nIdealni uczestnicy: {participants}. Zapytaj o wymagania, warianty lub linki zakupu.",
  },
  sv: {
    "detail.howToWin": "Hur man vinner",
    "detail.rulesNotToBreak": "Regler som inte får brytas",
    "chat.answer.howToPlay":
      "**{name}** — hur man spelar:\n{steps}\n\n**Hur man vinner**\n{howToWin}\n\n**Regler som inte får brytas**\n{rules}\n\nIdeala deltagare: {participants}. Fråga om krav, varianter eller köplänkar.",
  },
  el: {
    "detail.howToWin": "Πώς κερδίζεις",
    "detail.rulesNotToBreak": "Κανόνες που δεν πρέπει να σπάσεις",
    "chat.answer.howToPlay":
      "**{name}** — πώς παίζεται:\n{steps}\n\n**Πώς κερδίζεις**\n{howToWin}\n\n**Κανόνες που δεν πρέπει να σπάσεις**\n{rules}\n\nΙδανικοί συμμετέχοντες: {participants}. Ρωτήστε για απαιτήσεις, παραλλαγές ή συνδέσμους αγοράς.",
  },
  he: {
    "detail.howToWin": "איך לנצח",
    "detail.rulesNotToBreak": "כללים שאסור לשבור",
    "chat.answer.howToPlay":
      "**{name}** — איך משחקים:\n{steps}\n\n**איך לנצח**\n{howToWin}\n\n**כללים שאסור לשבור**\n{rules}\n\nמשתתפים אידיאליים: {participants}. שאלו על דרישות, וריאציות או קישורי רכישה.",
  },
  uk: {
    "detail.howToWin": "Як перемогти",
    "detail.rulesNotToBreak": "Правила, які не можна порушувати",
    "chat.answer.howToPlay":
      "**{name}** — як грати:\n{steps}\n\n**Як перемогти**\n{howToWin}\n\n**Правила, які не можна порушувати**\n{rules}\n\nІдеальні учасники: {participants}. Запитайте про вимоги, варіанти або посилання на купівлю.",
  },
  fa: {
    "detail.howToWin": "چگونه برنده شوید",
    "detail.rulesNotToBreak": "قواعدی که نباید شکست",
    "chat.answer.howToPlay":
      "**{name}** — نحوهٔ بازی:\n{steps}\n\n**چگونه برنده شوید**\n{howToWin}\n\n**قواعدی که نباید شکست**\n{rules}\n\nشرکت‌کنندگان ایدئال: {participants}. دربارهٔ الزامات، گونه‌ها یا پیوندهای خرید بپرسید.",
  },
  bn: {
    "detail.howToWin": "কীভাবে জিতবেন",
    "detail.rulesNotToBreak": "ভাঙা যাবে না এমন নিয়ম",
    "chat.answer.howToPlay":
      "**{name}** — কীভাবে খেলবেন:\n{steps}\n\n**কীভাবে জিতবেন**\n{howToWin}\n\n**ভাঙা যাবে না এমন নিয়ম**\n{rules}\n\nআদর্শ অংশগ্রহণকারী: {participants}. প্রয়োজনীয়তা, রূপভেদ বা কেনার লিঙ্ক জিজ্ঞাসা করতে পারেন।",
  },
  sw: {
    "detail.howToWin": "Jinsi ya kushinda",
    "detail.rulesNotToBreak": "Sheria zisizovunjwa",
    "chat.answer.howToPlay":
      "**{name}** — jinsi ya kucheza:\n{steps}\n\n**Jinsi ya kushinda**\n{howToWin}\n\n**Sheria zisizovunjwa**\n{rules}\n\nWashiriki wanaofaa: {participants}. Uliza mahitaji, tofauti, au viungo vya ununuzi.",
  },
  la: {
    "detail.howToWin": "Quomodo vincatur",
    "detail.rulesNotToBreak": "Leges non frangendae",
    "chat.answer.howToPlay":
      "**{name}** — quomodo ludatur:\n{steps}\n\n**Quomodo vincatur**\n{howToWin}\n\n**Leges non frangendae**\n{rules}\n\nParticipes ideales: {participants}. De requisitis, variationibus, nexus emptionis roga.",
  },
  grc: {
    "detail.howToWin": "Πῶς νικᾶν",
    "detail.rulesNotToBreak": "Νόμοι μὴ παραβατέοι",
    "chat.answer.howToPlay":
      "**{name}** — πῶς παίζειν:\n{steps}\n\n**Πῶς νικᾶν**\n{howToWin}\n\n**Νόμοι μὴ παραβατέοι**\n{rules}\n\nἸδανικοὶ μετέχοντες: {participants}. Ἐρώτα ἀπαιτήσεις, παραλλαγάς, ἢ συνδέσμους ὠνῆς.",
  },
  sa: {
    "detail.howToWin": "कथं जयः",
    "detail.rulesNotToBreak": "अभेद्यनियमाः",
    "chat.answer.howToPlay":
      "**{name}** — कथं क्रीड्यते:\n{steps}\n\n**कथं जयः**\n{howToWin}\n\n**अभेद्यनियमाः**\n{rules}\n\nआदर्शसहभागिनः: {participants}. आवश्यकताः, भेदान्, क्रयसङ्केतान् वा पृच्छतु।",
  },
  egy: {
    "detail.howToWin": "How to win (nḫt)",
    "detail.rulesNotToBreak": "Rules not to break (tp-rd)",
    "chat.answer.howToPlay":
      "**{name}** — sbꜣyt hbʿ:\n{steps}\n\n**How to win**\n{howToWin}\n\n**Rules not to break**\n{rules}\n\nı͗nw rmt mtr: {participants}. ḳı͗s ı͗ḫt, ḫprw, ḫsf ı͗sw.",
  },
  akk: {
    "detail.howToWin": "How to win",
    "detail.rulesNotToBreak": "Rules not to break",
    "chat.answer.howToPlay":
      "**{name}** — akī mēlulti:\n{steps}\n\n**How to win**\n{howToWin}\n\n**Rules not to break**\n{rules}\n\nṢābū namrūtu: {participants}. Šâl ḫišīḫti, šanâti, ū lū rikis šîmi.",
  },
  non: {
    "detail.howToWin": "Hvernig á að vinna",
    "detail.rulesNotToBreak": "Reglur sem má ekki brjóta",
    "chat.answer.howToPlay":
      "**{name}** — hvernig á að leika:\n{steps}\n\n**Hvernig á að vinna**\n{howToWin}\n\n**Reglur sem má ekki brjóta**\n{rules}\n\nKjörnir þátttakendur: {participants}. Spyrðu um kröfur, afbrigði eða kauphlekkji.",
  },
};

// Update English chat template too (source of truth for placeholders)
const enPath = join(__dirname, "../src/i18n/messages/en.ts");
let enSrc = readFileSync(enPath, "utf8");
const oldChat =
  /"chat\.answer\.howToPlay":\s*\n\s*"[^"]*",/;
if (!enSrc.includes("{howToWin}")) {
  enSrc = enSrc.replace(
    /"chat\.answer\.howToPlay":\s*\n\s*"([^"]*)",/,
    `"chat.answer.howToPlay":\n    "**{name}** — how to play:\\n{steps}\\n\\n**How to win**\\n{howToWin}\\n\\n**Rules not to break**\\n{rules}\\n\\nIdeal participants: {participants}. Ask about requirements, variations, or purchase links if you want.",`,
  );
  writeFileSync(enPath, enSrc);
  console.log("updated en.ts chat.answer.howToPlay");
}

let added = 0;
for (const file of readdirSync(packsDir).filter((f) => f.endsWith(".json"))) {
  const code = file.replace(/\.json$/, "");
  const patch = PATCH[code];
  if (!patch) throw new Error(`No patch for ${code}`);
  const path = join(packsDir, file);
  const map = JSON.parse(readFileSync(path, "utf8"));
  let n = 0;
  for (const [k, v] of Object.entries(patch)) {
    if (map[k] !== v) {
      map[k] = v;
      n++;
      added++;
    }
  }
  if (n) {
    writeFileSync(path, JSON.stringify(map, null, 2) + "\n");
    console.log(`patched ${code}: ${n}`);
  }
}
console.log(`keys touched=${added}`);

const gen = spawnSync(process.execPath, [join(__dirname, "generate-i18n.mjs")], {
  stdio: "inherit",
});
if (gen.status !== 0) process.exit(gen.status ?? 1);
