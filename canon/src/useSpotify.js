import { useEffect, useState } from "react";
import {
  addTrackToSpotifyAlbum,
  beginSpotifyLogin,
  clearSpotifySession,
  completeSpotifyLogin,
  fetchSpotifyProfile,
  getClientId,
  parseCallbackParams,
  saveClientId,
  setPendingAdd,
  takePendingAdd,
  trackSavedOnSpotify,
} from "./spotify.js";

const ENV_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";

export function useSpotify() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState({});
  const [clientId, setClientIdState] = useState(() => getClientId(undefined, ENV_CLIENT_ID));

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const params = parseCallbackParams(window.location.search);
      if (params.code || params.error) {
        setBusy(true);
        const result = await completeSpotifyLogin({
          search: window.location.search,
          envClientId: ENV_CLIENT_ID,
          location: window.location,
        });
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        url.searchParams.delete("error");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        if (!cancelled && result.error) setStatus(result.error);
        const pending = takePendingAdd();
        if (result.tokens && pending) {
          try {
            await addTrackToSpotifyAlbum(pending, { envClientId: ENV_CLIENT_ID });
            if (!cancelled) {
              setSaved((current) => ({ ...current, [pending]: true }));
              setStatus("Added to Liked Songs and your Canon album on Spotify.");
            }
          } catch (err) {
            if (!cancelled) setStatus(err.message);
          }
        }
        if (!cancelled) setBusy(false);
      }
      try {
        const profile = await fetchSpotifyProfile({ envClientId: ENV_CLIENT_ID });
        if (!cancelled) setUser(profile);
      } catch {
        clearSpotifySession();
        if (!cancelled) setUser(null);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  async function connect() {
    setStatus("");
    await beginSpotifyLogin({
      envClientId: ENV_CLIENT_ID,
      location: window.location,
    });
  }

  function disconnect() {
    clearSpotifySession();
    setUser(null);
    setSaved({});
    setStatus("Disconnected from Spotify.");
  }

  function rememberClientId(id) {
    saveClientId(id);
    setClientIdState(String(id || "").trim());
  }

  async function addTrack(track) {
    const spotifyId = track?.spotifyId;
    if (!spotifyId) {
      setStatus("This recording has no Spotify track id.");
      return;
    }
    if (!getClientId(undefined, ENV_CLIENT_ID)) {
      setStatus("Paste your Spotify client ID, then connect.");
      document.getElementById("spotify-connect")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (!user) {
      setPendingAdd(spotifyId);
      await connect();
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      await addTrackToSpotifyAlbum(spotifyId, { envClientId: ENV_CLIENT_ID });
      setSaved((current) => ({ ...current, [spotifyId]: true }));
      setStatus(`Added “${track.name}” to Liked Songs and your Canon album.`);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function addTracks(tracks) {
    for (const track of tracks) {
      await addTrack(track);
    }
  }

  async function checkSaved(track) {
    if (!user || !track?.spotifyId || saved[track.spotifyId] != null) return;
    try {
      const on = await trackSavedOnSpotify(track.spotifyId, { envClientId: ENV_CLIENT_ID });
      setSaved((current) => ({ ...current, [track.spotifyId]: on }));
    } catch {
      /* ignore lookup failures */
    }
  }

  return {
    user,
    status,
    busy,
    saved,
    clientId,
    connect,
    disconnect,
    rememberClientId,
    addTrack,
    addTracks,
    checkSaved,
    redirect: typeof window !== "undefined" ? `${window.location.origin}/` : "",
  };
}
