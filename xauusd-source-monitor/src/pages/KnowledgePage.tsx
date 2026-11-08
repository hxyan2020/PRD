import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useLocale } from '../i18n/locale'
import { loadKnowledgeTree, saveKnowledgeTree } from '../copilot/storage'
import type { KbNode } from '../copilot/types'

function childrenOf(nodes: KbNode[], parentId: string | null) {
  return nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}

function TreeNodeView({
  node,
  nodes,
  depth,
  selectedId,
  expanded,
  onToggle,
  onSelect,
}: {
  node: KbNode
  nodes: KbNode[]
  depth: number
  selectedId: string | null
  expanded: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}) {
  const kids = childrenOf(nodes, node.id)
  const open = expanded.has(node.id)
  return (
    <div className="kb-tree-node" style={{ marginLeft: depth * 14 }}>
      <div className={`kb-tree-row${selectedId === node.id ? ' selected' : ''}`}>
        {kids.length ? (
          <button type="button" className="kb-twist" onClick={() => onToggle(node.id)}>
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="kb-twist spacer">·</span>
        )}
        <button type="button" className="kb-tree-label" onClick={() => onSelect(node.id)}>
          {node.title}
        </button>
      </div>
      {open
        ? kids.map((c) => (
            <TreeNodeView
              key={c.id}
              node={c}
              nodes={nodes}
              depth={depth + 1}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  )
}

export function KnowledgePage() {
  const { t } = useLocale()
  const { isAdmin } = useAuth()
  const [nodes, setNodes] = useState<KbNode[]>(() => loadKnowledgeTree())
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const tree = loadKnowledgeTree()
    return tree.find((n) => n.parentId === null)?.id ?? tree[0]?.id ?? null
  })
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const roots = loadKnowledgeTree().filter((n) => n.parentId === null).map((n) => n.id)
    return new Set(roots)
  })

  const persist = (next: KbNode[]) => {
    if (!isAdmin) return
    setNodes(next)
    saveKnowledgeTree(next)
  }

  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) || null,
    [nodes, selectedId],
  )

  const roots = childrenOf(nodes, null)

  const updateSelected = (patch: Partial<KbNode>) => {
    if (!selected) return
    persist(
      nodes.map((n) =>
        n.id === selected.id ? { ...n, ...patch, updatedAt: Date.now() } : n,
      ),
    )
  }

  const addChild = () => {
    if (!selected) return
    const siblings = childrenOf(nodes, selected.id)
    const id = `kb_${Date.now()}`
    const node: KbNode = {
      id,
      parentId: selected.id,
      title: t('kbNewNode'),
      body: '',
      order: (siblings[siblings.length - 1]?.order ?? 0) + 1,
      updatedAt: Date.now(),
    }
    persist([...nodes, node])
    setExpanded((prev) => new Set(prev).add(selected.id))
    setSelectedId(id)
  }

  const addSibling = () => {
    if (!selected) return
    const parentId = selected.parentId
    const siblings = childrenOf(nodes, parentId)
    const id = `kb_${Date.now()}`
    const node: KbNode = {
      id,
      parentId,
      title: t('kbNewNode'),
      body: '',
      order: (siblings[siblings.length - 1]?.order ?? 0) + 1,
      updatedAt: Date.now(),
    }
    persist([...nodes, node])
    setSelectedId(id)
  }

  const deleteNode = () => {
    if (!selected || selected.parentId === null) return
    if (!confirm(t('copilotKbDeleteConfirm'))) return
    const doomed = new Set<string>()
    const walk = (id: string) => {
      doomed.add(id)
      childrenOf(nodes, id).forEach((c) => walk(c.id))
    }
    walk(selected.id)
    const next = nodes.filter((n) => !doomed.has(n.id))
    persist(next)
    setSelectedId(selected.parentId)
  }

  const move = (dir: -1 | 1) => {
    if (!selected) return
    const siblings = childrenOf(nodes, selected.parentId)
    const idx = siblings.findIndex((s) => s.id === selected.id)
    const swap = siblings[idx + dir]
    if (!swap) return
    persist(
      nodes.map((n) => {
        if (n.id === selected.id) return { ...n, order: swap.order, updatedAt: Date.now() }
        if (n.id === swap.id) return { ...n, order: selected.order, updatedAt: Date.now() }
        return n
      }),
    )
  }

  const moveUnder = (newParentId: string) => {
    if (!selected || selected.parentId === null) return
    if (newParentId === selected.id) return
    // Prevent cycles
    const descendants = new Set<string>()
    const walk = (id: string) => {
      descendants.add(id)
      childrenOf(nodes, id).forEach((c) => walk(c.id))
    }
    walk(selected.id)
    if (descendants.has(newParentId)) return
    const siblings = childrenOf(nodes, newParentId)
    persist(
      nodes.map((n) =>
        n.id === selected.id
          ? {
              ...n,
              parentId: newParentId,
              order: (siblings[siblings.length - 1]?.order ?? 0) + 1,
              updatedAt: Date.now(),
            }
          : n,
      ),
    )
    setExpanded((prev) => new Set(prev).add(newParentId))
  }

  const parentOptions = nodes.filter((n) => n.id !== selected?.id)

  return (
    <div className="panel knowledge-page">
      <h2>{t('kbTitle')}</h2>
      <p className="sub">{t('kbSub')}</p>
      {!isAdmin ? <p className="banner-warn">{t('adminOnlyWrite')}</p> : null}

      <div className="kb-layout">
        <aside className="kb-tree-pane">
          <h3>{t('kbTree')}</h3>
          {roots.map((r) => (
            <TreeNodeView
              key={r.id}
              node={r}
              nodes={nodes}
              depth={0}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={(id) =>
                setExpanded((prev) => {
                  const next = new Set(prev)
                  if (next.has(id)) next.delete(id)
                  else next.add(id)
                  return next
                })
              }
              onSelect={setSelectedId}
            />
          ))}
        </aside>

        <section className="kb-editor-pane">
          {selected ? (
            <>
              <h3>{t('kbEditor')}</h3>
              <label className="field-label">{t('copilotKbItemTitle')}</label>
              <input
                value={selected.title}
                disabled={!isAdmin}
                onChange={(e) => updateSelected({ title: e.target.value })}
              />
              <label className="field-label">{t('copilotKbBody')}</label>
              <textarea
                rows={12}
                value={selected.body}
                disabled={!isAdmin}
                onChange={(e) => updateSelected({ body: e.target.value })}
              />
              {isAdmin && selected.parentId !== null ? (
                <>
                  <label className="field-label">{t('kbMoveUnder')}</label>
                  <select
                    value={selected.parentId}
                    onChange={(e) => moveUnder(e.target.value)}
                  >
                    {parentOptions.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
              {isAdmin ? (
                <div className="copilot-actions">
                  <button type="button" className="archive-btn primary-archive" onClick={addChild}>
                    {t('kbAddChild')}
                  </button>
                  {selected.parentId !== null ? (
                    <>
                      <button type="button" className="archive-btn" onClick={addSibling}>
                        {t('kbAddSibling')}
                      </button>
                      <button type="button" className="archive-btn" onClick={() => move(-1)}>
                        {t('kbMoveUp')}
                      </button>
                      <button type="button" className="archive-btn" onClick={() => move(1)}>
                        {t('kbMoveDown')}
                      </button>
                      <button type="button" className="archive-btn" onClick={deleteNode}>
                        {t('copilotKbDelete')}
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
              <p className="sub">
                id={selected.id} · {t('archivedAtLabel')}:{' '}
                {selected.updatedAt
                  ? new Date(selected.updatedAt).toLocaleString('en-SG', {
                      timeZone: 'Asia/Singapore',
                    })
                  : '—'}
              </p>
            </>
          ) : (
            <p className="sub">{t('kbSelectNode')}</p>
          )}
        </section>
      </div>
    </div>
  )
}
