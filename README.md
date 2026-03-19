# Grudge RPG Sprite Attack

A tactical RPG featuring sprite-based combat, AI-powered 3D model generation, and a rich hero roster with multiple classes and abilities.

## Tech Stack

- **Frontend** — React 18, Vite, Tailwind CSS, PixiJS, Three.js
- **Backend** — Express, Node.js, PostgreSQL (Drizzle ORM)
- **AI** — OpenAI integration, Meshy 3D model generation
- **Infra** — Docker, Vercel (frontend)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (or Docker)

### Local Development

```bash
# Install dependencies
npm install

# Start PostgreSQL via Docker
npm run db:up

# Push database schema
npm run db:push

# Start dev server (frontend + backend on port 5000)
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

See `.env.production.example` for production configuration.

### Production Build

```bash
# Build frontend
npm run build

# Start production server
npm run start
```

### Docker

```bash
# Start everything (app + database)
npm run docker:up

# Stop
npm run docker:down
```

## Project Structure

```
client/          # React frontend (Vite)
  src/
    components/  # UI components
    pages/       # Route pages
    renderer/    # PixiJS / Three.js rendering
    hooks/       # React hooks
    contexts/    # React contexts
server/          # Express API server
  routes.ts      # API routes
  storage.ts     # Data storage layer
  meshyService.ts # Meshy AI 3D model integration
shared/          # Shared types and schemas
public/          # Static assets
```

## License

MIT
