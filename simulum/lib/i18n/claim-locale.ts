import type { Evidence, LocaleCode } from "@/lib/types";

/**
 * Exact English catalogue captions → Chinese claim lines.
 * Keys are lowercased trimmed English captions (or distinctive substrings matched below).
 */
const EN_TO_ZH: Record<string, string> = {
  "if civilizations run many ancestor simulations, odds favor us being in one":
    "若文明能运行大量祖先模拟，则我们极可能已处于模拟之中",
  "if civilizations can run many ancestor simulations, we are probably inside one":
    "若文明能运行大量祖先模拟，则我们很可能处于模拟之中",
  "if posthuman civilizations run ancestor simulations, we probably live in one":
    "若后人类文明运行祖先模拟，则我们很可能生活在模拟之中",
  "with many simulations, almost all observers are simulated":
    "若存在大量模拟，几乎所有观察者都是被模拟的",
  "bostrom's argument linked to the matrix metaphor as cultural evidence":
    "博斯特罗姆论证与《黑客帝国》隐喻被并列为文化证据",
  "observable reality as a program run by an advanced civilization":
    "可观察的现实被当作先进文明运行的程序",
  "zhuangzi's butterfly dream questions which layer of experience is real":
    "庄周梦蝶追问哪一层体验才是“真实”",
  "david chalmers argues virtual realities can be genuine realities, reframing simulation from skeptical threat to metaphysical possibility":
    "查默斯主张虚拟现实可以是真正的实在，把模拟从怀疑论威胁改写为形而上学可能",
  "chalmers argues virtual realities can be genuine realities":
    "查默斯主张虚拟现实可以是真正的实在",
  "if consciousness can run on any suitable substrate, then simulated minds are as 'real' as biological ones — a pillar of ancestor-simulation logic":
    "若意识可在任何合适基底上运行，则模拟心智与生物心智同样“真实”——祖先模拟逻辑的支柱",
  "if civilizations can run many ancestor simulations, almost all conscious observers are simulated":
    "若文明能运行大量祖先模拟，则几乎所有有意识的观察者都是被模拟的",
  "nick bostrom's 2003 argument: if civilizations can run many ancestor simulations, almost all conscious observers are simulated":
    "博斯特罗姆2003年论证：若文明能运行大量祖先模拟，几乎所有有意识观察者都是被模拟的",
  "rené descartes imagined a powerful deceiver creating a complete illusion of an external world, a classical precursor to simulation skepticism":
    "笛卡尔设想强大的欺骗者制造外部世界的完整幻觉——模拟怀疑论的古典先驱",
  "hilary putnam's thought experiment asks whether a brain fed simulated sensory input could know it was not in a 'real' world":
    "普特南的思想实验追问：被喂以模拟感官输入的大脑能否知道自己不在“真实”世界",
  "john archibald wheeler argued that every physical quantity derives from yes/no informational answers — reality as processed information":
    "惠勒主张每个物理量都来自是否式的信息回答——现实即被处理的信息",
  "the holographic principle suggests the universe's information content scales with surface area, not volume — like a rendered boundary":
    "全息原理表明宇宙信息量随表面积而非体积增长——如同被渲染的边界",
  "a 2012 paper argued that spacetime discreteness in a lattice simulation could leave observable signatures in cosmic rays":
    "2012年论文主张格点模拟中的时空离散性可能在宇宙线中留下可观测印记",
  "max tegmark proposes that our physical world is a mathematical structure — compatible with a fully formal, computable reality":
    "泰格马克提出物理世界即数学结构——与完全形式化、可计算的现实相容",
  "proposals that spacetime is discrete at the planck scale are often cited as consistent with a finite-resolution simulation substrate":
    "普朗克尺度时空离散的主张常被引为与有限分辨率模拟基底一致",
  "the apparent fine-tuning of physical constants is sometimes framed as evidence of deliberately chosen simulation parameters":
    "物理常数的表观精细调节有时被当作刻意设定的模拟参数之证据",
  "research linking ads/cft holography to quantum error correction is cited as suggestive that spacetime behaves like protected information":
    "将AdS/CFT全息与量子纠错相联系的研究被引为：时空表现得像受保护的信息",
  "stephen wolfram's cellular-automata program treats the universe as evolving under simple computational rules":
    "沃尔夫勒姆的元胞自动机纲领把宇宙当作在简单计算规则下演化",
  "konrad zuse's 1969 calculating space argued that the universe is a deterministic digital computer":
    "楚泽1969年《计算空间》主张宇宙是一台确定性数字计算机",
  "edward fredkin advanced digital philosophy: the universe is fundamentally a cellular automaton":
    "弗雷德金推进数字哲学：宇宙根本上是元胞自动机",
  "melvin vopson proposed that information has mass/energy and that detecting information erasure could test a simulated reality":
    "沃普森提出信息具有质量/能量，探测信息擦除可检验模拟现实",
  "elon musk publicly argued the odds we are in 'base reality' are one in billions, amplifying mainstream interest in the hypothesis":
    "马斯克公开主张我们处于“基底现实”的概率仅数十亿分之一，放大了该假说的主流关注",
  "in indic traditions, māyā describes phenomenal reality as illusion or cosmic play — a cultural ancestor of simulation metaphors":
    "在印度传统中，摩耶将现象实在描述为幻象或宇宙游戏——模拟隐喻的文化先驱",
  "popular accounts reinterpret delayed-choice experiments as evidence that unobserved paths are not 'rendered' until measured":
    "流行叙述将延迟选择实验重释为：未被观测的路径直到测量才被“渲染”",
  "non-technical retellings of the double-slit experiment claim observation collapses a simulated wavefunction — contested but widely posted as evidence":
    "双缝实验的非专业复述主张观测坍缩了模拟波函数——有争议但被广泛当作证据贴出",
  "collective false-memory lore is frequently posted online as a 'glitch' in a simulated timeline":
    "集体错误记忆传说常被当作模拟时间线中的“故障”在网上传播",
  "some writers claim the silence of the cosmos is explained if most observers inhabit sandboxed simulations with limited contact":
    "一些作者主张：若多数观察者居于接触受限的沙盒模拟中，即可解释宇宙的沉默",
  "rapid advances in real-time graphics are cited as inductive evidence that photoreal simulated worlds are eventually inevitable":
    "实时图形的飞速进步被引为归纳证据：逼真模拟世界终将不可避免",
  "ancestor simulations imply we are simulated":
    "祖先模拟意味着我们自身也被模拟",
};

