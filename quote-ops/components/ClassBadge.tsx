import type { Frequency, RiskClass, Severity } from "@/lib/types";

const CLASS_STYLE: Record<RiskClass, string> = {
  H: "bg-emerald-50 text-ok border-emerald-200",
  T: "bg-amber-50 text-copper border-amber-200",
  A: "bg-orange-50 text-orange-800 border-orange-200",
  M: "bg-red-50 text-danger border-red-200",
};

export function ClassBadge({ c }: { c: RiskClass }) {
  return (
    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[11px] font-medium ${CLASS_STYLE[c]}`}>
      {c}
    </span>
  );
}

export function SeverityBadge({ s }: { s: Severity }) {
  const hot = s === "P0" || s === "P1";
  return (
    <span
      className={`inline-flex rounded border px-1.5 py-0.5 font-mono text-[11px] ${
        hot ? "border-danger/40 bg-red-50 text-danger" : "border-line bg-white text-mist"
      }`}
    >
      {s}
    </span>
  );
}

export function FreqBadge({ f }: { f: Frequency }) {
  return (
    <span className="inline-flex rounded border border-line bg-white px-1.5 py-0.5 font-mono text-[11px] text-mist">
      {f}
    </span>
  );
}
