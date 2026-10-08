import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatTimestamp, useNotebook, type NotebookEntry } from '../hooks/useNotebook'
import { useLanguage } from '../i18n/LanguageContext'

function typeLabel(
  type: NotebookEntry['type'],
  t: (key: 'aiExplanation' | 'clip' | 'freeNote') => string,
) {
  if (type === 'explanation') return t('aiExplanation')
  if (type === 'note') return t('freeNote')
  return t('clip')
}

export function Notebook() {
  const { entries, count, addNote, updateEntry, removeEntry, clearAll } = useNotebook()
  const { lang, t } = useLanguage()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')
  const [draftExplanation, setDraftExplanation] = useState('')
  const [newNote, setNewNote] = useState('')
  const [composerOpen, setComposerOpen] = useState(true)

  function startEdit(entry: NotebookEntry) {
    setEditingId(entry.id)
    setDraftText(entry.selectedText)
    setDraftExplanation(entry.explanation ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setDraftText('')
    setDraftExplanation('')
  }

  function saveEdit(entry: NotebookEntry) {
    const selectedText = draftText.trim()
    if (!selectedText) return
    const patch =
      entry.type === 'explanation'
        ? { selectedText, explanation: draftExplanation }
        : { selectedText }
    const updated = updateEntry(entry.id, patch)
    if (updated) cancelEdit()
  }

  function createNote() {
    const created = addNote({ text: newNote })
    if (!created) return
    setNewNote('')
    setComposerOpen(true)
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{t('notebookEyebrow')}</p>
        <h1>{t('notebookTitle')}</h1>
        <p className="section-lede">{t('notebookLede')}</p>
        <p className="notebook-count">
          {count} {count === 1 ? t('note') : t('notes')}
        </p>
      </header>

      <section className="notebook-composer" aria-label={t('newNote')}>
        <div className="notebook-composer-head">
          <h2>{t('newNote')}</h2>
          {!composerOpen ? (
            <button type="button" className="btn primary" onClick={() => setComposerOpen(true)}>
              {t('newNote')}
            </button>
          ) : null}
        </div>
        {composerOpen ? (
          <div className="notebook-edit-form">
            <label>
              {t('noteBodyLabel')}
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
                placeholder={t('newNotePlaceholder')}
                autoFocus={entries.length === 0}
              />
            </label>
            <div className="notebook-actions">
              <button
                type="button"
                className="btn primary"
                disabled={!newNote.trim()}
                onClick={createNote}
              >
                {t('createNote')}
              </button>
              {entries.length > 0 ? (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setComposerOpen(false)
                    setNewNote('')
                  }}
                >
                  {t('cancelEdit')}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      {entries.length === 0 ? (
        <div className="callout">
          <h2>{t('emptyNotebook')}</h2>
          <p>
            {t('emptyNotebookBody')}{' '}
            <Link to="/day/1">
              {t('day')}1
            </Link>
          </p>
        </div>
      ) : (
        <ol className="notebook-timeline">
          {entries.map((entry) => {
            const editing = editingId === entry.id
            return (
              <li key={entry.id} className={`notebook-entry ${entry.type}${editing ? ' editing' : ''}`}>
                <div className="notebook-meta">
                  <time dateTime={entry.createdAt}>{formatTimestamp(entry.createdAt, lang)}</time>
                  {entry.updatedAt ? (
                    <span className="notebook-edited" title={formatTimestamp(entry.updatedAt, lang)}>
                      {t('edited')}
                    </span>
                  ) : null}
                  <span className="notebook-type">{typeLabel(entry.type, t)}</span>
                  {entry.sourceLabel && entry.type !== 'note' ? (
                    entry.sourcePath ? (
                      <Link to={entry.sourcePath}>{entry.sourceLabel}</Link>
                    ) : (
                      <span>{entry.sourceLabel}</span>
                    )
                  ) : null}
                  {entry.model ? <span className="notebook-model">{entry.model}</span> : null}
                </div>

                {editing ? (
                  <div className="notebook-edit-form">
                    <label>
                      {entry.type === 'note' ? t('noteBodyLabel') : t('selectedTextLabel')}
                      <textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        rows={entry.type === 'note' ? 6 : 3}
                        autoFocus
                      />
                    </label>
                    {entry.type === 'explanation' ? (
                      <label>
                        {t('explanationLabel')}
                        <textarea
                          value={draftExplanation}
                          onChange={(e) => setDraftExplanation(e.target.value)}
                          rows={8}
                        />
                      </label>
                    ) : null}
                    <div className="notebook-actions">
                      <button
                        type="button"
                        className="btn primary"
                        disabled={!draftText.trim()}
                        onClick={() => saveEdit(entry)}
                      >
                        {t('saveEdits')}
                      </button>
                      <button type="button" className="btn ghost" onClick={cancelEdit}>
                        {t('cancelEdit')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <blockquote className="notebook-quote">{entry.selectedText}</blockquote>
                    {entry.explanation ? (
                      <div className="notebook-explanation">
                        {entry.explanation.split(/\n\n+/).map((block, index) => (
                          <p key={`${entry.id}-b-${index}`}>{block.replace(/\*\*/g, '')}</p>
                        ))}
                      </div>
                    ) : null}
                    <div className="notebook-actions">
                      <button type="button" className="btn ghost" onClick={() => startEdit(entry)}>
                        {t('edit')}
                      </button>
                      <button type="button" className="btn ghost" onClick={() => removeEntry(entry.id)}>
                        {t('delete')}
                      </button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {entries.length > 0 ? (
        <div className="danger-zone">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              if (window.confirm(t('clearNotebookConfirm'))) clearAll()
            }}
          >
            {t('clearNotebook')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
