export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  evidenceCount?: number;
};

export type EvidenceImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
  credit: string;
  sourceUrl: string;
};

export type RatingDimension = {
  score: number;
  max: number;
  label: string;
  rationale: string;
  evidence: string[];
};

export type EvidenceRatings = {
  overall: number;
  credibility: RatingDimension;
  recency: RatingDimension;
  multiSources: RatingDimension;
  crossReferenced: RatingDimension;
  multiWitness: RatingDimension;
  scientificallySupported: RatingDimension;
};

export type EvidenceBody = {
  what: string;
  where: string;
  when: string;
  how: string;
  why: string;
};

export type EvidenceLocalePack = {
  caption: string;
  body: EvidenceBody;
};

export type EvidenceSource = {
  id: string;
  evidenceId: string;
  url: string;
  title: string;
  snippet: string;
  language: string;
  publisher: string;
  imageUrl: string;
  fetchedAt: string;
};

export type Evidence = {
  id: string;
  slug: string;
  title: string;
  caption: string;
  summary: string;
  detail: string;
  body: EvidenceBody;
  images: EvidenceImage[];
  ratings: EvidenceRatings;
  translations: Record<string, EvidenceLocalePack>;
  fingerprint: string;
  language: string;
  languages: string[];
  sourceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  status: "published" | "merged" | "rejected";
  categories: Category[];
  sources: EvidenceSource[];
  createdAt: string;
  updatedAt: string;
};

export type RelatedEvidence = {
  evidence: Evidence;
  similarity: number;
  reason: "same-category" | "content-similar" | "both";
};

export type EvidenceCandidate = {
  title: string;
  summary: string;
  detail?: string;
  caption?: string;
  body?: Partial<EvidenceBody>;
  language?: string;
  categorySlugs: string[];
  images?: EvidenceImage[];
  translations?: Record<string, EvidenceLocalePack>;
  source: {
    url: string;
    title?: string;
    snippet?: string;
    language?: string;
    publisher?: string;
    imageUrl?: string;
  };
};

export type ScanResult = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  candidates: number;
  merged: number;
  inserted: number;
  uniqueTotal: number;
  sourcesScanned: number;
  relevantSourced: number;
  source: string;
  notes: string;
  scheduleLabel?: string;
};

export type CatalogueStats = {
  uniqueEvidence: number;
  categoryCount: number;
  sourceCount: number;
  languageCount: number;
  lastScanAt: string | null;
  lastScanInserted: number;
  lastScanMerged: number;
  lastSourcesScanned: number;
  lastRelevantSourced: number;
};

export type LocaleCode =
  | "en"
  | "zh"
  | "hi"
  | "es"
  | "fr"
  | "ar"
  | "bn"
  | "pt"
  | "ru"
  | "id"
  | "de"
  | "ja"
  | "tr"
  | "vi"
  | "ko"
  | "it"
  | "th"
  | "pl"
  | "nl"
  | "uk";
