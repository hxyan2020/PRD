import { week1 } from './curriculum-week1'
import { week2 } from './curriculum-week2'
import { week3 } from './curriculum-week3'
import { week4 } from './curriculum-week4'
import type { DayLesson, PhaseId } from './types'
import { phases } from './phases'

export const curriculum: DayLesson[] = [...week1, ...week2, ...week3, ...week4]

export function getDay(day: number): DayLesson | undefined {
  return curriculum.find((d) => d.day === day)
}

export function getPhaseLessons(phase: PhaseId): DayLesson[] {
  return curriculum.filter((d) => d.phase === phase)
}

export function getPhaseForDay(day: number) {
  return phases.find((p) => p.days.includes(day))
}

export const TOTAL_DAYS = curriculum.length
