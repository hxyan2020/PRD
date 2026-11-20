import BrandMark from "./BrandMark.jsx";
import { useI18n } from "./I18n.jsx";

export default function BootScreen({ message, error = false }) {
  const { t } = useI18n();
  return (
    <div className={`boot${error ? " is-error" : ""}`} role="status" aria-live="polite">
      <div className="boot-stack">
        <BrandMark className="boot-mark" alt="" priority width={180} height={180} />
        <p className="boot-name">Canon</p>
        <p className="boot-kicker">{t("archiveEyebrow")}</p>
        <p className="boot-copy">{message}</p>
      </div>
    </div>
  );
}
