# Grudge Smash

A 2D sprite-based fighting game with 39 playable characters across 3 factions, AI opponents, online PvP, elliptical body collision, a stamina system, startup cinematic intro, and Smash Bros-style super attacks.

**Play Now:** [grudge-rpg-sprite-attack.vercel.app](https://grudge-rpg-sprite-attack-grudgenexus.vercel.app)
**Landing Page:** [molochdagod.github.io/Grudge-RPG-Sprite-Attack](https://molochdagod.github.io/Grudge-RPG-Sprite-Attack)
**Character Editor:** [#toonadmin](https://grudge-rpg-sprite-attack-grudgenexus.vercel.app/#toonadmin)
**PvP Server:** [grudge-pvp-server-production.up.railway.app](https://grudge-pvp-server-production.up.railway.app)

## Features

### 39 Playable Characters across 3 Factions
Each character belongs to a faction with its own emblem and color identity:
- **Crusade** (blue/silver) -- Knight, Archer, Wizard, Swordsman, Priest, Knight Templar, Barbarian Ranger, Barbarian, Silver Knight, Pirate Captain, Crossbowman, Fire Knight, Human Ranger, Human Mage, Water Priestess, Martial Hero, Loreon Knight
- **Legion** (red/black) -- Orc, Armored Orc, Elite Orc, Armored Skeleton, Dark Knight, Necromancer, Evil Wizard, Nightborne, Shardsoul Slayer
- **Fabled** (green) -- Elf Ranger, Werebear, Werewolf, Fire Wizard, Lightning Mage, Leaf Ranger, Wind Hashashin, Dwarf Mage, Dwarf Ranger, Arcane Archer, Elf Mage, Wanderer Magician

Faction emblems display on the character select grid and in the fight HUD.

### Combat System
- **Melee 1** (Q) — default combo starter with body-part hitboxes (head 1.3x, body 1x, legs 0.8x)
- **Melee 2** (E ground) — alternate strike animation with differentiated VFX
- **Dash Attack** (LMB) — lunge forward, distance scales with stamina (up to half-screen)
- **Rescue Roll** (W + LMB or double-tap Spacebar) — roll toward mouse; damages on collision. One use per airborne (resets on landing, like Smash up-B). If blocked/parried, attacker is pushed away at opposite angle and rescue stays locked
- **Air Slam** — attack while falling for 2.5x gravity dive-bomb with damage through descent
- **Dodge Roll** (AA / DD) — double-tap movement for invulnerable dodge with quick reposition (ground + air)
- **Platform Drop** (SS) — double-tap down to fall through floating one-way platforms (not main floor)
- **Block / Parry** (RMB) — counter stance that reflects damage
- **Ranged** (F) — character-specific projectiles with sprite animations
- **Air Ranged Alt** (E in air) — shoots projectile straight forward; **E+S in air** shoots angled downward
- **Up Special** (W+Q/E) — aerial dash strike with strong upward knockback
- **Down Special** (S+Q/E) — counter stance with downward spike knockback
- **Super Attack** (R) — Smash Bros-style cutscene when meter is full
- **Directional Knockback** — up-special launches upward, down-special spikes, dash sends forward, headshots launch at upward angle
- **Elliptical Body Collision** -- body collider is an ellipse that follows the character outline, naturally excluding weapon reach. Weapon hitbox is a separate rect active only during attack frames
- **Bouncing Bomb** (E+S in air) -- down-angle projectile that bounces twice then detonates for 75% splash damage within 120px
- **Debug Collision Overlay** (backtick key) -- toggle visible body ellipses (yellow), damage sub-zones (head/torso/legs dashed), weapon hitbox (pink, attack frames only), and foot anchor dots

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

### 143+ VFX from ObjectStore
Dynamically fetched from ObjectStore API at runtime (`/api/v1/effectSprites.json`):
- 19 pixel magic effects (spellcasts, auras, debuffs up to 121 frames)
- 15 color slash variants (red/blue/green/purple/orange in sm/md/lg)
- 20+ retro impact effects (fire, lightning, ice, holy, dark, nature)
- 5 bullet impact colors (320 frames each)
- Custom effects: arcane bolt, flamestrike, frostbolt, healing wave, demon slashes
- Local fallback sprites for offline play
- All VFX assignable per-character per-action via ToonAdmin Pro

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

### ToonAdmin Pro -- Sprite Animation Studio
Professional editor at `#toonadmin` for all 39 characters:
- **Canvas Stage** -- 800x500 Canvas 2D with grid floor, main platform, floating platform
- **Live Collision Overlay** -- body ellipse, head/torso/legs damage zones, weapon hitbox (matches game engine exactly)
- **Frame-by-Frame Scrubber** -- clickable timeline, arrow keys step, red playhead, speed 0.25x/0.5x/1x/2x
- **Onion Skinning** -- ghost previous (red) and next (blue) frames for animation continuity
- **VFX Browser** -- searchable grid of 143+ effects with category filter tabs
- **Live VFX Preview** -- assigned hit/swing VFX play on canvas during attack previews
- **Per-Action VFX Assignment** -- hit VFX + swing VFX dropdowns for attack/special/cast/block
- **Server Persistence** -- saves to server + localStorage, sync status indicator
- Remap animations, adjust hold/loop, edit ATK/SPD/Super stats
- Import/Export JSON configs, faction badge per character

## Tech Stack

- **Frontend** — React 18, Vite 6, Tailwind CSS, Canvas 2D, Howler.js (audio)
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
    pages/GrudgeFighter2D.tsx    # Main fighter game (ellipse collision, factions, debug overlay)
    pages/ToonAdmin.tsx          # ToonAdmin Pro sprite animation studio
    hooks/usePvP.ts              # Socket.io PvP client hook
    lib/grudaRoster.ts           # 39-character roster data with faction assignments
    lib/factions.ts              # Faction definitions (Crusade, Legion, Fabled)
    lib/gameSounds.ts            # Howler.js sound system (20 SFX types, pooled, pitch-randomized)
    lib/vfxLibrary.ts            # Dynamic VFX library (143+ from ObjectStore API)
    lib/charConfig.ts            # Character config persistence (server + localStorage)
  public/fighter2d/
    characters/                  # 39 character sprite folders
    effects/                     # Attack effect sprite strips
    projectiles/                 # Arrow, fireball, bullet, axe sprites
    image/factions/              # Faction emblem PNGs (crusade, legion, fabled)
    sfx/                         # Game sound effects (MP3)
  public/startup-intro.mp4       # Startup cinematic
  public/landing-bg.jpg          # Landing page hero background
server/
  pvp.ts                         # Socket.io PvP room server
  index.ts                       # Express entry point
  routes.ts                      # API routes + char-config persistence
data/
  char-configs.json              # Server-persisted character editor configs
docs/
  index.html                     # GitHub Pages landing page
  editor.html                    # Static character editor
  GAME_SERVER_DEPLOYMENT.md      # Server deployment guide
```

## Controls

| Action | Keyboard | Mouse | Gamepad |
|--------|----------|-------|---------|
| Move | A/D | — | Left Stick / D-Pad |
| Jump | W or Spacebar | — | Y |
| Melee 1 | Q | — | A |
| Melee 2 | E (ground) | — | X |
| Dash Attack | — | LMB | RT |
| Rescue Roll | W + LMB or double-tap Spacebar | toward mouse | — |
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
