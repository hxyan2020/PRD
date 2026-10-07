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
};

export type CollectionMeta = {
  generatedAt: string;
  totalGames: number;
  totalVariations: number;
  categories: string[];
  civilizations: string[];
  brand?: string;
};
