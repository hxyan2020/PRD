import type { CatalogItem } from "../types/catalog";
import { coverGradient } from "../lib/catalog";
import { useI18n } from "../i18n/I18nProvider";
import { formatUtc, getUnlock, permanentLink } from "../lib/unlocks";
import { useState } from "react";

interface Props {
  item: CatalogItem;
  categoryLabel: string;
  onClose: () => void;
}

export function CelebrateModal({ item, categoryLabel, onClose }: Props) {
  const { t } = useI18n();
  const unlock = getUnlock(item.id);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!unlock) return;
    await navigator.clipboard.writeText(permanentLink(unlock.shareId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="celebrate" role="dialog" aria-modal="true" aria-labelledby="bingo-title">
      <div className="celebrate__card">
        <div
          style={{
            height: 120,
            borderRadius: 16,
            background: coverGradient(item.coverHue, true),
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
        <div className="cta-row" style={{ justifyContent: "center", marginTop: "0.8rem" }}>
          {unlock && (
            <button type="button" className="btn btn--quiet" onClick={() => void copy()}>
              {copied ? "Copied!" : t("unlocked.share")}
            </button>
          )}
          <button type="button" className="btn btn--forest" onClick={onClose}>
            {t("bingo.keep")}
          </button>
        </div>
      </div>
    </div>
  );
}
