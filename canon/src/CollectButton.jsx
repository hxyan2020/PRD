export default function CollectButton({ id, collectedIds, onToggle }) {
  const on = collectedIds.includes(id);
  return (
    <button
      type="button"
      className={on ? "is-collected" : ""}
      aria-pressed={on}
      onClick={() => onToggle(id)}
    >
      {on ? "Collected" : "Collect"}
    </button>
  );
}
