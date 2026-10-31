import { Link } from "react-router-dom";
import type { CatalogItem } from "../types/catalog";
import { coverGradient } from "../lib/catalog";
import { coverUrl } from "../lib/marks";
import { useI18n } from "../i18n/I18nProvider";
import { formatUtc, getUnlock } from "../lib/unlocks";

interface Props {
  item: CatalogItem;
  categoryLabel: string;
  onClose: () => void;
}

export function CelebrateModal({ item, categoryLabel, onClose }: Props) {
  const { t } = useI18n();
  const unlock = getUnlock(item.id);
  const photo = unlock?.photoDataUrl || coverUrl(item);

  return (
    <div className="celebrate" role="dialog" aria-modal="true" aria-labelledby="bingo-title">
      <div className="celebrate__card">
        <div
          style={{
            height: 140,
            borderRadius: 16,
            background: photo ? undefined : coverGradient(item.coverHue, true),
            backgroundImage: photo ? `url(${photo})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            animation: "unlockBloom 0.9s ease",
          }}
        />
        <p className="muted" style={{ marginTop: "0.9rem" }}>
          Bingo · {categoryLabel}
        </p>
        <h3 id="bingo-title">{t("bingo.title", { name: item.name })}</h3>
        <p className="muted">{item.summary}</p>
        <p style={{ margin: "0.8rem 0 0.6rem" }}>{t("bingo.body")}</p>
        {unlock && (
          <p className="muted mono" style={{ fontSize: "0.85rem" }}>
            {formatUtc(unlock.unlockedAt)}
          </p>
        )}

        <div className="cta-row celebrate__actions">
          {unlock && (
            <Link
              className="btn btn--forest"
              to={`/u/${unlock.shareId}`}
              onClick={onClose}
            >
              {t("bingo.openLink")}
            </Link>
          )}
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            {t("bingo.keep")}
          </button>
        </div>
      </div>
    </div>
  );
}
