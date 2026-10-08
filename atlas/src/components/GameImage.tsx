import { useState, type ReactEventHandler } from "react";
import {
  isLudusCardSrc,
  ludusCardDataUri,
  resolveImageSrc,
} from "../lib/gameCardImage";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  loading?: "lazy" | "eager";
  onError?: ReactEventHandler<HTMLImageElement>;
  /** When set, title cards redraw with the live (possibly localized) name. */
  label?: { name: string; category: string; originCountry: string };
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
  const resolved =
    label && isLudusCardSrc(src)
      ? ludusCardDataUri(label.name, label.category, label.originCountry)
      : resolveImageSrc(src);

  const [failedFor, setFailedFor] = useState<string | null>(null);
  const failed = failedFor === src;

  const fallback =
    label && !isLudusCardSrc(src)
      ? ludusCardDataUri(label.name, label.category, label.originCountry)
      : null;

  const displaySrc = failed && fallback ? fallback : resolved;

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={(e) => {
        if (!failed && fallback) {
          setFailedFor(src);
        }
        onError?.(e);
      }}
    />
  );
}
