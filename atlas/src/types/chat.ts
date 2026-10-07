import type { Game } from "./game";

export type ChatRole = "assistant" | "user";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  recommendations?: Game[];
  quickReplies?: string[];
};

export type PlayerPref = "alone" | "two" | "small" | "group" | "any";
export type SettingPref = "indoor" | "outdoor" | "either";
export type VibePref =
  | "strategy"
  | "casual"
  | "craft"
  | "sport"
  | "ritual"
  | "kids"
  | "puzzle"
  | "any";

export type UserPrefs = {
  players?: PlayerPref;
  setting?: SettingPref;
  vibe?: VibePref;
  region?: string; // free text match against country/civilization
};

export type ChatPhase =
  | "welcome"
  | "ask_players"
  | "ask_setting"
  | "ask_vibe"
  | "ask_region"
  | "recommend"
  | "followup";

export type ChatState = {
  phase: ChatPhase;
  prefs: UserPrefs;
  lastRecommendations: Game[];
  focusGameId?: string;
};
