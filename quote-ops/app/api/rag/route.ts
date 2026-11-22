import { NextResponse } from "next/server";
import { logRagQuery } from "@/lib/db";
import { answerQuestion, type Locale } from "@/lib/rag";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { question?: string; locale?: Locale };
  try {
    body = (await req.json()) as { question?: string; locale?: Locale };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const question = body.question?.trim() ?? "";
  if (!question || question.length > 2000) {
    return NextResponse.json({ error: "question required (max 2000)" }, { status: 400 });
  }
  const locale = body.locale === "en" ? "en" : "zh-CN";
  const answer = await answerQuestion(question, locale);
  try {
    await logRagQuery(
      question,
      locale,
      answer.hits.map((h) => h.chunk.id),
    );
  } catch {
    // logging is best-effort
  }
  return NextResponse.json(answer);
}
