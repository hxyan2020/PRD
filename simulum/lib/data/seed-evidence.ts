import type { EvidenceCandidate } from "@/lib/types";

/**
 * Curated multilingual seed catalogue of publicly discussed simulation claims.
 * Each item is treated as candidate evidence and deduped on ingest.
 */
export const SEED_EVIDENCE: EvidenceCandidate[] = [
  {
    title: "Bostrom's trilemma: we are almost certainly simulated",
    summary:
      "Nick Bostrom's 2003 argument: if civilizations can run many ancestor simulations, almost all conscious observers are simulated.",
    detail:
      "The simulation argument concludes that at least one of three propositions is true: (1) almost no civilizations reach posthuman stage, (2) almost none run ancestor simulations, or (3) we are almost certainly living in a simulation.",
    language: "en",
    categorySlugs: ["philosophy-metaphysics", "thought-experiments", "public-discourse"],
    source: {
      url: "https://en.wikipedia.org/wiki/Simulation_hypothesis",
      title: "Simulation hypothesis — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
      snippet: "The simulation hypothesis proposes that all of reality could be an artificial simulation.",
    },
  },
  {
    title: "Descartes' evil demon",
    summary:
      "René Descartes imagined a powerful deceiver creating a complete illusion of an external world, a classical precursor to simulation skepticism.",
    language: "en",
    categorySlugs: ["philosophy-metaphysics", "thought-experiments", "cultural-historical"],
    source: {
      url: "https://en.wikipedia.org/wiki/Evil_demon",
      title: "Evil demon — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Brain in a vat",
    summary:
      "Hilary Putnam's thought experiment asks whether a brain fed simulated sensory input could know it was not in a 'real' world.",
    language: "en",
    categorySlugs: ["philosophy-metaphysics", "thought-experiments", "consciousness-mind"],
    source: {
      url: "https://en.wikipedia.org/wiki/Brain_in_a_vat",
      title: "Brain in a vat — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Wheeler's it from bit",
    summary:
      "John Archibald Wheeler argued that every physical quantity derives from yes/no informational answers — reality as processed information.",
    language: "en",
    categorySlugs: ["computation-information", "physics-cosmology", "philosophy-metaphysics"],
    source: {
      url: "https://en.wikipedia.org/wiki/Digital_physics",
      title: "Digital physics — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Holographic principle",
    summary:
      "The holographic principle suggests the universe's information content scales with surface area, not volume — like a rendered boundary.",
    language: "en",
    categorySlugs: ["physics-cosmology", "computation-information", "mathematical-structure"],
    source: {
      url: "https://en.wikipedia.org/wiki/Holographic_principle",
      title: "Holographic principle — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Beane, Davoudi & Savage lattice simulation bounds",
    summary:
      "A 2012 paper argued that spacetime discreteness in a lattice simulation could leave observable signatures in cosmic rays.",
    detail:
      "Silas Beane, Zohreh Davoudi and Martin Savage explored whether a universal simulation on a discrete lattice would imply anisotropic cutoffs detectable in high-energy cosmic rays.",
    language: "en",
    categorySlugs: ["experimental-claims", "physics-cosmology", "mathematical-structure"],
    source: {
      url: "https://arxiv.org/abs/1210.1847",
      title: "Constraints on the Universe as a Numerical Simulation — arXiv",
      publisher: "arXiv",
      language: "en",
    },
  },
  {
    title: "Tegmark's Mathematical Universe Hypothesis",
    summary:
      "Max Tegmark proposes that our physical world is a mathematical structure — compatible with a fully formal, computable reality.",
    language: "en",
    categorySlugs: ["mathematical-structure", "philosophy-metaphysics", "physics-cosmology"],
    source: {
      url: "https://en.wikipedia.org/wiki/Mathematical_universe_hypothesis",
      title: "Mathematical universe hypothesis — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Planck-scale pixelation and discrete spacetime",
    summary:
      "Proposals that spacetime is discrete at the Planck scale are often cited as consistent with a finite-resolution simulation substrate.",
    language: "en",
    categorySlugs: ["physics-cosmology", "computation-information", "mathematical-structure"],
    source: {
      url: "https://en.wikipedia.org/wiki/Planck_units",
      title: "Planck units — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Cosmological fine-tuning as rendered parameters",
    summary:
      "The apparent fine-tuning of physical constants is sometimes framed as evidence of deliberately chosen simulation parameters.",
    language: "en",
    categorySlugs: ["physics-cosmology", "philosophy-metaphysics", "public-discourse"],
    source: {
      url: "https://en.wikipedia.org/wiki/Fine-tuned_universe",
      title: "Fine-tuned universe — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Quantum error-correcting codes in spacetime",
    summary:
      "Research linking AdS/CFT holography to quantum error correction is cited as suggestive that spacetime behaves like protected information.",
    language: "en",
    categorySlugs: ["computation-information", "physics-cosmology", "mathematical-structure"],
    source: {
      url: "https://en.wikipedia.org/wiki/AdS/CFT_correspondence",
      title: "AdS/CFT correspondence — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Wolfram's computational universe",
    summary:
      "Stephen Wolfram's cellular-automata program treats the universe as evolving under simple computational rules.",
    language: "en",
    categorySlugs: ["computation-information", "mathematical-structure", "philosophy-metaphysics"],
    source: {
      url: "https://en.wikipedia.org/wiki/A_New_Kind_of_Science",
      title: "A New Kind of Science — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Zuse's Calculating Space",
    summary:
      "Konrad Zuse's 1969 Calculating Space argued that the universe is a deterministic digital computer.",
    language: "en",
    categorySlugs: ["computation-information", "cultural-historical", "mathematical-structure"],
    source: {
      url: "https://en.wikipedia.org/wiki/Calculating_Space",
      title: "Calculating Space — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Fredkin's digital philosophy",
    summary:
      "Edward Fredkin advanced digital philosophy: the universe is fundamentally a cellular automaton.",
    language: "en",
    categorySlugs: ["computation-information", "philosophy-metaphysics"],
    source: {
      url: "https://en.wikipedia.org/wiki/Digital_philosophy",
      title: "Digital philosophy — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Vopson's mass–energy–information equivalence",
    summary:
      "Melvin Vopson proposed that information has mass/energy and that detecting information erasure could test a simulated reality.",
    language: "en",
    categorySlugs: ["experimental-claims", "computation-information", "physics-cosmology"],
    source: {
      url: "https://en.wikipedia.org/wiki/Landauer%27s_principle",
      title: "Landauer's principle — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
      snippet: "Related discussions of information thermodynamics underpin experimental simulation tests.",
    },
  },
  {
    title: "Musk's 'one in billions' claim",
    summary:
      "Elon Musk publicly argued the odds we are in 'base reality' are one in billions, amplifying mainstream interest in the hypothesis.",
    language: "en",
    categorySlugs: ["public-discourse", "philosophy-metaphysics"],
    source: {
      url: "https://en.wikipedia.org/wiki/Simulation_hypothesis",
      title: "Simulation hypothesis — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
      snippet: "Public figures have popularized probabilistic claims about living in a simulation.",
    },
  },
  {
    title: "Maya: the world as illusion",
    summary:
      "In Indic traditions, māyā describes phenomenal reality as illusion or cosmic play — a cultural ancestor of simulation metaphors.",
    language: "en",
    categorySlugs: ["cultural-historical", "philosophy-metaphysics", "consciousness-mind"],
    source: {
      url: "https://en.wikipedia.org/wiki/Maya_(religion)",
      title: "Maya (religion) — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Zhuangzi's butterfly dream",
    summary:
      "The Daoist parable of Zhuangzi dreaming he was a butterfly questions which layer of experience is 'real'.",
    language: "zh",
    categorySlugs: ["cultural-historical", "philosophy-metaphysics", "consciousness-mind"],
    source: {
      url: "https://zh.wikipedia.org/wiki/%E5%BA%84%E5%91%A8%E6%A2%A6%E8%9D%B6",
      title: "庄周梦蝶 — 维基百科",
      publisher: "Wikipedia",
      language: "zh",
    },
  },
  {
    title: "假设我们生活在模拟宇宙中",
    summary:
      "中文讨论将博斯特罗姆模拟论证与计算宇宙论并列为：若可运行大量祖先模拟，则我们极可能处于模拟之中。",
    language: "zh",
    categorySlugs: ["philosophy-metaphysics", "public-discourse", "thought-experiments"],
    source: {
      url: "https://zh.wikipedia.org/wiki/%E6%A8%A1%E6%8B%9F%E5%AE%87%E5%AE%99",
      title: "模拟宇宙 — 维基百科",
      publisher: "Wikipedia",
      language: "zh",
    },
  },
  {
    title: "Hypothèse de la simulation",
    summary:
      "La version francophone de l'hypothèse de simulation reprend l'argument de Bostrom: si des civilisations posthumaines exécutent des simulations, nous y vivons probablement.",
    language: "fr",
    categorySlugs: ["philosophy-metaphysics", "public-discourse", "thought-experiments"],
    source: {
      url: "https://fr.wikipedia.org/wiki/Hypoth%C3%A8se_de_la_simulation",
      title: "Hypothèse de la simulation — Wikipédia",
      publisher: "Wikipedia",
      language: "fr",
    },
  },
  {
    title: "Simulación: el universo como programa",
    summary:
      "En español, la hipótesis de simulación sostiene que la realidad observable podría ser un programa computacional ejecutado por una civilización avanzada.",
    language: "es",
    categorySlugs: ["philosophy-metaphysics", "public-discourse"],
    source: {
      url: "https://es.wikipedia.org/wiki/Hip%C3%B3tesis_de_simulaci%C3%B3n",
      title: "Hipótesis de simulación — Wikipedia",
      publisher: "Wikipedia",
      language: "es",
    },
  },
  {
    title: "Delayed-choice quantum eraser as deferred rendering",
    summary:
      "Popular accounts reinterpret delayed-choice experiments as evidence that unobserved paths are not 'rendered' until measured.",
    language: "en",
    categorySlugs: ["physics-cosmology", "consciousness-mind", "anomalies-glitches"],
    source: {
      url: "https://en.wikipedia.org/wiki/Delayed-choice_quantum_eraser",
      title: "Delayed-choice quantum eraser — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Double-slit observer narratives",
    summary:
      "Non-technical retellings of the double-slit experiment claim observation collapses a simulated wavefunction — contested but widely posted as evidence.",
    language: "en",
    categorySlugs: ["physics-cosmology", "consciousness-mind", "public-discourse"],
    source: {
      url: "https://en.wikipedia.org/wiki/Double-slit_experiment",
      title: "Double-slit experiment — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Mandela Effect as timeline inconsistency",
    summary:
      "Collective false-memory lore is frequently posted online as a 'glitch' in a simulated timeline.",
    language: "en",
    categorySlugs: ["anomalies-glitches", "public-discourse", "cultural-historical"],
    source: {
      url: "https://en.wikipedia.org/wiki/False_memory",
      title: "False memory — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
      snippet: "Popular Mandela Effect discussions treat shared misremembering as simulation artifacts.",
    },
  },
  {
    title: "Fermi paradox resolved by simulated isolation",
    summary:
      "Some writers claim the silence of the cosmos is explained if most observers inhabit sandboxed simulations with limited contact.",
    language: "en",
    categorySlugs: ["physics-cosmology", "philosophy-metaphysics", "public-discourse"],
    source: {
      url: "https://en.wikipedia.org/wiki/Fermi_paradox",
      title: "Fermi paradox — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Substrate-independent minds",
    summary:
      "If consciousness can run on any suitable substrate, then simulated minds are as 'real' as biological ones — a pillar of ancestor-simulation logic.",
    language: "en",
    categorySlugs: ["consciousness-mind", "philosophy-metaphysics", "computation-information"],
    source: {
      url: "https://en.wikipedia.org/wiki/Mind_uploading",
      title: "Mind uploading — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Video-game realism analogy",
    summary:
      "Rapid advances in real-time graphics are cited as inductive evidence that photoreal simulated worlds are eventually inevitable.",
    language: "en",
    categorySlugs: ["public-discourse", "computation-information", "thought-experiments"],
    source: {
      url: "https://en.wikipedia.org/wiki/Simulation_hypothesis",
      title: "Simulation hypothesis — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Chalmers' Reality+",
    summary:
      "David Chalmers argues virtual realities can be genuine realities, reframing simulation from skeptical threat to metaphysical possibility.",
    language: "en",
    categorySlugs: ["philosophy-metaphysics", "consciousness-mind", "public-discourse"],
    source: {
      url: "https://en.wikipedia.org/wiki/David_Chalmers",
      title: "David Chalmers — Wikipedia",
      publisher: "Wikipedia",
      language: "en",
    },
  },
  {
    title: "Simulation und Matrix-Metapher (DE)",
    summary:
      "Deutschsprachige Diskussionen verbinden Bostroms Simulationsargument mit der Matrix-Metapher als kulturelle Evidenzlage.",
    language: "de",
    categorySlugs: ["public-discourse", "cultural-historical", "philosophy-metaphysics"],
    source: {
      url: "https://de.wikipedia.org/wiki/Simulationstheorie",
      title: "Simulationstheorie — Wikipedia",
      publisher: "Wikipedia",
      language: "de",
    },
  },
  {
    title: "Гипотеза симуляции",
    summary:
      "Русскоязычные источники пересказывают аргумент Бострома: при множестве симуляций почти все наблюдатели — симулированные.",
    language: "ru",
    categorySlugs: ["philosophy-metaphysics", "public-discourse"],
    source: {
      url: "https://ru.wikipedia.org/wiki/%D0%93%D0%B8%D0%BF%D0%BE%D1%82%D0%B5%D0%B7%D0%B0_%D1%81%D0%B8%D0%BC%D1%83%D0%BB%D1%8F%D1%86%D0%B8%D0%B8",
      title: "Гипотеза симуляции — Википедия",
      publisher: "Wikipedia",
      language: "ru",
    },
  },
  {
    title: "シミュレーション仮説",
    summary:
      "日本語圏では、文明が祖先シミュレーションを多数実行できるなら、我々もその中にいる確率が高いという議論が紹介される。",
    language: "ja",
    categorySlugs: ["philosophy-metaphysics", "public-discourse", "thought-experiments"],
    source: {
      url: "https://ja.wikipedia.org/wiki/%E3%82%B7%E3%83%9F%E3%83%A5%E3%83%AC%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E4%BB%AE%E8%AA%AC",
      title: "シミュレーション仮説 — Wikipedia",
      publisher: "Wikipedia",
      language: "ja",
    },
  },
];
