interface Props {
  percent: number
  completed: number
  total: number
}

export function ProgressBar({ percent, completed, total }: Props) {
  return (
    <div className="progress-block" aria-label={`Progress ${percent}%`}>
      <div className="progress-meta">
        <span>
          {completed} / {total} days
        </span>
        <strong>{percent}%</strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
