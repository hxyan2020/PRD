import type { LocaleCode } from "./locales";
import packZhCN from "./packs/zh-CN.json";
import packZhTW from "./packs/zh-TW.json";
import packJa from "./packs/ja.json";
import packKo from "./packs/ko.json";
import packEs from "./packs/es.json";
import packFr from "./packs/fr.json";
import packDe from "./packs/de.json";
import packPtBR from "./packs/pt-BR.json";
import packAr from "./packs/ar.json";
import packHi from "./packs/hi.json";
import packId from "./packs/id.json";
import packRu from "./packs/ru.json";
import packIt from "./packs/it.json";
import packTr from "./packs/tr.json";
import packVi from "./packs/vi.json";
import packTh from "./packs/th.json";
import packNl from "./packs/nl.json";

export type MessageKey = keyof typeof en;

const en = {
  "nav.today": "Today",
  "nav.ideas": "Ideas",
  "nav.match": "Match",
  "nav.method": "Method",
  "nav.sources": "Sources",
  "nav.login": "Log in",
  "nav.register": "Register",
  "nav.collection": "Collection",
  "nav.logout": "Log out",
  "nav.language": "Language",
  "nav.menu": "Menu",
  "nav.close": "Close",

  "common.people": "{count} people",
  "common.yes": "Yes",
  "common.notYet": "Not yet",
  "common.play": "Play",
  "common.source": "Source",
  "common.scanned": "scanned",

  "strategy.localize_asia": "Localize for Asian markets",
  "strategy.new_age_group": "Retarget a different age group",
  "strategy.partner_founders": "Ask founding team for cooperation",
  "strategy.franchise_local": "Franchise in your city / country",
  "strategy.license_tech": "License the underlying tech",
  "strategy.vertical_spinout": "Spin out a vertical niche",
  "strategy.b2b_pivot": "Offer as B2B to incumbents",

  "dossier.back": "← Back to ledger",
  "dossier.name": "(i) Idea name",
  "dossier.description": "(ii) Full description",
  "dossier.howMoney": "How it makes money:",
  "dossier.location": "(iii) Team location",
  "dossier.teamSize": "(iv) Team size",
  "dossier.industry": "(v) Industry",
  "dossier.sector": "(vi) Sector",
  "dossier.fundraising": "(vii) Fundraising secured?",
  "dossier.website": "(viii) Official website",
  "dossier.social": "(ix) Social media",
  "dossier.goForward": "(x) Go-forward play",

  "sourceKind.news": "News",
  "sourceKind.registry": "Registry",
  "sourceKind.fundraising": "Fundraising",
  "sourceKind.community": "Community",
  "sourceKind.government": "Government",
  "sourceKind.aggregator": "Aggregator",

  "time.justNow": "just now",
  "time.minutesAgo": "{count}m ago",
  "time.hoursAgo": "{count}h ago",
  "time.daysAgo": "{count}d ago",

  "hero.kicker": "Worldwide startup ideas + fundraising",
  "hero.body":
    "Fresh signals from startups and fundraising events worldwide—stored in a database and surfaced with the fields you need to decide your next move.",
  "hero.browse": "Browse {count} ideas",
  "hero.today": "Today's pick",
  "hero.match": "Match with chatbot",
  "hero.chips": "Name · model · team · funding · play",

  "teaser.kicker": "Everyday recommendation",
  "teaser.needProfile":
    "See your highest-matched idea, with clear matches, gaps, and how to close them.",
  "teaser.ready": "Today's best match: {title}",
  "teaser.open": "Open today's pick",
  "teaser.build": "Build profile first",

  "ledger.title": "Idea ledger",
  "ledger.body":
    "Each entry includes name, description, team, industry, sector, fundraising, website, socials, and a suggested go-forward play.",
  "ledger.sorted": " Sorted by your chatbot profile match score.",
  "ledger.buildProfile": "Build match profile",
  "ledger.sortMatch": "Sort: match score",
  "ledger.sortRecent": "Sort: recent scan",
  "ledger.scan": "Run scan",
  "ledger.scanning": "Scanning…",
  "ledger.search": "Search ideas, industries, countries…",
  "ledger.allIndustries": "All industries",
  "ledger.allCountries": "All countries",
  "ledger.allSectors": "All sectors",
  "ledger.fundAll": "Fundraising: all",
  "ledger.fundYes": "Fundraising secured",
  "ledger.fundNo": "Not yet funded",
  "ledger.shown": "{count} shown",
  "ledger.empty": "No ideas match these filters.",
  "ledger.funded": "Funded · {stage}",
  "ledger.open": "Fundraising open",
  "ledger.goForward": "Go forward",
  "ledger.match": "Match {score}%",

  "footer.tagline": "worldwide startup ideas & fundraising ledger",
  "footer.chips": "Scan · store · surface",

  "match.kicker": "Profile chatbot",
  "match.title": "Build your match profile",
  "match.body":
    "Skills, major, current business, interested domains — then we score each sourced idea.",
  "match.send": "Send",
  "match.rematch": "Rematch ideas",
  "match.scoring": "Scoring…",
  "match.rebuild": "Rebuild profile",
  "match.viewLedger": "View ledger",
  "match.profile": "Your profile",
  "match.name": "Name",
  "match.skills": "Skills",
  "match.major": "Major",
  "match.business": "Current business",
  "match.domains": "Interested domains",
  "match.markets": "Preferred markets",
  "match.scores": "Matching scores",
  "match.topFits": "Top fits",
  "match.finishHint":
    "Finish the chat and I'll rank every entrepreneurial idea against your profile.",
  "match.placeholder": "Type your answer…",
  "match.loading": "Loading matcher…",
  "match.step.name": "Hi — I'm the VentureScan matcher. What should I call you?",
  "match.step.skills":
    "What skills do you bring? List a few, separated by commas (e.g. product, sales, Python, supply chain).",
  "match.step.major": "What's your major or academic / professional background?",
  "match.step.business":
    "What is your current business, job, or venture focus? (If none yet, say what you're exploring.)",
  "match.step.domains":
    "Which domains interest you most? Comma-separated (e.g. health tech, climate, fintech, edtech).",
  "match.step.markets": "Any preferred markets or countries? Comma-separated, or type skip.",
  "match.redirect.name":
    "Nice to hear from you — I still need a name I can call you by. What should I put down?",
  "match.redirect.skills":
    "Got it. To keep matching on track, list a few skills (comma-separated) — e.g. product, sales, Python.",
  "match.redirect.major":
    "Thanks. Could you share your major or professional background so I can score ideas fairly?",
  "match.redirect.business":
    "Understood. What's your current business, job, or what you're exploring right now?",
  "match.redirect.domains":
    "Almost there — which domains interest you most? Comma-separated is fine (health tech, climate, fintech…).",
  "match.redirect.markets":
    "No rush. Preferred markets or countries, comma-separated — or type skip to move on.",
  "match.redirect.generic":
    "I noticed we drifted a bit — let's stay on this question so I can build an accurate match profile.",

  "ideaChat.kicker": "Idea desk",
  "ideaChat.title": "Ask about {name}",
  "ideaChat.body":
    "Ask follow-up questions about this dossier. Every reply includes the data sources it used.",
  "ideaChat.welcome":
    "I'm the dossier assistant for {name}. Ask about funding, team, business model, go-forward play, or where the data came from — I'll cite sources in every answer.",
  "ideaChat.placeholder": "Ask a question about {name}…",
  "ideaChat.send": "Ask",
  "ideaChat.sources": "Data sources",
  "ideaChat.loading": "Loading idea chatbot…",

  "ideaMedia.kicker": "Provenance media",
  "ideaMedia.title": "From related data sources",
  "ideaMedia.body":
    "Brand and cover images extracted from the desks that cover this market—open any tile to visit the source.",
  "ideaMedia.allSources": "All sources →",
  "ideaMedia.extracted": "Extracted",

  "today.kicker": "Today's recommendation",
  "today.needTitle": "Build a profile first",
  "today.needBody":
    "The daily pick needs your skills, major, current business, and interested domains so we can score every idea and show matches vs gaps.",
  "today.openMatch": "Open match chatbot",
  "today.loading": "Choosing today's best-matched idea…",
  "today.matched": "Where you matched",
  "today.gaps": "Where the gap is",
  "today.gapsHint": "Each gap includes a concrete action to close it.",
  "today.noMatch": "No strong matches yet — close the gaps below to raise today's score.",
  "today.noGaps": "No material gaps on the scored dimensions — you're tightly aligned today.",
  "today.closeIt": "Close it:",
  "today.dossier": "Open full dossier",
  "today.updateProfile": "Update profile",
  "today.collection": "View collection",
  "today.dateLabel": "Today's recommendation · {day}",

  "auth.loginKicker": "Sign in",
  "auth.registerKicker": "Create account",
  "auth.loginTitle": "Welcome back",
  "auth.registerTitle": "Join VentureScan",
  "auth.body": "Email and password access so you can collect ideas and matching analysis.",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.login": "Log in",
  "auth.register": "Create account",
  "auth.wait": "Please wait…",
  "auth.noAccount": "No account yet?",
  "auth.hasAccount": "Already registered?",

  "collection.kicker": "Saved for you",
  "collection.title": "Collection",
  "collection.body":
    "Ideas you've collected, including matching analysis when a profile was available.",
  "collection.empty":
    "Nothing saved yet. Open an idea or today's pick and tap Collect idea + match.",
  "collection.remove": "Remove",
  "collection.needLogin": "Log in to save and review collected ideas.",
  "collection.loading": "Loading collection…",

  "collect.loginPrompt": "to collect this idea and its matching analysis.",
  "collect.save": "Collect idea + match",
  "collect.saving": "Saving…",
  "collect.remove": "Remove from collection",
  "collect.updating": "Updating…",
  "collect.savedBoth": "Saved idea + matching analysis to your collection.",
  "collect.savedIdea": "Saved idea to your collection.",
  "collect.removed": "Removed from collection.",

  "method.title": "How VentureScan works",
  "method.scanLabel": "Scan",
  "method.scan":
    "ingest worldwide startup ideas and fundraising signals from a curated feed (pluggable for live APIs).",
  "method.storeLabel": "Store",
  "method.store":
    "normalize each idea into SQLite with the ten required fields (name through go-forward play).",
  "method.surfaceLabel": "Surface",
  "method.surface":
    "browse and filter on the frontend; open any entry for the full dossier with brand/cover images extracted from related data sources, plus an idea chatbot that answers follow-ups and cites those desks on every reply.",
  "method.matchLabel": "Match",
  "method.match":
    "a chatbot collects skills, major, current business, and interested domains, then scores every idea against that profile. If a reply drifts off the question, it gently steers you back before moving on.",
  "method.dailyLabel": "Daily pick",
  "method.daily":
    "each day we recommend your highest-matched idea and list where you matched, where the gap is, and how to close it.",
  "method.collectLabel": "Collect",
  "method.collect":
    "log in with email and password, then save ideas plus matching analysis into your personal collection.",
  "method.languagesLabel": "Languages",
  "method.languages":
    "switch the UI among major world languages with a flag icon language picker in the header.",
  "method.mobileLabel": "Mobile",
  "method.mobile":
    "sticky header + hamburger menu, larger tap targets, and stacked layouts tuned for phones.",
  "method.sourcesLabel": "Sources",
  "method.sourcesBefore": "the",
  "method.sourcesLink": "data sources desk",
  "method.sourcesAfter":
    "lists every connector, countries covered, last sourced time, and health status (including multilingual desks).",
  "method.urlLabel": "Permanent URL",
  "method.url": "published at",
  "method.seed":
    "Seed data covers climate, health, manufacturing, agri, edtech, mobility, martech, legal, food, energy, cyber, and fintech teams across Singapore, US, Germany, Kenya, Japan, India, UK, Indonesia, Canada, UAE, Netherlands, Brazil, Australia, South Korea, France, Mexico, South Africa, Sweden, Vietnam, and Israel.",

  "sources.kicker": "Ingest desk",
  "sources.title": "Data sources",
  "sources.body":
    "Every connector we pull from—news desks, registries, fundraising wires, and government feeds—across languages and regions. Health reflects how recently each source last succeeded.",
  "sources.statSources": "Sources",
  "sources.statCountries": "Countries",
  "sources.statLanguages": "Languages",
  "sources.statHealthy": "Healthy",
  "sources.coverage": "Country coverage",
  "sources.coverageBody":
    "Markets represented across the current connector set, including multilingual desks.",
  "sources.search": "Search sources, languages, countries…",
  "sources.allRegions": "All regions",
  "sources.allHealth": "All health",
  "sources.shown": "{count} shown",
  "sources.empty": "No sources match these filters.",
  "sources.language": "Language",
  "sources.region": "Region",
  "sources.countries": "Countries covered",
  "sources.lastSourced": "Last sourced",
  "sources.visit": "Open source",
  "sources.health.healthy": "Healthy",
  "sources.health.degraded": "Degraded",
  "sources.health.stale": "Stale",
  "sources.health.offline": "Offline",

  "lang.pickerLabel": "Choose language",
} as const;

type Dict = Record<MessageKey, string>;

function fromPack(pack: Record<string, string>): Dict {
  return { ...en, ...pack } as Dict;
}

export const MESSAGES: Record<LocaleCode, Dict> = {
  en,
  "zh-CN": fromPack(packZhCN),
  "zh-TW": fromPack(packZhTW),
  ja: fromPack(packJa),
  ko: fromPack(packKo),
  es: fromPack(packEs),
  fr: fromPack(packFr),
  de: fromPack(packDe),
  "pt-BR": fromPack(packPtBR),
  ar: fromPack(packAr),
  hi: fromPack(packHi),
  id: fromPack(packId),
  ru: fromPack(packRu),
  it: fromPack(packIt),
  tr: fromPack(packTr),
  vi: fromPack(packVi),
  th: fromPack(packTh),
  nl: fromPack(packNl),
};

export function translate(
  locale: LocaleCode,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const template = MESSAGES[locale]?.[key] ?? MESSAGES.en[key] ?? key;
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (text, [k, v]) => text.replaceAll(`{${k}}`, String(v)),
    template,
  );
}
