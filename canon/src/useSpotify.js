import { useEffect, useState } from "react";
import {
  addTrackToSpotifyAlbum,
  beginSpotifyLogin,
  clearSpotifySession,
  completeSpotifyLogin,
  fetchSpotifyProfile,
  getClientId,
  openSpotifyTrack,
  parseCallbackParams,
  searchSpotifyTracks,
  setPendingAdd,
  setPendingBeyond,
  takePendingAdd,
  takeReturnHash,
  trackSavedOnSpotify,
  redirectUri,
} from "./spotify.js";

const ENV_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";

export function useSpotify() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState({});
  const clientId = getClientId(undefined, ENV_CLIENT_ID);

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
        const returnHash = takeReturnHash();
        if (returnHash) url.hash = returnHash;
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        if (!cancelled && result.error) setStatus(result.error);
        const pending = takePendingAdd();
        if (result.tokens && pending) {
          try {
            await addTrackToSpotifyAlbum(pending, { envClientId: ENV_CLIENT_ID });
            if (!cancelled) {
              setSaved((current) => ({ ...current, [pending]: true }));
              setStatus({ key: "spotify.addedAlbum" });
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
    if (!getClientId(undefined, ENV_CLIENT_ID)) {
      setStatus({ key: "spotify.notConfigured" });
      return;
    }
    try {
      await beginSpotifyLogin({
        envClientId: ENV_CLIENT_ID,
        location: window.location,
      });
    } catch (err) {
      setStatus(err.message || { key: "spotify.notConfigured" });
    }
  }

  function disconnect() {
    clearSpotifySession();
    setUser(null);
    setSaved({});
    setStatus({ key: "spotify.disconnected" });
  }

  async function addTrack(track) {
    const spotifyId = track?.spotifyId;
    if (!spotifyId) {
      setStatus({ key: "spotify.noId" });
      return;
    }
    if (!getClientId(undefined, ENV_CLIENT_ID)) {
      const href = openSpotifyTrack(track);
      setStatus(href ? { key: "spotify.opened" } : { key: "spotify.noId" });
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
      setStatus({ key: "spotify.addedNamed", params: { name: track.name } });
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

  async function searchTracks({ query, market = "", offset = 0, limit = 20 } = {}) {
    if (!getClientId(undefined, ENV_CLIENT_ID)) {
      setStatus({ key: "spotify.notConfigured" });
      throw new Error("Spotify is not configured on this site.");
    }
    if (!user) {
      setPendingBeyond(true);
      setStatus({ key: "spotify.needConnect" });
      await connect();
      throw new Error("Authorize Spotify to stream titles beyond the 1,000-work canon.");
    }
    setBusy(true);
    try {
      return await searchSpotifyTracks({
        query,
        market,
        offset,
        limit,
        envClientId: ENV_CLIENT_ID,
      });
    } finally {
      setBusy(false);
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
    configured: Boolean(clientId),
    connect,
    disconnect,
    addTrack,
    addTracks,
    checkSaved,
    searchTracks,
    setStatus,
    redirect: typeof window !== "undefined" ? redirectUri() : "",
  };
}
