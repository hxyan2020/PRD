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

/** Hover/click help: EN + 中文 + XAU/BTC launch recommendations when available. */
export function FieldHelpLabel({ name, label }: Props) {
  const help = getFieldHelp(name)
  const visible = label ?? name
  const hasLaunch = !!(help.xauRec || help.btcRec || help.oldParam || help.reason)

  const tip = (
    <div style={{ maxWidth: 380 }}>
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
      {hasLaunch && (
        <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 8 }}>
          <div style={{ marginBottom: 4, color: '#ffe58f', fontWeight: 600 }}>首发建议 / Launch tips</div>
          {help.oldParam && (
            <div>
              <Text style={{ color: '#ffe58f' }}>旧参数 Old: </Text>
              <Text style={{ color: '#fff' }}>{help.oldParam}</Text>
            </div>
          )}
          {help.xauRec && (
            <div>
              <Text style={{ color: '#b7eb8f' }}>XAUUSD: </Text>
              <Text style={{ color: '#fff' }}>{help.xauRec}</Text>
            </div>
          )}
          {help.btcRec && (
            <div>
              <Text style={{ color: '#b7eb8f' }}>BTCUSD: </Text>
              <Text style={{ color: '#fff' }}>{help.btcRec}</Text>
            </div>
          )}
          {help.reason && (
            <div style={{ marginTop: 4 }}>
              <Text style={{ color: '#91caff' }}>原因 Why: </Text>
              <Text style={{ color: '#fff' }}>{help.reason}</Text>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // Whole label is the hover target (not only the tiny ?).
  // Native <span> child so Tooltip can attach listeners/ref; portal to body
  // so table overflow / sticky headers do not clip the popup.
  return (
    <Tooltip
      title={tip}
      trigger={['hover', 'click', 'focus']}
      mouseEnterDelay={0.05}
      mouseLeaveDelay={0.1}
      placement="topLeft"
      getPopupContainer={() => document.body}
      styles={{ root: { maxWidth: 420, zIndex: 11000 } }}
    >
      <span
        role="button"
        tabIndex={0}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'help',
          maxWidth: '100%',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{visible}</span>
        <QuestionCircleOutlined
          aria-label={`Help: ${name}`}
          style={{
            color: hasLaunch ? '#52c41a' : '#1677ff',
            fontSize: 13,
            flexShrink: 0,
          }}
        />
      </span>
    </Tooltip>
  )
}

/** Convenience for table column titles / Form labels */
export function fh(name: string): ReactNode {
  return <FieldHelpLabel name={name} />
}
