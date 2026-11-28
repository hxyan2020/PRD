import { simpleCard } from './cards.js'
import {
  adviseMemoryPath,
  deskNodeUrl,
  formatSubmissionSummary,
  parentDeskUrl,
  type MemorySubmission,
} from './memorySubmit.js'
import type { KbItem, Lang, SkillRec } from './types.js'
import { isZh } from './lang.js'

export function memoryProposeGuideCard(lang: Lang): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  const title = hans
    ? '提交 Skills／知识库修改'
    : zh
      ? '提交 Skills／知識庫修改'
      : 'Propose Skills / KB change'
  const body = hans
    ? [
        '📝 **欢迎提议修改** — 为保持一致性，变更需 **Yan Haixiang** 审批后才会写入。',
        '',
        '**写法示例**',
        '• `提交技能` + 换行写内容（可含节点 ID如 L1-13）',
        '• `提交知识库` + 换行写标题／正文',
        '• 删除：`删除技能 L1-13` 或 `删除知识库 ve-doc-alarms`',
        '',
        '提交后我会通知 Haixiang；通过或驳回后你会收到回复。',
        '',
        '桌面入口：[Skills](https://vex-llm-proxy.vercel.app/#/skills) · [知识库](https://vex-llm-proxy.vercel.app/#/knowledge)',
      ].join('\n')
    : zh
      ? [
          '📝 **歡迎提議修改** — 為保持一致性，變更需 **Yan Haixiang** 審批後才會寫入。',
          '',
          '**寫法示例**：`提交技能`／`提交知識庫` + 內容；刪除用 `刪除技能 …`／`刪除知識庫 …`。',
          '',
          '桌面入口：[Skills](https://vex-llm-proxy.vercel.app/#/skills) · [知識庫](https://vex-llm-proxy.vercel.app/#/knowledge)',
        ].join('\n')
      : [
          '📝 **You can propose edits** — for consistency, Yan Haixiang must approve before they land.',
          '',
          'Examples: `submit skill` / `submit knowledge` + body; deletes: `delete skill L1-13`.',
          '',
          'Desk: [Skills](https://vex-llm-proxy.vercel.app/#/skills) · [Knowledge](https://vex-llm-proxy.vercel.app/#/knowledge)',
        ].join('\n')
  return simpleCard(title, body, 'wathet')
}

export function memorySubmitterAckCard(
  lang: Lang,
  item: MemorySubmission,
): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  const title = hans
    ? '已提交 · 待 Haixiang 审批'
    : zh
      ? '已提交 · 待 Haixiang 審批'
      : 'Submitted · pending Haixiang'
  const body = hans
    ? [
        '✅ **你的修改提议已收到**',
        '',
        formatSubmissionSummary(item, lang),
        '',
        `• 单号：**${item.id}**`,
        '• 已路由给 **Yan Haixiang** 审批；通过或驳回后会通知你。',
        '• 若要撤回，发送：`删除提交 ' + item.id + '`',
      ].join('\n')
    : zh
      ? [
          '✅ **你的修改提議已收到**',
          '',
          formatSubmissionSummary(item, lang),
          '',
          `• 單號：**${item.id}**`,
          '• 已路由給 **Yan Haixiang** 審批。',
          '• 撤回：`刪除提交 ' + item.id + '`',
        ].join('\n')
      : [
          '✅ **Proposal received**',
          '',
          formatSubmissionSummary(item, lang),
          '',
          `• Id: **${item.id}**`,
          '• Routed to **Yan Haixiang** for approval.',
          '• Withdraw: `delete submission ' + item.id + '`',
        ].join('\n')
  return simpleCard(title, body, 'turquoise')
}

