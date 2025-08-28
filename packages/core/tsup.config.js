import { defineConfig } from 'tsup'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  entry: {
    index: 'src/index.js',
    cognition: 'src/cognition/index.js',
    resource: 'src/resource/index.js',
    toolx: 'src/toolx/index.js'
  },
  format: ['cjs', 'esm'],
  dts: false, // 不生成类型声明（因为是 JS 项目）
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true, // 自动添加 __dirname, __filename, import.meta.url 等 shims
  cjsInterop: true, // 更好的 CJS/ESM 互操作性
  target: 'node14',
  external: [
    '@modelcontextprotocol/sdk',
    '@promptx/resource',
    'chevrotain',
    'chalk',
    'js-yaml',
    'mermaid',
    'zod',
    'fastmcp',
    'fs-extra',
    // ... 其他外部依赖
  ],
  noExternal: [], // 确保所有本地模块都被打包
  esbuildOptions(options) {
    options.alias = {
      '~': path.resolve(__dirname, 'src')
    }
  }
})