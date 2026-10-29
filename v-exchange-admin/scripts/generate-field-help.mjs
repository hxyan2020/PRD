#!/usr/bin/env node
/**
 * Generates src/config/fieldHelp.generated.ts from all page titles/labels,
 * merging with curated entries in fieldHelp.curated.ts (if present via FIELD_HELP export).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (e.name.endsWith('.tsx')) acc.push(p)
  }
  return acc
}

const TERM_EN = {
  合约: 'Contract',
  名称: 'Name',
  展示: 'Display',
  账户: 'Account',
  告警: 'Alert',
  预警: 'Warning',
  监控: 'Monitor',
  阈值: 'Threshold',
  频率: 'Frequency',
  周期: 'Period',
  类型: 'Type',
  状态: 'Status',
  时间: 'Time',
  更新: 'Updated',
  创建: 'Created',
  操作: 'Action',
  金额: 'Amount',
  价格: 'Price',
  数量: 'Quantity',
  方向: 'Side/Direction',
  持仓: 'Position',
  订单: 'Order',
  成交: 'Trade/Fill',
  强平: 'Liquidation',
  资金: 'Funding/Capital',
  费率: 'Rate/Fee',
  指数: 'Index',
  合理: 'Fair',
  行情: 'Market',
  源: 'Source',
  权重: 'Weight',
  杠杆: 'Leverage',
  保证金: 'Margin',
  盈亏: 'PnL',
  用户: 'User',
  流水: 'Ledger/Flow',
  备注: 'Remark',
  方式: 'Method',
  信息: 'Info',
  数值: 'Value',
  上限: 'Upper limit',
  下限: 'Lower limit',
  精度: 'Precision',
  启用: 'Enabled',
  停用: 'Disabled',
  币种: 'Coin',
  币对: 'Pair',
  交易: 'Trade',
  做市: 'Market making',
  注资: 'Capital injection',
  回拨: 'Recall/Withdraw',
  回拨: 'Recall',
  心跳: 'Heartbeat',
  友商: 'Peer exchange',
  对标: 'Benchmark',
  价差: 'Spread',
  深度: 'Depth',
  档位: 'Level/Tier',
  偏离: 'Deviation',
  中位数: 'Median',
  白名单: 'Whitelist',
  黑名单: 'Blacklist',
  手续费: 'Fee',
  结算: 'Settlement',
  收取: 'Collection',
  自动: 'Auto',
  调整: 'Adjust',
  算法: 'Algorithm',
  基差: 'Basis',
  观察: 'Observe',
  恢复: 'Recovery',
  群: 'Group/Webhook',
  机器人: 'Bot',
  价值: 'Value/Notional',
  权益: 'Equity',
  钱包: 'Wallet',
  余额: 'Balance',
  水位线: 'Waterline',
  占用: 'Occupied',
  未实现: 'Unrealized',
  已实现: 'Realized',
  均价: 'Avg price',
  张数: 'Contracts (lots)',
  减仓: 'Deleveraging',
  开仓: 'Open',
  平仓: 'Close',
  触发: 'Trigger',
  委托: 'Order/Entrust',
  止盈: 'Take profit',
  止损: 'Stop loss',
  模式: 'Mode',
  分组: 'Group',
  描述: 'Description',
  标签: 'Tag',
  开关: 'Switch',
  详情: 'Detail',
  记录: 'Record',
  明细: 'Details',
  汇总: 'Summary',
  净值: 'Net value',
  可用: 'Available',
  最大: 'Max',
  最小: 'Min',
  默认: 'Default',
  当前: 'Current',
  最近: 'Latest',
  所属: 'Belonging',
  关联: 'Linked',
  对应: 'Mapped',
  平台: 'Platform',
  内部: 'Internal',
  外部: 'External',
  一级: 'Level-1',
  二级: 'Level-2',
  长时间: 'Long-duration',
  大额: 'Large',
  事件: 'Event',
  通知: 'Notification',
  失败: 'Failure',
  重试: 'Retry',
  英文: 'English',
  中文: 'Chinese',
  小时: 'Hours',
  分钟: 'Minutes',
  秒: 'Seconds',
}

function roughEn(zh) {
  if (/^[A-Za-z0-9 _/%().\-]+$/.test(zh)) return zh
  // keep known full phrases
  const known = {
    合约名称: 'Contract Name',
    合约展示名称: 'Contract Display Name',
    告警类型: 'Alert Type',
    告警时间: 'Alert Time',
    告警方式: 'Alert Method',
    告警信息: 'Alert Message',
    告警值: 'Alert Value',
    更新人: 'Updated By',
    更新时间: 'Updated At',
    创建时间: 'Created At',
    状态: 'Status',
    操作: 'Actions',
    预警群: 'Alert Webhook Group',
    报警群: 'Alarm Webhook Group',
    监控阈值: 'Monitor Threshold',
    监控频率: 'Monitor Frequency',
    监控周期: 'Monitor Period',
    对标交易所: 'Benchmark Exchanges',
    资金费率数值: 'Funding Rate Value',
    钱包余额: 'Wallet Balance',
    自动注资水位线: 'Auto-Inject Waterline',
    注资目标水位线: 'Inject Target Waterline',
    流水类型: 'Fund Flow Type',
    '金额 (USD)': 'Amount (USD)',
  }
  if (known[zh]) return known[zh]
  let out = zh
  // longest-first replace
  const terms = Object.keys(TERM_EN).sort((a, b) => b.length - a.length)
  for (const t of terms) out = out.split(t).join(TERM_EN[t] + ' ')
  out = out.replace(/\s+/g, ' ').trim()
  return out || zh
}

function explain(zh, en) {
  return {
    nameZh: zh,
    nameEn: en,
    explainZh: `「${zh}」字段：用于配置或展示相关业务数据，请按业务规则填写/筛选。`,
    explainEn: `"${en}" — used to configure or display related business data; fill or filter per ops rules.`,
    module: 'common',
  }
}

const pages = walk(path.join(root, 'src/pages'))
const names = new Set()
for (const file of pages) {
  const src = fs.readFileSync(file, 'utf8')
  for (const m of src.matchAll(/title:\s*(?:fh\('([^']+)'\)|'([^']+)'|"([^"]+)")/g)) {
    names.add(m[1] || m[2] || m[3])
  }
  for (const m of src.matchAll(/label=\{?fh\('([^']+)'\)\}?/g)) names.add(m[1])
  for (const m of src.matchAll(/label="([^"]+)"/g)) names.add(m[1])
}

// Load curated overrides from fieldHelp.ts FIELD_HELP object via regex parse of exported object keys we already maintain
const curatedPath = path.join(root, 'src/config/fieldHelp.ts')
const curatedSrc = fs.readFileSync(curatedPath, 'utf8')
// Keep curated file as source of truth for overrides; generated merges under it at runtime.

const skip = new Set(['操作', 'Actions', '快捷入口'])
const entries = []
for (const zh of [...names].filter(Boolean).sort((a, b) => a.localeCompare(b, 'zh'))) {
  if (skip.has(zh)) continue
  const en = roughEn(zh)
  const e = explain(zh, en)
  entries.push(e)
}

const out = `/* AUTO-GENERATED by scripts/generate-field-help.mjs — do not edit by hand */
import type { FieldHelpItem } from './fieldHelpTypes'

export const GENERATED_FIELD_HELP: Record<string, FieldHelpItem> = {
${entries
  .map((e) => {
    const key = JSON.stringify(e.nameZh)
    return `  ${key}: {
    nameZh: ${JSON.stringify(e.nameZh)},
    nameEn: ${JSON.stringify(e.nameEn)},
    explainZh: ${JSON.stringify(e.explainZh)},
    explainEn: ${JSON.stringify(e.explainEn)},
    module: 'common',
  },`
  })
  .join('\n')}
}
`
fs.writeFileSync(path.join(root, 'src/config/fieldHelp.generated.ts'), out)
console.log('generated', entries.length, 'field help entries')
