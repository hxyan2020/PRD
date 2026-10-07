import { Link } from 'react-router-dom'
import { formatTimestamp, useNotebook } from '../hooks/useNotebook'
import { useLanguage } from '../i18n/LanguageContext'

export function Notebook() {
  const { entries, count, removeEntry, clearAll } = useNotebook()
  const { lang, t } = useLanguage()

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
          {entries.map((entry) => (
            <li key={entry.id} className={`notebook-entry ${entry.type}`}>
              <div className="notebook-meta">
                <time dateTime={entry.createdAt}>{formatTimestamp(entry.createdAt, lang)}</time>
                <span className="notebook-type">
                  {entry.type === 'explanation' ? t('aiExplanation') : t('clip')}
                </span>
                {entry.sourceLabel ? (
                  entry.sourcePath ? (
                    <Link to={entry.sourcePath}>{entry.sourceLabel}</Link>
                  ) : (
                    <span>{entry.sourceLabel}</span>
                  )
                ) : null}
                {entry.model ? <span className="notebook-model">{entry.model}</span> : null}
              </div>
              <blockquote className="notebook-quote">{entry.selectedText}</blockquote>
              {entry.explanation ? (
                <div className="notebook-explanation">
                  {entry.explanation.split(/\n\n+/).map((block) => (
                    <p key={block.slice(0, 24)}>{block.replace(/\*\*/g, '')}</p>
                  ))}
                </div>
              ) : null}
              <button type="button" className="btn ghost" onClick={() => removeEntry(entry.id)}>
                {t('delete')}
              </button>
            </li>
          ))}
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
