import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";
import { hasDb } from "./db";

const app = express();
const httpServer = createServer(app);

// ── Security headers (helmet) ────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.puter.com", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      mediaSrc: ["'self'", "blob:", "data:"],
      connectSrc: [
        "'self'",
        "https://*.grudge-studio.com",
        "https://api.grudge-studio.com",
        "https://js.puter.com",
        "https://puter.com",
        "wss://*.grudge-studio.com",
        "ws://localhost:*",
        "http://localhost:*",
      ],
      frameSrc: ["'self'", "https://dungeon-crawler-quest.vercel.app", "https://gdevelop-assistant.vercel.app", "https://js.puter.com"],
      workerSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,   // allow loading cross-origin sprites/assets
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow sprites served to other games
}));

// ── Global CORS for all /api routes ──────────────────────────────
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5000').split(',').map(s => s.trim());
app.use('/api', cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, server-to-server) and listed origins
    if (!origin || CORS_ORIGINS.includes('*') || CORS_ORIGINS.includes(origin)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token', 'x-config-version'],
}));

// ── Health check (Railway / Coolify) ─────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', pvp: true, db: hasDb, ts: Date.now() });
});

// Serve attached_assets statically for GLB models and other assets
app.use('/attached_assets', express.static(path.resolve(import.meta.dirname, '..', 'attached_assets')));

// Serve sprite assets from dist/sprites
app.use('/sprites', express.static(path.resolve(import.meta.dirname, '..', 'dist', 'sprites')));

// Serve entire dist folder (API, docs, sprites) with CORS for external access
app.use('/dist', cors(), express.static(path.resolve(import.meta.dirname, '..', 'dist')));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // PvP WebSocket server
  const { setupPvP } = await import("./pvp");
  setupPvP(httpServer);

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
