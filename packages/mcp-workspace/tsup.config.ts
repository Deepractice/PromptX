import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'mcp-server': 'src/bin/mcp-server.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  target: 'node18',
  outDir: 'dist',
  noExternal: ['@promptx/logger', '@modelcontextprotocol/sdk'],
});
