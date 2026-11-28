export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  evidenceCount?: number;
};

export type EvidenceSource = {
  id: string;
  evidenceId: string;
  url: string;
  title: string;
  snippet: string;
  language: string;
  publisher: string;
  fetchedAt: string;
};

export type Evidence = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  detail: string;
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

export type EvidenceCandidate = {
  title: string;
  summary: string;
  detail?: string;
  language?: string;
  categorySlugs: string[];
  source: {
    url: string;
    title?: string;
    snippet?: string;
    language?: string;
    publisher?: string;
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
  source: string;
  notes: string;
};

export type CatalogueStats = {
  uniqueEvidence: number;
  categoryCount: number;
  sourceCount: number;
  languageCount: number;
  lastScanAt: string | null;
  lastScanInserted: number;
  lastScanMerged: number;
};
