import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { readDurableJson, writeDurableJson } from './durableJson.js'
import type { IncidentRecord, InvestigationState } from './types.js'

const STORE_DIR = join(tmpdir(), 've-lark-store')
const INCIDENTS_FILE = join(STORE_DIR, 'incidents.json')
const SESSIONS_FILE = join(STORE_DIR, 'sessions.json')
/** Cross-instance durable map so Lark ops appear on the web desk. */
const INCIDENTS_DURABLE = 'incidents-store.json'
const SESSIONS_DURABLE = 'sessions-store.json'

type SessionMap = Record<string, InvestigationState>
type IncidentMap = Record<string, IncidentRecord>

const memSessions: SessionMap = {}
const memIncidents: IncidentMap = {}
let hydrated = false
let incidentsDurableReady: Promise<void> | null = null
let sessionsDurableReady: Promise<void> | null = null

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

function mergeIncidentMaps(local: IncidentMap, remote: IncidentMap | null | undefined) {
  if (!remote || typeof remote !== 'object') return
  for (const [id, rec] of Object.entries(remote)) {
    if (!rec || typeof rec !== 'object') continue
    const cur = local[id]
    if (!cur || (rec.updatedAt || 0) >= (cur.updatedAt || 0)) {
      local[id] = rec
    }
  }
}

function mergeSessionMaps(local: SessionMap, remote: SessionMap | null | undefined) {
  if (!remote || typeof remote !== 'object') return
  for (const [key, state] of Object.entries(remote)) {
    if (!state || typeof state !== 'object') continue
    const cur = local[key]
    if (!cur || (state.updatedAt || 0) >= (cur.updatedAt || 0)) {
      local[key] = state
    }
  }
}

async function ensureIncidentsDurable(): Promise<void> {
  hydrate()
  if (!incidentsDurableReady) {
    incidentsDurableReady = (async () => {
      try {
        const remote = await readDurableJson<IncidentMap>(INCIDENTS_DURABLE)
        mergeIncidentMaps(memIncidents, remote)
        persistIncidents()
      } catch {
        /* keep mem/tmp */
      }
    })()
  }
  await incidentsDurableReady
}

async function ensureSessionsDurable(): Promise<void> {
  hydrate()
  if (!sessionsDurableReady) {
    sessionsDurableReady = (async () => {
      try {
        const remote = await readDurableJson<SessionMap>(SESSIONS_DURABLE)
        mergeSessionMaps(memSessions, remote)
        persistSessions()
      } catch {
        /* keep mem/tmp */
      }
    })()
  }
  await sessionsDurableReady
}

async function flushIncidentsDurable(): Promise<void> {
  try {
    const remote = await readDurableJson<IncidentMap>(INCIDENTS_DURABLE)
    mergeIncidentMaps(memIncidents, remote)
  } catch {
    /* keep local */
  }
  persistIncidents()
  await writeDurableJson(INCIDENTS_DURABLE, { ...memIncidents })
}

async function flushSessionsDurable(): Promise<void> {
  try {
    const remote = await readDurableJson<SessionMap>(SESSIONS_DURABLE)
    mergeSessionMaps(memSessions, remote)
  } catch {
    /* keep local */
  }
  persistSessions()
  await writeDurableJson(SESSIONS_DURABLE, { ...memSessions })
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

/** Prefer durable session when present (cross-instance). */
export async function getSessionDurable(
  chatId: string,
  openId: string,
): Promise<InvestigationState> {
  await ensureSessionsDurable()
  return getSession(chatId, openId)
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
  void flushSessionsDurable()
}

export async function saveSessionDurable(
  chatId: string,
  openId: string,
  state: InvestigationState,
): Promise<void> {
  await ensureSessionsDurable()
  state.updatedAt = Date.now()
  memSessions[sessionKey(chatId, openId)] = state
  await flushSessionsDurable()
}

export function clearSession(chatId: string, openId: string) {
  hydrate()
  delete memSessions[sessionKey(chatId, openId)]
  persistSessions()
  void flushSessionsDurable()
}

export async function clearSessionDurable(chatId: string, openId: string): Promise<void> {
  await ensureSessionsDurable()
  delete memSessions[sessionKey(chatId, openId)]
  await flushSessionsDurable()
}

export function upsertIncident(rec: IncidentRecord) {
  hydrate()
  memIncidents[rec.id] = rec
  persistIncidents()
  void flushIncidentsDurable()
}

export async function upsertIncidentDurable(rec: IncidentRecord): Promise<void> {
  await ensureIncidentsDurable()
  memIncidents[rec.id] = rec
  await flushIncidentsDurable()
}

function filterIncidents(opts?: {
  chatId?: string
  status?: 'open' | 'archived' | 'all'
  limit?: number
  sinceMs?: number
}): IncidentRecord[] {
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

export function listIncidents(opts?: {
  chatId?: string
  status?: 'open' | 'archived' | 'all'
  limit?: number
  /** Inclusive lower bound on createdAt or updatedAt (ms). */
  sinceMs?: number
}): IncidentRecord[] {
  hydrate()
  return filterIncidents(opts)
}

export async function listIncidentsDurable(opts?: {
  chatId?: string
  status?: 'open' | 'archived' | 'all'
  limit?: number
  sinceMs?: number
}): Promise<IncidentRecord[]> {
  await ensureIncidentsDurable()
  return filterIncidents(opts)
}

export function getIncident(id: string): IncidentRecord | undefined {
  hydrate()
  return memIncidents[id]
}

export async function getIncidentDurable(id: string): Promise<IncidentRecord | undefined> {
  await ensureIncidentsDurable()
  return memIncidents[id]
}

export function newIncidentId() {
  return `inc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
