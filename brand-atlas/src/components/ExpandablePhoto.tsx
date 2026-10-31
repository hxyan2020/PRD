import { useState, type ImgHTMLAttributes } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { PhotoLightbox } from "./PhotoLightbox";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  /** When false, renders a plain img (no expand). Default true when src is set. */
  expandable?: boolean;
};

/** Image that opens a full-scale lightbox on tap/click. */
export function ExpandablePhoto({
  expandable = true,
  className,
  src,
  alt = "",
  ...rest
}: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!src) return null;

  if (!expandable) {
    return <img className={className} src={src} alt={alt} {...rest} />;
  }

  return (
    <>
      <button
        type="button"
        className={`expandable-photo${className ? ` ${className}` : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={t("photo.expand")}
      >
        <img src={src} alt={alt} draggable={false} {...rest} />
        <span className="expandable-photo__hint" aria-hidden="true">
          {t("photo.expand")}
        </span>
      </button>
      {open && <PhotoLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
