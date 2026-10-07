import './LoadingState.css'

export function LoadingState({ label = 'Opening the collection…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <div className="loading-bar" />
      <p>{label}</p>
    </div>
  )
}
