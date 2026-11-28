import { LANG_LABEL, messages, type AppLang } from '../src/i18n/messages.ts'
import { isZh, zhUi } from '../src/i18n/zh.ts'

const langs = Object.keys(LANG_LABEL) as AppLang[]
const fails: string[] = []

if (langs.join(',') !== 'en,zh-Hant,zh-Hans') {
  fails.push(`LANG_LABEL order/keys = ${langs.join(',')} (want en,zh-Hant,zh-Hans)`)
}
if (LANG_LABEL['zh-Hans'] !== '简中') fails.push(`label zh-Hans=${LANG_LABEL['zh-Hans']}`)
if (LANG_LABEL['zh-Hant'] !== '繁中') fails.push(`label zh-Hant=${LANG_LABEL['zh-Hant']}`)

const enKeys = Object.keys(messages.en)
for (const L of langs) {
  const miss = enKeys.filter((k) => !(k in messages[L]))
  if (miss.length) fails.push(`${L} missing keys: ${miss.slice(0, 8).join(',')}`)
}

const hansTitle = messages['zh-Hans'].title || ''
const hantTitle = messages['zh-Hant'].title || ''
if (!/风险/.test(hansTitle)) fails.push(`zh-Hans title not Simplified: ${hansTitle}`)
if (!/風險/.test(hantTitle)) fails.push(`zh-Hant title not Traditional: ${hantTitle}`)
if (!/语言/.test(messages['zh-Hans'].menuLanguage || '')) {
  fails.push(`zh-Hans menuLanguage=${messages['zh-Hans'].menuLanguage}`)
}
if (!/語言/.test(messages['zh-Hant'].menuLanguage || '')) {
  fails.push(`zh-Hant menuLanguage=${messages['zh-Hant'].menuLanguage}`)
}

if (!isZh('zh-Hans') || !isZh('zh-Hant') || isZh('en')) fails.push('isZh helper broken')
if (zhUi('zh-Hans', '風險工具') !== '风险工具') {
  fails.push(`zhUi Hans convert failed: ${zhUi('zh-Hans', '風險工具')}`)
}

console.log(
  fails.length ? `FAIL ${fails.length}\n${fails.join('\n')}` : 'WEB_ZH_HANS_OK',
)
process.exit(fails.length ? 1 : 0)
