import { useEffect, useMemo, useState } from 'react'
import { getProductionLang } from '../data/content'
import type { LessonVisual as VisualSpec, VisualNode } from '../data/visualTypes'
import { useLanguage } from '../i18n/LanguageContext'

interface Props {
  visual: VisualSpec
}

const FLOW_TAGS = new Set(['start', 'process', 'decision', 'terminal'])

function NodeDetail({ node, hint }: { node: VisualNode | null; hint: string }) {
  if (!node) {
    return <p className="visual-hint">{hint}</p>
  }
  const showTag = node.tag && !FLOW_TAGS.has(node.tag)
  return (
    <div className="visual-detail">
      {showTag ? <span className="visual-tag">{node.tag}</span> : null}
      <strong>{node.label}</strong>
      <p>{node.detail}</p>
    </div>
  )
}

export function LessonVisual({ visual }: Props) {
  const { lang, t } = useLanguage()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sliderValue, setSliderValue] = useState(visual.slider?.initial ?? 0)
  const production = visual.kind === 'flowchart' ? undefined : getProductionLang(lang, visual.day)

  const allNodes = useMemo(() => {
    const list: VisualNode[] = []
    if (visual.nodes) list.push(...visual.nodes)
    if (visual.left) list.push(...visual.left)
    if (visual.right) list.push(...visual.right)
    if (visual.rows) visual.rows.forEach((r) => list.push(...r.children))
    if (visual.cells) list.push(...visual.cells)
    return list
  }, [visual])

  useEffect(() => {
    setActiveId(allNodes[0]?.id ?? null)
    setSliderValue(visual.slider?.initial ?? 0)
  }, [visual.day, visual.id, visual.kind, allNodes])

  const active = allNodes.find((n) => n.id === activeId) ?? null

  const activeBand = useMemo(() => {
    if (!visual.slider) return null
    return visual.slider.bands.find((b) => sliderValue <= b.max) ?? visual.slider.bands.at(-1) ?? null
  }, [sliderValue, visual.slider])

  const eyebrow =
    visual.kind === 'flowchart'
      ? t('interactiveFlowchart')
      : visual.kind === 'pipeline' || visual.kind === 'flow'
        ? t('interactiveFlow')
        : t('interactiveDiagram')

  return (
    <section className={`lesson-visual kind-${visual.kind}`} aria-label={visual.title}>
      <div className="visual-head">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{visual.title}</h2>
        <p>{visual.caption}</p>
        {production ? (
          <p className="visual-prod-hook">
            {t('productionLens')} <strong>{production.source}</strong> — {production.setting}
          </p>
        ) : null}
      </div>

      {visual.kind === 'flow' || visual.kind === 'pipeline' ? (
        <div className={`visual-flow ${visual.kind}`}>
          {(visual.nodes ?? []).map((node, index) => (
            <div key={node.id} className="flow-item">
              <button
                type="button"
                className={`visual-node ${activeId === node.id ? 'active' : ''}`}
                onClick={() => setActiveId(node.id)}
              >
                <span className="node-index">{index + 1}</span>
                <span>{node.label}</span>
              </button>
              {index < (visual.nodes?.length ?? 0) - 1 ? (
                <span className="flow-arrow" aria-hidden="true">
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {visual.kind === 'flowchart' ? (
        <div className="visual-flowchart" role="list">
          {(visual.nodes ?? []).map((node, index) => (
            <div key={node.id} className="flowchart-step" role="listitem">
              <button
                type="button"
                className={`flowchart-node tag-${node.tag ?? 'process'} ${activeId === node.id ? 'active' : ''}`}
                onClick={() => setActiveId(node.id)}
              >
                <span className="flowchart-kind">
                  {node.tag === 'decision'
                    ? t('flowDecision')
                    : node.tag === 'start'
                      ? t('flowStart')
                      : node.tag === 'terminal'
                        ? t('flowEnd')
                        : t('flowStep')}
                </span>
                <span className="flowchart-label">{node.label}</span>
              </button>
              {index < (visual.nodes?.length ?? 0) - 1 ? (
                <div className="flowchart-connector" aria-hidden="true">
                  <span className="flowchart-line" />
                  <span className="flowchart-chevron">↓</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {visual.kind === 'stack' ? (
        <div className="visual-stack">
          {(visual.nodes ?? []).map((node, index) => (
            <button
              key={node.id}
              type="button"
              className={`stack-layer ${activeId === node.id ? 'active' : ''}`}
              style={{ ['--i' as string]: index }}
              onClick={() => setActiveId(node.id)}
            >
              <span>{node.label}</span>
              {node.tag ? <em>{node.tag}</em> : null}
            </button>
          ))}
        </div>
      ) : null}

      {visual.kind === 'compare' ? (
        <div className="visual-compare">
          <div>
            <h3>{visual.leftTitle}</h3>
            <div className="compare-col">
              {(visual.left ?? []).map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className={`visual-node ${activeId === node.id ? 'active' : ''}`}
                  onClick={() => setActiveId(node.id)}
                >
                  {node.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3>{visual.rightTitle}</h3>
            <div className="compare-col">
              {(visual.right ?? []).map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className={`visual-node ${activeId === node.id ? 'active' : ''}`}
                  onClick={() => setActiveId(node.id)}
                >
                  {node.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {visual.kind === 'cycle' ? (
        <div className="visual-cycle">
          {(visual.nodes ?? []).map((node, index) => {
            const angle = (360 / (visual.nodes?.length || 1)) * index - 90
            const rad = (angle * Math.PI) / 180
            const x = 50 + Math.cos(rad) * 38
            const y = 50 + Math.sin(rad) * 38
            return (
              <button
                key={node.id}
                type="button"
                className={`cycle-node ${activeId === node.id ? 'active' : ''}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={() => setActiveId(node.id)}
              >
                {node.label}
              </button>
            )
          })}
          <div className="cycle-core">{t('cycleLoop')}</div>
        </div>
      ) : null}

      {visual.kind === 'tree' ? (
        <div className="visual-tree">
          {(visual.rows ?? []).map((row) => (
            <div key={row.label} className="tree-row">
              <div className="tree-label">{row.label}</div>
              <div className="tree-children">
                {row.children.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    className={`visual-node ${activeId === node.id ? 'active' : ''}`}
                    onClick={() => setActiveId(node.id)}
                  >
                    {node.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {visual.kind === 'matrix' && visual.cells && visual.xLabels && visual.yLabels ? (
        <div className="visual-matrix">
          <div className="matrix-y top">{visual.yLabels[0]}</div>
          <div className="matrix-grid">
            {visual.cells.map((cell) => (
              <button
                key={cell.id}
                type="button"
                className={`matrix-cell ${activeId === cell.id ? 'active' : ''}`}
                onClick={() => setActiveId(cell.id)}
              >
                {cell.label}
              </button>
            ))}
          </div>
          <div className="matrix-y bottom">{visual.yLabels[1]}</div>
          <div className="matrix-x">
            <span>{visual.xLabels[0]}</span>
            <span>{visual.xLabels[1]}</span>
          </div>
        </div>
      ) : null}

      {visual.kind === 'slider' && visual.slider ? (
        <div className="visual-slider">
          <label>
            <span>
              {visual.slider.label}:{' '}
              <strong>
                {sliderValue}
                {visual.slider.unit ?? ''}
              </strong>
            </span>
            <input
              type="range"
              min={visual.slider.min}
              max={visual.slider.max}
              step={visual.slider.step}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
            />
          </label>
          {activeBand ? (
            <div className="visual-detail">
              <strong>{activeBand.label}</strong>
              <p>{activeBand.detail}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {visual.kind === 'cards' || visual.kind === 'balance' ? (
        <div className={`visual-cards ${visual.kind}`}>
          {(visual.buckets ?? []).map((bucket) => (
            <div key={bucket.title} className="visual-bucket">
              <h3>{bucket.title}</h3>
              <ul>
                {bucket.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          {(visual.nodes ?? []).map((node) => (
            <button
              key={node.id}
              type="button"
              className={`visual-node cardish ${activeId === node.id ? 'active' : ''}`}
              onClick={() => setActiveId(node.id)}
            >
              {node.tag ? <span className="visual-tag">{node.tag}</span> : null}
              <strong>{node.label}</strong>
            </button>
          ))}
        </div>
      ) : null}

      {visual.kind !== 'slider' && visual.kind !== 'balance' ? (
        <NodeDetail node={active} hint={t('clickNode')} />
      ) : null}
      {visual.kind === 'balance' && visual.nodes?.length ? (
        <NodeDetail node={active} hint={t('clickNode')} />
      ) : null}
    </section>
  )
}
