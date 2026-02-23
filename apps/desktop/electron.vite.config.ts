import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import path, { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'

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

// 复制 web-ui 静态文件的插件（含 agentxjs browser bundle）
const copyWebUiPlugin = () => ({
  name: 'copy-web-ui',
  generateBundle() {
    const outputDir = resolve(__dirname, 'out/main/web-ui')
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    // Copy index.html
    const sourcePath = resolve(__dirname, 'src/main/web-ui/index.html')
    if (existsSync(sourcePath)) {
      copyFileSync(sourcePath, resolve(outputDir, 'index.html'))
      console.log('Copied web-ui/index.html to main output')
    }

    // Bundle agentxjs browser entry with all deps into a single ESM file
    try {
      const esbuildBin = resolve(__dirname, '../../node_modules/.bin/esbuild')
      const entryPoint = resolve(__dirname, 'node_modules/agentxjs/dist/browser.js')
      const outFile = resolve(outputDir, 'agentxjs.js')
      // Use workspace root as node_modules resolution base so @agentxjs/* deps are found
      execSync(
        `"${esbuildBin}" "${entryPoint}" --bundle --format=esm --platform=browser --outfile="${outFile}"`,
        { cwd: resolve(__dirname, '../..') }
      )
      console.log('Bundled agentxjs browser bundle to web-ui output')
    } catch (e) {
      console.warn('Could not bundle agentxjs browser bundle:', e)
    }
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
      copyI18nPlugin(),
      copyWebUiPlugin()
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
    },
    server: {
      port: 3000
    }
  }
})