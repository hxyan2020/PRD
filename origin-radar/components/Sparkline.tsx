import { sparklineMonthLabels } from "@/lib/sparkline-months";

const Y_MIN = 0;
const Y_MAX = 100;

export function Sparkline({
  values,
  className = "",
  asOf,
  labeled = false,
}: {
  values: number[];
  className?: string;
  asOf?: string;
  labeled?: boolean;
}) {
  if (values.length < 2) return null;

  if (!labeled) {
    const w = 160;
    const h = 42;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, 1);
    const pts = values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / span) * (h - 4) - 2;
        return `${x},${y}`;
      })
      .join(" ");
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className={`overflow-visible ${className}`} aria-hidden>
        <polyline fill="none" stroke="#e85d04" strokeWidth="2" points={pts} />
      </svg>
    );
  }

  const months = asOf ? sparklineMonthLabels(values.length, asOf) : [];
  const w = 560;
  const h = 220;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 52;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const yAt = (v: number) => padT + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * innerH;
  const xAt = (i: number) => padL + (i / (values.length - 1)) * innerW;
  const pts = values.map((v, i) => `${xAt(i)},${yAt(Math.max(Y_MIN, Math.min(Y_MAX, v)))}`).join(" ");
  const yTicks = [0, 50, 100];
  const xTickIdx = [0, Math.floor((values.length - 1) / 2), values.length - 1];

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="Google search interest index from 0 to 100 over the past 12 months"
      >
        <text
          x={16}
          y={padT + innerH / 2}
          fill="#8b97a8"
          fontSize="11"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
          textAnchor="middle"
          transform={`rotate(-90 16 ${padT + innerH / 2})`}
        >
          Search interest index (0–100)
        </text>
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={padL}
              x2={w - padR}
              y1={yAt(tick)}
              y2={yAt(tick)}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            <text
              x={padL - 8}
              y={yAt(tick) + 4}
              fill="#8b97a8"
              fontSize="11"
              fontFamily="IBM Plex Mono, ui-monospace, monospace"
              textAnchor="end"
            >
              {tick}
            </text>
          </g>
        ))}
        <line x1={padL} x2={padL} y1={padT} y2={padT + innerH} stroke="#8b97a8" strokeWidth="1" />
        <line
          x1={padL}
          x2={w - padR}
          y1={padT + innerH}
          y2={padT + innerH}
          stroke="#8b97a8"
          strokeWidth="1"
        />
        <polyline fill="none" stroke="#e85d04" strokeWidth="2.5" points={pts} />
        {xTickIdx.map((i) => (
          <text
            key={i}
            x={xAt(i)}
            y={padT + innerH + 18}
            fill="#8b97a8"
            fontSize="11"
            fontFamily="IBM Plex Mono, ui-monospace, monospace"
            textAnchor={i === 0 ? "start" : i === values.length - 1 ? "end" : "middle"}
          >
            {months[i] ?? `M${i + 1}`}
          </text>
        ))}
        <text
          x={padL + innerW / 2}
          y={h - 6}
          fill="#8b97a8"
          fontSize="11"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
          textAnchor="middle"
        >
          Month (past 12 months)
        </text>
      </svg>
    </figure>
  );
}
