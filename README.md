# Grudge RPG Sprite Attack

A tactical RPG featuring sprite-based 2D fighting, turn-based battles, AI-powered 3D model generation, and a roster of playable characters with unique animations and abilities.

**Live:** [grudge-rpg-sprite-attack.vercel.app](https://grudge-rpg-sprite-attack-grudgenexus.vercel.app)

## Game Modes

### Grudge Fighter (2D)
Canvas-based 2-player fighting game using the reference Fighting-Game-2D engine, rebuilt in React with GrudgeRPG sprite assets.

- **7 playable characters** — Knight, Archer, Wizard, Orc, Armored Skeleton, Swordsman, Priest
- Character select screen with stat previews (ATK / SPD)
- Per-character animations: idle, walk, attack, hurt, death (100×100 sprite strips at 3× scale)
- Smash-style specials: neutral (ranged), up (dash), down (counter)
- Unique move sets and balanced stats per character

### Tactical Battle
Turn-based RPG combat with procedurally generated encounters, skill trees, and a hero codex.

## Tech Stack

- **Frontend** — React 18, Vite 6, Tailwind CSS, Canvas 2D, PixiJS, Three.js
- **Backend** — Express, Node.js, PostgreSQL (Drizzle ORM)
- **AI** — OpenAI integration, Meshy 3D model generation
- **Deployment** — Vercel (frontend), Docker (fullstack)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (or Docker)

### Local Development

```bash
npm install --legacy-peer-deps
npm run db:up        # Start PostgreSQL via Docker
npm run db:push      # Push database schema
npm run dev          # Frontend + backend on port 5000
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the required values. See `.env.production.example` for production config.

### Production Build

```bash
npm run build   # Vite frontend build → dist/public
npm run start   # Express production server
```

### Docker

```bash
npm run docker:up    # App + database
npm run docker:down
```

## Project Structure

```
client/
  src/
    pages/           # GrudgeFighter2D, Home, etc.
    components/      # UI + game components
    renderer/        # PixiJS / Three.js rendering
    lib/             # Effect sprites, utilities
    hooks/           # React hooks
  public/
    fighter2d/       # Fighter game assets
      characters/    # GrudgeRPG 100×100 sprite sheets
      image/         # Background, castle
    assets/icons/    # Attribute icons, Grudge logos
server/
  routes.ts          # API routes
  storage.ts         # Data storage layer
  meshyService.ts    # Meshy AI 3D model integration
shared/              # Shared types and schemas
```

## Fighter Controls

| Action | Player 1 | Player 2 |
|--------|----------|----------|
| Move | A / D | Arrow Left / Right |
| Jump | W | Arrow Up |
| Attack | Q | / |
| Special | E | . |
| Up Special | W + E | Up + . |
| Down Special | S + E | Down + . |

## License

MIT
