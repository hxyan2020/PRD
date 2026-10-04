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
  const teal = inverted ? "#5eead4" : "#0b6e6a";
  const accent = inverted ? "#fb923c" : "#c45c26";
  return (
    <div className={`inline-flex items-center gap-2 min-w-0 ${className}`}>
      <svg
        className={markClassName}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="46" height="46" rx="12" fill={inverted ? "#0f2438" : "#10233a"} />
        <path d="M10 16h8.2L24 34l5.8-18H38L24 42 10 16Z" fill={teal} />
        <path d="M16.5 8h15L24 22 16.5 8Z" fill={accent} />
      </svg>
      {showWordmark ? (
        <span className="leading-tight">
          <span
            className="block text-[10px] uppercase tracking-[0.14em]"
            style={{ color: inverted ? "#99f6e4" : "#0b6e6a" }}
          >
            Vantage Markets
          </span>
          <span
            className="block font-[family-name:var(--font-display)] text-sm"
            style={{ color: ink }}
          >
            CRMP Admin
          </span>
        </span>
      ) : null}
    </div>
  );
}
