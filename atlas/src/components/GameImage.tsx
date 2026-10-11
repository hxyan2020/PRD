import type { ReactEventHandler } from "react";
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
  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading={loading}
      onError={onError}
    />
  );
}
