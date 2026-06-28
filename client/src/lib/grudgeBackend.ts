/**
 * Grudge backend integration — JWT session + account API for Sprite Attack.
 */
import { API_BASE } from "./grudgeConfig";

const AUTH_TOKEN_KEY = "grudge_auth_token";
const LEGACY_SESSION_TOKEN_KEY = "grudge_session_token";

export interface GrudgeMe {
  success?: boolean;
  grudgeId: string;
  username: string;
  displayName?: string;
  email?: string | null;
  walletAddress?: string | null;
  gbuxBalance?: number;
  avatarUrl?: string | null;
}

export interface GrudgeAccount {
  id: string;
  userId: string;
  grudgeId: string | null;
  displayName: string | null;
  gbuxBalance: number;
  gold: number;
  avatarUrl: string | null;
}

export function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_SESSION_TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(LEGACY_SESSION_TOKEN_KEY, token);
  try {
    const maxAge = 7 * 24 * 60 * 60;
    document.cookie = `grudge_auth_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_SESSION_TOKEN_KEY);
  try {
    document.cookie = "grudge_auth_token=; path=/; max-age=0; SameSite=Lax";
  } catch {
    /* ignore */
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, "X-Session-Token": token }
    : {};
}

/** Consume SSO params from URL (sso_token, grudge_id, legacy token/name). */
export function pickupSsoFromUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  let token =
    params.get("sso_token") ||
    params.get("token") ||
    params.get("grudge_token");

  if (!token && location.hash?.includes("token=")) {
    const hp = new URLSearchParams(location.hash.slice(1));
    token = hp.get("sso_token") || hp.get("token");
  }

  if (!token) return false;

  setToken(token);

  const grudgeId =
    params.get("grudge_id") ||
    params.get("grudgeId") ||
    new URLSearchParams(location.hash.slice(1)).get("grudgeId");
  const username =
    params.get("grudge_username") ||
    params.get("username") ||
    params.get("name") ||
    new URLSearchParams(location.hash.slice(1)).get("name");

  if (grudgeId) {
    localStorage.setItem("grudge_id", grudgeId);
    localStorage.setItem("grudge_account_id", grudgeId);
  }
  if (username) localStorage.setItem("grudge_username", username);

  ["sso_token", "token", "grudge_token", "grudge_id", "grudgeId", "grudge_username", "username", "name"].forEach(
    (k) => params.delete(k),
  );
  const clean = params.toString();
  const newUrl = window.location.pathname + (clean ? `?${clean}` : "") + window.location.hash;
  window.history.replaceState(null, "", newUrl);
  return true;
}

export async function bridgeGrudgeLaunchToken(launchToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/grudge-bridge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: launchToken, audience: window.location.origin }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.token) setToken(data.token);
    if (data.grudgeId) localStorage.setItem("grudge_id", data.grudgeId);
    if (data.username) localStorage.setItem("grudge_username", data.username);
    return !!data.token;
  } catch {
    return false;
  }
}

export async function fetchGrudgeMe(): Promise<GrudgeMe | null> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchGrudgeAccount(): Promise<GrudgeAccount | null> {
  const res = await fetch(`${API_BASE}/account`, { headers: authHeaders() });
  if (!res.ok) return null;
  return res.json();
}