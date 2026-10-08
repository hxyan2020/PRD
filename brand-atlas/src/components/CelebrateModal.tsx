import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CatalogItem } from "../types/catalog";
import { coverGradient } from "../lib/catalog";
import { useI18n } from "../i18n/I18nProvider";
import { formatUtc, getUnlock, permanentLink } from "../lib/unlocks";

interface Props {
  item: CatalogItem;
  categoryLabel: string;
  onClose: () => void;
}

export function CelebrateModal({ item, categoryLabel, onClose }: Props) {
  const { t } = useI18n();
  const unlock = getUnlock(item.id);
  const link = unlock ? permanentLink(unlock.shareId) : null;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!link) return;
    let cancelled = false;
    void (async () => {
      try {
        await navigator.clipboard.writeText(link);
        if (!cancelled) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
      } catch {
        /* clipboard may be blocked in some browsers */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [link]);

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {link && (
          <div className="permalink-box">
            <strong>Permanent link</strong>
            <p className="muted" style={{ margin: "0.25rem 0 0.5rem", fontSize: "0.85rem" }}>
              {copied
                ? "Pushed to your clipboard (GitHub Pages link)."
                : "Stable GitHub Pages URL for this unlock — copy or open anytime."}
            </p>
            <code className="permalink-url">{link}</code>
            <div className="cta-row" style={{ justifyContent: "center", marginTop: "0.7rem" }}>
              <button type="button" className="btn btn--quiet" onClick={() => void copy()}>
                {copied ? "Copied!" : t("unlocked.share")}
              </button>
              <Link className="btn btn--forest" to={`/u/${unlock!.shareId}`} onClick={onClose}>
                Open link
              </Link>
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn btn--quiet"
          style={{ marginTop: "0.9rem" }}
          onClick={onClose}
        >
          {t("bingo.keep")}
        </button>
      </div>
    </div>
  );
}
