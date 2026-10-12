import { useEffect, useState } from "react";
import { getSession, subscribeAuth, type Session } from "../lib/auth";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(() => getSession());

  useEffect(() => {
    // Always re-read from localStorage so a refreshed tab restores login.
    setSession(getSession());
    return subscribeAuth(() => setSession(getSession()));
  }, []);

  return {
    session,
    email: session?.email ?? null,
    isLoggedIn: Boolean(session),
  };
}
