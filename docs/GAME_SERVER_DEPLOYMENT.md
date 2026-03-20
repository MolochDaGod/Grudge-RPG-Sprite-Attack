# Game Server Deployment Guide

## Architecture

```
┌─────────────────┐         WebSocket (socket.io)         ┌──────────────────┐
│  Vercel Frontend │  ──────── /pvp path ────────────────► │  Grudge Server   │
│  (static build)  │                                       │  (Node + Express │
└─────────────────┘                                        │   + Socket.io)   │
                                                           └──────────────────┘
```

- **Frontend** (Vercel): Static Vite build, serves the game UI
- **Game Server** (Puter/Docker/VM): Express + Socket.io, handles PvP room matchmaking and input relay
- **Communication**: WebSocket via socket.io on the `/pvp` path

## Current Deployment

### Frontend (Vercel)
- Auto-deploys from `MolochDaGod/Grudge-RPG-Sprite-Attack` on push to `main`
- URL: `grudge-rpg-sprite-attack-grudgenexus.vercel.app`
- ToonAdmin: `grudge-rpg-sprite-attack-grudgenexus.vercel.app/#toonadmin`

### PvP Server (Railway)
- Repo: `MolochDaGod/grudge-pvp-server`
- URL: `https://grudge-pvp-server-production.up.railway.app`
- Health check: `https://grudge-pvp-server-production.up.railway.app/health`
- Socket.io path: `/pvp`

### Landing Page (GitHub Pages)
- URL: `molochdagod.github.io/Grudge-RPG-Sprite-Attack`
- Source: `docs/` folder on `main` branch

### Grudge Backend Integration
The game connects to the Grudge Studio backend ecosystem:
- **PvP Server**: Railway (`grudge-pvp-server-production.up.railway.app`)
- **Domain**: Can be proxied via `fighter-api.grudge-studio.com` on Cloudflare
- **Object Storage**: Sprite assets served from Vercel static build
- **Future**: Character configs can be stored on Grudge backend DB instead of localStorage

### Configuring the Server URL
Set in the frontend via environment variable:
```
VITE_PVP_SERVER_URL=https://grudge-pvp-server-production.up.railway.app
```
Falls back to `window.location.origin` for local dev (`npm run dev`).

## Deploying the Game Server

### Option 1: Railway (Recommended for Quick Deploy)
Railway supports WebSocket natively and deploys from GitHub.

1. Go to [railway.app](https://railway.app) and connect your GitHub
2. Create a new project from `MolochDaGod/Grudge-RPG-Sprite-Attack`
3. Railway detects `railway.json` and `Dockerfile` automatically
4. Set env variable: `PORT=5000`
5. Deploy — you'll get a URL like `grudge-server-production.up.railway.app`
6. Update the frontend:
   ```
   VITE_PVP_SERVER_URL=https://grudge-server-production.up.railway.app
   ```

Railway's free tier supports WebSocket connections and auto-scales.

### Option 2: Docker on a VM
Best for production with guaranteed uptime.

```bash
# Build the image
docker build -t grudge-fighter-server .

# Run it
docker run -d \
  --name grudge-server \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  grudge-fighter-server
```

Or use `docker-compose.yml`:
```bash
docker compose up -d app
```

### Option 3: Cloudflare + VM (Production Recommended)

1. **Set up a VM** (any provider: Hetzner, DigitalOcean, etc.)
2. **Install Docker** on the VM
3. **Deploy the container** as shown above
4. **Configure Cloudflare DNS**:
   - Add an A record: `fighter-api.grudge-studio.com` → VM IP
   - Enable Cloudflare proxy (orange cloud) for SSL
5. **Update the frontend**:
   ```
   VITE_PVP_SERVER_URL=https://fighter-api.grudge-studio.com
   ```

### Cloudflare WebSocket Support
Cloudflare proxied connections support WebSocket natively.
Socket.io will negotiate WebSocket upgrade through Cloudflare with no extra config needed.

## Server Architecture

### PvP System (`server/pvp.ts`)
- Room-based matchmaking with 4-character room codes
- Input relay architecture (no authoritative simulation)
- Events: `room:create`, `room:join`, `room:pick`, `room:ready`, `input`, `action`
- Rooms auto-cleanup after 10 minutes if not started

### Scaling

For multiple server instances (scaling beyond ~500 concurrent rooms):

1. **Add Redis adapter** for socket.io:
   ```bash
   npm install @socket.io/redis-adapter redis
   ```

2. Update `server/pvp.ts`:
   ```typescript
   import { createAdapter } from "@socket.io/redis-adapter";
   import { createClient } from "redis";
   
   const pubClient = createClient({ url: process.env.REDIS_URL });
   const subClient = pubClient.duplicate();
   await Promise.all([pubClient.connect(), subClient.connect()]);
   io.adapter(createAdapter(pubClient, subClient));
   ```

3. Run multiple server instances behind a load balancer (Cloudflare or nginx)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection | (see .env.example) |
| `REDIS_URL` | Redis for socket.io scaling | (optional) |

### Health Check
The server exposes the Express app on the configured port.
Use `GET /` or `GET /api/roster` for health checks.

## Local Development

```bash
# Start the full server (Express + PvP + Vite dev)
npm run dev

# The PvP WebSocket is available at ws://localhost:5000/pvp
# Set VITE_PVP_SERVER_URL=http://localhost:5000 for local testing
```

## Monitoring

Socket.io PvP events are logged to stdout with the `[pvp]` tag:
```
10:30:15 AM [pvp] PvP client connected: abc123
10:30:16 AM [pvp] Room XKCD created by abc123
10:30:20 AM [pvp] def456 joined room XKCD
10:30:25 AM [pvp] Room XKCD starting: knight vs wizard
```
