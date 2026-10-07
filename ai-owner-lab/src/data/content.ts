import type { Lang } from '../i18n/types'
import { curriculum as curriculumEn, TOTAL_DAYS } from './curriculum'
import { phases as phasesEn } from './phases'
import { glossary as glossaryEn, searchGlossary as searchGlossaryEn } from './glossary'
import { useCases as useCasesEn } from './useCases'
import { visuals as visualsEn, getVisual as getVisualEn } from './visuals'
import { productionExamples as productionEn, getProductionExample as getProdEn } from './productionExamples'
import { curriculumZh } from './zh/curriculum'
import { phasesZh } from './zh/phases'
import { glossaryZh } from './zh/glossary'
import { useCasesZh } from './zh/useCases'
import { visualsZh } from './zh/visuals'
import { productionExamplesZh } from './zh/productionExamples'
import type { DayLesson, GlossaryTerm, Phase, ProductionExample, UseCase } from './types'
import type { LessonVisual } from './visualTypes'

const curriculumZhWithProd: DayLesson[] = curriculumZh.map((lesson) => ({
  ...lesson,
  production: productionExamplesZh[lesson.day] ?? getProdEn(lesson.day),
}))

export function getPhases(lang: Lang): Phase[] {
  return lang === 'zh' ? phasesZh : phasesEn
}

export function getCurriculum(lang: Lang): DayLesson[] {
  return lang === 'zh' ? curriculumZhWithProd : curriculumEn
}

export function getDayLesson(lang: Lang, day: number): DayLesson | undefined {
  return getCurriculum(lang).find((d) => d.day === day)
}

export function getPhaseForDayLang(lang: Lang, day: number): Phase | undefined {
  return getPhases(lang).find((p) => p.days.includes(day))
}

export function getGlossary(lang: Lang): GlossaryTerm[] {
  return lang === 'zh' ? glossaryZh : glossaryEn
}

export function searchGlossaryLang(lang: Lang, query: string): GlossaryTerm[] {
  if (lang !== 'zh') return searchGlossaryEn(query)
  const q = query.trim().toLowerCase()
  if (!q) return glossaryZh
  return glossaryZh.filter(
    (g) =>
      g.term.toLowerCase().includes(q) ||
      g.short.toLowerCase().includes(q) ||
      g.detail.toLowerCase().includes(q),
  )
}

export function getUseCases(lang: Lang): UseCase[] {
  return lang === 'zh' ? useCasesZh : useCasesEn
}

export function getVisualLang(lang: Lang, day: number): LessonVisual | undefined {
  if (lang === 'zh') return visualsZh.find((v) => v.day === day)
  return getVisualEn(day)
}

export function getProductionLang(lang: Lang, day: number): ProductionExample | undefined {
  if (lang === 'zh') return productionExamplesZh[day] ?? productionEn[day]
  return productionEn[day]
}

export { TOTAL_DAYS, visualsEn }
