/**
 * Map Wikidata painter-country labels (incl. historical states) onto local flag assets.
 * Compound labels like "A / B" resolve to up to two flags.
 */

export type CountryFlagRef = {
  code: string
  title: string
}

/** Exact / normalized segment → flag file stem in public/flags/{code}.png */
const SEGMENT_FLAGS: Array<{ match: RegExp | string; code: string; title: string }> = [
  { match: /^unknown$/i, code: '', title: 'Unknown' },
  { match: /^statelessness$/i, code: '', title: 'Stateless' },
  { match: /^geographical region of italy$/i, code: 'it', title: 'Italy' },

  // Modern
  { match: /^france$/i, code: 'fr', title: 'France' },
  { match: /^spain$/i, code: 'es', title: 'Spain' },
  { match: /^italy$/i, code: 'it', title: 'Italy' },
  { match: /^germany$/i, code: 'de', title: 'Germany' },
  { match: /^belgium$/i, code: 'be', title: 'Belgium' },
  { match: /^switzerland$/i, code: 'ch', title: 'Switzerland' },
  { match: /^norway$/i, code: 'no', title: 'Norway' },
  { match: /^sweden$/i, code: 'se', title: 'Sweden' },
  { match: /^united states$/i, code: 'us', title: 'United States' },
  { match: /^united kingdom$/i, code: 'gb', title: 'United Kingdom' },
  { match: /^russia$/i, code: 'ru', title: 'Russia' },
  { match: /^poland$/i, code: 'pl', title: 'Poland' },
  { match: /^netherlands$/i, code: 'nl', title: 'Netherlands' },

  // British / Irish
  { match: /united kingdom of great britain and ireland/i, code: 'gb', title: 'United Kingdom of Great Britain and Ireland' },
  { match: /kingdom of great britain/i, code: 'gb', title: 'Kingdom of Great Britain' },
  { match: /british empire/i, code: 'gb', title: 'British Empire' },

  // Low Countries
  { match: /dutch republic/i, code: 'dutch-republic', title: 'Dutch Republic' },
  { match: /kingdom of the netherlands/i, code: 'nl', title: 'Kingdom of the Netherlands' },
  { match: /burgundian netherlands/i, code: 'burgundy', title: 'Burgundian Netherlands' },
  { match: /spanish netherlands/i, code: 'spanish-netherlands', title: 'Spanish Netherlands' },
  { match: /habsburg netherlands/i, code: 'habsburg', title: 'Habsburg Netherlands' },
  { match: /southern netherlands/i, code: 'be', title: 'Southern Netherlands' },
  { match: /northern low countries/i, code: 'dutch-republic', title: 'Northern Low Countries' },
  { match: /duchy of brabant/i, code: 'brabant', title: 'Duchy of Brabant' },

  // Italian states
  { match: /republic of florence/i, code: 'florence', title: 'Republic of Florence' },
  { match: /republic of venice/i, code: 'venice', title: 'Republic of Venice' },
  { match: /republic of pisa/i, code: 'pisa', title: 'Republic of Pisa' },
  { match: /duchy of milan/i, code: 'milan', title: 'Duchy of Milan' },
  { match: /papal states/i, code: 'papal-states', title: 'Papal States' },
  { match: /signoria di correggio/i, code: 'correggio', title: 'Signoria di Correggio' },
  { match: /kingdom of sicily/i, code: 'two-sicilies', title: 'Kingdom of Sicily' },
  { match: /kingdom of italy/i, code: 'kingdom-italy', title: 'Kingdom of Italy' },
  { match: /republic of geneva/i, code: 'geneva', title: 'Republic of Geneva' },

  // Iberia
  { match: /crown of castile/i, code: 'castile', title: 'Crown of Castile' },
  { match: /crown of aragon/i, code: 'aragon', title: 'Crown of Aragon' },

  // German / Central European
  { match: /holy roman empire/i, code: 'hre', title: 'Holy Roman Empire' },
  { match: /german empire/i, code: 'german-empire', title: 'German Empire' },
  { match: /kingdom of prussia/i, code: 'prussia', title: 'Kingdom of Prussia' },
  { match: /duchy of bavaria/i, code: 'bavaria', title: 'Duchy of Bavaria' },
  { match: /kingdom of bavaria/i, code: 'bavaria', title: 'Kingdom of Bavaria' },
  { match: /kingdom of württemberg|kingdom of wurttemberg/i, code: 'wurttemberg', title: 'Kingdom of Württemberg' },
  { match: /grand duchy of baden/i, code: 'de', title: 'Grand Duchy of Baden' },
  { match: /duchy of lorraine/i, code: 'lorraine', title: 'Duchy of Lorraine' },
  { match: /free city of kraków|free city of krakow/i, code: 'krakow', title: 'Free City of Kraków' },
  { match: /congress poland/i, code: 'pl', title: 'Congress Poland' },

  // Habsburg / Austria
  { match: /austria–hungary|austria-hungary/i, code: 'austria-hungary', title: 'Austria-Hungary' },
  { match: /austrian empire/i, code: 'habsburg', title: 'Austrian Empire' },
  { match: /cisleithania/i, code: 'austria-hungary', title: 'Cisleithania' },

  // France royal
  { match: /french constitutional monarchy/i, code: 'fr', title: 'French constitutional monarchy' },
  { match: /kingdom of france/i, code: 'kingdom-france', title: 'Kingdom of France' },

  // Nordic
  { match: /kingdom of denmark/i, code: 'dk', title: 'Kingdom of Denmark' },
  { match: /grand duchy of finland/i, code: 'grand-duchy-finland', title: 'Grand Duchy of Finland' },

  // East / empires
  { match: /russian empire/i, code: 'russian-empire', title: 'Russian Empire' },
  { match: /russian soviet federative socialist republic/i, code: 'soviet', title: 'Russian SFSR' },
  { match: /ukrainian soviet socialist republic/i, code: 'ukraine-ssr', title: 'Ukrainian SSR' },
  { match: /soviet union/i, code: 'soviet', title: 'Soviet Union' },
  { match: /ottoman empire/i, code: 'ottoman', title: 'Ottoman Empire' },
  { match: /qing dynasty/i, code: 'qing', title: 'Qing dynasty' },
  { match: /yuan dynasty/i, code: 'yuan', title: 'Yuan dynasty' },
  { match: /tang dynasty/i, code: 'tang', title: 'Tang dynasty' },
]

