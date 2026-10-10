import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RichTextEditor } from '../components/RichTextEditor'
import { formatTimestamp, useNotebook, type NotebookEntry } from '../hooks/useNotebook'
import { useLanguage } from '../i18n/LanguageContext'
import { isBlankHtml, sanitizeHtml } from '../lib/sanitizeHtml'

function typeLabel(
  type: NotebookEntry['type'],
  t: (key: 'aiExplanation' | 'clip' | 'freeNote') => string,
) {
  if (type === 'explanation') return t('aiExplanation')
  if (type === 'note') return t('freeNote')
  return t('clip')
}

function NoteBody({ html, className }: { html: string; className?: string }) {
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(html)
  if (!looksLikeHtml) {
    return <blockquote className={className}>{html}</blockquote>
  }
  return (
    <blockquote
      className={`${className ?? ''} notebook-rich`.trim()}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  )
}

export function Notebook() {
  const { entries, count, addNote, updateEntry, removeEntry, clearAll } = useNotebook()
  const { lang, t } = useLanguage()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftText, setDraftText] = useState('')
  const [draftExplanation, setDraftExplanation] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newNote, setNewNote] = useState('')
  const [composerOpen, setComposerOpen] = useState(true)

  function startEdit(entry: NotebookEntry) {
    setEditingId(entry.id)
    setDraftTitle(entry.title ?? '')
    setDraftText(entry.selectedText)
    setDraftExplanation(entry.explanation ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setDraftTitle('')
    setDraftText('')
    setDraftExplanation('')
  }

  function saveEdit(entry: NotebookEntry) {
    const selectedText =
      entry.type === 'note' ? sanitizeHtml(draftText).trim() : draftText.trim()
    if (entry.type === 'note' ? isBlankHtml(selectedText) : !selectedText) return
    const patch =
      entry.type === 'explanation'
        ? { title: draftTitle, selectedText, explanation: draftExplanation }
        : { title: draftTitle, selectedText }
    const updated = updateEntry(entry.id, patch)
    if (updated) cancelEdit()
  }

  function createNote() {
    const html = sanitizeHtml(newNote).trim()
    if (isBlankHtml(html)) return
    const created = addNote({ text: html, title: newTitle })
    if (!created) return
    setNewTitle('')
    setNewNote('')
    setComposerOpen(true)
  }

  const canCreate = !isBlankHtml(newNote)

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
            <label className="notebook-field">
              <span className="notebook-field-label">{t('noteTitleLabel')}</span>
              <input
                className="notebook-title-input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('noteTitlePlaceholder')}
                maxLength={120}
                autoFocus={entries.length === 0}
              />
            </label>
            <div className="notebook-field">
              <span className="notebook-field-label">{t('noteBodyLabel')}</span>
              <RichTextEditor
                value={newNote}
                onChange={setNewNote}
                placeholder={t('newNotePlaceholder')}
                ariaLabel={t('noteBodyLabel')}
              />
            </div>
            <div className="notebook-actions">
              <button
                type="button"
                className="btn primary"
                disabled={!canCreate}
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
                    setNewTitle('')
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
            const editBlank =
              entry.type === 'note' ? isBlankHtml(draftText) : !draftText.trim()
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
                    <label className="notebook-field">
                      <span className="notebook-field-label">{t('noteTitleLabel')}</span>
                      <input
                        className="notebook-title-input"
                        type="text"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        placeholder={t('noteTitlePlaceholder')}
                        maxLength={120}
                        autoFocus
                      />
                    </label>
                    {entry.type === 'note' ? (
                      <div className="notebook-field">
                        <span className="notebook-field-label">{t('noteBodyLabel')}</span>
                        <RichTextEditor
                          value={draftText}
                          onChange={setDraftText}
                          placeholder={t('newNotePlaceholder')}
                          minHeight="10rem"
                          ariaLabel={t('noteBodyLabel')}
                        />
                      </div>
                    ) : (
                      <label>
                        {t('selectedTextLabel')}
                        <textarea
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          rows={3}
                        />
                      </label>
                    )}
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
                        disabled={editBlank}
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
                    {entry.title ? <h3 className="notebook-entry-title">{entry.title}</h3> : null}
                    <NoteBody html={entry.selectedText} className="notebook-quote" />
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
