import { Link } from "react-router-dom";
import type { CatalogItem } from "../types/catalog";
import { coverGradient } from "../lib/catalog";
import { coverUrl } from "../lib/marks";
import { useI18n } from "../i18n/I18nProvider";
import { formatUtc, getUnlock } from "../lib/unlocks";
import { ExpandablePhoto } from "./ExpandablePhoto";
import { FireworksOverlay } from "./FireworksOverlay";

interface Props {
  item: CatalogItem;
  categoryLabel: string;
  onClose: () => void;
}

export function CelebrateModal({ item, categoryLabel, onClose }: Props) {
  const { t } = useI18n();
  const unlock = getUnlock(item.id);
  const userPhoto = unlock?.photoDataUrl;
  const stockPhoto = coverUrl(item);
  const photo = userPhoto || stockPhoto;

  return (
    <div className="celebrate" role="dialog" aria-modal="true" aria-labelledby="bingo-title">
      <FireworksOverlay bursts={6} />
      <div className="celebrate__card">
        {userPhoto ? (
          <ExpandablePhoto
            className="celebrate__photo"
            src={userPhoto}
            alt=""
          />
        ) : (
          <div
            className="celebrate__photo celebrate__photo--static"
            style={{
              background: photo ? undefined : coverGradient(item.coverHue, true),
              backgroundImage: photo ? `url(${photo})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              animation: "unlockBloom 0.9s ease",
            }}
          />
        )}
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
