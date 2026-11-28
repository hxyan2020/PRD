import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createNode } from "@/lib/kb/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function looksLikeLarkUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /(larksuite\.com|feishu\.cn|larkoffice\.com)$/i.test(u.hostname) ||
      /lark|feishu/i.test(u.hostname);
  } catch {
    return false;
  }
}

async function tryFetchDocText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": "VExchange-KB-Importer/1.0",
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // crude extract: strip tags
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text.length < 80) return null;
    return text.slice(0, 50000);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  const body = (await request.json()) as {
    url?: string;
    titleZh?: string;
    titleEn?: string;
    pastedContent?: string;
    parentId?: string;
    publish?: boolean;
  };

  const url = body.url?.trim() ?? "";
  if (!url || !looksLikeLarkUrl(url)) {
    return NextResponse.json(
      { error: "valid_lark_or_feishu_url_required" },
      { status: 400 },
    );
  }

  let content = (body.pastedContent || "").trim();
  let fetchStatus: "used_paste" | "fetched" | "fetch_failed" = "used_paste";
  if (!content) {
    const fetched = await tryFetchDocText(url);
    if (fetched) {
      content = fetched;
      fetchStatus = "fetched";
    } else {
      fetchStatus = "fetch_failed";
      return NextResponse.json(
        {
          error: "fetch_failed_paste_required",
          message:
            "Could not read the Lark/Feishu doc (usually private). Paste the doc content and retry.",
        },
        { status: 422 },
      );
    }
  }

  const firstLine =
    content
      .split(/\n/)
      .map((l) => l.replace(/^#+\s*/, "").trim())
      .find((l) => l.length >= 2 && l.length <= 120) || "";

  const titleZh =
    body.titleZh?.trim() ||
    firstLine ||
    `Lark 文档导入 ${new Date().toISOString().slice(0, 10)}`;
  const titleEn =
    body.titleEn?.trim() ||
    (firstLine ? `[EN] ${firstLine}` : `Imported Lark doc ${new Date().toISOString().slice(0, 10)}`);

  const mdZh = [`> 来源：[Lark/Feishu 文档](${url})`, "", content].join("\n");

  const node = await createNode(
    {
      kind: "custom",
      parentId: body.parentId || "folder-custom",
      titleZh,
      titleEn,
      summaryZh: `从 Lark/Feishu 导入：${url}`,
      summaryEn: `Imported from Lark/Feishu: ${url}`,
      bodyZh: mdZh,
      bodyEn: body.publish
        ? `> Source: [Lark/Feishu doc](${url})\n\n> Auto-mirrored on import — please review.\n\n${content}`
        : "",
      tags: ["lark", "import", "feishu"],
      status: body.publish ? "published" : "draft",
      payload: {
        source: { type: "lark", url, fetchStatus, importedAt: new Date().toISOString() },
      },
      note: `import-lark:${fetchStatus}`,
    },
    admin,
  );

  return NextResponse.json({ node, fetchStatus }, { status: 201 });
}
