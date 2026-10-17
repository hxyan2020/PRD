import { useEffect, useId } from "react";
import { GameImage } from "./GameImage";
import type { ImageLabel } from "../lib/gameCardImage";

type Props = {
  images: string[];
  index: number;
  alt: string;
  label?: ImageLabel;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  closeLabel?: string;
  prevLabel?: string;
  nextLabel?: string;
};

/** Full-viewport photo viewer for product galleries. */
export function ImageLightbox({
  images,
  index,
  alt,
  label,
  onClose,
  onIndexChange,
  closeLabel = "Close",
  prevLabel = "Previous image",
  nextLabel = "Next image",
}: Props) {
  const titleId = useId();
  const src = images[Math.min(Math.max(index, 0), Math.max(images.length - 1, 0))];
  const multi = images.length > 1;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!multi) return;
      if (e.key === "ArrowLeft") {
        onIndexChange((index - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowRight") {
        onIndexChange((index + 1) % images.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [images.length, index, multi, onClose, onIndexChange]);

  if (!src) return null;

  return (
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <p id={titleId} className="sr-only">
        {alt}
      </p>
      <button
        type="button"
        className="image-lightbox-close"
        onClick={onClose}
        aria-label={closeLabel}
      >
        ×
      </button>
      {multi ? (
        <button
          type="button"
          className="image-lightbox-nav prev"
          onClick={() =>
            onIndexChange((index - 1 + images.length) % images.length)
          }
          aria-label={prevLabel}
        >
          ‹
        </button>
      ) : null}
      <GameImage
        className="image-lightbox-shot"
        src={src}
        alt={alt}
        label={label}
      />
      {multi ? (
        <button
          type="button"
          className="image-lightbox-nav next"
          onClick={() => onIndexChange((index + 1) % images.length)}
          aria-label={nextLabel}
        >
          ›
        </button>
      ) : null}
    </div>
  );
}
