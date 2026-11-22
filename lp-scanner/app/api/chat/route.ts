import { NextRequest, NextResponse } from "next/server";
import { buildChatAnswer, formatChatAnswerText } from "@/lib/assistant";
import { listLps } from "@/lib/db";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    question?: string;
    selection?: string;
    locale?: Locale;
  };
  const question = body.question?.trim() ?? "";
  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });

  const locale = body.locale ?? "en";
  const lps = await listLps();
  const structured = buildChatAnswer(question, body.selection ?? "", lps, locale);

  return NextResponse.json({
    answer: formatChatAnswerText(structured, locale),
    understoodAs: structured.understoodAs,
    intent: structured.intent,
    sections: structured.sections,
    sources: structured.sources,
    disclaimer: structured.disclaimer ?? null,
  });
}
