import { useEffect, useState } from "react";
import { useI18n } from "./I18n.jsx";
import { SiteNav } from "./SitePages.jsx";
import {
  HX_BOTS,
  clearViewership,
  lastPingFor,
  loadBotPings,
  loadViewership,
  recordBotPing,
} from "./hx.js";
import { publicUrl } from "./urls.js";

function botHref(path) {
  if (String(path).startsWith("/#")) return publicUrl(path.slice(1));
  return publicUrl(path);
}

export function HxMonitor({ origin }) {
  const { t } = useI18n();
  const [health, setHealth] = useState(null);
  const [pings, setPings] = useState(() => loadBotPings());

  useEffect(() => {
    fetch(publicUrl("hx/health.json"), { cache: "no-store" })
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: "down" }));
  }, []);

  return (
    <article className="site-doc hx-desk">
      <p className="eyebrow">HX</p>
      <h2>{t("hx.monitor.title")}</h2>
      <p className="site-doc-lead">{t("hx.monitor.lead")}</p>
      <p>
        <strong>{t("hx.monitor.public")}:</strong>{" "}
        <a href={origin || "/"}>{origin || "/"}</a>
      </p>
      <p>
        <strong>{t("hx.monitor.health")}:</strong> {health?.status || "…"}
        {health?.archiveSongs ? ` · ${health.archiveSongs}` : ""}
      </p>
      <h3>{t("hx.monitor.bots")}</h3>
      <ul className="hx-bots">
        {HX_BOTS.map((bot) => {
          const last = lastPingFor(bot.id, pings);
          return (
            <li key={bot.id}>
              <a href={botHref(bot.path)}>{bot.name}</a>
              <span>
                {bot.interval} · {t("hx.monitor.last")}:{" "}
                {last ? new Date(last.at).toLocaleString() : t("hx.monitor.never")}
              </span>
            </li>
          );
        })}
      </ul>
      <p>
        <button type="button" className="text-btn" onClick={() => setPings(recordBotPing("hx-ping"))}>
          {t("hx.monitor.ping")}
        </button>
      </p>
      <SiteNav page="hx-monitor" />
    </article>
  );
}

export function HxViewership() {
  const { t } = useI18n();
  const [state, setState] = useState(() => loadViewership());

  return (
    <article className="site-doc hx-desk">
      <p className="eyebrow">HX</p>
      <h2>{t("hx.views.title")}</h2>
      <p className="site-doc-lead">{t("hx.views.lead")}</p>
      <dl className="stats hx-stats" aria-label={t("hx.views.title")}>
        <div>
          <dt>{t("hx.views.total")}</dt>
          <dd>{state.totals.views}</dd>
        </div>
        <div>
          <dt>{t("hx.views.human")}</dt>
          <dd>{state.totals.human}</dd>
        </div>
        <div>
          <dt>{t("hx.views.bot")}</dt>
          <dd>{state.totals.bot}</dd>
        </div>
      </dl>
      {state.visits.length === 0 ? (
        <p>{t("hx.views.empty")}</p>
      ) : (
        <ol className="hx-visits">
          {state.visits.map((v, i) => (
            <li key={`${v.at}-${i}`}>
              <time dateTime={v.at}>{new Date(v.at).toLocaleString()}</time>
              <span>{v.kind}</span>
              <span>{v.route}</span>
            </li>
          ))}
        </ol>
      )}
      <p>
        <button
          type="button"
          className="text-btn"
          onClick={() => setState(clearViewership())}
        >
          {t("hx.views.clear")}
        </button>
      </p>
      <SiteNav page="hx-viewership" />
    </article>
  );
}
