# Grudge Fighter

A 2D sprite-based fighting game with AI opponents, online PvP, a stamina resource system, and Smash Bros-style super attacks.

**Play Now:** [grudge-rpg-sprite-attack.vercel.app](https://grudge-rpg-sprite-attack-grudgenexus.vercel.app)
**Landing Page:** [molochdagod.github.io/Grudge-RPG-Sprite-Attack](https://molochdagod.github.io/Grudge-RPG-Sprite-Attack)

## Features

### 7 Playable Characters
Knight, Archer, Wizard, Orc, Armored Skeleton, Swordsman, Priest — each with unique animations (idle, walk, attack, hurt, death), attack effects, move sets, and super attacks.

### Combat System
- **Melee** (Q/E) — free basic attacks
- **Dash Attack** (LMB) — lunge forward, distance scales with stamina (up to half-screen)
- **Block / Parry** (RMB) — counter stance that reflects damage
- **Ranged** (F) — character-specific projectiles with sprite animations
- **Up Special** (W+Q/E) — aerial dash strike
- **Down Special** (S+Q/E) — counter stance
- **Super Attack** (R) — Smash Bros-style cutscene when meter is full

### Stamina System
3-pip resource bar that regens 1 point every 3 seconds:
- Dash: costs 3 (velocity scales with pips available)
- Ranged: costs 1
- Specials: cost 2
- Exhaustion: 300ms lockout when spamming at 0 stamina

### AI Opponent
Intelligent AI that approaches, attacks in range, dodges projectiles, blocks, uses specials, and triggers super attacks.

### Online PvP
Socket.io room-based matchmaking with 4-character room codes. Input relay architecture — both clients run the same simulation.

### Visual Effects
- Per-character attack effect sprite sheets (Split Effects from GrudgeRPGAssets2d)
- Animated sprite projectiles (Wizard fireball, Archer arrow)
- Screen shake on hit (heavier on counters/supers)
- Hit flash with fighter blink + screen tint
- Pulsing counter shield aura
- Super freeze cutscene with radial burst and name overlay

### Input Support
- Keyboard (full rebindable P1/P2 layouts)
- Mouse (LMB = dash, RMB = block)
- Gamepad (A/X=attack, B=ranged, Y=jump, RT=dash, LT=block, RB=super)

## Tech Stack

- **Frontend** — React 18, Vite 6, Tailwind CSS, Canvas 2D
- **Backend** — Express, Node.js, Socket.io (PvP), PostgreSQL
- **Deployment** — Vercel (frontend), Docker/Puter (game server)
- **Assets** — GrudgeRPGAssets2d 100×100 sprite sheets at 3× scale

## Quick Start

```bash
npm install --legacy-peer-deps
npm run dev    # http://localhost:5000
```

See [docs/GAME_SERVER_DEPLOYMENT.md](docs/GAME_SERVER_DEPLOYMENT.md) for server deployment.

## Project Structure

```
client/
  src/pages/GrudgeFighter2D.tsx   # Main fighter game (~1700 lines)
  src/hooks/usePvP.ts             # Socket.io PvP client hook
  public/fighter2d/
    characters/                   # 7 character sprite sheets
    effects/                      # Attack effect sprite strips
    projectiles/                  # Arrow, fireball sprites
server/
  pvp.ts                          # Socket.io PvP room server
  index.ts                        # Express entry point
  routes.ts                       # API routes
docs/
  index.html                      # GitHub Pages landing page
  GAME_SERVER_DEPLOYMENT.md       # Server deployment guide
  ENVIRONMENT_SETUP.md            # Environment setup
```

## Controls

| Action | Keyboard | Mouse | Gamepad |
|--------|----------|-------|---------|
| Move | A/D | — | Left Stick / D-Pad |
| Jump | W | — | Y |
| Melee Attack | Q or E | — | A or X |
| Dash Attack | — | LMB | RT |
| Block / Parry | — | RMB | LT |
| Ranged | F | — | B |
| Up Special | W + Q/E | — | Up + A |
| Down Special | S + Q/E | — | Down + A |
| Super | R | — | RB |

## License

MIT
