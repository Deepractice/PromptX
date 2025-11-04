import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import path, { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import { copyFileSync, mkdirSync, existsSync } from 'fs'

// 复制i18n文件的插件
const copyI18nPlugin = () => ({
  name: 'copy-i18n',
  generateBundle() {
    // 确保输出目录存在
    const outputDir = resolve(__dirname, 'out/main/i18n')
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }
    
    // 复制翻译文件
    const sourceDir = resolve(__dirname, 'src/main/i18n')
    const files = ['en.json', 'zh-CN.json']
    
    files.forEach(file => {
      const sourcePath = resolve(sourceDir, file)
      const targetPath = resolve(outputDir, file)
      if (existsSync(sourcePath)) {
        copyFileSync(sourcePath, targetPath)
        console.log(`Copied ${file} to main output`)
      }
    })
  }
})

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: [
          // Don't externalize our internal alias
          '~/**'
        ]
      }),
      copyI18nPlugin()
    ],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/bootstrap.ts')
        },
        output: {
          format: 'es'
        }
      },
      // Ensure aliases are resolved in the build
      lib: {
        entry: resolve(__dirname, 'src/main/bootstrap.ts'),
        formats: ['es']
      }
    },
    resolve: {
      alias: {
        '~': resolve(__dirname, 'src')
      }
    }
  },
  preload: {
    plugins: [
      externalizeDepsPlugin()
    ],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        },
        output: {
          format: 'cjs',  // Preload must be CommonJS
          entryFileNames: 'preload.cjs'
        }
      }
    },
    resolve: {
      alias: {
        '~': resolve(__dirname, 'src')
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/view'),
    publicDir: resolve(__dirname, 'public'),
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/view/index.html')
        }
      },
    },
    plugins: [react(), tailwindcss()] as any,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/view')
      }
    }
  }
})