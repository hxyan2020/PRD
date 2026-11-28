/**
 * Investigation escalate → role handoff.
 * Operator taps 升级 → waiting card; escalatee gets step + full timeline DM.
 */
import { readDurableJson, writeDurableJson } from './durableJson.js'
import { resolveAdminOpenId } from './client.js'
import type { GuideStep, Lang } from './types.js'

export const ESCALATE_ROLES = ['RC', 'BIT', 'Pricing', 'Finance', 'Owner'] as const
export type EscalateRole = (typeof ESCALATE_ROLES)[number]

const PENDING_NAME = 'escalation-pending.json'

export type EscalationPending = {
  /** Operator who pressed 升级 */
  operatorChatId: string
  operatorOpenId: string
  incidentId?: string
  stepId: string
  stepLabel: string
  stepIndex: number
  totalSteps: number
  roles: string[]
  lang: Lang
  at: number
  /** Briefing snapshot so escalatee DMs still work if operator session races. */
  factsPreview: string
  timelinePreview: string
}

type PendingStore = Record<string, EscalationPending>

/** Parse roles mentioned in SOP / step text. */
export function parseEscalateRoles(...texts: string[]): EscalateRole[] {
  const blob = texts.filter(Boolean).join('\n')
  if (!blob.trim()) return []
  const found: EscalateRole[] = []
  const push = (r: EscalateRole) => {
    if (!found.includes(r)) found.push(r)
  }
  if (/\bRC\b|风控负责人|风险值班|通知\s*RC/i.test(blob)) push('RC')
  if (/\bBIT\b|通知\s*BIT/i.test(blob)) push('BIT')
  if (/\bPricing\b|定价|报价组/i.test(blob)) push('Pricing')
  if (/\bFinance\b|财务|资金保护/i.test(blob)) push('Finance')
  if (/\bOwner\b|升级\s*Owner|业务\s*Owner/i.test(blob)) push('Owner')
  // Generic escalate / notify without a named role → default RC
  if (
    !found.length &&
    /升级|escalate|通知|上报|会商|拉群|人工\s*ACK/i.test(blob)
  ) {
    push('RC')
  }
  return found
}

/** Show 升级 when this step's skill/action (or the step text) names roles / escalate. */
export function escalateRolesForStep(
  step: GuideStep,
  skillAction = '',
): EscalateRole[] {
  return parseEscalateRoles(step.label, step.raw, skillAction)
}

function parseRoleOpenIdMap(): Record<string, string> {
  const raw = (process.env.LARK_ESCALATE_ROLE_OPEN_IDS || '').trim()
  if (!raw) return {}
  try {
    const j = JSON.parse(raw) as Record<string, string>
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(j || {})) {
      const id = String(v || '').trim()
      if (id.startsWith('ou_')) out[k.trim()] = id
    }
    return out
  } catch {
    return {}
  }
}

/** Resolve Feishu open_ids for roles; missing → Yan (admin) fallback. */
export async function resolveEscalateOpenIds(
  roles: string[],
): Promise<{ openIds: string[]; roleMap: Record<string, string>; fallbackAdmin: boolean }> {
  const envMap = parseRoleOpenIdMap()
  const roleMap: Record<string, string> = {}
  const openIds: string[] = []
  let fallbackAdmin = false
  for (const role of roles.length ? roles : ['RC']) {
    const fromEnv =
      envMap[role] ||
      envMap[role.toUpperCase()] ||
      (process.env[`LARK_ESCALATE_${role.toUpperCase()}_OPEN_ID`] || '').trim()
    if (fromEnv.startsWith('ou_')) {
      roleMap[role] = fromEnv
      if (!openIds.includes(fromEnv)) openIds.push(fromEnv)
      continue
    }
    fallbackAdmin = true
  }
  if (!openIds.length || fallbackAdmin) {
    const admin = await resolveAdminOpenId()
    if (admin.openId.startsWith('ou_')) {
      for (const role of roles.length ? roles : ['RC']) {
        if (!roleMap[role]) roleMap[role] = admin.openId
      }
      if (!openIds.includes(admin.openId)) openIds.push(admin.openId)
      fallbackAdmin = true
    }
  }
  return { openIds, roleMap, fallbackAdmin }
}

async function readPending(): Promise<PendingStore> {
  return (await readDurableJson<PendingStore>(PENDING_NAME)) || {}
}

export async function rememberEscalationPending(
  escalateeOpenId: string,
  pending: EscalationPending,
): Promise<boolean> {
  const id = escalateeOpenId.trim()
  if (!id.startsWith('ou_')) return false
  const map = await readPending()
  // Drop stale (>48h)
  const cutoff = Date.now() - 48 * 3600_000
  for (const [k, v] of Object.entries(map)) {
    if (!v?.at || v.at < cutoff) delete map[k]
  }
  map[id] = pending
  return writeDurableJson(PENDING_NAME, map)
}

export async function getEscalationPending(
  escalateeOpenId: string,
): Promise<EscalationPending | null> {
  const map = await readPending()
  return map[escalateeOpenId.trim()] || null
}

export async function clearEscalationPending(escalateeOpenId: string): Promise<void> {
  const map = await readPending()
  delete map[escalateeOpenId.trim()]
  await writeDurableJson(PENDING_NAME, map)
}

/** Clear all pending rows pointing at this operator case (after feedback). */
export async function clearEscalationsForOperator(
  operatorChatId: string,
  operatorOpenId: string,
): Promise<void> {
  const map = await readPending()
  let changed = false
  for (const [k, v] of Object.entries(map)) {
    if (v?.operatorChatId === operatorChatId && v?.operatorOpenId === operatorOpenId) {
      delete map[k]
      changed = true
    }
  }
  if (changed) await writeDurableJson(PENDING_NAME, map)
}
