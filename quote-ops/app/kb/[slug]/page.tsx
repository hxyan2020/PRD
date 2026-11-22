import { KbReader } from "@/components/KbReader";

export default async function KbPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <KbReader slug={slug} />;
}
