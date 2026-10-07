export type VisualKind =
  | 'flow'
  | 'stack'
  | 'compare'
  | 'cycle'
  | 'tree'
  | 'matrix'
  | 'slider'
  | 'pipeline'
  | 'cards'
  | 'balance'

export interface VisualNode {
  id: string
  label: string
  detail: string
  tag?: string
}

export interface MatrixCell {
  id: string
  label: string
  detail: string
}

export interface LessonVisual {
  day: number
  title: string
  caption: string
  kind: VisualKind
  nodes?: VisualNode[]
  leftTitle?: string
  rightTitle?: string
  left?: VisualNode[]
  right?: VisualNode[]
  rows?: { label: string; children: VisualNode[] }[]
  xLabels?: [string, string]
  yLabels?: [string, string]
  cells?: [MatrixCell, MatrixCell, MatrixCell, MatrixCell]
  slider?: {
    label: string
    min: number
    max: number
    step: number
    initial: number
    unit?: string
    bands: { max: number; label: string; detail: string }[]
  }
  buckets?: { title: string; items: string[] }[]
}
