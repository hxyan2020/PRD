/**
 * Locked official website hosts for every catalog idea.
 * Primary website must be the operator's real company/product home page —
 * never placeholders, and never a consumer feed when a company site exists
 * (e.g. ByteDance → bytedance.com, not tiktok.com).
 *
 * When sourcing a new idea, add its real host here in the same PR.
 */
export const OFFICIAL_WEBSITE_HOST_BY_SLUG: Record<string, string> = {
  // Featured seed dossiers
  "reef-credit-exchange": "coralvita.co",
  "nightshift-nursing-ai": "ambiencehealthcare.com",
  "kiln-microfactory": "saeki.ch",
  "farmstack-coldchain": "figorr.com",
  "elderloop-companion": "elliq.com",
  "ledgerlane-freight": "kalelogistics.com",
  "playpane-classroom": "classdojo.com",
  "voltpath-depot": "gogoro.com",
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

  // Expanded worldwide signals
  "stripe-atlas-rails": "stripe.com",
  "notion-ops-stack": "notion.so",
  "canva-design-os": "canva.com",
  "shopify-merchant-os": "shopify.com",
  "revolut-neo-bank": "revolut.com",
  "klarna-bnpl-rails": "klarna.com",
  "spotify-audio-graph": "spotify.com",
  "industrial-climate-os": "osapiens.com",
  "wise-fx-corridor": "wise.com",
  "rappi-super-app": "rappi.com",
  "nubank-digital-bank": "nubank.com.br",
  "mercadolibre-commerce": "mercadolibre.com",
  "grab-sea-superapp": "grab.com",
  "gojek-tokopedia": "gotocompany.com",
  "paytm-india-wallet": "paytm.com",
  "razorpay-merchant": "razorpay.com",
  "bytedance-creator-os": "bytedance.com",
  "shein-fast-fashion": "shein.com",
  "coupang-rocket": "coupang.com",
  "tokopedia-market": "tokopedia.com",
  "sea-shopee": "sea.com",
  "flutterwave-africa": "flutterwave.com",
  "paystack-africa": "paystack.com",
  "andela-talent": "andela.com",
  "yassir-maghreb": "yassir.com",
  "careem-middle-east": "careem.com",
  "tabby-bnpl-gcc": "tabby.ai",
  "vtex-commerce": "vtex.com",
  "dlocal-crossborder": "dlocal.com",
  "pieter-patreon-creators": "patreon.com",
  "airtable-ops-db": "airtable.com",
  "figma-design-collab": "figma.com",
  "databricks-lakehouse": "databricks.com",
  "openai-platform": "openai.com",
  "anthropic-claude": "anthropic.com",
  "mistral-europe-ai": "mistral.ai",
  "deepmind-science": "deepmind.google",
  "personio-hr-eu": "personio.com",
  "contentful-cms": "contentful.com",
  "celonis-process": "celonis.com",
  "ui-path-rpa": "uipath.com",
  "hashicorp-infra": "hashicorp.com",
  "gitlab-devops": "about.gitlab.com",
  "sentry-observability": "sentry.io",
  "vercel-frontend": "vercel.com",
  "supabase-backend": "supabase.com",
  "pleo-spend": "pleo.io",
  "hopin-events": "ringcentral.com",
  "checkout-com": "checkout.com",
  "adyen-acquiring": "adyen.com",
  "bolt-estonia": "bolt.eu",
  "wolt-delivery": "wolt.com",
  "swan-banking-as-a-service": "swan.io",
  "qonto-sme-bank": "qonto.com",
  "alan-health": "alan.com",
  "doctors-without-wait": "teladoc.com",
  "cognition-devin": "cognition.ai",
  "runway-ml-video": "runwayml.com",
  "elevenlabs-voice": "elevenlabs.io",
  "perplexity-answer": "perplexity.ai",
  "cursor-coding": "cursor.com",
  "loom-async-video": "loom.com",
  "miro-whiteboard": "miro.com",
  "webflow-sites": "webflow.com",
  "intercom-support": "intercom.com",
  "hubspot-crm": "hubspot.com",
  "atlassian-work": "atlassian.com",
  "xero-accounting": "xero.com",
  "canva-affinity": "canva.com",
  "freshworks-crm": "freshworks.com",
  "zoho-suite": "zoho.com",
};

/** Hostnames that must never be used as an idea's primary website. */
export const FORBIDDEN_WEBSITE_HOSTS = new Set([
  "example.com",
  "example.org",
  "localhost",
  "tiktok.com",
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
