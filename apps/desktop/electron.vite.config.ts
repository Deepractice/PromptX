import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

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
    root: resolve(__dirname, 'src/renderer'),
    build: {
      rollupOptions: {
        input: {
          resources: resolve(__dirname, 'src/renderer/resources.html')
        }
      }
    },
    resolve: {
      alias: {
        '~': resolve(__dirname, 'src')
      }
    }
  }
})