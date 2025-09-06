import { defineConfig } from 'tsup'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  entry: {
    index: 'src/index.js',
    cognition: 'src/cognition/index.js',
    resource: 'src/resource/index.js',
    toolx: 'src/toolx/index.js'
  },
  format: ['cjs'], // 只构建 CommonJS
  dts: false, // 不生成类型声明（因为是 JS 项目）
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true, // 自动添加 __dirname, __filename, import.meta.url 等 shims
  cjsInterop: true, // 更好的 CJS/ESM 互操作性
  platform: 'node', // 重要：指定平台为 node
  target: 'node14',
  external: [
    '@modelcontextprotocol/sdk',
    '@promptx/logger',
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
  noExternal: [], // 不强制打包任何模块
  esbuildOptions(options) {
    options.alias = {
      '~': path.resolve(__dirname, 'src')
    }
  },
  onSuccess: async () => {
    // 复制 ESM wrapper 文件
    console.log('Copying ESM wrapper...')
    fs.copyFileSync('./src/index.esm.js', './dist/index.mjs')
    console.log('ESM wrapper copied to dist/index.mjs')
    
    // 复制 PnpmWrapper 文件（需要独立存在）
    console.log('Copying PnpmWrapper.js...')
    fs.copyFileSync('./src/toolx/PnpmWrapper.js', './dist/PnpmWrapper.js')
    console.log('PnpmWrapper.js copied to dist/')
  }
})