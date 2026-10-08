export type PurchaseLink = {
  platform: string;
  label: string;
  url: string;
};

/** Selected YouTube tutorial for a catalog entry (best of ≥5 candidates). */
export type TutorialVideo = {
  videoId: string;
  title: string;
  url: string;
  channelTitle?: string;
  publishedText?: string | null;
  viewCount?: number;
  likeCount?: number | null;
  candidatesConsidered?: number;
  query?: string;
};

export type GameVariation = {
  name: string;
  originCountry: string;
  creationYear: string;
  notes: string;
  /** Distinct picture set for this cultural variation (never shared with parent/siblings). */
  images?: string[];
  /** English catalog key for flag lookup when `originCountry` is localized. */
  originCountryKey?: string;
};

export type Game = {
  id: string;
  slug: string;
  name: string;
  originCountry: string;
  civilization: string;
  creationYear: string;
  category: string;
  images: string[];
  description: string;
  howToPlay: string[];
  /** Win conditions shown under How to play. */
  howToWin: string[];
  /** Hard rules / fouls / safety limits shown under How to play. */
  rulesNotToBreak: string[];
  purchaseLinks: PurchaseLink[];
  requirements: string[];
  idealParticipants: string;
  variations: GameVariation[];
  tags: string[];
  /** Present on matrix-expanded regional craft/play entries; omitted for curated seeds. */
  archetypeKey?: string;
  /** English catalog key for flag lookup when `originCountry` is localized. */
  originCountryKey?: string;
  /** English catalog category key when `category` is localized. */
  categoryKey?: string;
  /** Best-matching YouTube process / tutorial video for this entry. */
  tutorialVideo?: TutorialVideo;
};

export type CollectionMeta = {
  generatedAt: string;
  totalGames: number;
  totalVariations: number;
  categories: string[];
  civilizations: string[];
  brand?: string;
};
