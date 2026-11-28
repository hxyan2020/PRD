/**
 * In-memory event store for the Lark parallel desk.
 * Swap for Postgres / Redis in production (see LARK_DEPLOY.md).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../.data')
const STORE_FILE = path.join(DATA_DIR, 'events.json')

function empty() {
  return {
    alarms: [],
    incidents: [],
    followups: [],
    logs: [],
  }
}

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, JSON.stringify(empty(), null, 2))
}

function read() {
  ensure()
  try {
    return { ...empty(), ...JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) }
  } catch {
    return empty()
  }
}

function write(data) {
  ensure()
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2))
}

function pushLog(kind, payload) {
  const data = read()
  const row = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
    kind,
    ...payload,
  }
  data.logs.unshift(row)
  data.logs = data.logs.slice(0, 500)
  write(data)
  return row
}

export function ingestAlarm(alarm) {
  const data = read()
  const row = {
    id: alarm.id || `ALT-${Date.now()}`,
    at: Date.now(),
    title: alarm.title || 'XAUUSD alert',
    severity: alarm.severity || 'P1',
    contract: alarm.contract || 'XAUUSD',
    trigger: alarm.trigger || '',
    breached: alarm.breached || '',
    summary: alarm.summary || '',
    facts: alarm.facts || alarm.summary || '',
    sources: alarm.sources || [],
    autoAnalyze: alarm.autoAnalyze !== false,
    status: 'open',
  }
  data.alarms.unshift(row)
  data.alarms = data.alarms.slice(0, 200)
  write(data)
  pushLog('alarm_ingested', { alarmId: row.id, severity: row.severity })
  return row
}

export function saveIncident(incident) {
  const data = read()
  const row = {
    id: incident.id || `RCA-${Date.now()}`,
    at: Date.now(),
    alarmId: incident.alarmId || null,
    title: incident.title || 'RCA',
    severity: incident.severity || 'P2',
    model: incident.model || 'rules',
    skills: incident.skills || '',
    thinking: incident.thinking || '',
    nextSteps: incident.nextSteps || '',
    report: incident.report || '',
    sources: incident.sources || [],
    archivedAt: null,
  }
  data.incidents.unshift(row)
  data.incidents = data.incidents.slice(0, 200)
  write(data)
  pushLog('rca_created', { incidentId: row.id, severity: row.severity, alarmId: row.alarmId })
  return row
}

export function saveFollowUp(fu) {
  const data = read()
  const row = {
    id: `FU-${Date.now()}`,
    at: Date.now(),
    incidentId: fu.incidentId || null,
    question: fu.question || '',
    answer: fu.answer || '',
    user: fu.user || 'lark-user',
  }
  data.followups.unshift(row)
  data.followups = data.followups.slice(0, 300)
  write(data)
  pushLog('followup', { followUpId: row.id, incidentId: row.incidentId })
  return row
}

export function archiveIncident(id) {
  const data = read()
  const row = data.incidents.find((x) => x.id === id)
  if (!row) return null
  row.archivedAt = Date.now()
  write(data)
  pushLog('rca_archived', { incidentId: id })
  return row
}

export function getIncident(id) {
  return read().incidents.find((x) => x.id === id) || null
}

export function getAlarm(id) {
  return read().alarms.find((x) => x.id === id) || null
}

export function statsSummary(windowMs = 24 * 3600_000) {
  const data = read()
  const since = Date.now() - windowMs
  const alarms = data.alarms.filter((a) => a.at >= since)
  const incidents = data.incidents.filter((i) => i.at >= since)
  const followups = data.followups.filter((f) => f.at >= since)
  const open = incidents.filter((i) => !i.archivedAt)
  const archived = incidents.filter((i) => i.archivedAt)
  const sevCount = {}
  for (const i of incidents) {
    const k = String(i.severity || '—')
    sevCount[k] = (sevCount[k] || 0) + 1
  }
  const topSeverity =
    Object.entries(sevCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  return {
    windowMs,
    windowLabel: windowMs >= 86400000 ? 'last 24h' : `last ${Math.round(windowMs / 3600000)}h`,
    alarmsTotal: alarms.length,
    rcaTotal: incidents.length,
    rcaOpen: open.length,
    rcaArchived: archived.length,
    followups: followups.length,
    topSeverity,
    bySeverity: sevCount,
    recentLogs: data.logs.filter((l) => l.at >= since).slice(0, 40),
  }
}

export function listRecent(limit = 20) {
  const data = read()
  return {
    alarms: data.alarms.slice(0, limit),
    incidents: data.incidents.slice(0, limit),
    followups: data.followups.slice(0, limit),
    logs: data.logs.slice(0, limit),
  }
}

export { pushLog }
