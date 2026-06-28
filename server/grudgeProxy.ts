/**
 * Proxy Grudge account/auth API to Railway (GrudgeBuilder Postgres).
 * Local /api/accounts (plural) remains on this server for legacy sprite-attack data.
 */
import type { Express, Request, Response } from "express";

const GRUDGE_DATA_API =
  process.env.GRUDGE_GAME_DATA_API ||
  process.env.VITE_GAME_DATA_API ||
  "https://grudge-builder-production.up.railway.app";

const PROXY_PREFIXES = ["/api/auth", "/api/account", "/api/characters"];

export function registerGrudgeBackendProxy(app: Express): void {
  app.use(async (req: Request, res: Response, next) => {
    const path = req.path;
    if (!PROXY_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
      return next();
    }

    const target = `${GRUDGE_DATA_API}${req.originalUrl}`;
    try {
      const headers: Record<string, string> = {};
      if (req.get("authorization")) headers.Authorization = req.get("authorization")!;
      if (req.get("x-session-token")) headers["X-Session-Token"] = req.get("x-session-token")!;
      if (req.get("content-type")) headers["Content-Type"] = req.get("content-type")!;

      const init: RequestInit = { method: req.method, headers };
      if (req.method !== "GET" && req.method !== "HEAD" && req.body && Object.keys(req.body).length) {
        init.body = JSON.stringify(req.body);
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
      }

      const upstream = await fetch(target, init);
      const text = await upstream.text();
      res.status(upstream.status);
      const ct = upstream.headers.get("content-type");
      if (ct) res.setHeader("Content-Type", ct);
      res.send(text);
    } catch (e: unknown) {
      res.status(502).json({
        error: "Grudge backend proxy failed",
        detail: e instanceof Error ? e.message : "upstream error",
      });
    }
  });

  console.log(`[grudge-proxy] /api/{auth,account,characters} → ${GRUDGE_DATA_API}`);
}