const TITLE_ZH: Array<[RegExp, string]> = [
  [/bostrom|trilemma|simulation hypothesis/i, "博斯特罗姆模拟论证：我们几乎肯定处于模拟之中"],
  [/descartes|evil demon/i, "笛卡尔的邪恶精灵：外部世界可能是完整幻觉"],
  [/brain in a vat/i, "缸中之脑：模拟感官能否区分真实世界"],
  [/it from bit|wheeler/i, "惠勒“比特即实在”：物理量来自信息回答"],
  [/holographic/i, "全息原理：宇宙信息像被渲染的边界"],
  [/beane|davoudi|savage|lattice|1210\.1847/i, "格点模拟边界：时空离散或在宇宙线中留痕"],
  [/tegmark|mathematical universe/i, "泰格马克数学宇宙：物理世界即数学结构"],
  [/planck|pixelation|discrete spacetime/i, "普朗克尺度像素化：有限分辨率的模拟基底"],
  [/fine-tun/i, "宇宙精细调节：如同被选定的模拟参数"],
  [/error-correct|ads\/cft|holography/i, "时空中的量子纠错：受保护的信息结构"],
  [/wolfram/i, "沃尔夫勒姆计算宇宙：简单规则下的演化"],
  [/zuse|calculating space/i, "楚泽计算空间：宇宙是确定性数字计算机"],
  [/fredkin|digital philosophy/i, "弗雷德金数字哲学：宇宙是元胞自动机"],
  [/vopson|landauer|information equivalence/i, "信息质能等价：或以信息擦除检验模拟"],
  [/musk|one in billions/i, "马斯克“数十亿分之一”：我们几乎不在基底现实"],
  [/m[aā]y[aā]|illusion/i, "摩耶：现象世界是幻象或宇宙游戏"],
  [/zhuangzi|butterfly|庄周/i, "庄周梦蝶：追问哪一层体验为真"],
  [/delayed-choice|quantum eraser|deferred rendering/i, "延迟选择量子擦除：未观测路径延后渲染"],
  [/double-slit/i, "双缝观测叙事：观测坍缩模拟波函数"],
  [/mandela/i, "曼德拉效应：被当作模拟时间线故障"],
  [/fermi/i, "费米悖论：沙盒模拟隔离解释宇宙沉默"],
  [/substrate-independent|mind upload/i, "基底无关心智：模拟心智与生物心智同等真实"],
  [/video-game|realism analogy/i, "电子游戏逼真类比：逼真模拟世界终将到来"],
  [/chalmers|reality\+/i, "查默斯《现实+》：虚拟现实可以是真正的实在"],
  [/matrix|simulationstheorie|simulation und/i, "模拟论与《黑客帝国》隐喻作为文化证据"],
  [/гипотеза симуляции|simulaci[oó]n|hypothèse de la simulation|シミュレーション/i,
    "模拟宇宙假说：祖先模拟使观察者极可能处于模拟之中"],
  [/假设我们生活在模拟/i, "假设我们生活在模拟宇宙中"],
];

