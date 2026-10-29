export type FieldHelpItem = {
  nameZh: string
  nameEn: string
  explainZh: string
  explainEn: string
  oldParam?: string
  xauRec?: string
  btcRec?: string
  reason?: string
  module?: 'price' | 'risk' | 'alert' | 'mm' | 'common'
}
