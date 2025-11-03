import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

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
            },
            preserveSymlinks: true
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
                    format: 'cjs', // Preload must be CommonJS
                    entryFileNames: 'preload.cjs'
                }
            }
        },
        resolve: {
            alias: {
                '~': resolve(__dirname, 'src')
            },
            preserveSymlinks: true
        }
    },
    renderer: {
        root: resolve(__dirname, 'src/view'),
        build: {
            rollupOptions: {
                input: {
                    resources: resolve(__dirname, 'src/view/index.html')
                }
            }
        },
        resolve: {
            alias: {
                '~': resolve(__dirname, 'src')
            },
            preserveSymlinks: true
        }
    }
});
