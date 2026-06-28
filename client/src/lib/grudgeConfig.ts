/**
 * Grudge auth + API config — imports fleet production URLs.
 */
import {
  GRUDGE_AUTH_GATEWAY,
  GRUDGE_GAME_DATA_API,
  GRUDGE_APP_ORIGIN,
} from "./fleetConfig";

export const AUTH_GATEWAY = GRUDGE_AUTH_GATEWAY;
export const GAME_DATA_API = GRUDGE_GAME_DATA_API;
export const API_BASE = "/api";

export function buildSsoLoginUrl(returnOrigin?: string): string {
  const origin = returnOrigin || GRUDGE_APP_ORIGIN;
  const redirectUri = `${origin}/auth/callback`;
  return `${AUTH_GATEWAY}/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export const STORAGE_KEYS = [
  "grudge_auth_token",
  "grudge_session_token",
  "grudge_id",
  "grudge_username",
  "grudge_account_id",
  "grudge_user",
  "grudge-session",
  "grudge_auth_pending_route",
] as const;

export function purgeGrudgeClientState(): void {
  try {
    STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && /^grudge[_-]/i.test(k)) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}