/** Official Vantage Markets mark (teal square, white chevron, orange triangle). */
export function VantageMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`vantage-mark ${className}`}>
      <svg
        viewBox="0 0 447 447"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Vantage Markets"
      >
        <title>Vantage Markets</title>
        <rect width="447" height="447" fill="#044855" />
        <path d="M120 128h50l78 144-25 46Z" fill="#ffffff" />
        <path d="M191 127h136L260 251V169Z" fill="#e45729" />
      </svg>
    </span>
  );
}

export function VantageLogo({
  className = "",
  markClassName = "h-8 w-8",
  showWordmark = true,
  inverted = false,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  inverted?: boolean;
}) {
  const ink = inverted ? "#f4f7fb" : "#10233a";
  const accent = inverted ? "#f4a48d" : "#e45729";
  return (
    <div className={`inline-flex items-center gap-2.5 min-w-0 ${className}`}>
      <VantageMark className={markClassName} />
      {showWordmark ? (
        <span className="leading-tight min-w-0">
          <span className="block text-[10px] uppercase tracking-[0.14em]" style={{ color: accent }}>
            Vantage Markets
          </span>
          <span
            className="block font-[family-name:var(--font-display)] text-sm"
            style={{ color: ink }}
          >
            CRMP Plus
          </span>
        </span>
      ) : null}
    </div>
  );
}
