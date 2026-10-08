/**
 * Fill UI MessageKeys missing from scripts/i18n-packs/*.json, then regenerate dictionaries.
 * Run: node scripts/patch-missing-ui-i18n.mjs
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
    "chat.rec.exhausted":
      "这些偏好下的合适推荐已经找完了。可以说“重新开始”换一组条件，或询问上面的任一标题。",
    "chat.rec.moreIntro":
      "这里还有 {n} 条目录推荐{prefLine}。可再点“更多推荐”看下一组，或询问上面的任一标题。",
    "detail.assistant.title": "询问此游戏",
    "detail.assistant.sub":
      "可询问 {name} 的玩法、来源、所需物品、文化变体，或购买渠道。",
    "detail.assistant.welcome":
      "我可以帮你了解 **{name}**——本目录中的规则、历史、所需物品、变体与购买链接。你想知道什么？",
    "detail.assistant.hint":
      "可以问本目录中关于 {name} 的任何问题——规则、起源、装备、变体或购买。",
    "detail.assistant.outOfScope":
      "我只回答 Ludus Atlas 与本页游戏 **{name}** 相关的问题。可以问玩法、背景、所需物品、变体或购买——请围绕这些提问。",
    "detail.assistant.otherGame":
      "本页介绍的是 **{name}**。我可以回答本条目的问题；若要了解其他标题，请打开其页面或使用 Atlas 向导。",
    "detail.assistant.useGuide":
      "若要寻找其他玩具与游戏，请使用 Atlas 向导。这里只讲解 **{name}**——规则、历史、装备、变体与购买。",
    "detail.assistant.default":
      "{about}\n\n可以问 {name} 的玩法、所需物品、变体或购买渠道。",
    "detail.assistant.placeholder": "询问 {name}…",
    "detail.assistant.inputLabel": "关于 {name} 的问题",
    "detail.assistant.send": "提问",
    "detail.assistant.suggestions": "建议问题",
    "detail.assistant.scopeNote": "范围限于本目录条目。",
    "detail.assistant.guideLink": "用 Atlas 向导浏览 →",
  },
  "zh-Hant": {
    "chat.rec.exhausted":
      "這些偏好下的合適推薦已經找完了。可以說「重新開始」換一組條件，或詢問上面的任一標題。",
    "chat.rec.moreIntro":
      "這裡還有 {n} 條目錄推薦{prefLine}。可再點「更多推薦」看下一組，或詢問上面的任一標題。",
    "detail.assistant.title": "詢問此遊戲",
    "detail.assistant.sub":
      "可詢問 {name} 的玩法、來源、所需物品、文化變體，或購買管道。",
    "detail.assistant.welcome":
      "我可以幫你了解 **{name}**——本目錄中的規則、歷史、所需物品、變體與購買連結。你想知道什麼？",
    "detail.assistant.hint":
      "可以問本目錄中關於 {name} 的任何問題——規則、起源、裝備、變體或購買。",
    "detail.assistant.outOfScope":
      "我只回答 Ludus Atlas 與本頁遊戲 **{name}** 相關的問題。可以問玩法、背景、所需物品、變體或購買——請圍繞這些提問。",
    "detail.assistant.otherGame":
      "本頁介紹的是 **{name}**。我可以回答本條目的問題；若要了解其他標題，請打開其頁面或使用 Atlas 嚮導。",
    "detail.assistant.useGuide":
      "若要尋找其他玩具與遊戲，請使用 Atlas 嚮導。這裡只講解 **{name}**——規則、歷史、裝備、變體與購買。",
    "detail.assistant.default":
      "{about}\n\n可以問 {name} 的玩法、所需物品、變體或購買管道。",
    "detail.assistant.placeholder": "詢問 {name}…",
    "detail.assistant.inputLabel": "關於 {name} 的問題",
    "detail.assistant.send": "提問",
    "detail.assistant.suggestions": "建議問題",
    "detail.assistant.scopeNote": "範圍限於本目錄條目。",
    "detail.assistant.guideLink": "用 Atlas 嚮導瀏覽 →",
  },
  es: {
    "chat.rec.exhausted":
      "Esas son todas las coincidencias fuertes para estas preferencias. Di “empezar de nuevo” para otro mix, o pregunta por cualquier título de arriba.",
    "chat.rec.moreIntro":
      "Aquí hay {n} selecciones más del catálogo{prefLine}. Toca otra vez “Más recomendaciones” para el siguiente lote, o pregunta por cualquier título de arriba.",
    "detail.assistant.title": "Pregunta sobre este juego",
    "detail.assistant.sub":
      "Pregunta cómo jugar a {name}, de dónde viene, qué necesitas, variaciones culturales o dónde comprarlo.",
    "detail.assistant.welcome":
      "Estoy aquí para ayudarte con **{name}**: reglas, historia, requisitos, variaciones y enlaces de compra de este catálogo. ¿Qué te gustaría saber?",
    "detail.assistant.hint":
      "Pregúntame lo que quieras sobre {name} en este catálogo: reglas, origen, material, variaciones o compra.",
    "detail.assistant.outOfScope":
      "Me quedo con Ludus Atlas y el juego de esta página, **{name}**. Puedo explicar cómo se juega, su origen, qué necesitas, variaciones o dónde comprarlo—pregunta en ese ámbito.",
    "detail.assistant.otherGame":
      "Esta página trata de **{name}**. Puedo responder sobre esta entrada; para otro título, abre su página o visita Atlas Guide.",
    "detail.assistant.useGuide":
      "Para encontrar otros juguetes y juegos, usa Atlas Guide. Aquí solo cubro **{name}**: reglas, historia, material, variaciones y compra.",
    "detail.assistant.default":
      "{about}\n\nPregunta cómo jugar a {name}, qué necesitas, variaciones o dónde comprarlo.",
    "detail.assistant.placeholder": "Pregunta sobre {name}…",
    "detail.assistant.inputLabel": "Pregunta sobre {name}",
    "detail.assistant.send": "Preguntar",
    "detail.assistant.suggestions": "Preguntas sugeridas",
    "detail.assistant.scopeNote": "Limitado a esta entrada del catálogo.",
    "detail.assistant.guideLink": "Explorar con Atlas Guide →",
  },
  fr: {
    "chat.rec.exhausted":
      "Ce sont toutes les bonnes correspondances pour ces préférences. Dites « recommencer » pour un autre mix, ou posez une question sur un titre ci-dessus.",
    "chat.rec.moreIntro":
      "Voici encore {n} choix du catalogue{prefLine}. Touchez à nouveau « Plus de recommandations » pour le lot suivant, ou demandez un titre ci-dessus.",
    "detail.assistant.title": "Demander à propos de ce jeu",
    "detail.assistant.sub":
      "Demandez comment jouer à {name}, d’où il vient, ce qu’il faut, les variantes culturelles, ou où l’acheter.",
    "detail.assistant.welcome":
      "Je suis là pour **{name}** — règles, histoire, matériel, variantes et liens d’achat de ce catalogue. Que voulez-vous savoir ?",
    "detail.assistant.hint":
      "Posez-moi n’importe quelle question sur {name} dans ce catalogue — règles, origine, matériel, variantes ou achat.",
    "detail.assistant.outOfScope":
      "Je reste dans Ludus Atlas et le jeu de cette page, **{name}**. Je peux expliquer comment y jouer, son origine, le matériel, les variantes ou l’achat — restez dans ce cadre.",
    "detail.assistant.otherGame":
      "Cette page concerne **{name}**. Je peux répondre sur cette fiche ; pour un autre titre, ouvrez sa page ou visitez Atlas Guide.",
    "detail.assistant.useGuide":
      "Pour trouver d’autres jouets et jeux, utilisez Atlas Guide. Ici je ne couvre que **{name}** — règles, histoire, matériel, variantes et achat.",
    "detail.assistant.default":
      "{about}\n\nDemandez comment jouer à {name}, ce qu’il faut, les variantes, ou où l’acheter.",
    "detail.assistant.placeholder": "Demander à propos de {name}…",
    "detail.assistant.inputLabel": "Question sur {name}",
    "detail.assistant.send": "Demander",
    "detail.assistant.suggestions": "Questions suggérées",
    "detail.assistant.scopeNote": "Limité à cette fiche du catalogue.",
    "detail.assistant.guideLink": "Parcourir avec Atlas Guide →",
  },
  pt: {
    "chat.rec.exhausted":
      "Essas são todas as boas correspondências para estas preferências. Diga “começar de novo” para outra combinação, ou pergunte sobre qualquer título acima.",
    "chat.rec.moreIntro":
      "Aqui estão mais {n} escolhas do catálogo{prefLine}. Toque de novo em “Mais recomendações” para o próximo conjunto, ou pergunte sobre qualquer título acima.",
    "detail.assistant.title": "Pergunte sobre este jogo",
    "detail.assistant.sub":
      "Pergunte como jogar {name}, de onde vem, o que precisa, variações culturais ou onde comprar.",
    "detail.assistant.welcome":
      "Estou aqui para ajudar com **{name}** — regras, história, requisitos, variações e links de compra deste catálogo. O que gostaria de saber?",
    "detail.assistant.hint":
      "Pergunte-me o que quiser sobre {name} neste catálogo — regras, origem, material, variações ou compra.",
    "detail.assistant.outOfScope":
      "Fico com o Ludus Atlas e o jogo desta página, **{name}**. Posso explicar como jogar, a origem, o que precisa, variações ou onde comprar — pergunte nesse âmbito.",
    "detail.assistant.otherGame":
      "Esta página é sobre **{name}**. Posso responder sobre esta entrada; para outro título, abra a página dele ou visite o Atlas Guide.",
    "detail.assistant.useGuide":
      "Para encontrar outros brinquedos e jogos, use o Atlas Guide. Aqui só cubro **{name}** — regras, história, material, variações e compra.",
    "detail.assistant.default":
      "{about}\n\nPergunte como jogar {name}, o que precisa, variações ou onde comprar.",
    "detail.assistant.placeholder": "Pergunte sobre {name}…",
    "detail.assistant.inputLabel": "Pergunta sobre {name}",
    "detail.assistant.send": "Perguntar",
    "detail.assistant.suggestions": "Perguntas sugeridas",
    "detail.assistant.scopeNote": "Limitado a esta entrada do catálogo.",
    "detail.assistant.guideLink": "Explorar com Atlas Guide →",
  },
  it: {
    "chat.rec.exhausted":
      "Queste sono tutte le corrispondenze forti per queste preferenze. Di’ “ricomincia” per un altro mix, o chiedi di un titolo qui sopra.",
    "chat.rec.moreIntro":
      "Ecco altre {n} scelte dal catalogo{prefLine}. Tocca di nuovo “Altre raccomandazioni” per il prossimo gruppo, o chiedi di un titolo qui sopra.",
    "detail.assistant.title": "Chiedi di questo gioco",
    "detail.assistant.sub":
      "Chiedi come si gioca a {name}, da dove viene, cosa serve, varianti culturali o dove comprarlo.",
    "detail.assistant.welcome":
      "Sono qui per **{name}** — regole, storia, requisiti, varianti e link d’acquisto di questo catalogo. Cosa vuoi sapere?",
    "detail.assistant.hint":
      "Chiedimi qualsiasi cosa su {name} in questo catalogo — regole, origine, materiale, varianti o acquisto.",
    "detail.assistant.outOfScope":
      "Resto su Ludus Atlas e sul gioco di questa pagina, **{name}**. Posso spiegare come si gioca, la storia, cosa serve, le varianti o dove comprarlo — resta in questo ambito.",
    "detail.assistant.otherGame":
      "Questa pagina riguarda **{name}**. Posso rispondere su questa scheda; per un altro titolo apri la sua pagina o visita Atlas Guide.",
    "detail.assistant.useGuide":
      "Per trovare altri giocattoli e giochi usa Atlas Guide. Qui tratto solo **{name}** — regole, storia, materiale, varianti e acquisto.",
    "detail.assistant.default":
      "{about}\n\nChiedi come si gioca a {name}, cosa serve, le varianti o dove comprarlo.",
    "detail.assistant.placeholder": "Chiedi di {name}…",
    "detail.assistant.inputLabel": "Domanda su {name}",
    "detail.assistant.send": "Chiedi",
    "detail.assistant.suggestions": "Domande suggerite",
    "detail.assistant.scopeNote": "Limitato a questa scheda del catalogo.",
    "detail.assistant.guideLink": "Sfoglia con Atlas Guide →",
  },
  de: {
    "chat.rec.exhausted":
      "Das sind alle starken Treffer für diese Vorlieben. Sag „von vorn“, um eine andere Mischung zu versuchen, oder frage zu einem Titel oben.",
    "chat.rec.moreIntro":
      "Hier sind {n} weitere Katalogtreffer{prefLine}. Tippe erneut auf „Mehr Empfehlungen“ für die nächste Runde, oder frage zu einem Titel oben.",
    "detail.assistant.title": "Zu diesem Spiel fragen",
    "detail.assistant.sub":
      "Frag, wie man {name} spielt, woher es kommt, was du brauchst, kulturelle Varianten oder wo man es kauft.",
    "detail.assistant.welcome":
      "Ich helfe bei **{name}** — Regeln, Geschichte, Voraussetzungen, Varianten und Kauflinks aus diesem Katalog. Was möchtest du wissen?",
    "detail.assistant.hint":
      "Frag mich alles zu {name} in diesem Katalog — Regeln, Herkunft, Material, Varianten oder Kauf.",
    "detail.assistant.outOfScope":
      "Ich bleibe bei Ludus Atlas und dem Spiel dieser Seite, **{name}**. Ich kann Regeln, Hintergrund, Material, Varianten oder Kauf erklären — bitte in diesem Rahmen fragen.",
    "detail.assistant.otherGame":
      "Diese Seite behandelt **{name}**. Ich beantworte Fragen zu diesem Eintrag; für einen anderen Titel öffne dessen Seite oder Atlas Guide.",
    "detail.assistant.useGuide":
      "Zum Finden anderer Spiele und Spielzeuge nutze Atlas Guide. Hier geht es nur um **{name}** — Regeln, Geschichte, Material, Varianten und Kauf.",
    "detail.assistant.default":
      "{about}\n\nFrag, wie man {name} spielt, was du brauchst, Varianten oder wo man es kauft.",
    "detail.assistant.placeholder": "Zu {name} fragen…",
    "detail.assistant.inputLabel": "Frage zu {name}",
    "detail.assistant.send": "Fragen",
    "detail.assistant.suggestions": "Vorgeschlagene Fragen",
    "detail.assistant.scopeNote": "Begrenzt auf diesen Katalogeintrag.",
    "detail.assistant.guideLink": "Mit Atlas Guide stöbern →",
  },
  ja: {
    "chat.rec.exhausted":
      "この条件での有力な候補は以上です。「最初から」で条件を変えるか、上のタイトルについて聞いてください。",
    "chat.rec.moreIntro":
      "カタログからさらに {n} 件です{prefLine}。また「もっとおすすめ」で次のセットへ、または上のタイトルについて聞いてください。",
    "detail.assistant.title": "この遊戯について尋ねる",
    "detail.assistant.sub":
      "{name} の遊び方、由来、必要なもの、文化的な変種、購入先を聞けます。",
    "detail.assistant.welcome":
      "**{name}** についてお手伝いします——このカタログのルール、歴史、必要なもの、変種、購入リンク。何を知りたいですか？",
    "detail.assistant.hint":
      "このカタログ内の {name} について、ルール・起源・用具・変種・購入など何でも聞いてください。",
    "detail.assistant.outOfScope":
      "Ludus Atlas とこのページの遊戯 **{name}** の範囲でお答えします。遊び方、背景、必要なもの、変種、購入について——その範囲で聞いてください。",
    "detail.assistant.otherGame":
      "このページは **{name}** です。この条目について答えます。別のタイトルは、そのページを開くか Atlas ガイドへ。",
    "detail.assistant.useGuide":
      "他のおもちゃや遊戯を探すときは Atlas ガイドを使ってください。ここでは **{name}** だけ——ルール、歴史、用具、変種、購入——を扱います。",
    "detail.assistant.default":
      "{about}\n\n{name} の遊び方、必要なもの、変種、購入先を聞いてください。",
    "detail.assistant.placeholder": "{name} について尋ねる…",
    "detail.assistant.inputLabel": "{name} についての質問",
    "detail.assistant.send": "尋ねる",
    "detail.assistant.suggestions": "おすすめの質問",
    "detail.assistant.scopeNote": "このカタログ条目に限定。",
    "detail.assistant.guideLink": "Atlas ガイドで探す →",
  },
  ko: {
    "chat.rec.exhausted":
      "이 선호에 맞는 추천은 여기까지입니다. “처음부터”로 조건을 바꾸거나, 위 제목에 대해 물어보세요.",
    "chat.rec.moreIntro":
      "목록에서 {n}개를 더 골랐습니다{prefLine}. “더 많은 추천”을 다시 눌러 다음 묶음을 보거나, 위 제목에 대해 물어보세요.",
    "detail.assistant.title": "이 게임에 대해 묻기",
    "detail.assistant.sub":
      "{name} 하는 법, 유래, 필요한 것, 문화적 변형, 구매처를 물어볼 수 있습니다.",
    "detail.assistant.welcome":
      "**{name}**을(를) 도와드릴게요——이 목록의 규칙, 역사, 준비물, 변형, 구매 링크. 무엇을 알고 싶나요?",
    "detail.assistant.hint":
      "이 목록의 {name}에 대해 규칙, 기원, 장비, 변형, 구매 등 무엇이든 물어보세요.",
    "detail.assistant.outOfScope":
      "Ludus Atlas와 이 페이지의 게임 **{name}**만 다룹니다. 하는 법, 배경, 준비물, 변형, 구매를——그 범위에서 물어보세요.",
    "detail.assistant.otherGame":
      "이 페이지는 **{name}**입니다. 이 항목에 답할 수 있어요. 다른 제목은 해당 페이지를 열거나 Atlas 가이드로 가세요.",
    "detail.assistant.useGuide":
      "다른 장난감·게임을 찾으려면 Atlas 가이드를 쓰세요. 여기서는 **{name}**만——규칙, 역사, 장비, 변형, 구매——다룹니다.",
    "detail.assistant.default":
      "{about}\n\n{name} 하는 법, 준비물, 변형, 구매처를 물어보세요.",
    "detail.assistant.placeholder": "{name}에 대해 묻기…",
    "detail.assistant.inputLabel": "{name}에 대한 질문",
    "detail.assistant.send": "묻기",
    "detail.assistant.suggestions": "추천 질문",
    "detail.assistant.scopeNote": "이 목록 항목으로 한정됩니다.",
    "detail.assistant.guideLink": "Atlas 가이드로 둘러보기 →",
  },
  ar: {
    "chat.rec.exhausted":
      "هذه كل التطابقات القوية لهذه التفضيلات. قل «البدء من جديد» لمزيج آخر، أو اسأل عن أي عنوان أعلاه.",
    "chat.rec.moreIntro":
      "إليك {n} اختيارات إضافية من الفهرس{prefLine}. المس «مزيد من التوصيات» مرة أخرى للمجموعة التالية، أو اسأل عن أي عنوان أعلاه.",
    "detail.assistant.title": "اسأل عن هذه اللعبة",
    "detail.assistant.sub":
      "اسأل كيف تلعب {name}، ومن أين جاءت، وما تحتاجه، والتنويعات الثقافية، أو أين تشتريها.",
    "detail.assistant.welcome":
      "أنا هنا للمساعدة بخصوص **{name}**—القواعد والتاريخ والمتطلبات والتنويعات وروابط الشراء من هذا الفهرس. ماذا تريد أن تعرف؟",
    "detail.assistant.hint":
      "اسألني أي شيء عن {name} في هذا الفهرس—القواعد أو الأصل أو المعدات أو التنويعات أو الشراء.",
    "detail.assistant.outOfScope":
      "أبقى مع لودوس أطلس ولعبة هذه الصفحة، **{name}**. يمكنني شرح اللعب أو الخلفية أو ما تحتاجه أو التنويعات أو الشراء—اسأل في هذا النطاق.",
    "detail.assistant.otherGame":
      "هذه الصفحة عن **{name}**. أجيب عن هذه المادة؛ لعبة أخرى افتح صفحتها أو زر مرشد أطلس.",
    "detail.assistant.useGuide":
      "للعثور على ألعاب ولُعب أخرى استخدم مرشد أطلس. هنا أغطي فقط **{name}**—القواعد والتاريخ والمعدات والتنويعات والشراء.",
    "detail.assistant.default":
      "{about}\n\nاسأل كيف تلعب {name}، وما تحتاجه، والتنويعات، أو أين تشتريها.",
    "detail.assistant.placeholder": "اسأل عن {name}…",
    "detail.assistant.inputLabel": "سؤال عن {name}",
    "detail.assistant.send": "اسأل",
    "detail.assistant.suggestions": "أسئلة مقترحة",
    "detail.assistant.scopeNote": "مقصور على مادة هذا الفهرس.",
    "detail.assistant.guideLink": "تصفح مع مرشد أطلس →",
  },
  hi: {
    "chat.rec.exhausted":
      "इन पसंदों के लिए मज़बूत सुझाव यहीं तक हैं। अलग मिश्रण के लिए “फिर से शुरू” कहें, या ऊपर किसी शीर्षक के बारे में पूछें।",
    "chat.rec.moreIntro":
      "यहाँ सूची से और {n} विकल्प हैं{prefLine}. अगले सेट के लिए फिर “और सुझाव” टैप करें, या ऊपर किसी शीर्षक के बारे में पूछें।",
    "detail.assistant.title": "इस खेल के बारे में पूछें",
    "detail.assistant.sub":
      "{name} कैसे खेलें, यह कहाँ से आया, क्या चाहिए, सांस्कृतिक रूप, या कहाँ खरीदें—पूछ सकते हैं।",
    "detail.assistant.welcome":
      "मैं **{name}** में मदद के लिए हूँ—इस सूची के नियम, इतिहास, ज़रूरतें, रूप और खरीद लिंक। आप क्या जानना चाहते हैं?",
    "detail.assistant.hint":
      "इस सूची में {name} के बारे में कुछ भी पूछें—नियम, उत्पत्ति, सामग्री, रूप या खरीद।",
    "detail.assistant.outOfScope":
      "मैं Ludus Atlas और इस पृष्ठ के खेल **{name}** तक सीमित हूँ। खेलना, पृष्ठभूमि, ज़रूरतें, रूप या खरीद समझा सकता हूँ—उसी दायरे में पूछें।",
    "detail.assistant.otherGame":
      "यह पृष्ठ **{name}** के बारे में है। इस प्रविष्टि पर जवाब दे सकता हूँ; दूसरे शीर्षक के लिए उसका पृष्ठ खोलें या Atlas मार्गदर्शक देखें।",
    "detail.assistant.useGuide":
      "अन्य खिलौने और खेल खोजने के लिए Atlas मार्गदर्शक उपयोग करें। यहाँ केवल **{name}**—नियम, इतिहास, सामग्री, रूप और खरीद।",
    "detail.assistant.default":
      "{about}\n\nपूछें कि {name} कैसे खेलें, क्या चाहिए, रूप, या कहाँ खरीदें।",
    "detail.assistant.placeholder": "{name} के बारे में पूछें…",
    "detail.assistant.inputLabel": "{name} के बारे में प्रश्न",
    "detail.assistant.send": "पूछें",
    "detail.assistant.suggestions": "सुझाए गए प्रश्न",
    "detail.assistant.scopeNote": "इस सूची प्रविष्टि तक सीमित।",
    "detail.assistant.guideLink": "Atlas मार्गदर्शक से देखें →",
  },
  ru: {
    "chat.rec.exhausted":
      "Это все сильные совпадения для этих предпочтений. Скажите «начать заново» для другого набора или спросите о любом названии выше.",
    "chat.rec.moreIntro":
      "Ещё {n} вариантов из каталога{prefLine}. Снова нажмите «Ещё рекомендации» для следующего набора или спросите о любом названии выше.",
    "detail.assistant.title": "Спросить об этой игре",
    "detail.assistant.sub":
      "Спросите, как играть в {name}, откуда она, что нужно, культурные варианты или где купить.",
    "detail.assistant.welcome":
      "Я помогу с **{name}** — правила, история, требования, варианты и ссылки на покупку из этого каталога. Что хотите узнать?",
    "detail.assistant.hint":
      "Спросите что угодно о {name} в этом каталоге — правила, происхождение, снаряжение, варианты или покупка.",
    "detail.assistant.outOfScope":
      "Я остаюсь в Ludus Atlas и с игрой этой страницы, **{name}**. Могу объяснить правила, фон, что нужно, варианты или покупку — спрашивайте в этих рамках.",
    "detail.assistant.otherGame":
      "Эта страница о **{name}**. Отвечу по этой записи; для другого названия откройте его страницу или Atlas Guide.",
    "detail.assistant.useGuide":
      "Чтобы найти другие игрушки и игры, используйте Atlas Guide. Здесь только **{name}** — правила, история, снаряжение, варианты и покупка.",
    "detail.assistant.default":
      "{about}\n\nСпросите, как играть в {name}, что нужно, варианты или где купить.",
    "detail.assistant.placeholder": "Спросить о {name}…",
    "detail.assistant.inputLabel": "Вопрос о {name}",
    "detail.assistant.send": "Спросить",
    "detail.assistant.suggestions": "Предложенные вопросы",
    "detail.assistant.scopeNote": "Ограничено этой записью каталога.",
    "detail.assistant.guideLink": "Смотреть в Atlas Guide →",
  },
  tr: {
    "chat.rec.exhausted":
      "Bu tercihler için güçlü eşleşmeler bu kadar. Farklı bir karışım için “baştan başla” deyin veya yukarıdaki bir başlık hakkında sorun.",
    "chat.rec.moreIntro":
      "Katalogdan {n} seçenek daha{prefLine}. Sonraki set için tekrar “Daha fazla öneri”ye dokunun veya yukarıdaki bir başlık hakkında sorun.",
    "detail.assistant.title": "Bu oyun hakkında sor",
    "detail.assistant.sub":
      "{name} nasıl oynanır, nereden gelir, ne gerekir, kültürel çeşitler veya nereden alınır diye sorabilirsiniz.",
    "detail.assistant.welcome":
      "**{name}** için buradayım — bu katalogdaki kurallar, tarih, gereksinimler, çeşitler ve satın alma bağlantıları. Ne öğrenmek istersiniz?",
    "detail.assistant.hint":
      "Bu katalogdaki {name} hakkında her şeyi sorun — kurallar, köken, gereç, çeşitler veya satın alma.",
    "detail.assistant.outOfScope":
      "Ludus Atlas ve bu sayfanın oyunu **{name}** ile kalıyorum. Nasıl oynanır, arka plan, ne gerekir, çeşitler veya satın alma anlatabilirim — bu çerçevede sorun.",
    "detail.assistant.otherGame":
      "Bu sayfa **{name}** hakkındadır. Bu kayda yanıt verebilirim; başka bir başlık için sayfasını açın veya Atlas Guide’ı ziyaret edin.",
    "detail.assistant.useGuide":
      "Başka oyuncak ve oyun bulmak için Atlas Guide’ı kullanın. Burada yalnızca **{name}** — kurallar, tarih, gereç, çeşitler ve satın alma.",
    "detail.assistant.default":
      "{about}\n\n{name} nasıl oynanır, ne gerekir, çeşitler veya nereden alınır diye sorun.",
    "detail.assistant.placeholder": "{name} hakkında sor…",
    "detail.assistant.inputLabel": "{name} hakkında soru",
    "detail.assistant.send": "Sor",
    "detail.assistant.suggestions": "Önerilen sorular",
    "detail.assistant.scopeNote": "Bu katalog kaydıyla sınırlı.",
    "detail.assistant.guideLink": "Atlas Guide ile gez →",
  },
  vi: {
    "chat.rec.exhausted":
      "Đó là tất cả gợi ý phù hợp cho các sở thích này. Nói “bắt đầu lại” để thử bộ khác, hoặc hỏi về bất kỳ tiêu đề nào ở trên.",
    "chat.rec.moreIntro":
      "Đây là thêm {n} lựa chọn từ danh mục{prefLine}. Chạm lại “Thêm gợi ý” cho nhóm tiếp theo, hoặc hỏi về bất kỳ tiêu đề nào ở trên.",
    "detail.assistant.title": "Hỏi về trò này",
    "detail.assistant.sub":
      "Hỏi cách chơi {name}, nguồn gốc, cần gì, biến thể văn hóa, hoặc nơi mua.",
    "detail.assistant.welcome":
      "Tôi ở đây để giúp với **{name}**—luật, lịch sử, yêu cầu, biến thể và liên kết mua từ danh mục này. Bạn muốn biết gì?",
    "detail.assistant.hint":
      "Hỏi tôi bất cứ điều gì về {name} trong danh mục này—luật, nguồn gốc, đồ dùng, biến thể hoặc mua.",
    "detail.assistant.outOfScope":
      "Tôi chỉ ở trong Ludus Atlas và trò trên trang này, **{name}**. Có thể giải thích cách chơi, bối cảnh, cần gì, biến thể hoặc mua—hãy hỏi trong phạm vi đó.",
    "detail.assistant.otherGame":
      "Trang này nói về **{name}**. Tôi trả lời mục này; với tiêu đề khác, mở trang của nó hoặc vào Atlas Guide.",
    "detail.assistant.useGuide":
      "Để tìm đồ chơi và trò khác, dùng Atlas Guide. Ở đây tôi chỉ nói về **{name}**—luật, lịch sử, đồ dùng, biến thể và mua.",
    "detail.assistant.default":
      "{about}\n\nHỏi cách chơi {name}, cần gì, biến thể, hoặc nơi mua.",
    "detail.assistant.placeholder": "Hỏi về {name}…",
    "detail.assistant.inputLabel": "Câu hỏi về {name}",
    "detail.assistant.send": "Hỏi",
    "detail.assistant.suggestions": "Câu hỏi gợi ý",
    "detail.assistant.scopeNote": "Giới hạn ở mục danh mục này.",
    "detail.assistant.guideLink": "Duyệt với Atlas Guide →",
  },
  th: {
    "chat.rec.exhausted":
      "นั่นคือรายการที่เข้ากันดีทั้งหมดสำหรับความชอบนี้ พูดว่า “เริ่มใหม่” เพื่อลองชุดอื่น หรือถามเกี่ยวกับชื่อด้านบน",
    "chat.rec.moreIntro":
      "นี่คืออีก {n} รายการจากแคตตาล็อก{prefLine} แตะ “แนะนำเพิ่ม” อีกครั้งสำหรับชุดถัดไป หรือถามเกี่ยวกับชื่อด้านบน",
    "detail.assistant.title": "ถามเกี่ยวกับเกมนี้",
    "detail.assistant.sub":
      "ถามวิธีเล่น {name} ที่มา สิ่งที่ต้องใช้ รูปแบบทางวัฒนธรรม หรือที่ซื้อ",
    "detail.assistant.welcome":
      "ฉันช่วยเรื่อง **{name}** ได้—กฎ ประวัติ สิ่งที่ต้องใช้ รูปแบบ และลิงก์ซื้อจากแคตตาล็อกนี้ อยากรู้เรื่องอะไร?",
    "detail.assistant.hint":
      "ถามอะไรก็ได้เกี่ยวกับ {name} ในแคตตาล็อกนี้—กฎ ที่มา อุปกรณ์ รูปแบบ หรือการซื้อ",
    "detail.assistant.outOfScope":
      "ฉันอยู่กับ Ludus Atlas และเกมหน้านี้ **{name}** อธิบายวิธีเล่น พื้นหลัง สิ่งที่ต้องใช้ รูปแบบ หรือการซื้อได้—ถามในกรอบนั้น",
    "detail.assistant.otherGame":
      "หน้านี้เกี่ยวกับ **{name}** ตอบได้เฉพาะรายการนี้ สำหรับชื่ออื่น เปิดหน้าของมันหรือไปที่ Atlas Guide",
    "detail.assistant.useGuide":
      "หากต้องการหาของเล่นและเกมอื่น ใช้ Atlas Guide ที่นี่พูดถึงเฉพาะ **{name}**—กฎ ประวัติ อุปกรณ์ รูปแบบ และการซื้อ",
    "detail.assistant.default":
      "{about}\n\nถามวิธีเล่น {name} สิ่งที่ต้องใช้ รูปแบบ หรือที่ซื้อ",
    "detail.assistant.placeholder": "ถามเกี่ยวกับ {name}…",
    "detail.assistant.inputLabel": "คำถามเกี่ยวกับ {name}",
    "detail.assistant.send": "ถาม",
    "detail.assistant.suggestions": "คำถามแนะนำ",
    "detail.assistant.scopeNote": "จำกัดเฉพาะรายการในแคตตาล็อกนี้",
    "detail.assistant.guideLink": "เรียกดูด้วย Atlas Guide →",
  },
  id: {
    "chat.rec.exhausted":
      "Itulah semua kecocokan kuat untuk preferensi ini. Katakan “mulai ulang” untuk campuran lain, atau tanya tentang judul di atas.",
    "chat.rec.moreIntro":
      "Berikut {n} pilihan lagi dari katalog{prefLine}. Ketuk lagi “Rekomendasi lainnya” untuk set berikutnya, atau tanya tentang judul di atas.",
    "detail.assistant.title": "Tanya tentang permainan ini",
    "detail.assistant.sub":
      "Tanya cara bermain {name}, asal-usulnya, apa yang dibutuhkan, variasi budaya, atau di mana membelinya.",
    "detail.assistant.welcome":
      "Saya di sini untuk membantu tentang **{name}**—aturan, sejarah, kebutuhan, variasi, dan tautan pembelian dari katalog ini. Apa yang ingin Anda ketahui?",
    "detail.assistant.hint":
      "Tanya apa saja tentang {name} di katalog ini—aturan, asal, perlengkapan, variasi, atau pembelian.",
    "detail.assistant.outOfScope":
      "Saya tetap pada Ludus Atlas dan permainan halaman ini, **{name}**. Saya bisa menjelaskan cara bermain, latar, kebutuhan, variasi, atau pembelian—tanya dalam lingkup itu.",
    "detail.assistant.otherGame":
      "Halaman ini tentang **{name}**. Saya menjawab entri ini; untuk judul lain, buka halamannya atau kunjungi Atlas Guide.",
    "detail.assistant.useGuide":
      "Untuk menemukan mainan dan permainan lain, gunakan Atlas Guide. Di sini saya hanya membahas **{name}**—aturan, sejarah, perlengkapan, variasi, dan pembelian.",
    "detail.assistant.default":
      "{about}\n\nTanya cara bermain {name}, apa yang dibutuhkan, variasi, atau di mana membelinya.",
    "detail.assistant.placeholder": "Tanya tentang {name}…",
    "detail.assistant.inputLabel": "Pertanyaan tentang {name}",
    "detail.assistant.send": "Tanya",
    "detail.assistant.suggestions": "Pertanyaan yang disarankan",
    "detail.assistant.scopeNote": "Dibatasi pada entri katalog ini.",
    "detail.assistant.guideLink": "Jelajahi dengan Atlas Guide →",
  },
  nl: {
    "chat.rec.exhausted":
      "Dat zijn alle sterke treffers voor deze voorkeuren. Zeg “opnieuw beginnen” voor een andere mix, of vraag naar een titel hierboven.",
    "chat.rec.moreIntro":
      "Hier zijn {n} extra cataloguskeuzes{prefLine}. Tik opnieuw op “Meer aanbevelingen” voor de volgende set, of vraag naar een titel hierboven.",
    "detail.assistant.title": "Vraag over dit spel",
    "detail.assistant.sub":
      "Vraag hoe je {name} speelt, waar het vandaan komt, wat je nodig hebt, culturele varianten of waar te koop.",
    "detail.assistant.welcome":
      "Ik help met **{name}** — regels, geschiedenis, benodigdheden, varianten en koop links uit deze catalogus. Wat wil je weten?",
    "detail.assistant.hint":
      "Vraag me alles over {name} in deze catalogus — regels, herkomst, materiaal, varianten of kopen.",
    "detail.assistant.outOfScope":
      "Ik blijf bij Ludus Atlas en het spel op deze pagina, **{name}**. Ik kan uitleggen hoe te spelen, de achtergrond, wat je nodig hebt, varianten of kopen — vraag in dat kader.",
    "detail.assistant.otherGame":
      "Deze pagina gaat over **{name}**. Ik beantwoord vragen over deze entry; voor een andere titel open die pagina of ga naar Atlas Guide.",
    "detail.assistant.useGuide":
      "Om andere speelgoed en spellen te vinden, gebruik Atlas Guide. Hier behandel ik alleen **{name}** — regels, geschiedenis, materiaal, varianten en kopen.",
    "detail.assistant.default":
      "{about}\n\nVraag hoe je {name} speelt, wat je nodig hebt, varianten of waar te koop.",
    "detail.assistant.placeholder": "Vraag over {name}…",
    "detail.assistant.inputLabel": "Vraag over {name}",
    "detail.assistant.send": "Vragen",
    "detail.assistant.suggestions": "Voorgestelde vragen",
    "detail.assistant.scopeNote": "Beperkt tot deze catalogusentry.",
    "detail.assistant.guideLink": "Bladeren met Atlas Guide →",
  },
  pl: {
    "chat.rec.exhausted":
      "To wszystkie mocne trafienia dla tych preferencji. Powiedz „zacznij od nowa”, by zmienić zestaw, albo zapytaj o dowolny tytuł powyżej.",
    "chat.rec.moreIntro":
      "Oto kolejne {n} pozycje z katalogu{prefLine}. Dotknij znów „Więcej rekomendacji” po następny zestaw albo zapytaj o tytuł powyżej.",
    "detail.assistant.title": "Zapytaj o tę grę",
    "detail.assistant.sub":
      "Zapytaj, jak grać w {name}, skąd pochodzi, czego potrzebujesz, o warianty kulturowe lub gdzie kupić.",
    "detail.assistant.welcome":
      "Jestem tu, by pomóc z **{name}** — zasady, historia, wymagania, warianty i linki zakupowe z tego katalogu. Co chcesz wiedzieć?",
    "detail.assistant.hint":
      "Zapytaj mnie o cokolwiek dotyczącego {name} w tym katalogu — zasady, pochodzenie, sprzęt, warianty lub zakup.",
    "detail.assistant.outOfScope":
      "Zostaję przy Ludus Atlas i grze z tej strony, **{name}**. Mogę wyjaśnić zasady, tło, potrzeby, warianty lub zakup — pytaj w tym zakresie.",
    "detail.assistant.otherGame":
      "Ta strona dotyczy **{name}**. Odpowiem na pytania o ten wpis; inny tytuł — otwórz jego stronę lub Atlas Guide.",
    "detail.assistant.useGuide":
      "Aby znaleźć inne zabawki i gry, użyj Atlas Guide. Tu omawiam tylko **{name}** — zasady, historię, sprzęt, warianty i zakup.",
    "detail.assistant.default":
      "{about}\n\nZapytaj, jak grać w {name}, czego potrzebujesz, o warianty lub gdzie kupić.",
    "detail.assistant.placeholder": "Zapytaj o {name}…",
    "detail.assistant.inputLabel": "Pytanie o {name}",
    "detail.assistant.send": "Zapytaj",
    "detail.assistant.suggestions": "Proponowane pytania",
    "detail.assistant.scopeNote": "Ograniczone do tego wpisu katalogu.",
    "detail.assistant.guideLink": "Przeglądaj z Atlas Guide →",
  },
  sv: {
    "chat.rec.exhausted":
      "Det är alla starka träffar för dessa preferenser. Säg “börja om” för en annan mix, eller fråga om någon titel ovan.",
    "chat.rec.moreIntro":
      "Här är {n} fler katalogval{prefLine}. Tryck igen på “Fler rekommendationer” för nästa set, eller fråga om någon titel ovan.",
    "detail.assistant.title": "Fråga om det här spelet",
    "detail.assistant.sub":
      "Fråga hur man spelar {name}, varifrån det kommer, vad du behöver, kulturella varianter eller var man köper det.",
    "detail.assistant.welcome":
      "Jag hjälper till med **{name}** — regler, historia, krav, varianter och köplänkar från den här katalogen. Vad vill du veta?",
    "detail.assistant.hint":
      "Fråga mig vad som helst om {name} i den här katalogen — regler, ursprung, utrustning, varianter eller köp.",
    "detail.assistant.outOfScope":
      "Jag håller mig till Ludus Atlas och spelet på den här sidan, **{name}**. Jag kan förklara spel, bakgrund, behov, varianter eller köp — fråga inom det.",
    "detail.assistant.otherGame":
      "Den här sidan handlar om **{name}**. Jag svarar om den här posten; för en annan titel, öppna dess sida eller besök Atlas Guide.",
    "detail.assistant.useGuide":
      "För att hitta andra leksaker och spel, använd Atlas Guide. Här täcker jag bara **{name}** — regler, historia, utrustning, varianter och köp.",
    "detail.assistant.default":
      "{about}\n\nFråga hur man spelar {name}, vad du behöver, varianter eller var man köper det.",
    "detail.assistant.placeholder": "Fråga om {name}…",
    "detail.assistant.inputLabel": "Fråga om {name}",
    "detail.assistant.send": "Fråga",
    "detail.assistant.suggestions": "Föreslagna frågor",
    "detail.assistant.scopeNote": "Begränsat till den här katalogposten.",
    "detail.assistant.guideLink": "Bläddra med Atlas Guide →",
  },
  el: {
    "chat.rec.exhausted":
      "Αυτές είναι όλες οι ισχυρές αντιστοιχίες για αυτές τις προτιμήσεις. Πες «ξεκίνα από την αρχή» για άλλο μείγμα, ή ρώτα για κάποιον τίτλο παραπάνω.",
    "chat.rec.moreIntro":
      "Ορίστε ακόμη {n} επιλογές από τον κατάλογο{prefLine}. Άγγιξε ξανά «Περισσότερες προτάσεις» για το επόμενο σύνολο, ή ρώτα για κάποιον τίτλο παραπάνω.",
    "detail.assistant.title": "Ρώτα για αυτό το παιχνίδι",
    "detail.assistant.sub":
      "Ρώτα πώς παίζεται το {name}, από πού έρχεται, τι χρειάζεσαι, πολιτισμικές παραλλαγές ή πού να το αγοράσεις.",
    "detail.assistant.welcome":
      "Είμαι εδώ για το **{name}**—κανόνες, ιστορία, απαιτήσεις, παραλλαγές και σύνδεσμοι αγοράς από αυτόν τον κατάλογο. Τι θέλεις να μάθεις;",
    "detail.assistant.hint":
      "Ρώτα με οτιδήποτε για το {name} σε αυτόν τον κατάλογο—κανόνες, προέλευση, εξοπλισμός, παραλλαγές ή αγορά.",
    "detail.assistant.outOfScope":
      "Μένω στο Ludus Atlas και στο παιχνίδι αυτής της σελίδας, **{name}**. Μπορώ να εξηγήσω παιχνίδι, υπόβαθρο, τι χρειάζεσαι, παραλλαγές ή αγορά—ρώτα σε αυτό το πλαίσιο.",
    "detail.assistant.otherGame":
      "Αυτή η σελίδα αφορά το **{name}**. Απαντώ για αυτή την καταχώριση· για άλλον τίτλο άνοιξε τη σελίδα του ή επισκέψου τον Οδηγό Άτλαντα.",
    "detail.assistant.useGuide":
      "Για να βρεις άλλα παιχνίδια και παιχνιδάκια, χρησιμοποίησε τον Οδηγό Άτλαντα. Εδώ καλύπτω μόνο το **{name}**—κανόνες, ιστορία, εξοπλισμός, παραλλαγές και αγορά.",
    "detail.assistant.default":
      "{about}\n\nΡώτα πώς παίζεται το {name}, τι χρειάζεσαι, παραλλαγές ή πού να το αγοράσεις.",
    "detail.assistant.placeholder": "Ρώτα για το {name}…",
    "detail.assistant.inputLabel": "Ερώτηση για το {name}",
    "detail.assistant.send": "Ρώτα",
    "detail.assistant.suggestions": "Προτεινόμενες ερωτήσεις",
    "detail.assistant.scopeNote": "Περιορίζεται σε αυτή την καταχώριση καταλόγου.",
    "detail.assistant.guideLink": "Περιήγηση με τον Οδηγό Άτλαντα →",
  },
  he: {
    "chat.rec.exhausted":
      "אלה כל ההתאמות החזקות להעדפות האלה. אמרו “התחלה מחדש” לתערובת אחרת, או שאלו על כותרת למעלה.",
    "chat.rec.moreIntro":
      "הנה עוד {n} בחירות מהקטלוג{prefLine}. לחצו שוב על “עוד המלצות” לקבוצה הבאה, או שאלו על כותרת למעלה.",
    "detail.assistant.title": "שאלו על המשחק הזה",
    "detail.assistant.sub":
      "שאלו איך משחקים ב־{name}, מאיפה הוא, מה צריך, וריאציות תרבותיות או איפה לקנות.",
    "detail.assistant.welcome":
      "אני כאן לעזור עם **{name}**—כללים, היסטוריה, דרישות, וריאציות וקישורי רכישה מהקטלוג הזה. מה תרצו לדעת?",
    "detail.assistant.hint":
      "שאלו אותי כל דבר על {name} בקטלוג הזה—כללים, מקור, ציוד, וריאציות או רכישה.",
    "detail.assistant.outOfScope":
      "אני נשארת עם Ludus Atlas ועם המשחק בעמוד הזה, **{name}**. אפשר להסביר איך משחקים, רקע, מה צריך, וריאציות או רכישה—שאלו בטווח הזה.",
    "detail.assistant.otherGame":
      "העמוד הזה על **{name}**. אפשר לענות על הרשומה הזו; לכותרת אחרת פתחו את העמוד שלה או בקרו ב־Atlas Guide.",
    "detail.assistant.useGuide":
      "למציאת צעצועים ומשחקים אחרים השתמשו ב־Atlas Guide. כאן אני מכסה רק את **{name}**—כללים, היסטוריה, ציוד, וריאציות ורכישה.",
    "detail.assistant.default":
      "{about}\n\nשאלו איך משחקים ב־{name}, מה צריך, וריאציות או איפה לקנות.",
    "detail.assistant.placeholder": "שאלו על {name}…",
    "detail.assistant.inputLabel": "שאלה על {name}",
    "detail.assistant.send": "שאלו",
    "detail.assistant.suggestions": "שאלות מוצעות",
    "detail.assistant.scopeNote": "מוגבל לרשומת הקטלוג הזו.",
    "detail.assistant.guideLink": "עיון עם Atlas Guide →",
  },
  uk: {
    "chat.rec.exhausted":
      "Це всі сильні збіги для цих уподобань. Скажіть «почати знову» для іншого набору або запитайте про будь-яку назву вище.",
    "chat.rec.moreIntro":
      "Ось ще {n} варіантів з каталогу{prefLine}. Знову натисніть «Більше рекомендацій» для наступного набору або запитайте про назву вище.",
    "detail.assistant.title": "Запитати про цю гру",
    "detail.assistant.sub":
      "Запитайте, як грати в {name}, звідки вона, що потрібно, культурні варіанти або де купити.",
    "detail.assistant.welcome":
      "Я тут, щоб допомогти з **{name}** — правила, історія, вимоги, варіанти та посилання на купівлю з цього каталогу. Що хочете дізнатися?",
    "detail.assistant.hint":
      "Запитайте що завгодно про {name} у цьому каталозі — правила, походження, спорядження, варіанти чи купівлю.",
    "detail.assistant.outOfScope":
      "Я лишаюся в Ludus Atlas і з грою цієї сторінки, **{name}**. Можу пояснити гру, тло, що потрібно, варіанти чи купівлю — питайте в цих межах.",
    "detail.assistant.otherGame":
      "Ця сторінка про **{name}**. Відповім щодо цього запису; для іншої назви відкрийте її сторінку або Atlas Guide.",
    "detail.assistant.useGuide":
      "Щоб знайти інші іграшки й ігри, скористайтеся Atlas Guide. Тут лише **{name}** — правила, історія, спорядження, варіанти й купівля.",
    "detail.assistant.default":
      "{about}\n\nЗапитайте, як грати в {name}, що потрібно, варіанти або де купити.",
    "detail.assistant.placeholder": "Запитати про {name}…",
    "detail.assistant.inputLabel": "Питання про {name}",
    "detail.assistant.send": "Запитати",
    "detail.assistant.suggestions": "Запропоновані питання",
    "detail.assistant.scopeNote": "Обмежено цим записом каталогу.",
    "detail.assistant.guideLink": "Переглянути з Atlas Guide →",
  },
  fa: {
    "chat.rec.exhausted":
      "این همهٔ تطابق‌های قوی برای این ترجیح‌هاست. بگویید «از نو شروع کن» برای ترکیب دیگر، یا دربارهٔ هر عنوان بالا بپرسید.",
    "chat.rec.moreIntro":
      "این‌جا {n} گزینش دیگر از فهرست است{prefLine}. دوباره «پیشنهادهای بیشتر» را بزنید برای دستهٔ بعد، یا دربارهٔ هر عنوان بالا بپرسید.",
    "detail.assistant.title": "دربارهٔ این بازی بپرسید",
    "detail.assistant.sub":
      "بپرسید چگونه {name} بازی می‌شود، از کجا آمده، چه نیاز دارید، گونه‌های فرهنگی، یا کجا بخرید.",
    "detail.assistant.welcome":
      "این‌جا برای کمک دربارهٔ **{name}** هستم—قواعد، تاریخ، نیازها، گونه‌ها و پیوندهای خرید از این فهرست. چه می‌خواهید بدانید؟",
    "detail.assistant.hint":
      "هر چیزی دربارهٔ {name} در این فهرست بپرسید—قواعد، خاستگاه، ابزار، گونه‌ها یا خرید.",
    "detail.assistant.outOfScope":
      "با Ludus Atlas و بازی این صفحه، **{name}** می‌مانم. می‌توانم بازی، پیشینه، نیازها، گونه‌ها یا خرید را توضیح دهم—در همان چارچوب بپرسید.",
    "detail.assistant.otherGame":
      "این صفحه دربارهٔ **{name}** است. به این مدخل پاسخ می‌دهم؛ برای عنوان دیگر صفحه‌اش را باز کنید یا Atlas Guide را ببینید.",
    "detail.assistant.useGuide":
      "برای یافتن اسباب‌بازی و بازی‌های دیگر از Atlas Guide استفاده کنید. این‌جا فقط **{name}** را پوشش می‌دهم—قواعد، تاریخ، ابزار، گونه‌ها و خرید.",
    "detail.assistant.default":
      "{about}\n\nبپرسید چگونه {name} بازی می‌شود، چه نیاز دارید، گونه‌ها، یا کجا بخرید.",
    "detail.assistant.placeholder": "دربارهٔ {name} بپرسید…",
    "detail.assistant.inputLabel": "پرسش دربارهٔ {name}",
    "detail.assistant.send": "بپرسید",
    "detail.assistant.suggestions": "پرسش‌های پیشنهادی",
    "detail.assistant.scopeNote": "محدود به این مدخل فهرست.",
    "detail.assistant.guideLink": "مرور با Atlas Guide →",
  },
  bn: {
    "chat.rec.exhausted":
      "এই পছন্দগুলোর জন্য সব শক্ত মিল এখানেই। অন্য মিশ্রণের জন্য “আবার শুরু” বলুন, বা উপরের কোনো শিরোনাম সম্পর্কে জিজ্ঞাসা করুন।",
    "chat.rec.moreIntro":
      "তালিকা থেকে আরও {n}টি পছন্দ{prefLine}। পরের সেটের জন্য আবার “আরও সুপারিশ” ট্যাপ করুন, বা উপরের কোনো শিরোনাম জিজ্ঞাসা করুন।",
    "detail.assistant.title": "এই খেলা সম্পর্কে জিজ্ঞাসা করুন",
    "detail.assistant.sub":
      "{name} কীভাবে খেলবেন, কোথা থেকে এসেছে, কী লাগবে, সাংস্কৃতিক রূপভেদ, বা কোথায় কিনবেন—জিজ্ঞাসা করতে পারেন।",
    "detail.assistant.welcome":
      "আমি **{name}** নিয়ে সাহায্য করতে এখানে—এই তালিকার নিয়ম, ইতিহাস, প্রয়োজন, রূপভেদ ও কেনার লিঙ্ক। কী জানতে চান?",
    "detail.assistant.hint":
      "এই তালিকায় {name} সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন—নিয়ম, উৎস, সরঞ্জাম, রূপভেদ বা কেনা।",
    "detail.assistant.outOfScope":
      "আমি Ludus Atlas ও এই পৃষ্ঠার খেলা **{name}**-এ সীমাবদ্ধ। খেলা, পটভূমি, প্রয়োজন, রূপভেদ বা কেনা ব্যাখ্যা করতে পারি—সেই সীমায় জিজ্ঞাসা করুন।",
    "detail.assistant.otherGame":
      "এই পৃষ্ঠা **{name}** সম্পর্কে। এই এন্ট্রিতে উত্তর দিতে পারি; অন্য শিরোনামের জন্য তার পৃষ্ঠা খুলুন বা Atlas Guide দেখুন।",
    "detail.assistant.useGuide":
      "অন্য খেলনা ও খেলা খুঁজতে Atlas Guide ব্যবহার করুন। এখানে শুধু **{name}**—নিয়ম, ইতিহাস, সরঞ্জাম, রূপভেদ ও কেনা।",
    "detail.assistant.default":
      "{about}\n\nজিজ্ঞাসা করুন {name} কীভাবে খেলবেন, কী লাগবে, রূপভেদ, বা কোথায় কিনবেন।",
    "detail.assistant.placeholder": "{name} সম্পর্কে জিজ্ঞাসা…",
    "detail.assistant.inputLabel": "{name} সম্পর্কে প্রশ্ন",
    "detail.assistant.send": "জিজ্ঞাসা",
    "detail.assistant.suggestions": "প্রস্তাবিত প্রশ্ন",
    "detail.assistant.scopeNote": "এই তালিকা এন্ট্রিতে সীমাবদ্ধ।",
    "detail.assistant.guideLink": "Atlas Guide দিয়ে ব্রাউজ →",
  },
  sw: {
    "chat.rec.exhausted":
      "Hizo ndizo mechi zote thabiti kwa mapendeleo haya. Sema “anza upya” kwa mchanganyiko mwingine, au uliza kuhusu kichwa chochote hapo juu.",
    "chat.rec.moreIntro":
      "Hapa kuna chaguo {n} zaidi kutoka katalogi{prefLine}. Gusa tena “Mapendekezo zaidi” kwa seti ifuatayo, au uliza kuhusu kichwa chochote hapo juu.",
    "detail.assistant.title": "Uliza kuhusu mchezo huu",
    "detail.assistant.sub":
      "Uliza jinsi ya kucheza {name}, inatoka wapi, unahitaji nini, tofauti za kitamaduni, au wapi kununua.",
    "detail.assistant.welcome":
      "Nipo kusaidia kuhusu **{name}**—sheria, historia, mahitaji, tofauti, na viungo vya ununuzi kutoka katalogi hii. Ungependa kujua nini?",
    "detail.assistant.hint":
      "Niulize chochote kuhusu {name} katika katalogi hii—sheria, asili, vifaa, tofauti, au ununuzi.",
    "detail.assistant.outOfScope":
      "Nabaki na Ludus Atlas na mchezo wa ukurasa huu, **{name}**. Ninaweza kueleza jinsi ya kucheza, historia, mahitaji, tofauti, au ununuzi—uliza katika mipaka hiyo.",
    "detail.assistant.otherGame":
      "Ukurasa huu ni kuhusu **{name}**. Ninaweza kujibu kuhusu ingizo hili; kwa kichwa kingine fungua ukurasa wake au tembelea Atlas Guide.",
    "detail.assistant.useGuide":
      "Kutafuta vinyago na michezo mingine, tumia Atlas Guide. Hapa ninafunika tu **{name}**—sheria, historia, vifaa, tofauti, na ununuzi.",
    "detail.assistant.default":
      "{about}\n\nUliza jinsi ya kucheza {name}, unahitaji nini, tofauti, au wapi kununua.",
    "detail.assistant.placeholder": "Uliza kuhusu {name}…",
    "detail.assistant.inputLabel": "Swali kuhusu {name}",
    "detail.assistant.send": "Uliza",
    "detail.assistant.suggestions": "Maswali yanayopendekezwa",
    "detail.assistant.scopeNote": "Imezuiliwa kwa ingizo hili la katalogi.",
    "detail.assistant.guideLink": "Vinjari na Atlas Guide →",
  },
  la: {
    "chat.rec.exhausted":
      "Hae sunt omnes firmæ congruentiae pro his preferentiis. Dic “denuo incipe” pro alia mixtura, aut roga de ullo titulo supra.",
    "chat.rec.moreIntro":
      "Ecce {n} plures electiones e catalogo{prefLine}. Tange iterum “Plura consilia” pro proximo grege, aut roga de ullo titulo supra.",
    "detail.assistant.title": "De hoc ludo interroga",
    "detail.assistant.sub":
      "Roga quomodo {name} ludatur, unde veniat, quid opus sit, variationes culturales, aut ubi emendum.",
    "detail.assistant.welcome":
      "Adsum de **{name}**—leges, historia, requisita, variationes et nexus emptionis ex hoc catalogo. Quid scire vis?",
    "detail.assistant.hint":
      "Roga quidlibet de {name} in hoc catalogo—leges, origo, instrumenta, variationes aut emptio.",
    "detail.assistant.outOfScope":
      "Maneo apud Ludum Atlantem et ludum huius paginae, **{name}**. Possum explicare quomodo ludatur, originem, quid opus sit, variationes aut emptionem—intra hos fines roga.",
    "detail.assistant.otherGame":
      "Hæc pagina de **{name}** est. De hoc titulo respondebo; pro alio titulo eius paginam aperi aut Ducem Atlantis visita.",
    "detail.assistant.useGuide":
      "Ad alia crepundia et ludos inveniendos Duce Atlantis utere. Hic solum **{name}** tracto—leges, historia, instrumenta, variationes et emptio.",
    "detail.assistant.default":
      "{about}\n\nRoga quomodo {name} ludatur, quid opus sit, variationes, aut ubi emendum.",
    "detail.assistant.placeholder": "De {name} interroga…",
    "detail.assistant.inputLabel": "Quæstio de {name}",
    "detail.assistant.send": "Interroga",
    "detail.assistant.suggestions": "Quæstiones suggestæ",
    "detail.assistant.scopeNote": "Ad hunc titulum catalogi limitatum.",
    "detail.assistant.guideLink": "Cum Duce Atlantis percurre →",
  },
  grc: {
    "chat.rec.exhausted":
      "Αὗται πᾶσαι αἱ ἰσχυραὶ συμφωνίαι ταῖς προτιμήσεσι ταύταις. Εἰπὲ «ἄρχου αὖθις» πρὸς ἄλλην μῖξιν, ἢ ἐρώτα περὶ τινος τίτλου ἄνω.",
    "chat.rec.moreIntro":
      "Ἰδοὺ ἔτι {n} ἐκλογαὶ ἐκ καταλόγου{prefLine}. Ἅψαι αὖθις «Πλείονες συμβουλαί» πρὸς τὸ ἑξῆς σύνολον, ἢ ἐρώτα περὶ τίτλου ἄνω.",
    "detail.assistant.title": "Ἐρώτησον περὶ τοῦδε τοῦ παιγνίου",
    "detail.assistant.sub":
      "Ἐρώτα πῶς παίζεται τὸ {name}, πόθεν ἥκει, τί δεῖ, πολιτισμικὰς παραλλαγάς, ἢ ποῦ ὠνεῖσθαι.",
    "detail.assistant.welcome":
      "Πάρειμι περὶ **{name}**—νόμοι, ἱστορία, ἀπαιτήσεις, παραλλαγαὶ καὶ σύνδεσμοι ὠνῆς ἐκ τοῦδε τοῦ καταλόγου. Τί βούλει μαθεῖν;",
    "detail.assistant.hint":
      "Ἐρώτα με ὁτιοῦν περὶ {name} ἐν τῷδε τῷ καταλόγῳ—νόμοι, ἀρχή, σκεύη, παραλλαγαὶ ἢ ὠνή.",
    "detail.assistant.outOfScope":
      "Μένω ἐν τῷ Ludus Atlas καὶ τῷ παιγνίῳ τῆσδε τῆς σελίδος, **{name}**. Δύναμαι ἐξηγεῖσθαι παίζειν, ἱστορίαν, χρείαν, παραλλαγὰς ἢ ὠνήν—ἐν τούτοις τοῖς ὅροις ἐρώτα.",
    "detail.assistant.otherGame":
      "Ἥδε ἡ σελὶς περὶ **{name}**. Ἀποκρίνομαι περὶ τῆσδε τῆς εἰσόδου· περὶ ἄλλου τίτλου ἄνοιξον τὴν σελίδα ἢ ἐπισκέψαι τὸν Ὁδηγὸν Ἄτλαντα.",
    "detail.assistant.useGuide":
      "Πρὸς ἄλλα παίγνια εὑρεῖν χρῶ τῷ Ὁδηγῷ Ἄτλαντι. Ἐνταῦθα μόνον τὸ **{name}** καλύπτω—νόμοι, ἱστορία, σκεύη, παραλλαγαὶ καὶ ὠνή.",
    "detail.assistant.default":
      "{about}\n\nἘρώτα πῶς παίζεται τὸ {name}, τί δεῖ, παραλλαγάς, ἢ ποῦ ὠνεῖσθαι.",
    "detail.assistant.placeholder": "Ἐρώτησον περὶ {name}…",
    "detail.assistant.inputLabel": "Ἐρώτησις περὶ {name}",
    "detail.assistant.send": "Ἐρώτησον",
    "detail.assistant.suggestions": "Προτεινόμεναι ἐρωτήσεις",
    "detail.assistant.scopeNote": "Περιορίζεται εἰς τήνδε τὴν καταλόγου εἴσοδον.",
    "detail.assistant.guideLink": "Περιήγησαι σὺν Ὁδηγῷ Ἄτλαντι →",
  },
  sa: {
    "chat.rec.exhausted":
      "एतेषां रुचीनां कृते दृढाः मिलनाः एतावन्तः। भिन्नमिश्रणाय “पुनरारभस्व” इति ब्रूहि, अथवा उपरि कस्यापि शीर्षकस्य विषये पृच्छ।",
    "chat.rec.moreIntro":
      "अत्र सूच्याः अपराणि {n} विकल्पाः{prefLine}। अग्रिमसमूहाय पुनः “अधिकानि सूचनानि” स्पृश, अथवा उपरि शीर्षकं पृच्छ।",
    "detail.assistant.title": "अस्याः क्रीडायाः विषये पृच्छतु",
    "detail.assistant.sub":
      "{name} कथं क्रीड्यते, कुतः आयाति, किं आवश्यकम्, सांस्कृतिकभेदाः, क्रयस्थानं वा पृच्छतु।",
    "detail.assistant.welcome":
      "अहं **{name}** विषये सहाय्यार्थम् अस्मि—अस्यां सूच्यां नियमाः, इतिहासः, आवश्यकताः, भेदाः, क्रयसङ्केताः च। किं ज्ञातुम् इच्छसि?",
    "detail.assistant.hint":
      "अस्यां सूच्यां {name} विषये किमपि पृच्छ—नियमाः, उत्पत्तिः, सामग्री, भेदाः अथवा क्रयः।",
    "detail.assistant.outOfScope":
      "अहं Ludus Atlas तथा अस्याः पृष्ठस्य क्रीडया **{name}** सह तिष्ठामि। क्रीडनविधिं, पृष्ठभूमिं, आवश्यकताः, भेदान्, क्रयं वा व्याख्यातुं शक्नोमि—तस्मिन् सीमायां पृच्छ।",
    "detail.assistant.otherGame":
      "इदं पृष्ठं **{name}** विषये। अस्याः प्रविष्टेः उत्तरं ददामि; अन्यशीर्षकाय तस्य पृष्ठं उद्घाटय अथवा Atlas मार्गदर्शकं पश्य।",
    "detail.assistant.useGuide":
      "अन्याः क्रीडाः क्रीडनकानि च अन्वेष्टुं Atlas मार्गदर्शकं उपयुज्यताम्। अत्र केवलं **{name}**—नियमाः, इतिहासः, सामग्री, भेदाः, क्रयः।",
    "detail.assistant.default":
      "{about}\n\nपृच्छतु {name} कथं क्रीड्यते, किं आवश्यकम्, भेदाः, क्रयस्थानं वा।",
    "detail.assistant.placeholder": "{name} विषये पृच्छतु…",
    "detail.assistant.inputLabel": "{name} विषये प्रश्नः",
    "detail.assistant.send": "पृच्छतु",
    "detail.assistant.suggestions": "सूचिताः प्रश्नाः",
    "detail.assistant.scopeNote": "अस्याः सूचीप्रविष्टेः सीमायां।",
    "detail.assistant.guideLink": "Atlas मार्गदर्शकेन पश्यतु →",
  },
  egy: {
    "chat.rec.exhausted":
      "nn nꜣ stp nꜣy.w mrwt. Say “šꜣꜥ m-bꜣḥ” for a different mix, or ask about a title above.",
    "chat.rec.moreIntro":
      "mk {n} stp ḥr sšmw{prefLine}. ḏm “More recommendations” ꜥn for the next set, or ask about a title above.",
    "detail.assistant.title": "ḳı͗s ḥr pꜣy hbʿ",
    "detail.assistant.sub":
      "ḳı͗s sı͗ mı͗ hbʿ {name}, ḫpr.f, ı͗ḫ ꜣḫ, ḫprw, ı͗wtyw ı͗sw.",
    "detail.assistant.welcome":
      "ı͗w.ı͗ ꜣḫ n **{name}**—tp-rd, ḫpr, ı͗ḫ ꜣḫ, ḫprw, ı͗sw m sšmw pn. ı͗ḫ mr.k rḫ?",
    "detail.assistant.hint":
      "ḳı͗s ı͗ḫ nb ḥr {name} m sšmw pn—tp-rd, ḫpr, ḫt, ḫprw, ı͗sw.",
    "detail.assistant.outOfScope":
      "ı͗w.ı͗ ḥnꜥ Ludus Atlas ḥnꜥ hbʿ n ḏfd pn, **{name}**. ı͗w.ı͗ r ḏd sbꜣyt, ḫpr, ı͗ḫ ꜣḫ, ḫprw, ı͗sw—ḳı͗s m tꜣ mı͗t.t.",
    "detail.assistant.otherGame":
      "pꜣy ḏfd ḥr **{name}**. ı͗w.ı͗ r wšb ḥr pꜣy rn; n rn ky wn ḏfd.f r-pw Atlas sšm.",
    "detail.assistant.useGuide":
      "r gm hbʿw ky.w ı͗rı͗ Atlas sšm. dy ı͗w.ı͗ ḥr **{name}** wꜥ—tp-rd, ḫpr, ḫt, ḫprw, ı͗sw.",
    "detail.assistant.default":
      "{about}\n\nḳı͗s sı͗ mı͗ hbʿ {name}, ı͗ḫ ꜣḫ, ḫprw, ı͗wtyw ı͗sw.",
    "detail.assistant.placeholder": "ḳı͗s ḥr {name}…",
    "detail.assistant.inputLabel": "šnı͗ ḥr {name}",
    "detail.assistant.send": "ḳı͗s",
    "detail.assistant.suggestions": "šnywt mtr",
    "detail.assistant.scopeNote": "m ḥw n pꜣy rn n sšmw.",
    "detail.assistant.guideLink": "ptr ḥnꜥ Atlas sšm →",
  },
  akk: {
    "chat.rec.exhausted":
      "Annûtu kal mitḫurū dannūtum ana migrī annûti. Qibi “ištu rēši epuš” ana šanîm, ū šâl šuma elênu.",
    "chat.rec.moreIntro":
      "Annumma {n} nigûtū šanûtum ina kisri{prefLine}. Luput “More recommendations” ana arkî, ū šâl šuma elênu.",
    "detail.assistant.title": "Šâl ina mēlulti annîti",
    "detail.assistant.sub":
      "Šâl akī {name} mēlulti, aṣâšu, mīna taḫšḫu, šanâti mātāti, ū ašar šâmi.",
    "detail.assistant.welcome":
      "Anāku ana **{name}**—parṣū, aṣû, ḫišḫū, šanâti, u ṭuppāt šîmi ina kisri annî. Mīna tidê?",
    "detail.assistant.hint":
      "Šâl mīnamme ina {name} ina kisri annî—parṣū, aṣû, unūtū, šanâti, ū šîmu.",
    "detail.assistant.outOfScope":
      "Ina Ludus Atlas u mēlulti ṭuppi annîti, **{name}**, azzaz. Parṣī, aṣâ, ḫišḫī, šanâti, ū šîma luparris—ina qerbīšu šâl.",
    "detail.assistant.otherGame":
      "Ṭuppu annû ina **{name}**. Ana ṭuppi annîti apâl; ana šumim šanîm pete ṭuppašu ū Atlas ālik pāni āmur.",
    "detail.assistant.useGuide":
      "Ana mēlulti šanâti amārim Atlas ālik pāni ūbil. Ina annîti **{name}** kīma ištēt—parṣū, aṣû, unūtū, šanâti, ū šîmu.",
    "detail.assistant.default":
      "{about}\n\nŠâl akī {name} mēlulti, mīna taḫšḫu, šanâti, ū ašar šâmi.",
    "detail.assistant.placeholder": "Šâl ina {name}…",
    "detail.assistant.inputLabel": "Šâlu ina {name}",
    "detail.assistant.send": "Šâl",
    "detail.assistant.suggestions": "Šâlū migru",
    "detail.assistant.scopeNote": "Ina ṭuppi kisri annîti.",
    "detail.assistant.guideLink": "Amur ina Atlas ālik pāni →",
  },
  non: {
    "chat.rec.exhausted":
      "Það eru allar sterkar samsvaranir fyrir þessar stillingar. Segðu „byrja upp á nýtt“ fyrir aðra blöndu, eða spyrðu um titil hér að ofan.",
    "chat.rec.moreIntro":
      "Hér eru {n} fleiri valkostir úr skránni{prefLine}. Ýttu aftur á „Fleiri tillögur“ fyrir næsta sett, eða spyrðu um titil hér að ofan.",
    "detail.assistant.title": "Spyrðu um þennan leik",
    "detail.assistant.sub":
      "Spyrðu hvernig á að leika {name}, hvaðan hann kemur, hvað þarf, menningarleg afbrigði eða hvar á að kaupa.",
    "detail.assistant.welcome":
      "Ég er hér til að hjálpa með **{name}**—reglur, saga, kröfur, afbrigði og kauphlekkir úr þessari skrá. Hvað viltu vita?",
    "detail.assistant.hint":
      "Spyrðu mig um hvað sem er varðandi {name} í þessari skrá—reglur, uppruna, búnað, afbrigði eða kaup.",
    "detail.assistant.outOfScope":
      "Ég held mig við Ludus Atlas og leik þessarar síðu, **{name}**. Ég get útskýrt leik, bakgrunn, þarfir, afbrigði eða kaup—spyrðu innan þess.",
    "detail.assistant.otherGame":
      "Þessi síða er um **{name}**. Ég svara um þessa færslu; fyrir annan titil opnaðu síðu hans eða farðu í Atlas Guide.",
    "detail.assistant.useGuide":
      "Til að finna önnur leikföng og leiki, notaðu Atlas Guide. Hér fjalla ég aðeins um **{name}**—reglur, sögu, búnað, afbrigði og kaup.",
    "detail.assistant.default":
      "{about}\n\nSpyrðu hvernig á að leika {name}, hvað þarf, afbrigði eða hvar á að kaupa.",
    "detail.assistant.placeholder": "Spyrðu um {name}…",
    "detail.assistant.inputLabel": "Spurning um {name}",
    "detail.assistant.send": "Spyrja",
    "detail.assistant.suggestions": "Tillöguspurningar",
    "detail.assistant.scopeNote": "Takmarkað við þessa skráarfærslu.",
    "detail.assistant.guideLink": "Skoða með Atlas Guide →",
  },
};

const PLACEHOLDER_KEYS = {
  "chat.rec.exhausted": [],
  "chat.rec.moreIntro": ["{n}", "{prefLine}"],
  "detail.assistant.title": [],
  "detail.assistant.sub": ["{name}"],
  "detail.assistant.welcome": ["{name}"],
  "detail.assistant.hint": ["{name}"],
  "detail.assistant.outOfScope": ["{name}"],
  "detail.assistant.otherGame": ["{name}"],
  "detail.assistant.useGuide": ["{name}"],
  "detail.assistant.default": ["{about}", "{name}"],
  "detail.assistant.placeholder": ["{name}"],
  "detail.assistant.inputLabel": ["{name}"],
  "detail.assistant.send": [],
  "detail.assistant.suggestions": [],
  "detail.assistant.scopeNote": [],
  "detail.assistant.guideLink": [],
};

const expectedKeys = Object.keys(PLACEHOLDER_KEYS);
let patchedFiles = 0;
let added = 0;

for (const file of readdirSync(packsDir).filter((f) => f.endsWith(".json"))) {
  const code = file.replace(/\.json$/, "");
  const patch = PATCH[code];
  if (!patch) throw new Error(`No patch for locale pack ${code}`);
  for (const k of expectedKeys) {
    if (!(k in patch)) throw new Error(`${code} missing patch key ${k}`);
    for (const ph of PLACEHOLDER_KEYS[k]) {
      if (!patch[k].includes(ph)) {
        throw new Error(`${code} ${k} missing placeholder ${ph}`);
      }
    }
  }
  const path = join(packsDir, file);
  const map = JSON.parse(readFileSync(path, "utf8"));
  let localAdded = 0;
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in map)) {
      map[k] = v;
      localAdded++;
      added++;
    }
  }
  if (localAdded) {
    writeFileSync(path, JSON.stringify(map, null, 2) + "\n");
    patchedFiles++;
    console.log(`patched ${code}: +${localAdded}`);
  } else {
    console.log(`ok ${code}: already complete`);
  }
}

console.log(`Done. files=${patchedFiles} keysAdded=${added}`);

const gen = spawnSync(process.execPath, [join(__dirname, "generate-i18n.mjs")], {
  stdio: "inherit",
});
if (gen.status !== 0) process.exit(gen.status ?? 1);
