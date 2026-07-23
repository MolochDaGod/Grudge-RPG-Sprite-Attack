/**
 * Grudge auth + API config — imports fleet production URLs.
 * Auth SSOT: id.grudge-studio.com/login?redirect_uri=
 */
import {
  GRUDGE_AUTH_GATEWAY,
  GRUDGE_GAME_DATA_API,
  GRUDGE_APP_ORIGIN,
  CANONICAL_APP_ORIGIN,
} from "./fleetConfig";

export const AUTH_GATEWAY = GRUDGE_AUTH_GATEWAY;
export const GAME_DATA_API = GRUDGE_GAME_DATA_API;
/** Same-origin /api via Vercel rewrites (or Vite/Express proxy in dev). */
export const API_BASE = "/api";

/**
 * Build fleet SSO login URL.
 * Always return to the current origin's /auth/callback when in a browser
 * so water.grudge-studio.com and Vercel previews both complete correctly.
 */
export function buildSsoLoginUrl(returnOrigin?: string): string {
  const origin =
    returnOrigin ||
    (typeof window !== "undefined" ? window.location.origin : null) ||
    GRUDGE_APP_ORIGIN ||
    CANONICAL_APP_ORIGIN;
  const redirectUri = `${origin.replace(/\/$/, "")}/auth/callback`;
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
