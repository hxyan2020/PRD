import type { Game } from "./game";
import type { PlayerPref, SettingPref, VibePref } from "./chat";

export type DiscoverPreferences = {
  players: PlayerPref;
  setting: SettingPref;
  vibe: VibePref;
  region: string;
  keywords: string;
  era: "ancient" | "traditional" | "modern" | "any";
  includeNewDiscoveries: boolean;
};

export type DiscoverProgress = {
  percent: number;
  status: string;
  detail?: string;
};

export type DiscoverHit = {
  game: Game;
  source: "catalog" | "discovery";
  score: number;
  reason: string;
};

export type DiscoverResult = {
  hits: DiscoverHit[];
  scannedCatalog: number;
  draftedDiscoveries: number;
};
