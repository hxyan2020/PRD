import type { ReactNode } from 'react'
import { Tooltip, Typography } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { getFieldHelp } from '../config/fieldHelp'

const { Text } = Typography

type Props = {
  /** Chinese field name used as lookup key (and default visible label) */
  name: string
  /** Optional override for visible label text */
  label?: ReactNode
}

/** Hover/click help: EN + 中文 explanation, plus XAU/BTC launch recs when available. */
export function FieldHelpLabel({ name, label }: Props) {
  const help = getFieldHelp(name)
  const visible = label ?? name
  if (!help) return <>{visible}</>

  const tip = (
    <div style={{ maxWidth: 360 }}>
      <div style={{ marginBottom: 6 }}>
        <Text strong style={{ color: '#fff' }}>
          {help.nameEn}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.65)' }}> / {help.nameZh}</Text>
      </div>
      <div style={{ marginBottom: 4 }}>
        <Text style={{ color: '#91caff' }}>EN: </Text>
        <Text style={{ color: '#fff' }}>{help.explainEn}</Text>
      </div>
      <div style={{ marginBottom: 4 }}>
        <Text style={{ color: '#91caff' }}>中文: </Text>
        <Text style={{ color: '#fff' }}>{help.explainZh}</Text>
      </div>
      {(help.xauRec || help.btcRec) && (
        <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 6 }}>
          {help.oldParam && (
            <div>
              <Text style={{ color: '#ffe58f' }}>旧参数 / Old: </Text>
              <Text style={{ color: '#fff' }}>{help.oldParam}</Text>
            </div>
          )}
          {help.xauRec && (
            <div>
              <Text style={{ color: '#b7eb8f' }}>XAUUSD 建议: </Text>
              <Text style={{ color: '#fff' }}>{help.xauRec}</Text>
            </div>
          )}
          {help.btcRec && (
            <div>
              <Text style={{ color: '#b7eb8f' }}>BTCUSD 建议: </Text>
              <Text style={{ color: '#fff' }}>{help.btcRec}</Text>
            </div>
          )}
          {help.reason && (
            <div style={{ marginTop: 4 }}>
              <Text style={{ color: '#91caff' }}>原因 / Why: </Text>
              <Text style={{ color: '#fff' }}>{help.reason}</Text>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span>{visible}</span>
      <Tooltip title={tip} trigger={['hover', 'click']}>
        <QuestionCircleOutlined style={{ color: '#1677ff', cursor: 'help', fontSize: 12 }} />
      </Tooltip>
    </span>
  )
}

/** Convenience for table column titles / Form labels */
export function fh(name: string): ReactNode {
  return <FieldHelpLabel name={name} />
}
