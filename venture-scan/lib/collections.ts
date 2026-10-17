import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import type { CollectionItem, IdeaMatch, StartupIdea, UserProfile } from "./types";
import { ensureAuthTables } from "./users";

export type { CollectionItem };

export function listCollection(userId: string): CollectionItem[] {
  ensureAuthTables();
  const rows = getDb()
    .prepare(
      `SELECT id, user_id, idea_slug, idea_payload, match_payload, profile_snapshot, note, created_at, updated_at
       FROM collections WHERE user_id = ? ORDER BY updated_at DESC`,
    )
    .all(userId) as Array<{
    id: string;
    user_id: string;
    idea_slug: string;
    idea_payload: string;
    match_payload: string | null;
    profile_snapshot: string | null;
    note: string | null;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map(rowToItem);
}

export function getCollectionItem(
  userId: string,
  ideaSlug: string,
): CollectionItem | undefined {
  ensureAuthTables();
  const row = getDb()
    .prepare(
      `SELECT id, user_id, idea_slug, idea_payload, match_payload, profile_snapshot, note, created_at, updated_at
       FROM collections WHERE user_id = ? AND idea_slug = ?`,
    )
    .get(userId, ideaSlug) as
    | {
        id: string;
        user_id: string;
        idea_slug: string;
        idea_payload: string;
        match_payload: string | null;
        profile_snapshot: string | null;
        note: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;
  return row ? rowToItem(row) : undefined;
}

export function upsertCollectionItem(input: {
  userId: string;
  idea: StartupIdea;
  match?: IdeaMatch | null;
  profileSnapshot?: UserProfile | null;
  note?: string;
}): CollectionItem {
  ensureAuthTables();
  const now = new Date().toISOString();
  const existing = getCollectionItem(input.userId, input.idea.slug);
  const id = existing?.id ?? randomUUID();
  const createdAt = existing?.createdAt ?? now;
  const matchPayload = input.match ? JSON.stringify(input.match) : existing?.match
    ? JSON.stringify(existing.match)
    : null;
  const profilePayload = input.profileSnapshot
    ? JSON.stringify(input.profileSnapshot)
    : existing?.profileSnapshot
      ? JSON.stringify(existing.profileSnapshot)
      : null;
  const note = input.note ?? existing?.note ?? "";

  getDb()
    .prepare(
      `INSERT INTO collections
        (id, user_id, idea_slug, idea_payload, match_payload, profile_snapshot, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, idea_slug) DO UPDATE SET
         idea_payload=excluded.idea_payload,
         match_payload=COALESCE(excluded.match_payload, collections.match_payload),
         profile_snapshot=COALESCE(excluded.profile_snapshot, collections.profile_snapshot),
         note=excluded.note,
         updated_at=excluded.updated_at`,
    )
    .run(
      id,
      input.userId,
      input.idea.slug,
      JSON.stringify(input.idea),
      matchPayload,
      profilePayload,
      note,
      createdAt,
      now,
    );

  return getCollectionItem(input.userId, input.idea.slug)!;
}

export function removeCollectionItem(userId: string, ideaSlug: string): boolean {
  ensureAuthTables();
  const result = getDb()
    .prepare(`DELETE FROM collections WHERE user_id = ? AND idea_slug = ?`)
    .run(userId, ideaSlug);
  return Number(result.changes ?? 0) > 0;
}

function rowToItem(row: {
  id: string;
  user_id: string;
  idea_slug: string;
  idea_payload: string;
  match_payload: string | null;
  profile_snapshot: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}): CollectionItem {
  return {
    id: row.id,
    userId: row.user_id,
    ideaSlug: row.idea_slug,
    idea: JSON.parse(row.idea_payload) as StartupIdea,
    match: row.match_payload ? (JSON.parse(row.match_payload) as IdeaMatch) : null,
    profileSnapshot: row.profile_snapshot
      ? (JSON.parse(row.profile_snapshot) as UserProfile)
      : null,
    note: row.note ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
