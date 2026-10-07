import { useCallback, useSyncExternalStore } from "react";
import {
  AUTH_EVENT,
  getCurrentUser,
  getSession,
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  SESSION_KEY,
} from "../lib/auth";
import type { AuthUser } from "../types/auth";

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot() {
  return localStorage.getItem(SESSION_KEY) ?? "";
}

function getServerSnapshot() {
  return "";
}

export function useAuth() {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const user = getCurrentUser();
  const session = getSession();

  const login = useCallback(async (email: string, password: string) => {
    return authLogin(email, password);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    return authRegister(email, password);
  }, []);

  const logout = useCallback(() => {
    authLogout();
  }, []);

  return {
    user: user as AuthUser | null,
    session,
    isLoggedIn: Boolean(user),
    login,
    register,
    logout,
  };
}
