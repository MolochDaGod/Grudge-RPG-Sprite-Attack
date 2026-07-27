# VFX / Effects Deploy Pipeline (Sprite Attack)

Production path for **slash, impact, and combat VFX** used by `#fighter` and turn-based battle.

## Sources

| Layer | URL / path |
|-------|------------|
| Catalog JSON | `https://info.grudge-studio.com/api/v1/effectSprites.json` |
| Same-origin catalog | `/cdn-api/effects.json` (Vercel rewrite / Vite proxy) |
| Effect binaries | `/cdn-effects/*` → `info.grudge-studio.com/sprites/effects/*` |
| Local strips | `/fighter2d/effects/*` (Knight/Swordsman split effects, slash_arc) |

## Code

| Module | Role |
|--------|------|
| `client/src/lib/vfxLibrary.ts` | Load catalog, multi-row sheets, pure-VFX guard |
| `client/src/lib/vfxPipeline.ts` | Boot warm-cache, multi-slash burst plans, range tuning |
| `client/src/lib/defaultVfx.ts` | Per-character default swing/hit IDs |
| `scripts/verify-vfx-pipeline.mjs` | Prebuild gate |

## Commands

```bash
npm run vfx:verify      # catalog + CDN HEAD checks
npm run prebuild        # runs verify before vite build
npm run deploy:check    # verify + full production build
```

## Deploy

1. Push `main` → Vercel project `grudge-rpg-sprite-attack`
2. Env already includes `VITE_INFO_BASE_URL`, `VITE_EFFECTS_CATALOG_URL`
3. Rewrites in `vercel.json` must keep `/cdn-effects/:path*` and `/cdn-api/effects.json`
4. CSP `connect-src` / `img-src` must allow `info.grudge-studio.com`

## Runtime boot

```ts
import { bootVfxPipeline } from "@/lib/vfxPipeline";
void bootVfxPipeline(); // fighter match start + battle mount
```

## Never

- Do not use character body sheets (`/fighter2d/characters/…`) as slash/impact
- Do not block build on optional remote IDs — local fallbacks + CDN aliases cover combat
