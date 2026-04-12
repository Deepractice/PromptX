import { defineConfig } from 'tsup';

// CJS shims required because pino (bundled via @promptx/logger noExternal)
// uses require/__dirname internally, which are not defined in ESM context.
const cjsShims = [
  "import { createRequire } from 'module';",
  "import { fileURLToPath } from 'url';",
  "import { dirname } from 'path';",
  "const require = createRequire(import.meta.url);",
  "const __filename = fileURLToPath(import.meta.url);",
  "const __dirname = dirname(__filename);"
].join('\n');

const sharedConfig = {
  format: ['esm'] as const,
  splitting: false,
  sourcemap: false,
  clean: false,
  target: 'node18' as const,
  outDir: 'dist',
  noExternal: ['@promptx/logger', '@modelcontextprotocol/sdk'],
};

export default defineConfig([
  // Library build: no special env overrides
  {
    ...sharedConfig,
    entry: { 'index': 'src/index.ts' },
    dts: true,
    clean: true,
    banner: { js: cjsShims },
  },
  // MCP server binary: disable pino worker threads.
  // pino-pretty is not bundled (worker threads require filesystem resolution),
  // so in a deployed/standalone environment it cannot be found.
  // PROMPTX_NO_WORKERS=true switches the logger to sync/file mode (no pino-pretty).
  {
    ...sharedConfig,
    entry: { 'mcp-server': 'src/bin/mcp-server.ts' },
    dts: true,
    banner: {
      js: cjsShims + "\nif (!process.env.PROMPTX_NO_WORKERS) process.env.PROMPTX_NO_WORKERS = 'true';"
    },
  },
]);
