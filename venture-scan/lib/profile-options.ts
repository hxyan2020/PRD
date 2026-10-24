/** Suggested bubble options for the match profile builder. */

export type ProfileBubble = {
  id: string;
  label: string;
  /** Simple icon key rendered by ProfileBubbleIcon. */
  icon:
    | "finance"
    | "product"
    | "code"
    | "design"
    | "sales"
    | "ops"
    | "data"
    | "legal"
    | "edu"
    | "health"
    | "climate"
    | "games"
    | "travel"
    | "lifestyle"
    | "ai"
    | "commerce"
    | "market-us"
    | "market-asia"
    | "market-eu"
    | "market-latam"
    | "market-me"
    | "market-africa"
    | "business"
    | "major";
};

export const SKILL_BUBBLES: ProfileBubble[] = [
  { id: "finance", label: "Finance", icon: "finance" },
  { id: "product", label: "Product", icon: "product" },
  { id: "engineering", label: "Engineering", icon: "code" },
  { id: "design", label: "Design", icon: "design" },
  { id: "sales", label: "Sales", icon: "sales" },
  { id: "operations", label: "Operations", icon: "ops" },
  { id: "data", label: "Data", icon: "data" },
  { id: "legal", label: "Legal", icon: "legal" },
];

export const MAJOR_BUBBLES: ProfileBubble[] = [
  { id: "finance", label: "Finance", icon: "finance" },
  { id: "computer-science", label: "Computer Science", icon: "code" },
  { id: "business", label: "Business", icon: "business" },
  { id: "engineering", label: "Engineering", icon: "code" },
  { id: "design", label: "Design", icon: "design" },
  { id: "law", label: "Law", icon: "legal" },
  { id: "medicine", label: "Medicine", icon: "health" },
  { id: "education", label: "Education", icon: "edu" },
];

export const BUSINESS_BUBBLES: ProfileBubble[] = [
  { id: "startup", label: "Startup", icon: "business" },
  { id: "saas", label: "SaaS", icon: "product" },
  { id: "agency", label: "Agency", icon: "design" },
  { id: "commerce", label: "Commerce", icon: "commerce" },
  { id: "investing", label: "Investing", icon: "finance" },
  { id: "consulting", label: "Consulting", icon: "ops" },
  { id: "student", label: "Student", icon: "edu" },
  { id: "exploring", label: "Exploring", icon: "lifestyle" },
];

export const DOMAIN_BUBBLES: ProfileBubble[] = [
  { id: "fintech", label: "FinTech", icon: "finance" },
  { id: "edutech", label: "EduTech", icon: "edu" },
  { id: "games", label: "Games", icon: "games" },
  { id: "travel", label: "Travel", icon: "travel" },
  { id: "lifestyle", label: "Lifestyle", icon: "lifestyle" },
  { id: "health", label: "Health", icon: "health" },
  { id: "climate", label: "Climate", icon: "climate" },
  { id: "ai", label: "AI", icon: "ai" },
  { id: "commerce", label: "Commerce", icon: "commerce" },
];

export const MARKET_BUBBLES: ProfileBubble[] = [
  { id: "united-states", label: "United States", icon: "market-us" },
  { id: "southeast-asia", label: "Southeast Asia", icon: "market-asia" },
  { id: "china", label: "China", icon: "market-asia" },
  { id: "india", label: "India", icon: "market-asia" },
  { id: "europe", label: "Europe", icon: "market-eu" },
  { id: "latin-america", label: "Latin America", icon: "market-latam" },
  { id: "middle-east", label: "Middle East", icon: "market-me" },
  { id: "africa", label: "Africa", icon: "market-africa" },
];
