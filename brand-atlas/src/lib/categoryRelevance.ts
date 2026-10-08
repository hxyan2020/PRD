import { interestSpecFor } from "./interestTraits";
import { imageCues } from "./identify";

const WIKI = "https://en.wikipedia.org/w/api.php";

async function wikiJson<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(WIKI);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Wikipedia request failed (${res.status})`);
  return (await res.json()) as T;
}

export interface RelevanceRule {
  /** Short subject phrase for search, e.g. "tree" or "car manufacturer" */
  subject: string;
  /** Extract must hit at least one of these (case-insensitive) */
  acceptHints: string[];
  /** Extract hitting these without accept hints → reject */
  rejectHints: string[];
  /** Nature shelves: soft visual expectation */
  natureCue?: "green" | "floral" | "animal";
}

const RULES: Record<string, RelevanceRule> = {
  cars: {
    subject: "automobile manufacturer",
    acceptHints: [
      "automobile",
      "automaker",
      "car manufacturer",
      "vehicle",
      "motor company",
      "cars",
      "automotive",
    ],
    rejectHints: ["tree species", "flower", "cigarette", "tobacco", "brewery"],
  },
  cigarettes: {
    subject: "cigarette brand",
    acceptHints: ["cigarette", "tobacco", "smoking", "nicotine"],
    rejectHints: ["automobile", "tree species", "flower"],
  },
  liquor: {
    subject: "spirits brand distillery",
    acceptHints: ["whisky", "whiskey", "vodka", "gin", "rum", "spirit", "distill", "liquor", "cognac", "baijiu"],
    rejectHints: ["automobile", "tree species", "cigarette brand"],
  },
  wine: {
    subject: "wine producer",
    acceptHints: ["wine", "vineyard", "winery", "viticulture", "champagne"],
    rejectHints: ["automobile", "cigarette", "tree species"],
  },
  sake: {
    subject: "sake brewery",
    acceptHints: ["sake", "nihonshu", "brewery", "rice wine"],
    rejectHints: ["automobile", "cigarette"],
  },
  beer: {
    subject: "beer brewery brand",
    acceptHints: ["beer", "brewery", "lager", "ale", "brew"],
    rejectHints: ["automobile", "tree species", "cigarette"],
  },
  coffee: {
    subject: "coffee brand",
    acceptHints: ["coffee", "café", "cafe", "espresso", "roaster", "barista"],
    rejectHints: ["automobile", "cigarette brand"],
  },
  tea: {
    subject: "tea brand",
    acceptHints: ["tea", "tea leave", "camellia", "infusion", "matcha"],
    rejectHints: ["automobile", "cigarette brand"],
  },
  clothes: {
    subject: "clothing fashion brand",
    acceptHints: ["fashion", "clothing", "apparel", "wear", "garment", "streetwear", "retailer"],
    rejectHints: ["automobile manufacturer", "tree species", "cigarette"],
  },
  luxury: {
    subject: "luxury fashion brand",
    acceptHints: ["luxury", "fashion", "maison", "couture", "leather goods", "jewellery", "jewelry", "watchmaker"],
    rejectHints: ["tree species", "cigarette brand"],
  },
  trees: {
    subject: "tree",
    acceptHints: [
      "tree",
      "trees",
      "woody plant",
      "conifer",
      "deciduous",
      "forest",
      "arbor",
      "oak",
      "pine",
      "maple",
      "species of tree",
    ],
    rejectHints: [
      "automobile",
      "car manufacturer",
      "cigarette",
      "clothing brand",
      "smartphone",
      "flowering herb",
    ],
    natureCue: "green",
  },
  flowers: {
    subject: "flowering plant",
    acceptHints: ["flower", "bloom", "blossom", "petal", "floral", "angiosperm", "ornamental plant"],
    rejectHints: ["automobile", "cigarette", "car manufacturer"],
    natureCue: "floral",
  },
  animals: {
    subject: "animal species",
    acceptHints: ["animal", "mammal", "bird", "insect", "reptile", "species", "wildlife", "fauna"],
    rejectHints: ["automobile", "cigarette brand", "clothing brand"],
    natureCue: "animal",
  },
  food: {
    subject: "food brand product",
    acceptHints: ["food", "snack", "sauce", "noodle", "confection", "grocery", "edible", "cuisine"],
    rejectHints: ["automobile manufacturer", "cigarette brand"],
  },
};

export function relevanceRuleFor(categoryId: string): RelevanceRule | null {
  return RULES[categoryId] ?? null;
}

function includesAny(hay: string, needles: string[]): boolean {
  const h = hay.toLowerCase();
  return needles.some((n) => h.includes(n.toLowerCase()));
}

export interface RelevanceResult {
  ok: boolean;
  score: number;
  reason: string;
  wikiTitle?: string;
  wikiExtract?: string;
  origin?: string | null;
  summary?: string;
  coverUrl?: string | null;
  sourceUrl?: string;
}

/**
 * Confirm an uploaded sighting belongs in this category (e.g. trees → must be a tree).
 * Uses Wikipedia evidence + light image cues for nature shelves.
 */
export async function validateCategoryRelevance(input: {
  categoryId: string;
  name: string;
  ocrText?: string;
  file?: Blob;
}): Promise<RelevanceResult> {
  const rule = relevanceRuleFor(input.categoryId);
  const spec = interestSpecFor(input.categoryId);
  if (!rule) {
    return { ok: false, score: 0, reason: "This category cannot accept contributions yet." };
  }

  const name = input.name.trim();
  if (name.length < 2) {
    return { ok: false, score: 0, reason: "Enter the brand or species name shown in the image." };
  }

  const queries = [
    `${name} ${rule.subject}`,
    `${name} ${spec?.listQuery ?? rule.subject}`,
    name,
  ];

  let bestTitle = "";
  let bestExtract = "";
  let bestThumb: string | null = null;
  let bestUrl = "";

  for (const q of queries) {
    const os = await wikiJson<[string, string[], string[], string[]]>({
      action: "opensearch",
      search: q,
      limit: "5",
    });
    const titles = os[1] ?? [];
    if (!titles.length) continue;

    // Prefer titles that mention the subject
    const ordered = [...titles].sort((a, b) => {
      const as = includesAny(a, rule.acceptHints) ? 0 : 1;
      const bs = includesAny(b, rule.acceptHints) ? 0 : 1;
      return as - bs;
    });

    const data = await wikiJson<{
      query?: {
        pages?: Record<
          string,
          {
            title: string;
            extract?: string;
            thumbnail?: { source: string };
            missing?: string;
          }
        >;
      };
    }>({
      action: "query",
      prop: "extracts|pageimages",
      exintro: "1",
      explaintext: "1",
      pithumbsize: "640",
      redirects: "1",
      titles: ordered.slice(0, 3).join("|"),
    });

    for (const page of Object.values(data.query?.pages ?? {})) {
      if (!page || page.missing != null) continue;
      const extract = page.extract ?? "";
      const hay = `${page.title} ${extract}`.toLowerCase();
      const accept = includesAny(hay, rule.acceptHints);
      const reject = includesAny(hay, rule.rejectHints);
      if (reject && !accept) continue;
      if (extract.length >= bestExtract.length) {
        bestTitle = page.title;
        bestExtract = extract;
        bestThumb = page.thumbnail?.source ?? null;
        bestUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;
      }
      if (accept) break;
    }
    if (bestExtract && includesAny(`${bestTitle} ${bestExtract}`, rule.acceptHints)) break;
  }

  const combined = `${name} ${input.ocrText ?? ""} ${bestTitle} ${bestExtract}`.toLowerCase();
  let score = 0;
  if (includesAny(combined, rule.acceptHints)) score += 3;
  if (bestTitle.toLowerCase().includes(name.toLowerCase().slice(0, Math.min(6, name.length)))) {
    score += 1;
  }
  if (includesAny(combined, rule.rejectHints) && !includesAny(combined, rule.acceptHints)) {
    score -= 3;
  }

  // Nature visual cues — soft gate for trees/flowers (never block on hung decode)
  if (input.file && rule.natureCue) {
    try {
      const cues = await Promise.race([
        imageCues(input.file),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
      ]);
      if (cues) {
        if (rule.natureCue === "green") {
          if (cues.greenness >= 0.08) score += 1.5;
          else score -= 1.2;
        }
        if (rule.natureCue === "floral") {
          if (cues.warmness >= 0.08 || cues.greenness >= 0.05) score += 1;
          else score -= 0.8;
        }
        if (rule.natureCue === "animal") {
          if (cues.contrast >= 0.15) score += 0.6;
        }
      }
    } catch {
      // ignore cue failures; Wikipedia evidence still decides
    }
  }

  const ok = score >= 2.5 && includesAny(combined, rule.acceptHints);

  if (!ok) {
    const subject = rule.subject;
    return {
      ok: false,
      score,
      reason: bestExtract
        ? `This does not look like a ${subject} for this shelf. Wikipedia matched “${bestTitle}”, which is not clearly relevant — try another photo or name.`
        : `Could not verify that “${name}” belongs in this category (${subject}). Use a clearer photo of a real ${subject}, and check the name.`,
      wikiTitle: bestTitle || undefined,
      wikiExtract: bestExtract || undefined,
    };
  }

  // Light origin guess from extract ("... is a Japanese ...")
  let origin: string | null = null;
  const originMatch = bestExtract.match(
    /\b(Japanese|Chinese|American|German|French|Italian|British|Korean|Swedish|Indian|Brazilian|Spanish|Vietnamese|Swiss|Australian)\b/i,
  );
  if (originMatch) {
    const map: Record<string, string> = {
      japanese: "Japan",
      chinese: "China",
      american: "USA",
      german: "Germany",
      french: "France",
      italian: "Italy",
      british: "UK",
      korean: "South Korea",
      swedish: "Sweden",
      indian: "India",
      brazilian: "Brazil",
      spanish: "Spain",
      vietnamese: "Vietnam",
      swiss: "Switzerland",
      australian: "Australia",
    };
    origin = map[originMatch[1].toLowerCase()] ?? originMatch[1];
  }

  return {
    ok: true,
    score,
    reason: `Verified as relevant to this category via “${bestTitle}”.`,
    wikiTitle: bestTitle,
    wikiExtract: bestExtract.slice(0, 280),
    origin,
    summary: bestExtract.slice(0, 280) || `${name} — contributed from your sighting.`,
    coverUrl: bestThumb,
    sourceUrl: bestUrl,
  };
}