export function memoryAdminReviewCard(
  lang: Lang,
  item: MemorySubmission,
): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  const title = hans
    ? '新 Skills／KB 提交 · 待审'
    : zh
      ? '新 Skills／KB 提交 · 待審'
      : 'New Skills/KB submission'
  const body = [
    hans
      ? '📥 **有新的修改提议需要你审批**'
      : zh
        ? '📥 **有新的修改提議需要你審批**'
        : '📥 **New change proposal needs your review**',
    '',
    formatSubmissionSummary(item, lang),
    '',
    hans
      ? '点 **继续** 查看建议路径与前后对比；或 **驳回**（随后请输入原因）。'
      : zh
        ? '點 **繼續** 查看建議路徑與前後對比；或 **駁回**（隨後請輸入原因）。'
        : 'Tap **Proceed** for path + pre/post, or **Reject** (then type a reason).',
  ].join('\n')
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'orange',
      title: { tag: 'plain_text', content: title },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: body } },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            type: 'primary',
            text: {
              tag: 'plain_text',
              content: hans ? '继续' : zh ? '繼續' : 'Proceed',
            },
            value: {
              action: 'memory_submit_proceed',
              submissionId: item.id,
              lang,
            },
          },
          {
            tag: 'button',
            type: 'danger',
            text: {
              tag: 'plain_text',
              content: hans ? '驳回' : zh ? '駁回' : 'Reject',
            },
            value: {
              action: 'memory_submit_reject',
              submissionId: item.id,
              lang,
            },
          },
        ],
      },
    ],
  }
}

export function memoryAdminProceedCard(
  lang: Lang,
  item: MemorySubmission,
  skills: SkillRec[],
  kb: KbItem[],
): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  const advice = adviseMemoryPath(item, skills, kb, lang)
  const title = hans
    ? '审批路径 · 前后对比'
    : zh
      ? '審批路徑 · 前後對比'
      : 'Approval path · pre/post'
  const body = [
    hans ? `📍 **建议路径：** ${advice.path}` : zh ? `📍 **建議路徑：** ${advice.path}` : `📍 **Path:** ${advice.path}`,
    '',
    hans ? '**变更前**' : zh ? '**變更前**' : '**Before**',
    advice.pre,
    '',
    hans ? '**变更后**' : zh ? '**變更後**' : '**After**',
    advice.post,
    '',
    hans
      ? '可直接 **批准写入**；若要改内容，点 **修改后批准** 并在下一条消息发送最终正文。'
      : zh
        ? '可直接 **批准寫入**；若要改內容，點 **修改後批准** 並在下一則訊息發送最終正文。'
        : '**Approve** to write as-is, or **Edit then approve** and send the final text next.',
  ].join('\n')
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'blue',
      title: { tag: 'plain_text', content: title },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: body } },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            type: 'primary',
            text: {
              tag: 'plain_text',
              content: hans ? '批准写入' : zh ? '批准寫入' : 'Approve',
            },
            value: {
              action: 'memory_submit_approve',
              submissionId: item.id,
              lang,
            },
          },
          {
            tag: 'button',
            type: 'default',
            text: {
              tag: 'plain_text',
              content: hans ? '修改后批准' : zh ? '修改後批准' : 'Edit then approve',
            },
            value: {
              action: 'memory_submit_edit',
              submissionId: item.id,
              lang,
            },
          },
          {
            tag: 'button',
            type: 'danger',
            text: {
              tag: 'plain_text',
              content: hans ? '驳回' : zh ? '駁回' : 'Reject',
            },
            value: {
              action: 'memory_submit_reject',
              submissionId: item.id,
              lang,
            },
          },
        ],
      },
    ],
  }
}

