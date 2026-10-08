import { useState, type ReactEventHandler } from "react";
import {
  isLudusSyntheticSrc,
  ludusCardDataUri,
  stableImageSrc,
  type ImageLabel,
} from "../lib/gameCardImage";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  loading?: "lazy" | "eager";
  onError?: ReactEventHandler<HTMLImageElement>;
  /** When set, title cards / views redraw with live (possibly localized) text. */
  label?: ImageLabel;
};

/** <img> wrapper that resolves Ludus title-card refs to correctly named SVGs. */
export function GameImage({
  src,
  alt = "",
  className,
  loading,
  onError,
  label,
}: Props) {
  const resolved = stableImageSrc(src, label);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const failed = failedFor === src;

  const fallback = label
    ? ludusCardDataUri(label.name, label.category, label.originCountry, {
        categoryKey: label.categoryKey,
        cardFooter: label.cardFooter,
      })
    : null;

  // Already on a title card / data URI — no second network hop to fail.
  const displaySrc =
    failed && fallback && displayNeedsFallback(resolved)
      ? fallback
      : resolved;

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={(e) => {
        if (!failed && fallback && displayNeedsFallback(resolved)) {
          setFailedFor(src);
        }
        onError?.(e);
      }}
    />
  );
}

function displayNeedsFallback(resolved: string): boolean {
  return !resolved.startsWith("data:") && !isLudusSyntheticSrc(resolved);
}
