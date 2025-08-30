import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/bin/mcp-server.ts'],
  format: ['esm'],
  dts: false, // 暂时禁用，有类型错误需要修复
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
    'zod',
    'express',
    '@modelcontextprotocol/sdk',
    'crypto'
  ]
})