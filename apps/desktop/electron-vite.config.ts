import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/main',
      lib: {
        entry: resolve(__dirname, 'src/main.ts'),
        formats: ['es']
      },
      rollupOptions: {
        output: {
          format: 'es'
        }
      }
    },
    resolve: {
      alias: {
        '@promptx/core': resolve(__dirname, '../../src'),
        '@domain': resolve(__dirname, 'src/domain'),
        '@application': resolve(__dirname, 'src/application'),
        '@infrastructure': resolve(__dirname, 'src/infrastructure'),
        '@presentation': resolve(__dirname, 'src/presentation'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  },
  
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload.ts')
        },
        output: {
          format: 'es'
        }
      }
    }
  },
  
  renderer: {
    build: {
      outDir: 'dist/renderer',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html')
        }
      }
    }
  }
})