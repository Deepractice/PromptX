import { defineConfig } from 'tsup'
import { copyFileSync, mkdirSync, cpSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // 暂时禁用，有类型错误
  sourcemap: true,
  clean: true,
  target: 'es2020',
  outDir: 'dist',
  external: [
    'fs',
    'path'
  ],
  async onSuccess() {
    try {
      // 先生成注册表
      console.log('🔍 Discovering resources...')
      execSync('node scripts/generate-registry.js', { stdio: 'inherit' })
      
      // 复制package.json到dist（与编译后的文件同级）
      console.log('📦 Copying package.json to dist...')
      copyFileSync('package.json', 'dist/package.json')
      console.log('✓ Package.json copied successfully')
      
      // 复制资源文件到 dist
      console.log('📦 Copying resources to dist...')
      if (existsSync('resources')) {
        cpSync('resources', 'dist/resources', { recursive: true })
        console.log('✓ Resources copied successfully')
      } else {
        console.warn(' Resources directory not found')
      }
      
      // registry.json 已经直接生成到 dist 目录，无需复制
      if (existsSync('dist/registry.json')) {
        console.log('✓ Registry generated successfully in dist/')
      } else {
        console.warn('⚠ Registry file not found in dist/')
      }
      
      console.log('Build complete with resources')
    } catch (error) {
      console.error('Error during onSuccess:', error)
      // 不要抛出错误，继续构建过程
    }
  }
})