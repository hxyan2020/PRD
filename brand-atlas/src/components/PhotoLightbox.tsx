import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/I18nProvider";

interface Props {
  src: string;
  alt?: string;
  onClose: () => void;
}

/** Full-viewport lightbox for an uploaded / sighting photo. */
export function PhotoLightbox({ src, alt = "", onClose }: Props) {
  const { t } = useI18n();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="photo-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={t("photo.expanded")}
      onClick={onClose}
    >
      <button
        type="button"
        className="photo-lightbox__close"
        aria-label={t("common.close")}
        onClick={onClose}
      >
        ×
      </button>
      <img
        className="photo-lightbox__img"
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
