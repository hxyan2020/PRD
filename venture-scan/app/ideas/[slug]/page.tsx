import { notFound } from "next/navigation";
import { IdeaDetail } from "@/components/IdeaDetail";
import { getIdeaBySlug } from "@/lib/db";
import { ensureSeeded } from "@/lib/scanner";

export const dynamic = "force-dynamic";

export default async function IdeaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  ensureSeeded();
  const { slug } = await params;
  const idea = getIdeaBySlug(slug);
  if (!idea) notFound();
  return <IdeaDetail idea={idea} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  ensureSeeded();
  const { slug } = await params;
  const idea = getIdeaBySlug(slug);
  if (!idea) return { title: "Idea not found · VentureScan" };
  return {
    title: `${idea.name} · VentureScan`,
    description: idea.description.slice(0, 160),
  };
}