export function memoryApprovedNotifyCard(
  lang: Lang,
  item: MemorySubmission,
): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  const nodeId = item.appliedNodeId || (item.payload as { id?: string }).id || ''
  const url = deskNodeUrl(item.kind, nodeId)
  const title = hans
    ? '你的提交已通过'
    : zh
      ? '你的提交已通過'
      : 'Your submission was approved'
  const body = hans
    ? [
        '🎉 **Haixiang 已批准并写入**',
        '',
        formatSubmissionSummary(item, lang),
        '',
        `• 节点：**${nodeId}**`,
        `• 打开：[查看节点](${url})`,
      ].join('\n')
    : zh
      ? [
          '🎉 **Haixiang 已批准並寫入**',
          '',
          formatSubmissionSummary(item, lang),
          '',
          `• 節點：**${nodeId}**`,
          `• 打開：[查看節點](${url})`,
        ].join('\n')
      : [
          '🎉 **Haixiang approved and applied your change**',
          '',
          formatSubmissionSummary(item, lang),
          '',
          `• Node: **${nodeId}**`,
          `• Open: [view node](${url})`,
        ].join('\n')
  return simpleCard(title, body, 'green')
}

export function memoryRejectedNotifyCard(
  lang: Lang,
  item: MemorySubmission,
): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  const title = hans
    ? '你的提交未通过'
    : zh
      ? '你的提交未通過'
      : 'Your submission was rejected'
  const reason = item.rejectReason || '—'
  const body = hans
    ? [
        '⚠️ **Haixiang 已驳回**',
        '',
        formatSubmissionSummary(item, lang),
        '',
        `• **原因：** ${reason}`,
        '• 可修改后再次 `提交技能`／`提交知识库`。',
      ].join('\n')
    : zh
      ? [
          '⚠️ **Haixiang 已駁回**',
          '',
          formatSubmissionSummary(item, lang),
          '',
          `• **原因：** ${reason}`,
        ].join('\n')
      : [
          '⚠️ **Haixiang rejected the proposal**',
          '',
          formatSubmissionSummary(item, lang),
          '',
          `• **Reason:** ${reason}`,
        ].join('\n')
  return simpleCard(title, body, 'orange')
}

export function memoryDeletedAckCard(
  lang: Lang,
  item: MemorySubmission,
): Record<string, unknown> {
  const hans = lang === 'zh-Hans'
  const zh = isZh(lang)
  const nodeId = (item.payload as { id?: string }).id || ''
  const url = nodeId
    ? deskNodeUrl(item.kind, nodeId)
    : parentDeskUrl(item.kind)
  const title = hans
    ? '提交已删除'
    : zh
      ? '提交已刪除'
      : 'Submission deleted'
  const body = hans
    ? [
        '🗑️ **该部分提议已删除**',
        '',
        `• 单号：**${item.id}**`,
        nodeId ? `• 相关节点：**${nodeId}**` : '• 相关目录：Skills／知识库',
        `• 链接：[打开](${url})`,
      ].join('\n')
    : zh
      ? [
          '🗑️ **該部分提議已刪除**',
          '',
          `• 單號：**${item.id}**`,
          `• 連結：[打開](${url})`,
        ].join('\n')
      : [
          '🗑️ **That proposal was deleted**',
          '',
          `• Id: **${item.id}**`,
          `• Link: [open](${url})`,
        ].join('\n')
  return simpleCard(title, body, 'grey')
}

export function memoryRouteToApprovalReply(lang: Lang): string {
  if (lang === 'zh-Hans') {
    return [
      '📝 **可以修改** — 为确保一致性，你的提交会路由给 **Yan Haixiang** 审批。',
      '',
      '• 通过后你会收到通知，并附上更新节点链接。',
      '• 现在可以说 **提交技能** 或 **提交知识库**，然后写下要改的内容。',
      '• 桌面同样可在 Skills／知识库页提交提议。',
    ].join('\n')
  }
  if (lang === 'zh-Hant') {
    return [
      '📝 **可以修改** — 為確保一致性，你的提交會路由給 **Yan Haixiang** 審批。',
      '',
      '• 通過後會通知你並附上節點連結。',
      '• 請說 **提交技能** 或 **提交知識庫**，再寫下內容。',
    ].join('\n')
  }
  return [
    '📝 **You are free to propose edits** — for consistency they are routed to **Yan Haixiang** for approval.',
    '',
    '• You will be notified when approved, with a link to the updated node.',
    '• Say **submit skill** or **submit knowledge**, then the content.',
  ].join('\n')
}
