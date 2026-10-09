import { randomUUID } from "node:crypto";
import { getDb } from "./db";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  email: string;
  createdAt: string;
};

export function ensureAuthTables(): void {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      idea_slug TEXT NOT NULL,
      idea_payload TEXT NOT NULL,
      match_payload TEXT,
      profile_snapshot TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, idea_slug)
    );
    CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
  `);
}

export function createUser(email: string, passwordHash: string): PublicUser {
  ensureAuthTables();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)`,
    )
    .run(id, email, passwordHash, createdAt);
  return { id, email, createdAt };
}

export function findUserByEmail(email: string): UserRecord | undefined {
  ensureAuthTables();
  const row = getDb()
    .prepare(`SELECT id, email, password_hash, created_at FROM users WHERE email = ?`)
    .get(email) as
    | { id: string; email: string; password_hash: string; created_at: string }
    | undefined;
  if (!row) return undefined;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

export function findUserById(id: string): PublicUser | undefined {
  ensureAuthTables();
  const row = getDb()
    .prepare(`SELECT id, email, created_at FROM users WHERE id = ?`)
    .get(id) as { id: string; email: string; created_at: string } | undefined;
  if (!row) return undefined;
  return { id: row.id, email: row.email, createdAt: row.created_at };
}

export function createSession(userId: string, expiresAt: string): { id: string } {
  ensureAuthTables();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`,
    )
    .run(id, userId, expiresAt, createdAt);
  return { id };
}

export function deleteSession(sessionId: string): void {
  ensureAuthTables();
  getDb().prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
}

export function getSessionUser(sessionId: string): PublicUser | null {
  ensureAuthTables();
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.created_at, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
    )
    .get(sessionId) as
    | { id: string; email: string; created_at: string; expires_at: string }
    | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    deleteSession(sessionId);
    return null;
  }
  return { id: row.id, email: row.email, createdAt: row.created_at };
}
