import { SectorIcon } from "@/components/SectorIcon";

type Props = {
  /** Primary sector, or comma-separated sectors when an idea spans more than one. */
  sector: string;
  /** Optional localized display labels aligned 1:1 with `sector` parts. */
  label?: string;
  className?: string;
  iconClassName?: string;
  /** Show a compact “Sector” caption before the value. */
  showCaption?: boolean;
  caption?: string;
};

function splitSectors(value: string): string[] {
  return value
    .split(/\s*,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Sector name(s) with matching glyph — used on ledger rows and dossiers. */
export function SectorLabel({
  sector,
  label,
  className = "",
  iconClassName = "text-celadon",
  showCaption = false,
  caption = "Sector",
}: Props) {
  const raw = splitSectors(sector);
  const labels = label ? splitSectors(label) : raw;
  const parts = raw.map((s, i) => ({ key: s, text: labels[i] ?? s }));

  if (parts.length === 0) return null;

  return (
    <span className={`inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      {showCaption ? (
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-mist/80">
          {caption}
        </span>
      ) : null}
      {parts.map((p) => (
        <span
          key={p.key}
          className="inline-flex min-w-0 max-w-full items-center gap-1.5"
          title={p.text}
        >
          <SectorIcon sector={p.key} className={`shrink-0 ${iconClassName}`} title={p.text} />
          <span className="truncate">{p.text}</span>
        </span>
      ))}
    </span>
  );
}
