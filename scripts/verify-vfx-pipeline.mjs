#!/usr/bin/env node
/**
 * verify-vfx-pipeline.mjs — production gate for effects catalog + CDN.
 * Run: node scripts/verify-vfx-pipeline.mjs
 * Exit 0 = deploy-ready; non-zero = fail CI/deploy.
 */

const INFO = process.env.VITE_INFO_BASE_URL || "https://info.grudge-studio.com";
const CATALOG =
  process.env.VITE_EFFECTS_CATALOG_URL ||
  `${INFO}/api/v1/effectSprites.json`;

const REQUIRED_PATHS = [
  "/sprites/effects/slash/slash_red_md.png",
  "/sprites/effects/slash/slash_red_lg.png",
  "/sprites/effects/hit_effect_1.png",
  "/sprites/effects/demon_slash_1.png",
  "/sprites/effects/pixel/smear_h1.png",
  "/sprites/effects/retro_impact/impactFireA.png",
  "/sprites/effects/custom/crit.png",
];

const REQUIRED_IDS = [
  "slashRedMd",
  "hitEffect1",
  "demonSlash1",
  "smearH1",
  "impactFireA",
  "critSlash",
];

async function headOk(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    if (r.ok) return true;
    const g = await fetch(url, { method: "GET" });
    return g.ok;
  } catch {
    return false;
  }
}

async function main() {
  const errors = [];
  console.log(`[vfx-pipeline] catalog ${CATALOG}`);

  let json;
  try {
    const res = await fetch(CATALOG);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    json = await res.json();
  } catch (e) {
    console.error(`[vfx-pipeline] FAIL catalog: ${e.message || e}`);
    process.exit(2);
  }

  const effects = json.effects || {};
  const count = Object.keys(effects).length;
  console.log(`[vfx-pipeline] effects entries: ${count}`);
  if (count < 50) errors.push(`catalog too small (${count})`);

  for (const id of REQUIRED_IDS) {
    if (!effects[id]) errors.push(`missing effect id: ${id}`);
    else console.log(`  ✓ id ${id}`);
  }

  for (const path of REQUIRED_PATHS) {
    const url = `${INFO}${path}`;
    const ok = await headOk(url);
    if (!ok) errors.push(`asset missing: ${url}`);
    else console.log(`  ✓ asset ${path}`);
  }

  // Local fighter strips (deploy bundle)
  const local = [
    "client/public/fighter2d/effects/slash_arc.png",
    "client/public/fighter2d/effects/slash_ranged.png",
    "client/public/fighter2d/effects/Knight-Attack01_Effect.png",
  ];
  const fs = await import("node:fs");
  for (const p of local) {
    if (!fs.existsSync(p)) errors.push(`local missing: ${p}`);
    else console.log(`  ✓ local ${p}`);
  }

  if (errors.length) {
    console.error("[vfx-pipeline] FAILED:");
    for (const e of errors) console.error("  -", e);
    process.exit(1);
  }
  console.log("[vfx-pipeline] OK — production effects ready");
  process.exit(0);
}

main();
