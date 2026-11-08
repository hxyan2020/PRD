import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useLocale } from '../i18n/locale'
import { loadSkills, saveSkills } from '../copilot/storage'
import type { SkillLevel, SkillRecord } from '../copilot/types'

const emptyDraft = (): SkillRecord => ({
  id: '',
  level: 'L1',
  name: '',
  severity: 'P2',
  description: '',
  matchHints: '',
  linkedL1: '',
  check: '',
  action: '',
  opt: '',
  disabled: false,
  custom: true,
  updatedAt: Date.now(),
})

export function SkillsPage() {
  const { t } = useLocale()
  const { isAdmin } = useAuth()
  const [skills, setSkills] = useState<SkillRecord[]>(() => loadSkills())
  const [q, setQ] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | SkillLevel>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState<SkillRecord | null>(null)
  const [creating, setCreating] = useState(false)

  const persist = (next: SkillRecord[]) => {
    if (!isAdmin) return
    setSkills(next)
    saveSkills(next)
  }

  const visible = useMemo(() => {
    const qq = q.toLowerCase()
    return skills.filter((s) => {
      if (!showArchived && s.archivedAt) return false
      if (levelFilter !== 'all' && s.level !== levelFilter) return false
      if (!qq) return true
      return `${s.id} ${s.name} ${s.description} ${s.matchHints} ${s.check}`
        .toLowerCase()
        .includes(qq)
    })
  }, [skills, q, levelFilter, showArchived])

  const startCreate = () => {
    if (!isAdmin) return
    setCreating(true)
    setEditing(emptyDraft())
  }

  const saveEditor = () => {
    if (!isAdmin || !editing) return
    const id = editing.id.trim()
    const name = editing.name.trim()
    if (!id || !name) return
    const record: SkillRecord = {
      ...editing,
      id,
      name,
      description: editing.description.trim() || name,
      matchHints: editing.matchHints.trim() || `${id} ${name}`,
      updatedAt: Date.now(),
    }
    const exists = skills.some((s) => s.id === id)
    const next = exists
      ? skills.map((s) => (s.id === id ? record : s))
      : [record, ...skills]
    persist(next)
    setEditing(null)
    setCreating(false)
  }

  const toggleDisable = (id: string) => {
    if (!isAdmin) return
    persist(
      skills.map((s) =>
        s.id === id ? { ...s, disabled: !s.disabled, updatedAt: Date.now() } : s,
      ),
    )
  }

  const archiveSkill = (id: string) => {
    if (!isAdmin) return
    persist(
      skills.map((s) =>
        s.id === id ? { ...s, archivedAt: Date.now(), disabled: true, updatedAt: Date.now() } : s,
      ),
    )
  }

  const restoreSkill = (id: string) => {
    if (!isAdmin) return
    persist(
      skills.map((s) => {
        if (s.id !== id) return s
        const { archivedAt: _a, ...rest } = s
        return { ...rest, disabled: false, updatedAt: Date.now() }
      }),
    )
  }

  return (
    <div className="panel skills-page">
      <h2>{t('skillsTitle')}</h2>
      <p className="sub">{t('skillsSub')}</p>
      {!isAdmin ? <p className="banner-warn">{t('adminOnlyWrite')}</p> : null}

      <div className="skills-toolbar">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('copilotSkillSearch')}
        />
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as 'all' | SkillLevel)}
        >
          <option value="all">{t('skillsFilterAll')}</option>
          <option value="L1">L1</option>
          <option value="L2">L2</option>
        </select>
        <label className="check-inline">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          {t('skillsShowArchived')}
        </label>
        {isAdmin ? (
          <button type="button" className="archive-btn primary-archive" onClick={startCreate}>
            {t('skillsCreate')}
          </button>
        ) : null}
      </div>

      {editing && isAdmin ? (
        <div className="skill-editor item-block">
          <h3>{creating ? t('skillsCreate') : t('skillsEdit')}</h3>
          <div className="copilot-row">
            <div>
              <label className="field-label">{t('skillsId')}</label>
              <input
                value={editing.id}
                disabled={!creating}
                onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">{t('skillsLevel')}</label>
              <select
                value={editing.level}
                onChange={(e) =>
                  setEditing({ ...editing, level: e.target.value as SkillLevel })
                }
              >
                <option value="L1">L1</option>
                <option value="L2">L2</option>
              </select>
            </div>
            <div>
              <label className="field-label">{t('copilotSeverity')}</label>
              <input
                value={editing.severity}
                onChange={(e) => setEditing({ ...editing, severity: e.target.value })}
              />
            </div>
          </div>
          <label className="field-label">{t('skillsName')}</label>
          <input
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
          />
          <label className="field-label">{t('skillsDescription')}</label>
          <input
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
          />
          <label className="field-label">{t('skillsMatchHints')}</label>
          <input
            value={editing.matchHints}
            onChange={(e) => setEditing({ ...editing, matchHints: e.target.value })}
          />
          {editing.level === 'L2' ? (
            <>
              <label className="field-label">{t('copilotLinked')}</label>
              <input
                value={editing.linkedL1}
                onChange={(e) => setEditing({ ...editing, linkedL1: e.target.value })}
              />
            </>
          ) : null}
          <label className="field-label">{t('copilotCheck')}</label>
          <textarea
            rows={3}
            value={editing.check}
            onChange={(e) => setEditing({ ...editing, check: e.target.value })}
          />
          <label className="field-label">{t('copilotAction')}</label>
          <textarea
            rows={2}
            value={editing.action}
            onChange={(e) => setEditing({ ...editing, action: e.target.value })}
          />
          <label className="field-label">{t('copilotOpt')}</label>
          <textarea
            rows={2}
            value={editing.opt}
            onChange={(e) => setEditing({ ...editing, opt: e.target.value })}
          />
          <div className="copilot-actions">
            <button type="button" className="archive-btn primary-archive" onClick={saveEditor}>
              {t('skillsSave')}
            </button>
            <button
              type="button"
              className="archive-btn"
              onClick={() => {
                setEditing(null)
                setCreating(false)
              }}
            >
              {t('skillsCancel')}
            </button>
          </div>
        </div>
      ) : null}

      <p className="sub">
        {t('skillsCount').replace('{n}', String(visible.length))}
      </p>

      {visible.map((s) => (
        <article key={s.id} className={`item-block skill-card${s.disabled ? ' muted' : ''}`}>
          <header className="skill-card-head">
            <b>
              [{s.level}] {s.id} {s.name}
            </b>
            <span className="pill sev-yellow">{s.severity}</span>
            {s.disabled ? <span className="pill">{t('skillsDisabled')}</span> : null}
            {s.archivedAt ? <span className="pill">{t('skillsArchived')}</span> : null}
            {s.custom ? <span className="pill">{t('skillsCustom')}</span> : null}
          </header>
          <p className="sub">{s.description}</p>
          <p className="sub">
            {t('skillsMatchHints')}: {s.matchHints || '—'}
          </p>
          {s.level === 'L2' ? (
            <p className="sub">
              {t('copilotLinked')}: {s.linkedL1 || '—'}
            </p>
          ) : null}
          <p>
            <b>{t('copilotCheck')}:</b> {s.check}
          </p>
          <p>
            <b>{t('copilotAction')}:</b> {s.action}
          </p>
          <p className="sub">
            <b>{t('copilotOpt')}:</b> {s.opt}
          </p>
          {isAdmin ? (
            <div className="copilot-actions">
              <button
                type="button"
                className="archive-btn"
                onClick={() => {
                  setCreating(false)
                  setEditing({ ...s })
                }}
              >
                {t('skillsEdit')}
              </button>
              <button type="button" className="archive-btn" onClick={() => toggleDisable(s.id)}>
                {s.disabled ? t('skillsEnable') : t('skillsDisable')}
              </button>
              {s.archivedAt ? (
                <button type="button" className="archive-btn" onClick={() => restoreSkill(s.id)}>
                  {t('unarchiveAction')}
                </button>
              ) : (
                <button type="button" className="archive-btn" onClick={() => archiveSkill(s.id)}>
                  {t('archiveAction')}
                </button>
              )}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}
