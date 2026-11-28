/**
 * Smoke: quote + investigate command must not create a second gather alert.
 * Run: npx tsx scripts/smoke-quote-cmd-not-alert.ts
 */
import {
  isGatherInstructionOnly,
  looksLikeIncidentEvidence,
  splitOwnTextAndRepliedAlert,
  stripInvestigateCommandPrefix,
} from '../api/lark/_lib/scope.ts'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function extractGatherFact(workingText: string): string {
  const { own: ownRaw, repliedAlert } = splitOwnTextAndRepliedAlert(workingText)
  const ownClean = stripInvestigateCommandPrefix(ownRaw)
  const alertBody = repliedAlert
    .replace(/\[(forwarded_card|merge_forward)\]\s*/gi, '')
    .trim()
  const ownIsEvidence =
    Boolean(ownClean) &&
    !isGatherInstructionOnly(ownClean) &&
    looksLikeIncidentEvidence(ownClean)
  if (alertBody) {
    if (ownIsEvidence) return `${alertBody}\n\n${ownClean}`
    return alertBody
  }
  if (ownIsEvidence) return ownClean
  return ''
}

const ALERT =
  'Mark vs Index 偏离 48bps · IDX-01 被剔除；无有效源告警 severity P0 失败'

// Quote + soft command → only alert
{
  const working = `排查一下\n\n[replied_alert]\n${ALERT}`
  const fact = extractGatherFact(working)
  assert(fact === ALERT, `quote+排查一下 expected alert only, got ${JSON.stringify(fact)}`)
  assert(!fact.includes('排查'), 'command must not remain in fact')
}

{
  const working = `帮我看看\n\n[replied_alert]\n${ALERT}`
  const fact = extractGatherFact(working)
  assert(fact === ALERT, `quote+帮我看看 expected alert only, got ${JSON.stringify(fact)}`)
}

{
  const working = `investigate this\n\n[replied_alert]\n${ALERT}`
  const fact = extractGatherFact(working)
  assert(fact === ALERT, `quote+investigate this expected alert only`)
}

// Instruction alone → no fact
assert(extractGatherFact('排查一下') === '', 'instruction-only must yield empty fact')
assert(extractGatherFact('帮我看看') === '', 'soft look-at must yield empty')
assert(isGatherInstructionOnly('一下'), 'strip leftover 一下 is instruction')
assert(isGatherInstructionOnly('这个告警帮忙看下'), 'soft alert ask is instruction')
assert(!looksLikeIncidentEvidence('排查一下'), '排查一下 is not evidence')

// Real paste still gathers
{
  const fact = extractGatherFact(ALERT)
  assert(fact.includes('48bps') && fact.includes('IDX-01'), 'real alert paste must gather')
}

console.log('QUOTE_CMD_NOT_ALERT_SMOKE_OK')
