import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { enlargeImageUrl, uniqueImages } from "./portraits.js";
import { hdCoverUrl } from "./cover.js";
import { useI18n } from "./I18n.jsx";

export default function PortraitGallery({ name, portrait }) {
  const { t } = useI18n();
  const dialogId = useId();
  const closeRef = useRef(null);
  const scrollerRef = useRef(null);
  const ignoreScroll = useRef(false);
  const [openIndex, setOpenIndex] = useState(-1);
  const images = uniqueImages(portrait?.images || [], 9);
  const open = openIndex >= 0 && images[openIndex];

  function goTo(next) {
    if (!images.length) return;
    const wrapped = ((next % images.length) + images.length) % images.length;
    ignoreScroll.current = false;
    setOpenIndex(wrapped);
  }

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpenIndex(-1);
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(openIndex - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(openIndex + 1);
      }
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
  }, [open, openIndex, images.length]);

  useEffect(() => {
    if (!open || !scrollerRef.current) return;
    if (ignoreScroll.current) {
      ignoreScroll.current = false;
      return;
    }
    const slide = scrollerRef.current.children[openIndex];
    slide?.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
  }, [open, openIndex]);

  if (!portrait) return null;

  function onScrollerScroll(event) {
    const node = event.currentTarget;
    if (!node.clientWidth) return;
    const next = Math.round(node.scrollLeft / node.clientWidth);
    if (next !== openIndex && images[next]) {
      ignoreScroll.current = true;
      setOpenIndex(next);
    }
  }

  const lightbox =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="portrait-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogId}
            onClick={() => setOpenIndex(-1)}
          >
            <button
              ref={closeRef}
              type="button"
              className="portrait-lightbox-close"
              onClick={() => setOpenIndex(-1)}
            >
              {t("closePortrait")}
            </button>
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  className="portrait-lightbox-nav is-prev"
                  onClick={(event) => {
                    event.stopPropagation();
                    goTo(openIndex - 1);
                  }}
                >
                  {t("prevPortrait")}
                </button>
                <button
                  type="button"
                  className="portrait-lightbox-nav is-next"
                  onClick={(event) => {
                    event.stopPropagation();
                    goTo(openIndex + 1);
                  }}
                >
                  {t("nextPortrait")}
                </button>
                <p className="portrait-lightbox-count">
                  {t("portraitPosition", { current: openIndex + 1, total: images.length })}
                </p>
              </>
            ) : null}
            <div
              className="portrait-lightbox-scroller"
              ref={scrollerRef}
              onClick={(event) => event.stopPropagation()}
              onScroll={onScrollerScroll}
            >
              {images.map((image, index) => (
                <figure key={image.src} className="portrait-lightbox-slide">
                  <img
                    id={index === openIndex ? dialogId : undefined}
                    src={enlargeImageUrl(hdCoverUrl(image.src))}
                    alt={image.alt || name}
                  />
                </figure>
              ))}
            </div>
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
            {images.map((image, index) => (
              <li key={image.src}>
                <button
                  type="button"
                  className="portrait-open"
                  onClick={() => setOpenIndex(index)}
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
