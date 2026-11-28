/**
 * Lark handlers for Skills/KB submission + Haixiang approval.
 */
import {
  fetchUserDisplayName,
  isLarkAdminUser,
  resolveAdminOpenId,
  sendCardToOpenId,
  sendTextToOpenId,
} from './client.js'
import { simpleCard } from './cards.js'
import {
  memoryAdminProceedCard,
  memoryAdminReviewCard,
  memoryApprovedNotifyCard,
  memoryDeletedAckCard,
  memoryProposeGuideCard,
  memoryRejectedNotifyCard,
  memoryRouteToApprovalReply,
  memorySubmitterAckCard,
} from './memorySubmitCards.js'
import {
  createMemorySubmission,
  deleteMemorySubmission,
  finalizeApprovedSubmission,
  finalizeRejectedSubmission,
  findAwaitingAdminSubmission,
  getMemorySubmission,
  hydrateMemoryOverlays,
  parseLarkMemoryProposal,
  updateMemorySubmission,
  type MemoryKbPayload,
  type MemorySkillPayload,
} from './memorySubmit.js'
import {
  MEMORY_EDIT_SOFT_RE,
  isMemorySubmitCommand,
  parseDeleteSubmissionId,
} from './scope.js'
import { clearSkillsKbCaches, loadKnowledge, loadSkills } from './skills.js'
import type { BotReply, Lang } from './types.js'

export async function handleMemorySubmitMessage(args: {
  text: string
  openId: string
  chatId: string
  lang: Lang
}): Promise<BotReply> {
  await hydrateMemoryOverlays()
  const t = args.text.trim()

  // Haixiang typing reject reason / edited body while awaiting.
  const gate = await isLarkAdminUser(args.openId, { preferChatId: args.chatId })
  if (gate.ok) {
    const awaiting = await findAwaitingAdminSubmission(args.openId)
    if (awaiting?.status === 'awaiting_reject_reason') {
      const reason = t
      if (reason.length < 2) {
        return {
          card: simpleCard(
            args.lang === 'en' ? 'Need a reject reason' : '请输入驳回原因',
            args.lang === 'en'
              ? 'Please type the rejection reason in one message.'
              : '请用一句话说明驳回原因，我会通知提交人。',
            'orange',
          ),
        }
      }
      const rejected = await finalizeRejectedSubmission(awaiting.id, reason)
      if (rejected?.submitterOpenId) {
        try {
          await sendCardToOpenId(
            rejected.submitterOpenId,
            memoryRejectedNotifyCard(args.lang, rejected),
          )
        } catch {
          /* ignore */
        }
      }
      return {
        card: simpleCard(
          args.lang === 'zh-Hans' ? '已驳回并通知提交人' : 'Rejected · submitter notified',
          `• **${awaiting.id}**\n• Reason: ${reason}`,
          'orange',
        ),
      }
    }
    if (awaiting?.status === 'awaiting_edit') {
      const edited = t
      const payload =
        awaiting.kind === 'skill'
          ? ({
              ...(awaiting.payload as MemorySkillPayload),
              check: edited.slice(0, 8000),
              name:
                (awaiting.payload as MemorySkillPayload).name ||
                (awaiting.payload as MemorySkillPayload).id,
            } satisfies MemorySkillPayload)
          : ({
              ...(awaiting.payload as MemoryKbPayload),
              body: edited.slice(0, 8000),
            } satisfies MemoryKbPayload)
      clearSkillsKbCaches()
      const approved = await finalizeApprovedSubmission(
        awaiting.id,
        args.openId,
        loadSkills(),
        loadKnowledge(),
        payload,
      )
      clearSkillsKbCaches()
      if (approved?.submitterOpenId) {
        try {
          await sendCardToOpenId(
            approved.submitterOpenId,
            memoryApprovedNotifyCard(args.lang, approved),
          )
        } catch {
          /* ignore */
        }
      }
      return {
        card: simpleCard(
          args.lang === 'zh-Hans' ? '已按修改写入' : 'Applied with your edits',
          approved
            ? `• **${approved.appliedNodeId}** written\n• Submitter notified`
            : 'Apply failed',
          'green',
        ),
      }
    }
  }

  const delId = parseDeleteSubmissionId(t)
  if (delId) {
    const res = await deleteMemorySubmission(delId, args.openId)
    if (!res.ok || !res.item) {
      return {
        card: simpleCard(
          args.lang === 'zh-Hans' ? '无法删除提交' : 'Cannot delete submission',
          res.error || 'not found',
          'orange',
        ),
      }
    }
    return { card: memoryDeletedAckCard(args.lang, res.item) }
  }

  // Soft “I want to edit” without payload → gentle guidance.
  if (MEMORY_EDIT_SOFT_RE.test(t) && !isMemorySubmitCommand(t) && !/\n/.test(t)) {
    return {
      card: simpleCard(
        args.lang === 'zh-Hans' ? '修改将送审' : 'Edits go to approval',
        memoryRouteToApprovalReply(args.lang),
        'wathet',
      ),
    }
  }

  // Bare command without body → guide card.
  if (
    /^(提交技能|提交知识库|提交知識庫|submit\s*skill|submit\s*knowledge|submit\s*kb|propose\s*change|提议修改|提議修改|申请修改|申請修改)\s*$/i.test(
      t,
    )
  ) {
    return { card: memoryProposeGuideCard(args.lang) }
  }

  const parsed = parseLarkMemoryProposal(t)
  if (!parsed) {
    return { card: memoryProposeGuideCard(args.lang) }
  }

  let submitterName = ''
  try {
    submitterName = (await fetchUserDisplayName(args.openId)) || ''
  } catch {
    /* ignore */
  }

  const item = await createMemorySubmission({
    kind: parsed.kind,
    op: parsed.op,
    payload: parsed.payload,
    note: parsed.note,
    submitterOpenId: args.openId,
    submitterName: submitterName || undefined,
    source: 'lark',
  })

  try {
    const admin = await resolveAdminOpenId({ preferChatId: args.chatId })
    if (admin.openId) {
      await sendCardToOpenId(admin.openId, memoryAdminReviewCard(args.lang, item))
    }
  } catch {
    /* ignore */
  }

  return { card: memorySubmitterAckCard(args.lang, item) }
}

