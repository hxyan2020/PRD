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

function severityClass(sev: string) {
  const s = sev.toUpperCase()
  if (s.startsWith('P0')) return 'sev-p0'
  if (s.startsWith('P1')) return 'sev-p1'
  if (s.startsWith('P2')) return 'sev-p2'
  return 'sev-p3'
}

export function SkillsPage() {
  const { t } = useLocale()
  const { user } = useAuth()
  const canWrite = Boolean(user)
  const [skills, setSkills] = useState<SkillRecord[]>(() => loadSkills())
  const [q, setQ] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | SkillLevel>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState<SkillRecord | null>(null)
  const [creating, setCreating] = useState(false)

  const persist = (next: SkillRecord[]) => {
    if (!canWrite) return
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
    if (!canWrite) return
    setCreating(true)
    setEditing(emptyDraft())
  }

  const saveEditor = () => {
    if (!canWrite || !editing) return
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
    if (!canWrite) return
    persist(
      skills.map((s) =>
        s.id === id ? { ...s, disabled: !s.disabled, updatedAt: Date.now() } : s,
      ),
    )
  }

  const archiveSkill = (id: string) => {
    if (!canWrite) return
    persist(
      skills.map((s) =>
        s.id === id ? { ...s, archivedAt: Date.now(), disabled: true, updatedAt: Date.now() } : s,
      ),
    )
  }

  const restoreSkill = (id: string) => {
    if (!canWrite) return
    persist(
      skills.map((s) => {
        if (s.id !== id) return s
        const { archivedAt: _a, ...rest } = s
        return { ...rest, disabled: false, updatedAt: Date.now() }
      }),
    )
  }

  const isEditing = (id: string) => editing && !creating && editing.id === id

  return (
    <div className="panel skills-page">
      <h2>{t('skillsTitle')}</h2>
      <p className="sub">{t('skillsSub')}</p>

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
        {canWrite ? (
          <button type="button" className="archive-btn primary-archive" onClick={startCreate}>
            {t('skillsCreate')}
          </button>
        ) : null}
      </div>

      {creating && editing && canWrite ? (
        <article className="std-card std-card-edit">
          <header className="std-card-head">
            <div className="std-card-title-block">
              <span className="std-badge">{t('skillsCreate')}</span>
              <h3>{t('skillsCreate')}</h3>
            </div>
          </header>
          <SkillEditorFields editing={editing} setEditing={setEditing} creating />
          <div className="std-card-actions">
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
        </article>
      ) : null}

      <p className="sub">{t('skillsCount').replace('{n}', String(visible.length))}</p>

      {visible.map((s) =>
        isEditing(s.id) && editing ? (
          <article key={s.id} className="std-card std-card-edit">
            <header className="std-card-head">
              <div className="std-card-title-block">
                <span className="std-badge">{s.level}</span>
                <h3>
                  {s.id} · {t('skillsEdit')}
                </h3>
              </div>
              <span className={`std-sev ${severityClass(editing.severity)}`}>{editing.severity}</span>
            </header>
            <SkillEditorFields editing={editing} setEditing={setEditing} creating={false} />
            <div className="std-card-actions">
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
          </article>
        ) : (
          <article
            key={s.id}
            className={`std-card${s.disabled ? ' muted' : ''}${s.archivedAt ? ' archived' : ''}`}
          >
            <header className="std-card-head">
              <div className="std-card-title-block">
                <div className="std-card-badges">
                  <span className="std-badge">{s.level}</span>
                  {s.custom ? <span className="std-badge soft">{t('skillsCustom')}</span> : null}
                  {s.disabled ? <span className="std-badge soft">{t('skillsDisabled')}</span> : null}
                  {s.archivedAt ? (
                    <span className="std-badge soft">{t('skillsArchived')}</span>
                  ) : null}
                </div>
                <h3>
                  <span className="std-id">{s.id}</span> {s.name}
                </h3>
                <p className="std-desc">{s.description}</p>
              </div>
              <span className={`std-sev ${severityClass(s.severity)}`}>{s.severity}</span>
            </header>

            <section className="std-section">
              <h4>{t('skillsMatchHints')}</h4>
              <p>{s.matchHints || '—'}</p>
            </section>
            {s.level === 'L2' ? (
              <section className="std-section">
                <h4>{t('copilotLinked')}</h4>
                <p>{s.linkedL1 || '—'}</p>
              </section>
            ) : null}
            <section className="std-section">
              <h4>{t('copilotCheck')}</h4>
              <p>{s.check || '—'}</p>
            </section>
            <section className="std-section">
              <h4>{t('copilotAction')}</h4>
              <p>{s.action || '—'}</p>
            </section>
            <section className="std-section">
              <h4>{t('copilotOpt')}</h4>
              <p>{s.opt || '—'}</p>
            </section>

            {canWrite ? (
              <div className="std-card-actions">
                <button
                  type="button"
                  className="archive-btn primary-archive"
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
        ),
      )}
    </div>
  )
}

function SkillEditorFields({
  editing,
  setEditing,
  creating,
}: {
  editing: SkillRecord
  setEditing: (s: SkillRecord) => void
  creating: boolean
}) {
  const { t } = useLocale()
  return (
    <div className="std-editor-grid">
      <label className="std-field">
        <span>{t('skillsId')}</span>
        <input
          value={editing.id}
          disabled={!creating}
          onChange={(e) => setEditing({ ...editing, id: e.target.value })}
        />
      </label>
      <label className="std-field">
        <span>{t('skillsLevel')}</span>
        <select
          value={editing.level}
          onChange={(e) => setEditing({ ...editing, level: e.target.value as SkillLevel })}
        >
          <option value="L1">L1</option>
          <option value="L2">L2</option>
        </select>
      </label>
      <label className="std-field">
        <span>{t('copilotSeverity')}</span>
        <input
          value={editing.severity}
          onChange={(e) => setEditing({ ...editing, severity: e.target.value })}
        />
      </label>
      <label className="std-field full">
        <span>{t('skillsName')}</span>
        <input
          value={editing.name}
          onChange={(e) => setEditing({ ...editing, name: e.target.value })}
        />
      </label>
      <label className="std-field full">
        <span>{t('skillsDescription')}</span>
        <input
          value={editing.description}
          onChange={(e) => setEditing({ ...editing, description: e.target.value })}
        />
      </label>
      <label className="std-field full">
        <span>{t('skillsMatchHints')}</span>
        <textarea
          rows={2}
          value={editing.matchHints}
          onChange={(e) => setEditing({ ...editing, matchHints: e.target.value })}
        />
      </label>
      {editing.level === 'L2' ? (
        <label className="std-field full">
          <span>{t('copilotLinked')}</span>
          <input
            value={editing.linkedL1}
            onChange={(e) => setEditing({ ...editing, linkedL1: e.target.value })}
          />
        </label>
      ) : null}
      <label className="std-field full">
        <span>{t('copilotCheck')}</span>
        <textarea
          rows={3}
          value={editing.check}
          onChange={(e) => setEditing({ ...editing, check: e.target.value })}
        />
      </label>
      <label className="std-field full">
        <span>{t('copilotAction')}</span>
        <textarea
          rows={2}
          value={editing.action}
          onChange={(e) => setEditing({ ...editing, action: e.target.value })}
        />
      </label>
      <label className="std-field full">
        <span>{t('copilotOpt')}</span>
        <textarea
          rows={2}
          value={editing.opt}
          onChange={(e) => setEditing({ ...editing, opt: e.target.value })}
        />
      </label>
    </div>
  )
}
