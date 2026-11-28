import { notFound } from "next/navigation";
import { RiskDetail } from "@/components/RiskDetail";
import { getRisk, RISK_SCENARIOS } from "@/lib/data/risks";

export function generateStaticParams() {
  return RISK_SCENARIOS.map((r) => ({ id: String(r.id) }));
}

export default async function RiskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const risk = getRisk(Number(id));
  if (!risk) notFound();
  return <RiskDetail risk={risk} />;
}