const PATTERN_ZH: Array<[RegExp, string]> = [
  [
    /ancestor simulation/i,
    "祖先模拟论证：若可运行大量模拟，我们极可能已在其中",
  ],
  [
    /almost all observers are simulated/i,
    "若存在大量模拟，几乎所有观察者都是被模拟的",
  ],
  [/matrix metaphor/i, "模拟论证与《黑客帝国》隐喻作为文化证据"],
  [/virtual realit/i, "虚拟现实可被当作真正的实在"],
  [/simulated reality|simulation hypothesis/i, "模拟现实／模拟宇宙假说相关主张"],
  [/computational|digital physics|cellular automaton/i, "数字／计算宇宙相关主张"],
];

function norm(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/** True when text is Simplified/Traditional Chinese prose (not Japanese kana). */
function looksChinese(text: string): boolean {
  const sample = text.slice(0, 64);
  if (!/[\u3400-\u9fff]/.test(sample)) return false;
  if (/[\u3040-\u30ff]/.test(sample)) return false; // hiragana/katakana → Japanese
  if (/[\uac00-\ud7af]/.test(sample)) return false; // Hangul
  return true;
}

/** Produce a Chinese claim caption from English (or other) catalogue text. */
export function chineseClaimCaption(
  englishOrTopic: string,
  evidence?: Pick<Evidence, "title" | "summary" | "caption" | "slug">,
): string {
  const raw = englishOrTopic.replace(/\s+/g, " ").trim();
  if (!raw) return "模拟宇宙相关主张";
  // Already Chinese (exclude Japanese titles that share Han characters).
  if (looksChinese(raw)) return raw;

  const key = norm(raw);
  if (EN_TO_ZH[key]) return EN_TO_ZH[key];

  for (const [needle, zh] of Object.entries(EN_TO_ZH)) {
    if (key.includes(needle) || needle.includes(key.slice(0, 48))) return zh;
  }

  const hay = `${evidence?.title || ""} ${evidence?.summary || ""} ${evidence?.caption || ""} ${evidence?.slug || ""} ${raw}`;
  for (const [re, zh] of TITLE_ZH) {
    if (re.test(hay)) return zh;
  }
  for (const [re, zh] of PATTERN_ZH) {
    if (re.test(hay)) return zh;
  }

  // Last resort: short unique Chinese line using a stable topic token (not slug-tail English).
  const token = (evidence?.slug || raw)
    .replace(/[^a-zA-Z0-9\u3400-\u9fff]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(" ");
  const hint = token && !/^[\d\s]+$/.test(token) ? token : "公开讨论";
  return `模拟假说相关主张（${hint}）`;
}

/**
 * Translate a claim caption into the UI locale when we only have English (or
 * mismatched-script) text. Returns "" when the locale can keep Latin/English.
 */
export function localizeClaimCaption(
  caption: string,
  locale: LocaleCode,
  evidence?: Pick<Evidence, "title" | "summary" | "caption" | "slug">,
): string {
  if (locale === "zh") return chineseClaimCaption(caption, evidence);
  return "";
}
