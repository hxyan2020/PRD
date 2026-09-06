import { hdCoverUrl } from "./cover.js";
import { useI18n } from "./I18n.jsx";

export default function PortraitGallery({ name, portrait }) {
  const { t } = useI18n();
  if (!portrait) return null;
  const images = (portrait.images || []).slice(0, 9);
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
                <img src={hdCoverUrl(image.src)} alt={image.alt || name} loading="lazy" />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