export async function handleMemorySubmitCardAction(args: {
  action: string
  submissionId: string
  openId: string
  chatId: string
  lang: Lang
}): Promise<BotReply | null> {
  const { action, submissionId, openId, chatId, lang } = args
  if (
    ![
      'memory_submit_proceed',
      'memory_submit_approve',
      'memory_submit_reject',
      'memory_submit_edit',
    ].includes(action)
  ) {
    return null
  }

  await hydrateMemoryOverlays()
  const gate = await isLarkAdminUser(openId, { preferChatId: chatId })
  if (!gate.ok) {
    return {
      card: simpleCard(
        lang === 'zh-Hans' ? '仅 Haixiang 可审批' : 'Haixiang only',
        memoryRouteToApprovalReply(lang),
        'orange',
      ),
    }
  }

  const item = await getMemorySubmission(submissionId)
  if (!item) {
    return {
      card: simpleCard(
        lang === 'en' ? 'Not found' : '未找到提交',
        `id=${submissionId}`,
        'orange',
      ),
    }
  }

  if (action === 'memory_submit_proceed') {
    return {
      card: memoryAdminProceedCard(lang, item, loadSkills(), loadKnowledge()),
    }
  }

  if (action === 'memory_submit_reject') {
    await updateMemorySubmission(submissionId, {
      status: 'awaiting_reject_reason',
    })
    return {
      card: simpleCard(
        lang === 'zh-Hans' ? '请输入驳回原因' : 'Type the reject reason',
        lang === 'zh-Hans'
          ? `请直接回复驳回原因（针对 **${submissionId}**）。我会记录并通知提交人。`
          : `Reply with the rejection reason for **${submissionId}**. I will notify the submitter.`,
        'orange',
      ),
    }
  }

  if (action === 'memory_submit_edit') {
    await updateMemorySubmission(submissionId, { status: 'awaiting_edit' })
    return {
      card: simpleCard(
        lang === 'zh-Hans' ? '请发送修改后的正文' : 'Send the edited content',
        lang === 'zh-Hans'
          ? `下一条消息将作为 **${submissionId}** 的最终写入内容，然后自动批准并通知提交人。`
          : `Your next message becomes the final body for **${submissionId}**, then I approve and notify the submitter.`,
        'blue',
      ),
    }
  }

  if (action === 'memory_submit_approve') {
    clearSkillsKbCaches()
    const approved = await finalizeApprovedSubmission(
      submissionId,
      openId,
      loadSkills(),
      loadKnowledge(),
    )
    clearSkillsKbCaches()
    if (approved?.submitterOpenId) {
      try {
        await sendCardToOpenId(
          approved.submitterOpenId,
          memoryApprovedNotifyCard(lang, approved),
        )
      } catch {
        try {
          await sendTextToOpenId(
            approved.submitterOpenId,
            `Approved: ${approved.appliedNodeId}`,
          )
        } catch {
          /* ignore */
        }
      }
    }
    return {
      card: simpleCard(
        lang === 'zh-Hans' ? '已写入并通知提交人' : 'Applied · submitter notified',
        approved
          ? `• Node **${approved.appliedNodeId}**\n• Status: approved`
          : 'Apply failed',
        'green',
      ),
    }
  }

  return null
}
