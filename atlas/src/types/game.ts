export type PurchaseLink = {
  platform: string;
  label: string;
  url: string;
};

export type GameVariation = {
  name: string;
  originCountry: string;
  creationYear: string;
  notes: string;
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
  purchaseLinks: PurchaseLink[];
  requirements: string[];
  idealParticipants: string;
  variations: GameVariation[];
  tags: string[];
  /** Present on matrix-expanded regional craft/play entries; omitted for curated seeds. */
  archetypeKey?: string;
  /** English catalog key for flag lookup when `originCountry` is localized. */
  originCountryKey?: string;
};

export type CollectionMeta = {
  generatedAt: string;
  totalGames: number;
  totalVariations: number;
  categories: string[];
  civilizations: string[];
  brand?: string;
};
