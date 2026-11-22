import { notFound } from "next/navigation";
import { SkillRunner } from "@/components/SkillRunner";
import { getSkill, SKILLS } from "@/lib/data/skills";

export function generateStaticParams() {
  return SKILLS.map((s) => ({ slug: s.slug }));
}

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = getSkill(slug);
  if (!skill) notFound();
  return <SkillRunner skill={skill} />;
}
