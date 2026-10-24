import type { StartupIdea } from "./types";

/** Hosts that are public megacorps / ancient platforms — never catalog “startup ideas”. */
export const BLOCKED_OPERATOR_HOSTS = [
  "spotify.com",
  "stripe.com",
  "shopify.com",
  "canva.com",
  "openai.com",
  "anthropic.com",
  "bytedance.com",
  "tiktok.com",
  "databricks.com",
  "notion.so",
  "figma.com",
  "airtable.com",
  "atlassian.com",
  "hubspot.com",
  "intercom.com",
  "miro.com",
  "webflow.com",
  "hashicorp.com",
  "gitlab.com",
  "github.com",
  "microsoft.com",
  "google.com",
  "deepmind.google",
  "amazon.com",
  "aws.amazon.com",
  "meta.com",
  "facebook.com",
  "apple.com",
  "tesla.com",
  "uber.com",
  "airbnb.com",
  "netflix.com",
  "adobe.com",
  "salesforce.com",
  "oracle.com",
  "sap.com",
  "ibm.com",
  "snowflake.com",
  "cloudflare.com",
  "twilio.com",
  "zendesk.com",
  "asana.com",
  "monday.com",
  "dropbox.com",
  "slack.com",
  "zoom.us",
  "grab.com",
  "sea.com",
  "shopee.com",
  "tokopedia.com",
  "coupang.com",
  "shein.com",
  "nubank.com.br",
  "mercadolibre.com",
  "paytm.com",
  "revolut.com",
  "klarna.com",
  "wise.com",
  "personio.com",
  "uipath.com",
  "celonis.com",
  "contentful.com",
  "vercel.com",
  "supabase.com",
  "patreon.com",
  "gogoro.com",
  "classdojo.com",
  "zoho.com",
  "freshworks.com",
  "xero.com",
  "adyen.com",
  "checkout.com",
  "hopin.com",
  "bolt.eu",
  "wolt.com",
  "gotocompany.com",
  "careem.com",
  "rappi.com",
  "vtex.com",
  "dlocal.com",
  "andela.com",
  "paystack.com",
  "flutterwave.com",
] as const;

const BLOCKED_STAGES = new Set(["Public", "Acquired", "Late stage", "Series I", "Series I+", "Series F", "Series E"]);

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function isBlockedOperatorHost(host: string): boolean {
  const h = host.replace(/^www\./, "").toLowerCase();
  return BLOCKED_OPERATOR_HOSTS.some((blocked) => h === blocked || h.endsWith(`.${blocked}`));
}

/**
 * VentureScan catalogs early/mid-stage startups with recent signals —
 * not public megacorps dressed up as “ideas”.
 */
export function startupEligibilityIssues(idea: StartupIdea): string[] {
  const issues: string[] = [];
  const host = hostnameOf(idea.website);
  if (!host) issues.push("missing/invalid website");
  if (host && isBlockedOperatorHost(host)) issues.push(`blocked megacorp host ${host}`);
  if (idea.teamSize > 250) issues.push(`team too large (${idea.teamSize})`);
  if (idea.fundingStage && BLOCKED_STAGES.has(idea.fundingStage)) {
    issues.push(`stage not a sourced startup (${idea.fundingStage})`);
  }
  if ((idea.fundingAmountUsd ?? 0) > 500_000_000) {
    issues.push(`funding amount too large for startup catalog`);
  }
  return issues;
}

export function isEligibleStartupIdea(idea: StartupIdea): boolean {
  return startupEligibilityIssues(idea).length === 0;
}

export function filterEligibleIdeas(ideas: StartupIdea[]): StartupIdea[] {
  return ideas.filter(isEligibleStartupIdea);
}
