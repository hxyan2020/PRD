import { useState } from "react";

/**
 * National flag as a self-hosted SVG (preferred) or flagcdn CDN image.
 * Never render regional-indicator emoji — those become “IN” / “US” letters
 * when color-emoji fonts are missing.
 */

type Props = {
  /** ISO 3166-1 alpha-2 (lowercase), e.g. "in". */
  iso?: string | null;
  /** Optional emoji — only used to derive ISO if `iso` is omitted. */
  flag?: string;
  className?: string;
  title?: string;
};

/** Convert 🇮🇳 → "in"; returns null for non-flag emblems. */
export function flagEmojiToIso(flag: string): string | null {
  const chars = [...flag.trim()];
  if (chars.length !== 2) return null;
  const a = chars[0].codePointAt(0);
  const b = chars[1].codePointAt(0);
  if (
    a == null ||
    b == null ||
    a < 0x1f1e6 ||
    a > 0x1f1ff ||
    b < 0x1f1e6 ||
    b > 0x1f1ff
  ) {
    return null;
  }
  return String.fromCharCode(a - 0x1f1e6 + 65, b - 0x1f1e6 + 65).toLowerCase();
}

function localFlagSrc(iso: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}flags/${iso}.svg`;
}

/** Tiny globe mark when no national flag applies (historical / multi-region). */
function GlobeMark({ className, title }: { className: string; title?: string }) {
  return (
    <svg
      className={`${className} flag-icon-globe`}
      viewBox="0 0 20 15"
      width={20}
      height={15}
      aria-hidden="true"
    >
      {title ? <title>{title}</title> : null}
      <rect width="20" height="15" rx="2" fill="#2a3340" />
      <circle cx="10" cy="7.5" r="5" fill="none" stroke="#9eb0c0" strokeWidth="1.2" />
      <ellipse cx="10" cy="7.5" rx="2.2" ry="5" fill="none" stroke="#9eb0c0" strokeWidth="1" />
      <path d="M5 7.5h10M6.2 5h7.6M6.2 10h7.6" stroke="#9eb0c0" strokeWidth="0.9" />
    </svg>
  );
}

export function FlagIcon({ iso, flag, className, title }: Props) {
  const resolved = (iso || (flag ? flagEmojiToIso(flag) : null) || "").toLowerCase();
  const cls = className ? `flag-icon ${className}` : "flag-icon";
  const [srcIndex, setSrcIndex] = useState(0);

  if (!resolved) {
    return <GlobeMark className={cls} title={title} />;
  }

  const sources = [localFlagSrc(resolved), `https://flagcdn.com/${resolved}.svg`];
  const src = sources[Math.min(srcIndex, sources.length - 1)];

  return (
    <img
      className={`${cls} flag-icon-img`}
      src={src}
      width={20}
      height={15}
      alt=""
      title={title}
      loading="lazy"
      decoding="async"
      aria-hidden="true"
      onError={() => {
        if (srcIndex < sources.length - 1) setSrcIndex((i) => i + 1);
      }}
    />
  );
}
