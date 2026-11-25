import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { IncidentRecord, InvestigationState } from './types.js'

const STORE_DIR = join(tmpdir(), 've-lark-store')
const INCIDENTS_FILE = join(STORE_DIR, 'incidents.json')
const SESSIONS_FILE = join(STORE_DIR, 'sessions.json')

type SessionMap = Record<string, InvestigationState>
type IncidentMap = Record<string, IncidentRecord>

const memSessions: SessionMap = {}
const memIncidents: IncidentMap = {}
let hydrated = false

function ensureDir() {
  if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true })
}

function hydrate() {
  if (hydrated) return
  hydrated = true
  try {
    ensureDir()
    if (existsSync(SESSIONS_FILE)) {
      Object.assign(memSessions, JSON.parse(readFileSync(SESSIONS_FILE, 'utf8')) as SessionMap)
    }
    if (existsSync(INCIDENTS_FILE)) {
      Object.assign(memIncidents, JSON.parse(readFileSync(INCIDENTS_FILE, 'utf8')) as IncidentMap)
    }
  } catch {
    // cold start / ephemeral fs — keep memory maps
  }
}

function persistSessions() {
  try {
    ensureDir()
    writeFileSync(SESSIONS_FILE, JSON.stringify(memSessions))
  } catch {
    /* ignore */
  }
}

function persistIncidents() {
  try {
    ensureDir()
    writeFileSync(INCIDENTS_FILE, JSON.stringify(memIncidents))
  } catch {
    /* ignore */
  }
}

export function sessionKey(chatId: string, openId: string) {
  return `${chatId}:${openId}`
}

export function getSession(chatId: string, openId: string): InvestigationState {
  hydrate()
  const key = sessionKey(chatId, openId)
  const existing = memSessions[key]
  if (existing) return existing
  const fresh: InvestigationState = {
    mode: 'idle',
    facts: [],
    checkedSteps: [],
    interactions: [],
    lastSeverity: '待判定',
    lastHits: [],
    lastKb: [],
    preferredLang: 'en',
    updatedAt: Date.now(),
  }
  memSessions[key] = fresh
  return fresh
}

/** Ensure older persisted sessions have an interactions array. */
export function ensureSessionInteractions(state: InvestigationState): InvestigationState {
  if (!Array.isArray(state.interactions)) state.interactions = []
  return state
}

export function saveSession(chatId: string, openId: string, state: InvestigationState) {
  hydrate()
  state.updatedAt = Date.now()
  memSessions[sessionKey(chatId, openId)] = state
  persistSessions()
}

export function clearSession(chatId: string, openId: string) {
  hydrate()
  delete memSessions[sessionKey(chatId, openId)]
  persistSessions()
}

export function upsertIncident(rec: IncidentRecord) {
  hydrate()
  memIncidents[rec.id] = rec
  persistIncidents()
}

export function listIncidents(opts?: {
  chatId?: string
  status?: 'open' | 'archived' | 'all'
  limit?: number
  /** Inclusive lower bound on createdAt or updatedAt (ms). */
  sinceMs?: number
}): IncidentRecord[] {
  hydrate()
  const status = opts?.status ?? 'all'
  const limit = opts?.limit ?? 50
  const since = opts?.sinceMs ?? 0
  return Object.values(memIncidents)
    .filter((r) => (opts?.chatId ? r.chatId === opts.chatId : true))
    .filter((r) => (status === 'all' ? true : r.status === status))
    .filter((r) => (since ? Math.max(r.createdAt, r.updatedAt) >= since : true))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit)
}

export function getIncident(id: string): IncidentRecord | undefined {
  hydrate()
  return memIncidents[id]
}

export function newIncidentId() {
  return `inc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
