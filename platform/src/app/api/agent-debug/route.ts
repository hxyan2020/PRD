import { NextResponse } from "next/server";
import { appendFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const LOG = "/opt/cursor/logs/debug.log";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    mkdirSync(dirname(LOG), { recursive: true });
    appendFileSync(
      LOG,
      JSON.stringify({ ...body, timestamp: body.timestamp ?? Date.now() }) + "\n"
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
