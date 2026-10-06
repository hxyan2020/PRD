import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";
import { retrieveRag } from "@/lib/ai/rag";
import { answerDeskChat, type DeskChatMessage } from "@/lib/ai/desk-chat";
import { parseUiLocale } from "@/lib/i18n";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !(hasPermission(user.role_code, "ai.read") || hasPermission(user.role_code, "admin.access"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    selection?: string;
    question?: string;
    pagePath?: string;
    locale?: string;
    messages?: DeskChatMessage[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const selection = String(body.selection || "").trim();
  const history = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const question = String(body.question || lastUser?.content || "").trim();
  if (!selection && !question) {
    return NextResponse.json({ error: "selection or question required" }, { status: 400 });
  }

  const locale = parseUiLocale(body.locale);
  const pagePath = String(body.pagePath || "/admin");

  let ragSnippets: Array<{ title: string; content: string }> = [];
  try {
    const q = `${selection} ${question}`.trim();
    ragSnippets = retrieveRag(getDb(), q, 3).map((h) => ({ title: h.title, content: h.content }));
  } catch {
    ragSnippets = [];
  }

  const result = answerDeskChat({
    selection,
    question: question || (locale === "zh-Hant" ? "請解釋這段文字" : "Explain this selection"),
    pagePath,
    locale,
    ragSnippets,
    history,
  });

  try {
    writeAudit(user, "DESK_CHAT", "selection", pagePath.slice(0, 80), {
      selection_len: selection.length,
      question_len: question.length,
    });
  } catch {
    /* ignore */
  }

  return NextResponse.json({ ok: true, ...result });
}
