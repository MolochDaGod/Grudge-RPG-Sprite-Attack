# Grudge Smash

A 2D sprite-based fighting game with 39 playable characters, AI opponents, online PvP, a stamina system, startup cinematic intro, and Smash Bros-style super attacks.

**Play Now:** [grudge-rpg-sprite-attack.vercel.app](https://grudge-rpg-sprite-attack-grudgenexus.vercel.app)
**Landing Page:** [molochdagod.github.io/Grudge-RPG-Sprite-Attack](https://molochdagod.github.io/Grudge-RPG-Sprite-Attack)
**Character Editor:** [#toonadmin](https://grudge-rpg-sprite-attack-grudgenexus.vercel.app/#toonadmin)
**PvP Server:** [grudge-pvp-server-production.up.railway.app](https://grudge-pvp-server-production.up.railway.app)

## Features

### 39 playable characters
Knight, Archer, Wizard, Orc, Dark Knight, Fire Knight, Silver Knight, Elf Ranger, Elf Mage, Barbarian, Necromancer, Pirate Captain, Fire Wizard, Lightning Mage, Crossbowman, Werebear, Werewolf, Arcane Archer, Leaf Ranger, Martial Hero, Dwarf Mage, Nightborne, Wind Hashashin, Water Priestess, Shardsoul Slayer, Loreon Knight, Elite Orc, Evil Wizard, Wanderer Magician, Human Ranger, and more. Each with unique sprites from GRUDA Wars, differentiated attack animations, move-specific VFX defaults, projectiles, and super attacks.

### Combat System
- **Melee 1** (Q) — default combo starter with body-part hitboxes (head 1.3x, body 1x, legs 0.8x)
- **Melee 2** (E ground) — alternate strike animation with differentiated VFX
- **Dash Attack** (LMB) — lunge forward, distance scales with stamina (up to half-screen)
- **Rescue Roll** (W + LMB) — roll toward mouse as a fast maneuver; damages on collision
- **Air Slam** — attack while falling for 2.5x gravity dive-bomb with damage through descent
- **Dodge Roll** (AA / DD) — double-tap movement for invulnerable dodge with quick reposition (ground + air)
- **Platform Drop** (SS) — double-tap down to fall through floating one-way platforms (not main floor)
- **Block / Parry** (RMB) — counter stance that reflects damage
- **Ranged** (F) — character-specific projectiles with sprite animations
- **Air Ranged Alt** (E in air) — shoots projectile straight forward; **E+S in air** shoots angled downward
- **Up Special** (W+Q/E) — aerial dash strike
- **Down Special** (S+Q/E) — counter stance
- **Super Attack** (R) — Smash Bros-style cutscene when meter is full
- **Collider Consistency** — character border detection and body push now use the same hurt-box boundary math for cleaner spacing and contact behavior

### Startup + Landing Presentation
- Startup intro video auto-plays from `client/public/startup-intro.mp4` with a skip button.
- Landing hero background loads from `client/public/landing-bg.jpg`.

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

### ObjectStore VFX
- Smear slash effects (smearH1-3, smearV1-3) from ObjectStore on every melee hit
- Hit impact flash (hit_effect_1) at contact point
- Fire breath effects for fire mages (fireBreath, fireBreathHit)
- All VFX assignable per-character via ToonAdmin

### Visual Effects
- Per-character attack effect sprite sheets (Split Effects from GrudgeRPGAssets2d)
- Animated sprite projectiles (Wizard fireball, Archer arrow)
- Screen shake on hit (heavier on counters/supers)
- Hit flash with fighter blink + screen tint
- Pulsing counter shield aura
- Super freeze cutscene with radial burst and name overlay

### Input Support
- Keyboard (full rebindable P1/P2 layouts)
- Mouse (LMB = dash, W+LMB = rescue roll toward mouse, RMB = block)
- Gamepad (A/X=attack, B=ranged, Y=jump, RT=dash, LT=block, RB=super)
- Double-tap movement dodge: `AA` (left) and `DD` (right), plus `SS` for floating-platform drop-through

### ToonAdmin — Character Editor
Full admin tool at `#toonadmin` for editing all 39 characters:
- Live animated sprite preview with scale control (1x–8x)
- Remap any animation to any game action (Q attack, E attack, block, cast, etc.)
- Adjust animation speed (hold frames) and loop behavior
- Edit ATK, SPD, Super DMG stats
- Save to localStorage (game reads overrides on load)
- Import/Export JSON configs

## Tech Stack

- **Frontend** — React 18, Vite 6, Tailwind CSS, Canvas 2D
- **PvP Server** — Node.js + Socket.io on Railway
- **Backend** — Express, PostgreSQL (Drizzle ORM), Grudge Studio backend
- **Deployment** — Vercel (frontend), Railway (PvP), Docker (fullstack)
- **Assets** — Zerie Tiny RPG (2x scale), CraftPix Wizard + RPG Heroes, GRUDA Wars (48–200px frames, scaled to 300px)

## Quick Start

```bash
npm install --legacy-peer-deps
npm run dev    # http://localhost:5000
```

See [docs/GAME_SERVER_DEPLOYMENT.md](docs/GAME_SERVER_DEPLOYMENT.md) for server deployment.

## Project Structure

```
client/
  src/
    pages/GrudgeFighter2D.tsx    # Main fighter game
    pages/ToonAdmin.tsx          # Character editor admin tool
    hooks/usePvP.ts              # Socket.io PvP client hook
    lib/grudaRoster.ts           # 39-character roster data
    lib/charConfig.ts            # Character config persistence
  public/fighter2d/
    characters/                  # 39 character sprite folders
    effects/                     # Attack effect sprite strips
    projectiles/                 # Arrow, fireball, bullet, axe sprites
  public/startup-intro.mp4       # Startup cinematic
  public/landing-bg.jpg          # Landing page hero background
server/
  pvp.ts                         # Socket.io PvP room server
  index.ts                       # Express entry point
  routes.ts                      # API routes
docs/
  index.html                     # GitHub Pages landing page
  editor.html                    # Static character editor
  GAME_SERVER_DEPLOYMENT.md      # Server deployment guide
```

## Controls

| Action | Keyboard | Mouse | Gamepad |
|--------|----------|-------|---------|
| Move | A/D | — | Left Stick / D-Pad |
| Jump | W | — | Y |
| Melee 1 | Q | — | A |
| Melee 2 | E (ground) | — | X |
| Dash Attack | — | LMB | RT |
| Rescue Roll | W + LMB | W + LMB | — |
| Dodge Roll | Double-tap A/D (AA or DD) | — | Double-tap Left/Right |
| Drop Through Floating Platforms | Double-tap S (SS) | — | Double-tap Down |
| Block / Parry | — | RMB | LT |
| Ranged | F | — | B |
| Air Alt Ranged | E (forward) / E+S (down-angle) while airborne | — | — |
| Up Special | W + Q/E | — | Up + A |
| Down Special | S + Q/E | — | Down + A |
| Super | R | — | RB |

## License

MIT
