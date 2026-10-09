import type { StartupIdea } from "./types";

const scannedAt = "2026-10-09T08:00:00.000Z";

/** Curated worldwide startup + fundraising signals used by the scanner. */
export const SEED_IDEAS: StartupIdea[] = [
  {
    id: "idea_01",
    slug: "reef-credit-exchange",
    name: "ReefCredit Exchange",
    description:
      "A marketplace that tokenizes verified coral reef restoration outcomes and sells carbon-adjacent biodiversity credits to hotels, insurers, and coastal governments. Field partners upload sensor + dive logs; ReefCredit issues tradable certificates.",
    businessModel:
      "Takes 8–12% transaction fee on credit sales plus SaaS seats for verification dashboards sold to resorts and municipal buyers.",
    teamCountry: "Singapore",
    teamCity: "Singapore",
    teamSize: 14,
    industry: "Climate Tech",
    sector: "Blue Economy / Biodiversity Credits",
    fundraisingSecured: true,
    fundingStage: "Series A",
    fundingAmountUsd: 18_000_000,
    fundingRoundNote: "Led by regional climate fund with tourism LPs",
    website: "https://example.com/reefcredit",
    social: [
      { platform: "x", handle: "@ReefCredit", url: "https://x.com/ReefCredit" },
      { platform: "linkedin", handle: "ReefCredit Exchange", url: "https://linkedin.com/company/reefcredit" },
    ],
    goForward: {
      strategy: "franchise_local",
      summary:
        "Offer to become the franchise verification hub in your coastal city—run dive-partner onboarding and sell credits to local hotels while the parent platform handles settlement.",
    },
    source: "seed:apac-climate-rounds",
    scannedAt,
    tags: ["biodiversity", "credits", "tourism", "Singapore"],
  },
  {
    id: "idea_02",
    slug: "nightshift-nursing-ai",
    name: "Nightshift Nursing AI",
    description:
      "Ambient voice assistant for overnight hospital wards that drafts nursing notes, flags deterioration risk from vitals chatter, and hands a structured brief to the morning team. Built for staffing-scarce acute care units.",
    businessModel:
      "Per-bed annual license sold to hospital systems; premium tier includes EHR write-back connectors.",
    teamCountry: "United States",
    teamCity: "Boston",
    teamSize: 22,
    industry: "Health Tech",
    sector: "Hospital Workflow AI",
    fundraisingSecured: true,
    fundingStage: "Series B",
    fundingAmountUsd: 42_000_000,
    fundingRoundNote: "Hospital system strategic co-invest",
    website: "https://example.com/nightshift-ai",
    social: [
      { platform: "x", handle: "@NightshiftAI", url: "https://x.com/NightshiftAI" },
      { platform: "linkedin", handle: "Nightshift Nursing AI", url: "https://linkedin.com/company/nightshift-ai" },
    ],
    goForward: {
      strategy: "localize_asia",
      summary:
        "Copy the core night-ward workflow for Asian private hospital chains; localize language packs (JP/KR/ZH) and start with ICU wards where English charting already exists.",
    },
    source: "seed:us-health-fundraising",
    scannedAt,
    tags: ["healthcare", "AI", "hospitals", "Boston"],
  },
  {
    id: "idea_03",
    slug: "kiln-microfactory",
    name: "Kiln Microfactory",
    description:
      "Shared neighborhood ceramic + metal 3D-print microfactories that let designers upload CAD, pick materials, and get same-week small-batch production without owning machines. Targets indie hardware brands and architecture studios.",
    businessModel:
      "Machine utilization fees + materials margin + optional design-to-manufacture concierge retainers.",
    teamCountry: "Germany",
    teamCity: "Berlin",
    teamSize: 9,
    industry: "Manufacturing",
    sector: "Distributed Fabrication",
    fundraisingSecured: false,
    fundingStage: "Pre-seed",
    fundingRoundNote: "Raising €1.2M angel round",
    website: "https://example.com/kiln-micro",
    social: [
      { platform: "instagram", handle: "@kiln.micro", url: "https://instagram.com/kiln.micro" },
      { platform: "x", handle: "@KilnMicro", url: "https://x.com/KilnMicro" },
    ],
    goForward: {
      strategy: "franchise_local",
      summary:
        "Franchise a microfactory bay in your city using their software stack—own the local designer relationships while licensing Kiln’s job scheduler and materials pricing.",
    },
    source: "seed:eu-hardware-watch",
    scannedAt,
    tags: ["hardware", "3d-print", "Berlin", "SMB"],
  },
  {
    id: "idea_04",
    slug: "farmstack-coldchain",
    name: "FarmStack Coldchain",
    description:
      "Solar-backed modular cold rooms and IoT spoilage sensors for smallholder produce aggregators. Farmers rent slots by the crate; buyers get quality-assured supply windows via WhatsApp + app.",
    businessModel:
      "Hardware lease + per-crate cold storage fees + marketplace take-rate when buyers book lots.",
    teamCountry: "Kenya",
    teamCity: "Nairobi",
    teamSize: 31,
    industry: "AgriTech",
    sector: "Cold Chain Logistics",
    fundraisingSecured: true,
    fundingStage: "Series A",
    fundingAmountUsd: 11_500_000,
    fundingRoundNote: "DFIs + climate growth equity",
    website: "https://example.com/farmstack",
    social: [
      { platform: "x", handle: "@FarmStackKE", url: "https://x.com/FarmStackKE" },
      { platform: "instagram", handle: "@farmstack.ke", url: "https://instagram.com/farmstack.ke" },
    ],
    goForward: {
      strategy: "partner_founders",
      summary:
        "Ask the founding team for cooperation as their Southeast Asia or South Asia licensed operator—replicate the crate rental model with local solar EPC partners.",
    },
    source: "seed:africa-agri-rounds",
    scannedAt,
    tags: ["agriculture", "coldchain", "Kenya", "climate"],
  },
  {
    id: "idea_05",
    slug: "elderloop-companion",
    name: "ElderLoop Companion",
    description:
      "Tablet + wearable companion that runs daily check-ins for seniors living alone, alerts family on anomaly patterns, and books local caregiver visits. Emphasis on voice-first UX and low-friction family dashboards.",
    businessModel:
      "Monthly subscription per household; caregiver agencies pay for lead referrals and roster tools.",
    teamCountry: "Japan",
    teamCity: "Tokyo",
    teamSize: 17,
    industry: "Health Tech",
    sector: "Aging Care / Consumer",
    fundraisingSecured: true,
    fundingStage: "Seed",
    fundingAmountUsd: 4_200_000,
    fundingRoundNote: "Corporate venture from telco + insurer",
    website: "https://example.com/elderloop",
    social: [
      { platform: "x", handle: "@ElderLoopJP", url: "https://x.com/ElderLoopJP" },
      { platform: "xiaohongshu", handle: "ElderLoop", url: "https://www.xiaohongshu.com/explore" },
    ],
    goForward: {
      strategy: "new_age_group",
      summary:
        "Offer the same stack to a different age group—young remote workers caring for parents abroad—or rebundle as a corporate EAP benefit for employees with overseas elders.",
    },
    source: "seed:jp-aging-tech",
    scannedAt,
    tags: ["aging", "consumer", "Japan", "subscription"],
  },
  {
    id: "idea_06",
    slug: "ledgerlane-freight",
    name: "LedgerLane Freight",
    description:
      "AI documentation layer that auto-builds customs packets, bills of lading, and compliance trails for cross-border SME exporters. Integrates with WhatsApp document drops and common ERPs.",
    businessModel:
      "Per-shipment SaaS fee + premium compliance insurance upsell with partner underwriters.",
    teamCountry: "India",
    teamCity: "Bengaluru",
    teamSize: 28,
    industry: "Logistics Tech",
    sector: "Trade Compliance SaaS",
    fundraisingSecured: true,
    fundingStage: "Series A",
    fundingAmountUsd: 16_000_000,
    fundingRoundNote: "India–Middle East corridor investors",
    website: "https://example.com/ledgerlane",
    social: [
      { platform: "linkedin", handle: "LedgerLane Freight", url: "https://linkedin.com/company/ledgerlane" },
      { platform: "x", handle: "@LedgerLane", url: "https://x.com/LedgerLane" },
    ],
    goForward: {
      strategy: "b2b_pivot",
      summary:
        "Offer it as white-label compliance middleware to freight forwarders and banks in your market rather than competing for end SME logos directly.",
    },
    source: "seed:india-logistics-rounds",
    scannedAt,
    tags: ["logistics", "SaaS", "India", "trade"],
  },
  {
    id: "idea_07",
    slug: "playpane-classroom",
    name: "PlayPane Classroom",
    description:
      "Physical STEM kits synced to a teacher dashboard for after-school programs. Kids build electronics projects; the app tracks mastery and recommends next kits. Strong foothold in UK academy trusts.",
    businessModel:
      "Kit hardware margin + annual classroom software seats sold to schools and franchise tutoring centers.",
    teamCountry: "United Kingdom",
    teamCity: "London",
    teamSize: 12,
    industry: "EdTech",
    sector: "K-12 Hands-on Learning",
    fundraisingSecured: false,
    fundingStage: "Seed",
    fundingRoundNote: "Open £2.5M round",
    website: "https://example.com/playpane",
    social: [
      { platform: "instagram", handle: "@playpane.class", url: "https://instagram.com/playpane.class" },
      { platform: "youtube", handle: "PlayPane Classroom", url: "https://youtube.com/@playpane" },
    ],
    goForward: {
      strategy: "localize_asia",
      summary:
        "Copy the kit + dashboard model for Asian enrichment centers; localize curriculum to contest pathways (Olympiads) and sell through tutoring franchise networks.",
    },
    source: "seed:uk-edtech-watch",
    scannedAt,
    tags: ["education", "hardware", "UK", "K12"],
  },
  {
    id: "idea_08",
    slug: "voltpath-depot",
    name: "VoltPath Depot",
    description:
      "Battery-swap depots for last-mile delivery fleets using standardized packs. Couriers swap in under two minutes; VoltPath owns pack inventory and sells energy-as-a-service to logistics brands.",
    businessModel:
      "Per-swap fees + monthly fleet SLA contracts; residual value from second-life pack sales.",
    teamCountry: "Indonesia",
    teamCity: "Jakarta",
    teamSize: 45,
    industry: "Mobility",
    sector: "EV Battery Infrastructure",
    fundraisingSecured: true,
    fundingStage: "Series B",
    fundingAmountUsd: 55_000_000,
    fundingRoundNote: "Ride-hailing strategic + infrastructure PE",
    website: "https://example.com/voltpath",
    social: [
      { platform: "instagram", handle: "@voltpath.id", url: "https://instagram.com/voltpath.id" },
      { platform: "x", handle: "@VoltPathID", url: "https://x.com/VoltPathID" },
      { platform: "xiaohongshu", handle: "VoltPath", url: "https://www.xiaohongshu.com/explore" },
    ],
    goForward: {
      strategy: "franchise_local",
      summary:
        "Offer to become franchise depot operator in your city—VoltPath supplies packs and software; you secure land and courier contracts.",
    },
    source: "seed:sea-mobility-rounds",
    scannedAt,
    tags: ["EV", "logistics", "Indonesia", "infrastructure"],
  },
  {
    id: "idea_09",
    slug: "cuecraft-ads",
    name: "CueCraft Ads",
    description:
      "Generative ad studio that turns a product URL into localized creative packs for Meta, TikTok, and Xiaohongshu—complete with compliance checks for claim language by market.",
    businessModel:
      "Seat-based SaaS for agencies + usage credits for render volume; enterprise SSO plans.",
    teamCountry: "Canada",
    teamCity: "Toronto",
    teamSize: 19,
    industry: "MarTech",
    sector: "Creative Automation",
    fundraisingSecured: true,
    fundingStage: "Seed",
    fundingAmountUsd: 6_800_000,
    fundingRoundNote: "North America seed with Asia GTM angels",
    website: "https://example.com/cuecraft",
    social: [
      { platform: "x", handle: "@CueCraftAds", url: "https://x.com/CueCraftAds" },
      { platform: "xiaohongshu", handle: "CueCraft", url: "https://www.xiaohongshu.com/explore" },
      { platform: "instagram", handle: "@cuecraft.ads", url: "https://instagram.com/cuecraft.ads" },
    ],
    goForward: {
      strategy: "vertical_spinout",
      summary:
        "Spin out a vertical niche—e.g. beauty D2C only—with Xiaohongshu-native templates and sell to agencies that already specialize in that category.",
    },
    source: "seed:na-martech-rounds",
    scannedAt,
    tags: ["ads", "generative", "Canada", "cross-border"],
  },
  {
    id: "idea_10",
    slug: "harbor-legal-ops",
    name: "Harbor Legal Ops",
    description:
      "Workflow OS for boutique immigration and visa law firms: client intake, document checklists, deadline calendars, and encrypted client chat. Cuts admin hours so lawyers bill more advisory time.",
    businessModel:
      "Per-lawyer monthly SaaS; premium e-signature and government form fillers as add-ons.",
    teamCountry: "UAE",
    teamCity: "Dubai",
    teamSize: 11,
    industry: "Legal Tech",
    sector: "Practice Management",
    fundraisingSecured: false,
    fundingStage: "Pre-seed",
    fundingRoundNote: "Bootstrapped + friends/family",
    website: "https://example.com/harbor-legal",
    social: [
      { platform: "linkedin", handle: "Harbor Legal Ops", url: "https://linkedin.com/company/harbor-legal" },
      { platform: "instagram", handle: "@harbor.legal", url: "https://instagram.com/harbor.legal" },
    ],
    goForward: {
      strategy: "partner_founders",
      summary:
        "Ask the founding team for cooperation as their APAC reseller—bundle Harbor with your local immigration consultancy network and share MRR.",
    },
    source: "seed:mena-saas-watch",
    scannedAt,
    tags: ["legal", "SaaS", "UAE", "immigration"],
  },
  {
    id: "idea_11",
    slug: "spore-kitchen",
    name: "Spore Kitchen",
    description:
      "Precision fermentation startup producing dairy-identical proteins for ice cream and creamers without cows. Selling B2B ingredients to CPG brands seeking cleaner Scope 3 narratives.",
    businessModel:
      "Ingredient supply contracts with volume tiers; co-development fees for custom formulations.",
    teamCountry: "Netherlands",
    teamCity: "Amsterdam",
    teamSize: 36,
    industry: "Food Tech",
    sector: "Alternative Proteins",
    fundraisingSecured: true,
    fundingStage: "Series A",
    fundingAmountUsd: 28_000_000,
    fundingRoundNote: "European food-tech growth syndicate",
    website: "https://example.com/sporekitchen",
    social: [
      { platform: "x", handle: "@SporeKitchen", url: "https://x.com/SporeKitchen" },
      { platform: "linkedin", handle: "Spore Kitchen", url: "https://linkedin.com/company/spore-kitchen" },
    ],
    goForward: {
      strategy: "license_tech",
      summary:
        "License the fermentation strain + process IP for a regional plant instead of importing finished protein—partner with a local CPG co-packer.",
    },
    source: "seed:eu-foodtech-rounds",
    scannedAt,
    tags: ["food", "fermentation", "Netherlands", "B2B"],
  },
  {
    id: "idea_12",
    slug: "meshpay-remit",
    name: "MeshPay Remit",
    description:
      "Low-fee remittance rails using local bank partners and stablecoin settlement between Brazil and African corridors. Focus on micro-merchant payouts for diaspora e-commerce sellers.",
    businessModel:
      "FX + transfer fee spread; float yield on settlement balances; API fees for marketplace integrations.",
    teamCountry: "Brazil",
    teamCity: "São Paulo",
    teamSize: 24,
    industry: "FinTech",
    sector: "Cross-border Payments",
    fundraisingSecured: true,
    fundingStage: "Series A",
    fundingAmountUsd: 22_000_000,
    fundingRoundNote: "LatAm fintech + Africa-focused fund",
    website: "https://example.com/meshpay",
    social: [
      { platform: "x", handle: "@MeshPayRemit", url: "https://x.com/MeshPayRemit" },
      { platform: "instagram", handle: "@meshpay.br", url: "https://instagram.com/meshpay.br" },
    ],
    goForward: {
      strategy: "localize_asia",
      summary:
        "Copy the corridor design for Asia–Africa remittance lanes (e.g. Singapore/HK → East Africa) using the same merchant-payout positioning.",
    },
    source: "seed:latam-fintech-rounds",
    scannedAt,
    tags: ["payments", "remittance", "Brazil", "fintech"],
  },
  {
    id: "idea_13",
    slug: "bushfire-mesh-sensors",
    name: "Bushfire Mesh Sensors",
    description:
      "Low-power mesh sensors and satellite uplinks that detect early heat signatures and smoke plumes across rural fire belts. Alerts feed into local CFA/SES dashboards and insurer loss models.",
    businessModel:
      "Hardware + annual monitoring SaaS sold to councils and utilities; data licensing to insurers.",
    teamCountry: "Australia",
    teamCity: "Melbourne",
    teamSize: 16,
    industry: "Climate Tech",
    sector: "Wildfire Detection",
    fundraisingSecured: true,
    fundingStage: "Seed",
    fundingAmountUsd: 5_400_000,
    fundingRoundNote: "Climate angels + disaster-tech grant stack",
    website: "https://example.com/bushfire-mesh",
    social: [
      { platform: "linkedin", handle: "Bushfire Mesh", url: "https://linkedin.com/company/bushfire-mesh" },
      { platform: "x", handle: "@BushfireMesh", url: "https://x.com/BushfireMesh" },
    ],
    goForward: {
      strategy: "localize_asia",
      summary:
        "Port the mesh + alert stack to Southeast Asian peat-fire corridors, pairing with local telco LoRaWAN partners.",
    },
    source: "seed:oceania-climate-rounds",
    scannedAt,
    tags: ["climate", "sensors", "Australia", "insurance"],
  },
  {
    id: "idea_14",
    slug: "hanok-energy-retrofit",
    name: "Hanok Energy Retrofit",
    description:
      "Modular insulation and heat-pump kits designed for traditional Korean courtyard homes, sold with subsidized financing and municipal rebate paperwork automation.",
    businessModel:
      "Kit margin + installation partner take-rate + SaaS for rebate filing sold to contractors.",
    teamCountry: "South Korea",
    teamCity: "Seoul",
    teamSize: 13,
    industry: "Climate Tech",
    sector: "Residential Retrofit",
    fundraisingSecured: true,
    fundingStage: "Series A",
    fundingAmountUsd: 14_000_000,
    fundingRoundNote: "Korean green-bank co-invest",
    website: "https://example.com/hanok-energy",
    social: [
      { platform: "instagram", handle: "@hanok.energy", url: "https://instagram.com/hanok.energy" },
      { platform: "linkedin", handle: "Hanok Energy Retrofit", url: "https://linkedin.com/company/hanok-energy" },
    ],
    goForward: {
      strategy: "franchise_local",
      summary:
        "Franchise install crews in secondary Korean cities first, then adapt kits for Japanese wooden stock.",
    },
    source: "seed:kr-climate-rounds",
    scannedAt,
    tags: ["retrofit", "energy", "South Korea", "housing"],
  },
  {
    id: "idea_15",
    slug: "atelier-carbon-ledger",
    name: "Atelier Carbon Ledger",
    description:
      "Scope-3 accounting OS for French luxury maisons that maps supplier ateliers, materials, and logistics into audit-ready carbon ledgers for CSRD reporting.",
    businessModel:
      "Enterprise SaaS seats + per-SKU footprint calculation credits; auditor co-sell revenue share.",
    teamCountry: "France",
    teamCity: "Paris",
    teamSize: 21,
    industry: "Climate Tech",
    sector: "ESG / Supply Chain",
    fundraisingSecured: true,
    fundingStage: "Series A",
    fundingAmountUsd: 19_500_000,
    fundingRoundNote: "European climate growth + fashion strategics",
    website: "https://example.com/atelier-carbon",
    social: [
      { platform: "linkedin", handle: "Atelier Carbon Ledger", url: "https://linkedin.com/company/atelier-carbon" },
      { platform: "x", handle: "@AtelierCarbon", url: "https://x.com/AtelierCarbon" },
    ],
    goForward: {
      strategy: "vertical_spinout",
      summary:
        "Spin a ready-to-wear-only SKU module and sell it to mid-market brands that cannot afford full maison deployments.",
    },
    source: "seed:fr-esg-rounds",
    scannedAt,
    tags: ["ESG", "fashion", "France", "SaaS"],
  },
  {
    id: "idea_16",
    slug: "mercado-voice-pos",
    name: "Mercado Voice POS",
    description:
      "Voice-first point-of-sale for Mexican tiendas and street vendors: speak inventory and sales in Spanish, sync to WhatsApp receipts, and unlock micro-working-capital lines.",
    businessModel:
      "Hardware kit margin + monthly SaaS + interest share on embedded credit with bank partners.",
    teamCountry: "Mexico",
    teamCity: "Mexico City",
    teamSize: 27,
    industry: "FinTech",
    sector: "SMB Payments / Embedded Finance",
    fundraisingSecured: true,
    fundingStage: "Series A",
    fundingAmountUsd: 17_000_000,
    fundingRoundNote: "LatAm fintech syndicate",
    website: "https://example.com/mercado-voice",
    social: [
      { platform: "instagram", handle: "@mercadovoice", url: "https://instagram.com/mercadovoice" },
      { platform: "x", handle: "@MercadoVoice", url: "https://x.com/MercadoVoice" },
    ],
    goForward: {
      strategy: "localize_asia",
      summary:
        "Reuse the voice POS UX for Bahasa/Tagalog informal retail corridors with local telco wallets.",
    },
    source: "seed:mx-fintech-rounds",
    scannedAt,
    tags: ["fintech", "POS", "Mexico", "SMB"],
  },
  {
    id: "idea_17",
    slug: "cape-clinic-triage",
    name: "Cape Clinic Triage",
    description:
      "WhatsApp + USSD triage bots that route township patients to the right clinic queue, with nurse dashboards and ambulance ETA sharing for Cape Town metro clinics.",
    businessModel:
      "Per-clinic SaaS + provincial health system licenses; optional telehealth upsell.",
    teamCountry: "South Africa",
    teamCity: "Cape Town",
    teamSize: 18,
    industry: "Health Tech",
    sector: "Primary Care Access",
    fundraisingSecured: false,
    fundingStage: "Seed",
    fundingRoundNote: "Raising $3.2M for multi-province rollout",
    website: "https://example.com/cape-clinic",
    social: [
      { platform: "linkedin", handle: "Cape Clinic Triage", url: "https://linkedin.com/company/cape-clinic" },
      { platform: "x", handle: "@CapeClinicSA", url: "https://x.com/CapeClinicSA" },
    ],
    goForward: {
      strategy: "partner_founders",
      summary:
        "Partner as the East Africa deployment operator—localize USSD flows and clinic integrations while Cape Clinic owns the core engine.",
    },
    source: "seed:za-health-watch",
    scannedAt,
    tags: ["health", "access", "South Africa", "mobile"],
  },
  {
    id: "idea_18",
    slug: "fjord-battery-secondlife",
    name: "Fjord Battery SecondLife",
    description:
      "Repurposes EV packs from Nordic fleets into modular home and cabin storage with remote diagnostics and grid ancillary services bidding.",
    businessModel:
      "Pack refurb margin + monthly energy-as-a-service; grid services revenue share.",
    teamCountry: "Sweden",
    teamCity: "Gothenburg",
    teamSize: 23,
    industry: "Energy",
    sector: "Battery Circularity",
    fundraisingSecured: true,
    fundingStage: "Series A",
    fundingAmountUsd: 21_000_000,
    fundingRoundNote: "Nordic industrial + climate PE",
    website: "https://example.com/fjord-battery",
    social: [
      { platform: "linkedin", handle: "Fjord Battery", url: "https://linkedin.com/company/fjord-battery" },
      { platform: "x", handle: "@FjordBattery", url: "https://x.com/FjordBattery" },
    ],
    goForward: {
      strategy: "license_tech",
      summary:
        "License the BMS + diagnostics stack to Asian EV OEMs seeking EU second-life compliance pathways.",
    },
    source: "seed:nordic-energy-rounds",
    scannedAt,
    tags: ["energy", "batteries", "Sweden", "circular"],
  },
  {
    id: "idea_19",
    slug: "saigon-microgrid-coops",
    name: "Saigon Microgrid Co-ops",
    description:
      "Solar + storage co-ops for Vietnamese industrial parks that pool rooftops, settle energy credits on-chain lite, and sell surplus to the grid under DPPA rules.",
    businessModel:
      "Project development fees + ongoing co-op management SaaS + energy trading spread.",
    teamCountry: "Vietnam",
    teamCity: "Ho Chi Minh City",
    teamSize: 20,
    industry: "Climate Tech",
    sector: "Distributed Energy",
    fundraisingSecured: true,
    fundingStage: "Seed",
    fundingAmountUsd: 7_100_000,
    fundingRoundNote: "SEA climate fund + industrial park LPs",
    website: "https://example.com/saigon-microgrid",
    social: [
      { platform: "linkedin", handle: "Saigon Microgrid", url: "https://linkedin.com/company/saigon-microgrid" },
      { platform: "x", handle: "@SaigonMicrogrid", url: "https://x.com/SaigonMicrogrid" },
    ],
    goForward: {
      strategy: "franchise_local",
      summary:
        "Franchise co-op formation playbooks to secondary Vietnamese cities and Cambodian border parks.",
    },
    source: "seed:vn-energy-rounds",
    scannedAt,
    tags: ["energy", "solar", "Vietnam", "co-op"],
  },
  {
    id: "idea_20",
    slug: "iron-dome-devsecops",
    name: "Iron Lattice DevSecOps",
    description:
      "Continuous security pipeline for Israeli deep-tech startups that maps SBOM, cloud misconfig, and red-team findings into board-ready risk scores for Series A diligence.",
    businessModel:
      "Per-engineer SaaS + premium pen-test credits; VC diligence white-label plans.",
    teamCountry: "Israel",
    teamCity: "Tel Aviv",
    teamSize: 15,
    industry: "Cybersecurity",
    sector: "DevSecOps / GRC",
    fundraisingSecured: true,
    fundingStage: "Seed",
    fundingAmountUsd: 8_500_000,
    fundingRoundNote: "Cyber angels + US enterprise strategics",
    website: "https://example.com/iron-lattice",
    social: [
      { platform: "linkedin", handle: "Iron Lattice", url: "https://linkedin.com/company/iron-lattice" },
      { platform: "x", handle: "@IronLattice", url: "https://x.com/IronLattice" },
    ],
    goForward: {
      strategy: "b2b_pivot",
      summary:
        "Sell the diligence white-label pack to regional VCs and corporate venture arms rather than chasing every startup logo.",
    },
    source: "seed:il-cyber-rounds",
    scannedAt,
    tags: ["cyber", "DevSecOps", "Israel", "SaaS"],
  },
];
