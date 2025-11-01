import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import path, { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import type { PluginOption } from 'vite'  // 新增：统一插件类型
export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: [
          // Don't externalize our internal alias
          '~/**'
        ]
      })
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