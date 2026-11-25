export type JournalKind = "collected" | "played";

export type JournalEntry = {
  gameId: string;
  slug: string;
  name: string;
  originCountry: string;
  category: string;
  image: string;
  collectedAt?: string;
  playedAt?: string;
};

export type JournalState = {
  entries: Record<string, JournalEntry>;
};
