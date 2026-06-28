/**
 * Grudge Studio service URLs — single source of truth for Sprite Attack.
 */
const env = (import.meta as any).env ?? {};

export const AUTH_GATEWAY: string =
  env.VITE_AUTH_GATEWAY_URL || "https://id.grudge-studio.com";

/** Railway game-data API (accounts, characters, wallet). Proxied via /api in production. */
export const GAME_DATA_API: string =
  env.VITE_GAME_DATA_API ||
  env.VITE_GRUDGE_API_URL ||
  "https://grudge-builder-production.up.railway.app";

export const API_BASE = "/api";

export function buildSsoLoginUrl(returnOrigin?: string): string {
  const origin =
    returnOrigin ||
    (typeof window !== "undefined" ? window.location.origin : "https://grudge-rpg-sprite-attack.vercel.app");
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