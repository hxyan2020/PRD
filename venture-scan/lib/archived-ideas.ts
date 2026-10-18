import archivedPayload from "./data/archived-ideas.json";
import type { StartupIdea } from "./types";

/**
 * Historical catalog entries retained after the live scan was narrowed to
 * authentic early/mid-stage startups. Kept searchable; not shown in the
 * default active ledger.
 */
export const ARCHIVED_IDEAS: StartupIdea[] = (
  archivedPayload.ideas as StartupIdea[]
).map((idea) => ({
  ...idea,
  status: "archived" as const,
  archivedAt: idea.archivedAt ?? archivedPayload.archivedAt,
  archiveReason: idea.archiveReason ?? "historical-catalog",
}));

export function isArchivedIdea(idea: StartupIdea): boolean {
  return (idea.status ?? "active") === "archived";
}

export function isActiveIdea(idea: StartupIdea): boolean {
  return !isArchivedIdea(idea);
}

export function partitionIdeas(ideas: StartupIdea[]): {
  active: StartupIdea[];
  archived: StartupIdea[];
} {
  const active: StartupIdea[] = [];
  const archived: StartupIdea[] = [];
  for (const idea of ideas) {
    if (isArchivedIdea(idea)) archived.push(idea);
    else active.push(idea);
  }
  return { active, archived };
}
