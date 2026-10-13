export type CategoryColorId =
  | 'teal'
  | 'amber'
  | 'rose'
  | 'blue'
  | 'green'
  | 'slate'
  | 'orange'
  | 'violet'

export interface CategoryColor {
  id: CategoryColorId
  swatch: string
  soft: string
  text: string
  border: string
}

export const CATEGORY_COLORS: CategoryColor[] = [
  {
    id: 'teal',
    swatch: '#0f766e',
    soft: 'rgba(15, 118, 110, 0.14)',
    text: '#115e59',
    border: 'rgba(15, 118, 110, 0.45)',
  },
  {
    id: 'amber',
    swatch: '#b45309',
    soft: 'rgba(180, 83, 9, 0.14)',
    text: '#9a3412',
    border: 'rgba(180, 83, 9, 0.45)',
  },
  {
    id: 'rose',
    swatch: '#be123c',
    soft: 'rgba(190, 18, 60, 0.12)',
    text: '#9f1239',
    border: 'rgba(190, 18, 60, 0.4)',
  },
  {
    id: 'blue',
    swatch: '#1d4ed8',
    soft: 'rgba(29, 78, 216, 0.12)',
    text: '#1e3a8a',
    border: 'rgba(29, 78, 216, 0.4)',
  },
  {
    id: 'green',
    swatch: '#15803d',
    soft: 'rgba(21, 128, 61, 0.14)',
    text: '#166534',
    border: 'rgba(21, 128, 61, 0.4)',
  },
  {
    id: 'slate',
    swatch: '#334155',
    soft: 'rgba(51, 65, 85, 0.12)',
    text: '#1e293b',
    border: 'rgba(51, 65, 85, 0.4)',
  },
  {
    id: 'orange',
    swatch: '#c2410c',
    soft: 'rgba(194, 65, 12, 0.14)',
    text: '#9a3412',
    border: 'rgba(194, 65, 12, 0.4)',
  },
  {
    id: 'violet',
    swatch: '#6d28d9',
    soft: 'rgba(109, 40, 217, 0.12)',
    text: '#5b21b6',
    border: 'rgba(109, 40, 217, 0.4)',
  },
]

const COLOR_MAP = new Map(CATEGORY_COLORS.map((c) => [c.id, c]))

export function isCategoryColorId(value: unknown): value is CategoryColorId {
  return typeof value === 'string' && COLOR_MAP.has(value as CategoryColorId)
}

export function getCategoryColor(id?: string | null): CategoryColor {
  if (id && COLOR_MAP.has(id as CategoryColorId)) {
    return COLOR_MAP.get(id as CategoryColorId)!
  }
  return CATEGORY_COLORS[0]
}

export function nextCategoryColor(used: Array<string | undefined>): CategoryColorId {
  const counts = new Map<CategoryColorId, number>()
  for (const color of CATEGORY_COLORS) counts.set(color.id, 0)
  for (const id of used) {
    if (isCategoryColorId(id)) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  let best = CATEGORY_COLORS[0].id
  let bestCount = Number.POSITIVE_INFINITY
  for (const color of CATEGORY_COLORS) {
    const count = counts.get(color.id) ?? 0
    if (count < bestCount) {
      best = color.id
      bestCount = count
    }
  }
  return best
}

export function categoryColorStyle(id?: string | null): {
  ['--cat-swatch']: string
  ['--cat-soft']: string
  ['--cat-text']: string
  ['--cat-border']: string
} {
  const color = getCategoryColor(id)
  return {
    '--cat-swatch': color.swatch,
    '--cat-soft': color.soft,
    '--cat-text': color.text,
    '--cat-border': color.border,
  }
}
