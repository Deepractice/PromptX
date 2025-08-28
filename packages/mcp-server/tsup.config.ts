import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  outDir: 'dist',
  esbuildOptions(options) {
    // 配置别名解析
    options.alias = {
      '~': './src'
    }
  },
  // 不打包外部依赖
  external: [
    '@promptx/core',
    'fastmcp',
    'zod'
  ]
})