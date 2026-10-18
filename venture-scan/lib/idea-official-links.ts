/**
 * Locked official website hosts for every catalog idea.
 * Primary website must be the operator's real company/product home page —
 * never placeholders, and never a consumer feed when a company site exists.
 *
 * When sourcing a new idea, add its real host here in the same PR.
 * Catalog is early/mid-stage startups only (see startup-eligibility.ts).
 */
export const OFFICIAL_WEBSITE_HOST_BY_SLUG: Record<string, string> = {
  // Featured seed dossiers
  "reef-credit-exchange": "coralvita.co",
  "nightshift-nursing-ai": "ambiencehealthcare.com",
  "kiln-microfactory": "saeki.ch",
  "farmstack-coldchain": "figorr.com",
  "elderloop-companion": "elliq.com",
  "ledgerlane-freight": "kalelogistics.com",
  "playpane-classroom": "melscience.com",
  "voltpath-depot": "oyika.com",
  "cuecraft-ads": "creatopy.com",
  "harbor-legal-ops": "docketwise.com",
  "spore-kitchen": "farmless.com",
  "meshpay-remit": "felixpago.com",
  "bushfire-mesh-sensors": "ororatech.com",
  "hanok-energy-retrofit": "heattransformers.com",
  "atelier-carbon-ledger": "carbonfact.com",
  "mercado-voice-pos": "clip.mx",
  "cape-clinic-triage": "quromedical.co.za",
  "fjord-battery-secondlife": "cylib.de",
  "saigon-microgrid-coops": "solaraitech.com",
  "iron-dome-devsecops": "legitsecurity.com",

  // Expanded worldwide startup signals
  "resend-email-api": "resend.com",
  "clerk-auth": "clerk.com",
  "neon-serverless-postgres": "neon.tech",
  "linear-issue-ops": "linear.app",
  "ramp-spend": "ramp.com",
  "mercury-banking": "mercury.com",
  "brex-finance": "brex.com",
  "runway-ml": "runwayml.com",
  "elevenlabs-voice": "elevenlabs.io",
  "perplexity-answer": "perplexity.ai",
  "cognition-devin": "cognition.ai",
  "cursor-coding": "cursor.com",
  "heaptrace-observability": "heap.io",
  "posthog-product-os": "posthog.com",
  "motherduck-analytics": "motherduck.com",
  "tabby-bnpl-gcc": "tabby.ai",
  "yassir-maghreb": "yassir.com",
  "mono-africa-open-banking": "mono.co",
  "chipper-cash": "chippercash.com",
  "piggyvest-savings": "piggyvest.com",
  "carbonfact-fashion": "carbonfact.com",
  "sylvera-carbon": "sylvera.com",
  "watershed-climate": "watershed.com",
  "antora-heat-battery": "antora.energy",
  "batterysmart-swap": "batterysmart.in",
  "magicschool-ai": "magicschool.ai",
  "synthesis-school": "synthesis.com",
  "abridge-clinical": "abridge.com",
  "sideshift-care": "sideshift.com",
  "alan-health": "suki.ai",
  "qonto-sme-bank": "qonto.com",
  "swan-baas": "swan.io",
  "attio-crm": "attio.com",
  "cashfree-merchant": "cashfree.com",
  "dub-link-os": "dub.co",
  "fi-money": "fi.money",
  "incident-ops": "incident.io",
};

/** Hostnames that must never be used as an idea's primary website. */
export const FORBIDDEN_WEBSITE_HOSTS = new Set([
  "example.com",
  "example.org",
  "localhost",
  "tiktok.com",
  "spotify.com",
  "wikipedia.org",
  "en.wikipedia.org",
]);

export function websiteHost(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
}

export function assertOfficialWebsite(slug: string, website: string): string | null {
  let host: string;
  try {
    host = websiteHost(website);
  } catch {
    return `${slug}: website is not a valid URL (${website})`;
  }
  if (!website.startsWith("https://")) {
    return `${slug}: website must be https (${website})`;
  }
  if (FORBIDDEN_WEBSITE_HOSTS.has(host)) {
    return `${slug}: forbidden website host ${host}`;
  }
  const expected = OFFICIAL_WEBSITE_HOST_BY_SLUG[slug];
  if (!expected) {
    return `${slug}: missing OFFICIAL_WEBSITE_HOST_BY_SLUG entry — add the real company host before shipping`;
  }
  if (host !== expected.toLowerCase()) {
    return `${slug}: expected official host ${expected}, got ${host}`;
  }
  return null;
}
