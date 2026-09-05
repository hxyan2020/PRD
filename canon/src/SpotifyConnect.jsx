import { useI18n } from "./I18n.jsx";
import { formatStatus } from "./i18n.js";

export default function SpotifyConnect({ spotify }) {
  const { locale, t } = useI18n();
  const connected = Boolean(spotify.user);
  const redirect = spotify.redirect || "http://localhost:5173/";
  return (
    <section className="spotify-connect" id="spotify-connect" aria-label={t("spotifyAuth")}>
      <div>
        <p className="eyebrow">{t("yourSpotify")}</p>
        <h2>{t("addToAlbum")}</h2>
        <p>{t("spotifyIntro")}</p>
        {connected ? (
          <p className="spotify-user">
            {t("connectedAs", { name: spotify.user.display_name || spotify.user.id })}{" "}
            <button type="button" className="text-btn" onClick={spotify.disconnect}>
              {t("disconnect")}
            </button>
          </p>
        ) : (
          <form
            className="spotify-setup"
            onSubmit={async (event) => {
              event.preventDefault();
              const id = new FormData(event.currentTarget).get("clientId");
              spotify.rememberClientId(id);
              await spotify.connect();
            }}
          >
            <label>
              {t("spotifyClientId")}
              <input
                name="clientId"
                defaultValue={spotify.clientId}
                placeholder={t("spotifyClientPlaceholder")}
                autoComplete="off"
                required
              />
            </label>
            <p className="stats-note">{t("spotifySetup", { uri: redirect })}</p>
            <button type="submit" disabled={spotify.busy}>
              {spotify.busy ? t("connecting") : t("connectSpotify")}
            </button>
          </form>
        )}
        {spotify.status ? <p className="spotify-status">{formatStatus(locale, spotify.status)}</p> : null}
      </div>
    </section>
  );
}
