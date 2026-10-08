/**
 * Renders a national flag as an image when the emoji is a regional-indicator
 * pair (avoids “IN” / “US” letter fallbacks when color emoji fonts are missing).
 * Non-flag emblems (🦅, 🏛️, 🌍, …) stay as emoji.
 */

type Props = {
  /** Flag emoji or emblem from `flagForCountry` / language meta. */
  flag: string;
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

export function FlagIcon({ flag, className, title }: Props) {
  const iso = flagEmojiToIso(flag);
  const cls = className ? `flag-icon ${className}` : "flag-icon";

  if (!iso) {
    return (
      <span className={`${cls} flag-icon-emoji`} aria-hidden="true" title={title}>
        {flag || "🌍"}
      </span>
    );
  }

  return (
    <img
      className={`${cls} flag-icon-img`}
      src={`https://flagcdn.com/w40/${iso}.png`}
      srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
      width={20}
      height={15}
      alt=""
      title={title}
      loading="lazy"
      decoding="async"
      aria-hidden="true"
    />
  );
}
