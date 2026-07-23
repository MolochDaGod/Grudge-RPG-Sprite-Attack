import fs from "fs";
import path from "path";

function pngSize(p) {
  const b = fs.readFileSync(p);
  if (b[0] !== 0x89) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const root = "client/public/fighter2d/characters";
const folders = fs.readdirSync(root);
const out = [];
for (const f of folders) {
  const dir = path.join(root, f);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir).filter((x) => x.endsWith(".png"))) {
    const s = pngSize(path.join(dir, file));
    if (!s) continue;
    const square = s.w % s.h === 0 ? s.w / s.h : null;
    out.push({ folder: f, file, w: s.w, h: s.h, square });
  }
}

const roster = fs.readFileSync("client/src/lib/grudaRoster.ts", "utf8");
const charRe =
  /\{\s*id:"([^"]+)"[\s\S]*?folder:"([^"]+)"[\s\S]*?frameSize:(\d+)[\s\S]*?(?=,\s*\n\s*\{\s*id:|,\s*\n\];)/g;
const charBlocks = [...roster.matchAll(charRe)];
console.log("chars found", charBlocks.length);

const mismatches = [];
const skipSlots = new Set([
  "atk",
  "spd",
  "superDmg",
  "role",
  "faction",
  "color",
  "name",
  "id",
  "folder",
  "frameSize",
  "renderScale",
  "renderScaleX",
  "renderScaleY",
  "effectFrames",
]);

for (const m of charBlocks) {
  const id = m[1];
  const folder = m[2];
  const frameSize = +m[3];
  const body = m[0];
  const anims = [...body.matchAll(/(\w+):\s*\["([^"]+)",\s*(\d+)\]/g)];
  for (const a of anims) {
    const slot = a[1];
    const file = a[2];
    const frames = +a[3];
    if (skipSlots.has(slot)) continue;
    const info = out.find((o) => o.folder === folder && o.file === file);
    if (!info) {
      mismatches.push({ id, folder, slot, file, frames, issue: "MISSING" });
      continue;
    }
    let actualFrames = null;
    if (info.w % frameSize === 0 && (info.h === frameSize || info.h % frameSize === 0)) {
      actualFrames = info.w / frameSize;
    } else if (info.square != null) {
      actualFrames = info.square;
    } else {
      // Try common frame widths equal to height or frameSize
      for (const fw of [frameSize, info.h, 48, 64, 80, 96, 100, 128, 150, 180, 190, 200]) {
        if (info.w % fw === 0 && info.h % (info.h) === 0) {
          const cols = info.w / fw;
          if (Number.isInteger(cols) && cols >= 1 && cols <= 80) {
            actualFrames = cols;
            break;
          }
        }
      }
    }
    if (actualFrames != null && actualFrames !== frames) {
      mismatches.push({
        id,
        folder,
        slot,
        file,
        declared: frames,
        actual: actualFrames,
        w: info.w,
        h: info.h,
        frameSize,
      });
    }
  }
}

console.log(JSON.stringify(mismatches, null, 2));
console.log("total mismatches", mismatches.length);

// Effects dims
const efxRoot = "client/public/fighter2d/effects";
console.log("\n=== Local effect sheets ===");
for (const file of fs.readdirSync(efxRoot).filter((x) => x.endsWith(".png"))) {
  const s = pngSize(path.join(efxRoot, file));
  if (s) console.log(`${file}: ${s.w}x${s.h}`);
}
