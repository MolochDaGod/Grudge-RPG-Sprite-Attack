# Grudge Project Environment Setup (F Drive)

This guide sets up local dev, backend services, AI keys, and deployment-ready config for:

- f:/Grudge-RPG-Sprite-Attack/Grudge-RPG-Sprite-Attack

## 1) Required Tools

Install these on Windows:

1. Node.js 20 LTS (includes npm)
2. Git
3. Docker Desktop (for local Postgres + container deployment flow)

Verify in terminal:

```powershell
node -v
npm -v
docker --version
docker compose version
```

## 2) Project Bootstrap

From project root:

```powershell
cd /d f:\Grudge-RPG-Sprite-Attack\Grudge-RPG-Sprite-Attack
npm install
```

## 3) Environment Variables

Create your local env file from template:

```powershell
copy .env.example .env
```

Then edit `.env` and set:

- `DATABASE_URL`
- `AI_INTEGRATIONS_OPENAI_API_KEY`
- `AI_INTEGRATIONS_OPENAI_BASE_URL` (default: `https://api.openai.com/v1`)
- `MESHY_API_KEY`

## 4) Database Setup (Local Postgres via Docker)

Start Postgres:

```powershell
npm run db:up
```

Run schema push:

```powershell
npm run db:push
```

Stop Postgres when done:

```powershell
npm run db:down
```

## 5) Run Dev Environment

Start app (frontend + backend through existing server entrypoint):

```powershell
npm run dev
```

App/API default port: `5000` (controlled by `PORT`).

## 6) Type Check

```powershell
npm run check
```

## 7) Deployment Flow (Container)

Build and run full stack with Docker Compose:

```powershell
npm run docker:up
```

Stop:

```powershell
npm run docker:down
```

Production env should come from secure platform settings using `.env.production.example` as reference.

## 8) AI/Backend Notes

Backend env usage in this repo includes:

- `DATABASE_URL` for Postgres access (`server/db.ts`, `drizzle.config.ts`)
- `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` for chat/image/audio integrations
- `MESHY_API_KEY` for Meshy service

Keep secrets out of git. `.env` files are ignored; templates are committed.

## 9) Common Windows Issues

1. `npm is not recognized`
   - Reinstall Node.js 20 LTS and reopen terminal.
2. Docker engine not running
   - Start Docker Desktop, wait until engine is healthy.
3. Port 5000/5432 conflict
   - Change `PORT` or Postgres mapping in `docker-compose.yml`.
