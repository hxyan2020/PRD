import { notFound } from "next/navigation";
import { IdeaDetail } from "@/components/IdeaDetail";
import { isStaticMode } from "@/lib/base-path";
import { catalogBySlug, catalogIdeas } from "@/lib/catalog";
import { getIdeaBySlug } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

export function generateStaticParams() {
  return catalogIdeas().map((idea) => ({ slug: idea.slug }));
}

function loadIdea(slug: string) {
  if (isStaticMode()) return catalogBySlug(slug);
  try {
    ensureSeeded();
    return getIdeaBySlug(slug) ?? catalogBySlug(slug);
  } catch {
    return catalogBySlug(slug);
  }
}

export default async function IdeaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const idea = loadIdea(slug);
  if (!idea) notFound();
  return <IdeaDetail idea={idea} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const idea = loadIdea(slug);
  if (!idea) return { title: "Idea not found · VentureScan" };
  return {
    title: `${idea.name} · VentureScan`,
    description: idea.description.slice(0, 160),
  };
}
