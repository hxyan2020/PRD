export default function SpotifyConnect({ spotify }) {
  const connected = Boolean(spotify.user);
  return (
    <section className="spotify-connect" id="spotify-connect" aria-label="Spotify authorization">
      <div>
        <p className="eyebrow">Your Spotify</p>
        <h2>Add recordings to your album</h2>
        <p>
          Canon never edits official artist albums. After you authorize Spotify, Add to
          Spotify saves the track to Liked Songs and to a private playlist named Canon
          — your album of this archive.
        </p>
        {connected ? (
          <p className="spotify-user">
            Connected as {spotify.user.display_name || spotify.user.id}.{" "}
            <button type="button" className="text-btn" onClick={spotify.disconnect}>
              Disconnect
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
              Spotify client ID
              <input
                name="clientId"
                defaultValue={spotify.clientId}
                placeholder="From developer.spotify.com/dashboard"
                autoComplete="off"
                required
              />
            </label>
            <p className="stats-note">
              Create a Spotify app, add redirect URI <code>{spotify.redirect || "http://localhost:5173/"}</code>,
              then paste the client ID and connect. Spotify will ask you to approve access.
            </p>
            <button type="submit" disabled={spotify.busy}>
              {spotify.busy ? "Connecting…" : "Connect Spotify"}
            </button>
          </form>
        )}
        {spotify.status ? <p className="spotify-status">{spotify.status}</p> : null}
      </div>
    </section>
  );
}
