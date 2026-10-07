import { Link } from 'react-router-dom'
import { formatTimestamp, useNotebook } from '../hooks/useNotebook'

export function Notebook() {
  const { entries, count, removeEntry, clearAll } = useNotebook()

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Your capture stream</p>
        <h1>Notebook</h1>
        <p className="section-lede">
          Select text anywhere in OWNLAB → <strong>Add to notebook</strong> or{' '}
          <strong>Explain with AI</strong>, then save the reply here. Newest notes first, each with
          a timestamp.
        </p>
        <p className="notebook-count">{count} note{count === 1 ? '' : 's'}</p>
      </header>

      {entries.length === 0 ? (
        <div className="callout">
          <h2>Empty for now</h2>
          <p>
            Open a <Link to="/day/1">day lesson</Link>, highlight a sentence, and use the floating
            toolbar.
          </p>
        </div>
      ) : (
        <ol className="notebook-timeline">
          {entries.map((entry) => (
            <li key={entry.id} className={`notebook-entry ${entry.type}`}>
              <div className="notebook-meta">
                <time dateTime={entry.createdAt}>{formatTimestamp(entry.createdAt)}</time>
                <span className="notebook-type">
                  {entry.type === 'explanation' ? 'AI explanation' : 'Clip'}
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
                Delete
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
              if (window.confirm('Clear the entire notebook?')) clearAll()
            }}
          >
            Clear notebook
          </button>
        </div>
      ) : null}
    </div>
  )
}
