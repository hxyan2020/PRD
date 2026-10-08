import type { CatalogItem } from "../types/catalog";
import { coverGradient } from "../lib/catalog";

interface Props {
  item: CatalogItem;
  categoryLabel: string;
  onClose: () => void;
}

export function CelebrateModal({ item, categoryLabel, onClose }: Props) {
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
        <h3 id="bingo-title">You unlocked {item.name}</h3>
        <p className="muted">{item.summary}</p>
        <p style={{ margin: "0.8rem 0 1.2rem" }}>
          Greyscale lifted. Colour cover restored in your catalogue.
        </p>
        <button type="button" className="btn btn--forest" onClick={onClose}>
          Keep exploring
        </button>
      </div>
    </div>
  );
}
