import type { AuthUser } from "../types/domain";

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

const SESSION_KEY = "dms_seller_session";
let memorySession: Session | null = null;
let expiredHandlers: Array<() => void> = [];

const getLocalStorage = () => {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) return null;
  return globalThis.localStorage;
};

export function getStoredSession() {
  if (memorySession) return memorySession;

  const storage = getLocalStorage();
  const raw = storage?.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    memorySession = JSON.parse(raw) as Session;
    return memorySession;
  } catch {
    storage?.removeItem(SESSION_KEY);
    return null;
  }
}

export function storeSession(session: Session) {
  memorySession = session;
  getLocalStorage()?.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  memorySession = null;
  getLocalStorage()?.removeItem(SESSION_KEY);
}

export function onSessionExpired(handler: () => void) {
  expiredHandlers.push(handler);
  return () => {
    expiredHandlers = expiredHandlers.filter((item) => item !== handler);
  };
}

export function notifySessionExpired() {
  clearSession();
  expiredHandlers.forEach((handler) => handler());
}

export async function signOut() {
  clearSession();
}
