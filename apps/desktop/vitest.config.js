"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("vitest/config");
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
var __dirname = (0, node_url_1.fileURLToPath)(new URL('.', import.meta.url));
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['tests/**', '*.config.ts', 'dist/**'],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80
            }
        },
        testTimeout: 10000,
        hookTimeout: 10000
    },
    resolve: {
        alias: {
            '@promptx/core': (0, node_path_1.resolve)(__dirname, '../../src'),
            '@domain': (0, node_path_1.resolve)(__dirname, './src/domain'),
            '@application': (0, node_path_1.resolve)(__dirname, './src/application'),
            '@infrastructure': (0, node_path_1.resolve)(__dirname, './src/infrastructure'),
            '@presentation': (0, node_path_1.resolve)(__dirname, './src/presentation'),
            '@shared': (0, node_path_1.resolve)(__dirname, './src/shared')
        }
    }
});
