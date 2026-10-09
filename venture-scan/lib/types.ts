export type SocialPlatform =
  | "x"
  | "instagram"
  | "xiaohongshu"
  | "linkedin"
  | "tiktok"
  | "youtube";

export type SocialAccount = {
  platform: SocialPlatform;
  handle: string;
  url: string;
};

export type GoForwardStrategy =
  | "localize_asia"
  | "new_age_group"
  | "partner_founders"
  | "franchise_local"
  | "license_tech"
  | "vertical_spinout"
  | "b2b_pivot";

export type StartupIdea = {
  id: string;
  slug: string;
  /** (i) idea name */
  name: string;
  /** (ii) full description */
  description: string;
  businessModel: string;
  /** (iii) team location (country) */
  teamCountry: string;
  teamCity?: string;
  /** (iv) how many people in the team */
  teamSize: number;
  /** (v) industry */
  industry: string;
  /** (vi) sector */
  sector: string;
  /** (vii) whether fundraising secured */
  fundraisingSecured: boolean;
  fundingStage?: string;
  fundingAmountUsd?: number;
  fundingRoundNote?: string;
  /** (viii) official website */
  website: string;
  /** (ix) official social media accounts */
  social: SocialAccount[];
  /** (x) suggested best way of going forward */
  goForward: {
    strategy: GoForwardStrategy;
    summary: string;
  };
  source: string;
  scannedAt: string;
  tags: string[];
};

export type IdeaFilters = {
  q?: string;
  industry?: string;
  sector?: string;
  country?: string;
  fundraising?: "yes" | "no" | "all";
};

/** Profile collected by the matching chatbot. */
export type UserProfile = {
  id: string;
  displayName: string;
  skills: string[];
  major: string;
  currentBusiness: string;
  interestedDomains: string[];
  preferredMarkets: string[];
  notes: string;
  updatedAt: string;
};

export type MatchBreakdown = {
  skills: number;
  major: number;
  currentBusiness: number;
  interestedDomains: number;
  preferredMarkets: number;
};

export type IdeaMatch = {
  ideaId: string;
  slug: string;
  /** 0–100 overall match */
  score: number;
  breakdown: MatchBreakdown;
  matched: string[];
  gaps: string[];
};
