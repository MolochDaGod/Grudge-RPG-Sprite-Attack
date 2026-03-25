import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

await esbuild.build({
  entryPoints: [path.resolve(root, "server/index.ts")],
  outfile: path.resolve(root, "dist/index.cjs"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: true,
  // Keep node_modules external — they're installed in the Docker image
  packages: "external",
  // Resolve the @shared path alias used across the project
  alias: {
    "@shared": path.resolve(root, "shared"),
  },
  define: {
    "import.meta.dirname": "__dirname",
  },
  // Exclude the Vite dev server — only needed in development
  external: ["../vite.config"],
  logLevel: "info",
});

console.log("Server build complete → dist/index.cjs");
