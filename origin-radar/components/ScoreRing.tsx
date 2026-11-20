import { scoreTone } from "@/lib/format";

export function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const tone = scoreTone(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={tone === "hot" ? "#e85d04" : tone === "warm" ? "#e8b86d" : "#8b97a8"}
          strokeWidth="6"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className={`absolute inset-0 grid place-items-center font-serif text-lg score-${tone}`}>
        {Math.round(score)}
      </div>
    </div>
  );
}