function resolveSegment(segment: string): CountryFlagRef | null {
  const s = segment.trim()
  if (!s) return null
  for (const row of SEGMENT_FLAGS) {
    const ok = typeof row.match === 'string' ? s.toLowerCase() === row.match.toLowerCase() : row.match.test(s)
    if (ok) {
      if (!row.code) return null
      return { code: row.code, title: row.title }
    }
  }
  // Soft fallbacks by keyword
  const lower = s.toLowerCase()
  if (lower.includes('florence')) return { code: 'florence', title: s }
  if (lower.includes('venice')) return { code: 'venice', title: s }
  if (lower.includes('milan')) return { code: 'milan', title: s }
  if (lower.includes('netherland') || lower.includes('dutch')) return { code: 'nl', title: s }
  if (lower.includes('britain') || lower.includes('english')) return { code: 'gb', title: s }
  if (lower.includes('france') || lower.includes('french')) return { code: 'fr', title: s }
  if (lower.includes('spain') || lower.includes('spanish')) return { code: 'es', title: s }
  if (lower.includes('italy') || lower.includes('italian')) return { code: 'it', title: s }
  if (lower.includes('german')) return { code: 'de', title: s }
  if (lower.includes('russia')) return { code: 'ru', title: s }
  if (lower.includes('china') || lower.includes('dynasty')) return { code: 'cn', title: s }
  return null
}

/** Resolve painterCountry label into 0–2 local flag refs. */
export function flagsForCountry(painterCountry: string): CountryFlagRef[] {
  if (!painterCountry || /^unknown$/i.test(painterCountry.trim())) return []
  const parts = painterCountry.split(/\s*\/\s*/)
  const out: CountryFlagRef[] = []
  const seen = new Set<string>()
  for (const part of parts) {
    const ref = resolveSegment(part)
    if (!ref || seen.has(ref.code)) continue
    seen.add(ref.code)
    out.push(ref)
    if (out.length >= 2) break
  }
  return out
}
