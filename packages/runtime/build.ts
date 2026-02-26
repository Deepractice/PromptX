/**
 * Bun Build Script for @agentxjs/runtime
 * ESM-only server build
 */

import { dts } from "bun-dts";

const entrypoints = ["src/index.ts"];
const outdir = "./dist";

await Bun.$`rm -rf ${outdir}`;

console.log("🚀 Building @agentxjs/runtime (ESM-only, Node.js target)\n");

const result = await Bun.build({
  entrypoints,
  outdir,
  format: "esm",
  target: "node",
  sourcemap: "external",
  minify: false,
  external: ["@agentxjs/*", "@anthropic-ai/*", "rxjs", "db0", "unstorage", "ws"],
  plugins: [dts()],
});

if (!result.success) {
  console.error("❌ Build failed:");
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log(`✅ ESM build: ${result.outputs.length} files`);
console.log(`🎉 Build complete!`);
