import { fetchQuoteOpsRag } from '../api/lark/_lib/quoteOps'
import { loadKnowledge, loadSkills, retrieveRag } from '../api/lark/_lib/skills'

async function main() {
  console.log('skills', loadSkills().length, 'kb', loadKnowledge().length)
  const qs = [
    'Mark 偏离指数 48bps 怎么排查',
    '接仓失败 Funding 异常',
    '强平失败 ADL',
    '什么是 Index Premium Funding Mark',
    'V Exchange 永续知识库使用原则',
    '如何处理无有效源告警',
  ]
  for (const q of qs) {
    const r = retrieveRag(q)
    console.log('\nQ:', q)
    console.log(' hits', r.hits.slice(0, 6).map((h) => `${h.id}:${h.score}`).join(', '), 'sev', r.severity)
    console.log(' kb', r.kb.slice(0, 4).map((k) => `${k.id}:${k.score}`).join(', '))
  }
  const live = await fetchQuoteOpsRag('Mark vs Index 偏离 接仓失败')
  console.log('\nlive quote-ops', live ? live.slice(0, 300) : null)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
