import { notFound } from "next/navigation";
import { IdeaDetail } from "@/components/IdeaDetail";
import { catalogIdeas } from "@/lib/catalog";
import { loadIdeaForPage } from "@/lib/load-ideas";

export function generateStaticParams() {
  return catalogIdeas().map((idea) => ({ slug: idea.slug }));
}

function loadIdea(slug: string) {
  return loadIdeaForPage(slug);
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
