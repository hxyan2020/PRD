import { randomBytes } from "crypto";
import type Database from "better-sqlite3";
import { getDb } from "@/lib/db";

export type SpineStage =
  | "DETECT"
  | "ALARM"
  | "AI_RCA"
  | "SKILL_EXECUTE"
  | "HUMAN_INTERVENTION"
  | "RESOLVED"
  | "DASHBOARD";

export function logSpineEvent(input: {
  stage: SpineStage;
  title: string;
  product?: string | null;
  ref_type?: string | null;
  ref_id?: string | null;
  severity?: string | null;
  detail?: Record<string, unknown>;
  actor?: string | null;
}) {
  const db = getDb();
  const eventId = `SPN-${randomBytes(4).toString("hex").toUpperCase()}`;
  db.prepare(
    `INSERT INTO spine_events (event_id, stage, product, ref_type, ref_id, severity, title, detail_json, actor)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    eventId,
    input.stage,
    input.product ?? null,
    input.ref_type ?? null,
    input.ref_id ?? null,
    input.severity ?? null,
    input.title,
    JSON.stringify(input.detail ?? {}),
    input.actor ?? "system"
  );
  return eventId;
}

export function listSpineEvents(db: Database.Database, limit = 100) {
  return db
    .prepare(`SELECT * FROM spine_events ORDER BY id DESC LIMIT ?`)
    .all(limit);
}

export function spineStageCounts(db: Database.Database, sinceHours = 24) {
  return db
    .prepare(
      `SELECT stage, COUNT(*) AS c
       FROM spine_events
       WHERE created_at >= datetime('now', ?)
       GROUP BY stage`
    )
    .all(`-${sinceHours} hours`) as Array<{ stage: string; c: number }>;
}
