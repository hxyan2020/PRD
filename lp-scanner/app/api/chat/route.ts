import { NextRequest, NextResponse } from "next/server";
import { listLps } from "@/lib/db";
import { answerChat } from "@/lib/research";
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
  const lps = await listLps();
  const answer = answerChat(question, body.selection ?? "", lps, body.locale ?? "en");
  return NextResponse.json({ answer });
}
