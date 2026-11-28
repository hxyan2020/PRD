"use client";

import type { QualityChart } from "@/lib/quality-research";

function barColor(value: number, band?: string): string {
  if (band === "green" || value >= 85) return "#15803d";
  if (band === "yellow" || value >= 65) return "#c2410c";
  if (band === "red") return "#b91c1c";
  return "#1d4ed8";
}

type Props = {
  chart: QualityChart;
  animate?: boolean;
};

export function QualityBarChart({ chart, animate = true }: Props) {
  const max = Math.max(100, ...chart.series.map((s) => s.value), 1);
  const w = 360;
  const rowH = 28;
  const labelW = 92;
  const h = Math.max(80, chart.series.length * rowH + 16);

  return (
    <div className="rounded-md border border-line bg-white/90 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal">{chart.title}</p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-2 h-auto w-full"
        role="img"
        aria-label={chart.title}
      >
        {chart.series.map((s, i) => {
          const y = 8 + i * rowH;
          const barW = Math.max(2, ((w - labelW - 48) * s.value) / max);
          return (
            <g key={`${s.label}-${i}`}>
              <text x={0} y={y + 14} fontSize="11" fill="#243047">
                {s.label.length > 12 ? `${s.label.slice(0, 11)}…` : s.label}
              </text>
              <rect
                x={labelW}
                y={y}
                width={animate ? barW : barW}
                height={16}
                rx={3}
                fill={barColor(s.value, s.band)}
                opacity={0.9}
              >
                {animate && (
                  <animate
                    attributeName="width"
                    from="0"
                    to={String(barW)}
                    dur="0.55s"
                    fill="freeze"
                  />
                )}
              </rect>
              <text
                x={labelW + barW + 6}
                y={y + 13}
                fontSize="11"
                fontFamily="ui-monospace, monospace"
                fill="#0c1222"
              >
                {s.value}
                {chart.unit ?? ""}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs leading-relaxed text-mist">{chart.analysis}</p>
    </div>
  );
}
