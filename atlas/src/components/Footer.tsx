import { useI18n } from "../i18n";

export function Footer({ total }: { total?: number }) {
  const { t } = useI18n();

  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          <strong
            style={{
              color: "var(--brand)",
              fontFamily: "var(--font-brand)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Ludus Atlas
          </strong>{" "}
          {t("footer.blurb")}
          {typeof total === "number"
            ? ` ${t("footer.entries", { n: total.toLocaleString() })}`
            : null}
        </p>
      </div>
    </footer>
  );
}
