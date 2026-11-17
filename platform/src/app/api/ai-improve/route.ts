import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { parseUiLocale } from "@/lib/i18n";
import {
  getImprovementForAnalysis,
  handleImprovementChat,
  reviewAnalysisIfNeeded,
  backfillImprovements,
} from "@/lib/ai/improvement";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "ai.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("analysis_id") || url.searchParams.get("id") || 0);
  if (!id) return NextResponse.json({ error: "analysis_id required" }, { status: 400 });
  const review = reviewAnalysisIfNeeded(id);
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, review });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !(hasPermission(user.role_code, "ai.read") || hasPermission(user.role_code, "admin.access"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    action?: string;
    analysis_id?: number;
    message?: string;
    locale?: string;
    limit?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const locale = parseUiLocale(body.locale);
  const action = String(body.action || "chat");

  if (action === "backfill") {
    if (!hasPermission(user.role_code, "ai.operate")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const results = backfillImprovements(Number(body.limit ?? 80));
    return NextResponse.json({ ok: true, count: results.length, results });
  }

  const analysisId = Number(body.analysis_id);
  if (!analysisId) return NextResponse.json({ error: "analysis_id required" }, { status: 400 });

  if (action === "get") {
    const review = reviewAnalysisIfNeeded(analysisId);
    if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, review });
  }

  const canned =
    action === "pull"
      ? "Pull live data"
      : action === "regenerate"
        ? "Regenerate with the new facts"
        : action === "accept"
          ? "This solution is satisfactory"
          : String(body.message || "").trim();

  if (!canned) return NextResponse.json({ error: "message required" }, { status: 400 });

  const result = handleImprovementChat(analysisId, canned, locale);
  return NextResponse.json({ ok: true, ...result, current: getImprovementForAnalysis(analysisId) });
}
