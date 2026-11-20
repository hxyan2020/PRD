import {
  finishPoint,
  isIncompletePoint,
  isQuestionCopy,
  stripPublisherTail,
  tidyPoint,
} from "./extract";
import type { NewsCategory, NewsItem, Sector } from "./types";

const CATEGORY_PHRASE: Record<NewsCategory, string> = {
  listing: "a new listing or instrument story",
  product: "a product/feature story",
  regulation: "a regulatory story",
  risk_tools: "a risk-tool story",
};

const SECTOR_PHRASE: Record<Sector, string> = {
  banks: "banks",
  brokers: "brokers",
  crypto: "crypto exchanges",
};

const HOW_TO_GERUND: Record<string, string> = {
  deploy: "Deploying",
  build: "Building",
  use: "Using",
  implement: "Implementing",
  set: "Setting",
  create: "Creating",
  add: "Adding",
  run: "Running",
};

export type EntityNameMap = Record<string, string>;

function titleCaseFirst(text: string): string {
  const value = text.trim();
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function tidyTopic(raw: string): string {
  return raw
    .replace(/[?]+$/g, "")
    .replace(/^(which|who|what|whose)\s+/i, "")
    .replace(/\b(has|have|had)\s+more\b/gi, "")
    .replace(/\bmore\b/gi, "")
    .replace(/\b(now|today|this week)\b/gi, "")
    .replace(/\bmatters\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function placeLabel(place: string): string {
  if (
    /^(United States|United Kingdom|European Union|Netherlands|Philippines|United Arab Emirates)$/.test(
      place,
    )
  ) {
    return `the ${place}`;
  }
  return place;
}

function namesFromVs(title: string): string[] {
  const match = title.match(/^(.+?)\s+vs\.?\s+(.+?)(?::|\?|$)/i);
  if (!match) return [];
  return [match[1], match[2]].map((part) =>
    part.replace(/\s*\([^)]*\)\s*$/, "").replace(/:$/, "").trim(),
  );
}

export function resolveEntityNames(item: NewsItem, names: EntityNameMap = {}): string[] {
  const fromIds = item.entities.map((id) => names[id]).filter(Boolean);
  if (fromIds.length) return [...new Set(fromIds)];
  return namesFromVs(stripPublisherTail(item.caption));
}

export function rewriteCaption(rawTitle: string, entityNames: string[] = []): string {
  const title = stripPublisherTail(rawTitle);
  if (!title) return tidyPoint(rawTitle);

  const twoPart = title.match(/^(.+\?)\s+([^?].+)$/);
  if (twoPart && twoPart[2].trim().length >= 18 && !isQuestionCopy(twoPart[2])) {
    return titleCaseFirst(twoPart[2].replace(/[.]+$/g, "").trim());
  }

  const vsWhich = title.match(
    /^(.+?)\s+vs\.?\s+(.+?):\s+(?:which|who|what)\s+(.+?)\??$/i,
  );
  if (vsWhich) {
    const left = entityNames[0] || vsWhich[1].trim();
    const right = entityNames[1] || vsWhich[2].trim();
    const topic = tidyTopic(vsWhich[3]);
    return topic ? `${left} and ${right} compared on ${topic}` : `${left} and ${right} compared`;
  }

  const why = title.match(/^why\s+(.+?)\??$/i);
  if (why) return titleCaseFirst(why[1].replace(/[.]+$/g, "").trim());

  const howTo = title.match(/^how\s+to\s+(.+?)\??$/i);
  if (howTo) {
    const rest = howTo[1].replace(/[.]+$/g, "").trim();
    const gerund = rest.replace(
      /^(deploy|build|use|implement|set(?:\s+up)?|create|add|run)\b/i,
      (verb) => HOW_TO_GERUND[verb.toLowerCase().split(/\s+/)[0]] ?? verb,
    );
    return titleCaseFirst(gerund);
  }

  const how = title.match(/^how\s+(.+?)\??$/i);
  if (how) return titleCaseFirst(how[1].replace(/[.]+$/g, "").trim());

  const which = title.match(/^which\s+(.+?)\??$/i);
  if (which) {
    const subject = which[1]
      .replace(/\s+(matters|stands out|to watch|is best|comes out(?:\s+ahead|\s+on top)?).*$/i, "")
      .replace(/[.]+$/g, "")
      .trim();
    return `${titleCaseFirst(subject)} in focus`;
  }

  const what = title.match(/^what\s+(.+?)\??$/i);
  if (what) return titleCaseFirst(what[1].replace(/[.]+$/g, "").trim());

  if (/\?\s*$/.test(title)) {
    return titleCaseFirst(title.replace(/[?\s]+$/g, "").trim());
  }

  if (isQuestionCopy(title) && entityNames.length >= 2) {
    return `${entityNames[0]} and ${entityNames[1]} compared`;
  }
  if (isQuestionCopy(title) && entityNames.length === 1) {
    const rest = title
      .replace(/^(why|how|what|which|who|would|should|could|can|is|are)\s+/i, "")
      .replace(/[?]+$/g, "")
      .trim();
    return `${entityNames[0]}: ${titleCaseFirst(rest)}`;
  }

  return title;
}

function normalizePoint(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u3400-\u9fff\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanExistingPoint(point: string): string {
  return tidyPoint(point.replace(/^key\s*points:?\s*/i, ""));
}

function isGeneratedPoint(point: string): boolean {
  return (
    /^(the desk files this as|this is a |coverage compares|the piece compares|originally carried by|published via|the subject is|named firms? are|the article walks through|coverage reports that|the story covers)\b/i.test(
      point,
    ) ||
    /\bare compared on\b/i.test(point) ||
    /\bis the named firm\.?$/i.test(point) ||
    /\bare the named firms\.?$/i.test(point)
  );
}

function comparisonTopic(caption: string): string {
  const match = caption.match(/\bcompared on\s+(.+)$/i);
  if (match) return match[1].replace(/[.]+$/g, "").trim();
  if (/\bupside\b/i.test(caption)) return "relative stock upside";
  return "relative positioning";
}

export function buildContextPoints(
  caption: string,
  item: Pick<NewsItem, "category" | "sectors" | "jurisdictions" | "sources">,
  entityNames: string[],
): string[] {
  const points: string[] = [];
  const source = item.sources[0]?.name?.trim();
  const sourceLooksLikeEntity =
    !!source && entityNames.some((name) => source.toLowerCase().includes(name.toLowerCase().split(" ")[0]));
  const places = item.jurisdictions.filter((place) => place && place !== "Global");
  const sectorText = joinAnd(item.sectors.map((sector) => SECTOR_PHRASE[sector] ?? sector));
  const categoryText = CATEGORY_PHRASE[item.category] ?? "coverage";

  if (/\bcompared\b/i.test(caption) && entityNames.length >= 2) {
    points.push(`${joinAnd(entityNames)} are compared on ${comparisonTopic(caption)}.`);
  } else if (/^(deploying|building|using|implementing|setting|creating|adding|running)\b/i.test(caption)) {
    points.push(`The article walks through ${caption.charAt(0).toLowerCase()}${caption.slice(1)}.`);
  } else if (entityNames.length >= 2) {
    points.push(`Named firms are ${joinAnd(entityNames)}.`);
  } else if (entityNames.length === 1) {
    points.push(`The subject is ${entityNames[0]}.`);
  } else if (caption.length >= 24) {
    const reported = caption.replace(/[.]+$/g, "");
    const reportedBody = /^(the|a|an)\b/i.test(reported)
      ? reported.charAt(0).toLowerCase() + reported.slice(1)
      : reported;
    points.push(`The story covers ${reportedBody}.`);
  }

  const placeBit = places.length ? ` in ${joinAnd(places.map(placeLabel))}` : "";
  points.push(`This is ${categoryText} covering ${sectorText}${placeBit}.`);

  if (source && !sourceLooksLikeEntity && !points.some((point) => point.includes(source))) {
    points.push(`Published via ${source}.`);
  }

  return points
    .map((point) => finishPoint(point))
    .filter((point) => point.length >= 24 && !isIncompletePoint(point));
}

export function shapeKeyPoints(
  points: string[],
  caption: string,
  item: Pick<NewsItem, "category" | "sectors" | "jurisdictions" | "sources">,
  entityNames: string[],
  options: { allowCaptionFallback?: boolean } = {},
): string[] {
  const captionNorm = normalizePoint(caption);
  const kept: string[] = [];
  for (const raw of points) {
    const cleaned = finishPoint(cleanExistingPoint(raw));
    if (!cleaned || isIncompletePoint(cleaned) || isQuestionCopy(cleaned) || isGeneratedPoint(cleaned)) {
      continue;
    }
    const norm = normalizePoint(cleaned);
    if (!norm || norm === captionNorm) continue;
    if (kept.some((existing) => normalizePoint(existing) === norm)) continue;
    kept.push(cleaned);
    if (kept.length >= 4) break;
  }
  if (kept.length) return kept;
  if (options.allowCaptionFallback && !isQuestionCopy(caption)) {
    const fromCaption = finishPoint(caption);
    if (fromCaption) return [fromCaption];
  }
  return buildContextPoints(caption, item, entityNames).slice(0, 4);
}

export function shapeStoryCopy(item: NewsItem, names: EntityNameMap = {}): NewsItem {
  const entityNames = resolveEntityNames(item, names);
  const originalWasQuestion = isQuestionCopy(stripPublisherTail(item.caption));
  const caption = rewriteCaption(item.caption, entityNames);
  const hasRealPoint = item.keyPoints.some((point) => {
    const cleaned = finishPoint(cleanExistingPoint(point));
    return Boolean(
      cleaned &&
        !isIncompletePoint(cleaned) &&
        !isQuestionCopy(cleaned) &&
        !isGeneratedPoint(cleaned),
    );
  });
  const keyPoints = shapeKeyPoints(item.keyPoints, caption, item, entityNames, {
    allowCaptionFallback: !originalWasQuestion && hasRealPoint,
  });
  const captionChanged = caption !== item.caption;
  const pointsChanged =
    keyPoints.length !== item.keyPoints.length ||
    keyPoints.some((point, index) => point !== item.keyPoints[index]);

  return {
    ...item,
    caption,
    captionZh: captionChanged ? "" : item.captionZh,
    keyPoints,
    keyPointsZh: pointsChanged ? keyPoints.map(() => "") : item.keyPointsZh,
  };
}
