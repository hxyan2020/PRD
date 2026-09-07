import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { enlargeImageUrl, uniqueImages } from "./portraits.js";
import { hdCoverUrl } from "./cover.js";
import { useI18n } from "./I18n.jsx";

export default function PortraitGallery({ name, portrait }) {
  const { t } = useI18n();
  const dialogId = useId();
  const closeRef = useRef(null);
  const [open, setOpen] = useState(null);
  const images = uniqueImages(portrait?.images || [], 9);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("portrait-lightbox-open");
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      document.body.classList.remove("portrait-lightbox-open");
    };
  }, [open]);

  if (!portrait) return null;

  const lightbox =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="portrait-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogId}
            onClick={() => setOpen(null)}
          >
            <button
              ref={closeRef}
              type="button"
              className="portrait-lightbox-close"
              onClick={() => setOpen(null)}
            >
              {t("closePortrait")}
            </button>
            <img
              id={dialogId}
              src={enlargeImageUrl(hdCoverUrl(open.src))}
              alt={open.alt || name}
              onClick={(event) => event.stopPropagation()}
            />
          </div>,
          document.body
        )
      : null;

  return (
    <section className="anecdote-block">
      <h3>{name}</h3>
      {portrait.anecdote ? <p className="anecdote-text">{portrait.anecdote}</p> : null}
      {images.length ? (
        <>
          <p className="anecdote-kicker">{t("portraitsOf", { name })}</p>
          <ul className="portrait-row">
            {images.map((image) => (
              <li key={image.src}>
                <button
                  type="button"
                  className="portrait-open"
                  onClick={() => setOpen(image)}
                  aria-label={t("expandPortrait", { name: image.alt || name })}
                >
                  <img src={hdCoverUrl(image.src)} alt="" loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {lightbox}
    </section>
  );
}
