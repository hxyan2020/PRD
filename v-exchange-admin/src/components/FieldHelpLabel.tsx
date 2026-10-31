import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { getFieldHelp } from '../config/fieldHelp'
import './FieldHelpLabel.css'

type Props = {
  /** Chinese field name used as lookup key (and default visible label) */
  name: string
  /** Optional override for visible label text */
  label?: ReactNode
}

type TipPos = { top: number; left: number }

/**
 * Hover/click field help: EN + 中文 (+ XAU/BTC launch tips).
 * Uses a body-portaled panel (not native title / not Ant Tooltip) so table
 * header overflow and sticky cells cannot clip or swallow the tip.
 */
export function FieldHelpLabel({ name, label }: Props) {
  const help = getFieldHelp(name)
  const visible = label ?? name
  const hasLaunch = !!(help.xauRec || help.btcRec || help.oldParam || help.reason)
  const tipId = useId()
  const anchorRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<TipPos>({ top: 0, left: 0 })
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const place = () => {
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const tipW = tipRef.current?.offsetWidth ?? 380
    const tipH = tipRef.current?.offsetHeight ?? 120
    const gap = 8
    let left = r.left
    let top = r.top - tipH - gap
    if (top < 8) top = r.bottom + gap
    if (left + tipW > window.innerWidth - 8) left = Math.max(8, window.innerWidth - tipW - 8)
    if (left < 8) left = 8
    setPos({ top, left })
  }

  const show = () => {
    clearClose()
    setOpen(true)
  }

  const hideSoon = () => {
    clearClose()
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(() => place())
    const onScroll = () => place()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  useEffect(() => () => clearClose(), [])

  const tip = (
    <div
      ref={tipRef}
      id={tipId}
      role="tooltip"
      className="field-help-floating"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={show}
      onMouseLeave={hideSoon}
    >
      <div className="field-help-floating__title">
        <strong>{help.nameEn}</strong>
        <span className="field-help-floating__muted"> / {help.nameZh}</span>
      </div>
      <div className="field-help-floating__row">
        <span className="field-help-floating__lang">EN</span>
        <span>{help.explainEn}</span>
      </div>
      <div className="field-help-floating__row">
        <span className="field-help-floating__lang">中文</span>
        <span>{help.explainZh}</span>
      </div>
      {hasLaunch && (
        <div className="field-help-floating__launch">
          <div className="field-help-floating__launch-title">首发建议 / Launch tips</div>
          {help.oldParam && (
            <div>
              <span className="field-help-floating__tag-old">旧参数 Old: </span>
              {help.oldParam}
            </div>
          )}
          {help.xauRec && (
            <div>
              <span className="field-help-floating__tag-pair">XAUUSD: </span>
              {help.xauRec}
            </div>
          )}
          {help.btcRec && (
            <div>
              <span className="field-help-floating__tag-pair">BTCUSD: </span>
              {help.btcRec}
            </div>
          )}
          {help.reason && (
            <div className="field-help-floating__why">
              <span className="field-help-floating__lang">原因 Why: </span>
              {help.reason}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      <span
        ref={anchorRef}
        className="field-help-label"
        data-field-help="1"
        role="button"
        tabIndex={0}
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hideSoon}
        onFocus={show}
        onBlur={hideSoon}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (open) hideSoon()
          else show()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => !v)
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
      >
        <span className="field-help-label__text">{visible}</span>
        <QuestionCircleOutlined
          aria-label={`Help: ${name}`}
          className={hasLaunch ? 'field-help-label__icon field-help-label__icon--launch' : 'field-help-label__icon'}
        />
      </span>
      {open ? createPortal(tip, document.body) : null}
    </>
  )
}

/** Convenience for table column titles / Form labels */
export function fh(name: string): ReactNode {
  return <FieldHelpLabel name={name} />
}

/** Colored label + help (e.g. red notional column) */
export function fhStyled(name: string, style: CSSProperties): ReactNode {
  return <FieldHelpLabel name={name} label={<span style={style}>{name}</span>} />
}
