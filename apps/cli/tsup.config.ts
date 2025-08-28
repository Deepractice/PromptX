import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/bin/promptx.ts'],
  format: ['esm'],
  dts: false, // 不需要类型定义文件
  sourcemap: true,
  clean: true,
  target: 'es2020',
  outDir: 'dist',
  splitting: false,
  shims: true, // 添加必要的 shims
  external: [
    '@promptx/core',
    '@promptx/mcp-server',
    '@promptx/logger'
  ]
})