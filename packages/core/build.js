const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  // 清理 dist 目录
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
  }
  fs.mkdirSync('dist', { recursive: true });

  // 定义入口点
  const entryPoints = {
    'index': './src/index.js',
    'cognition': './src/cognition/index.js',
    'resource': './src/resource/index.js',
    'mcp': './src/mcp/index.js',
    'toolx': './src/toolx/index.js'
  };

  // 构建配置
  const baseConfig = {
    bundle: true,
    platform: 'node',
    target: 'node14',
    alias: {
      '~': path.resolve(__dirname, 'src')
    },
    external: [
      '@modelcontextprotocol/sdk',
      'chevrotain',
      'chalk',
      'js-yaml',
      'mermaid',
      'zod',
      'fastmcp',
      'fs-extra',
      'pnpm',
      'sury',
      'effect',
      '@valibot/to-json-schema',
      'fs',
      'path',
      'crypto',
      'os',
      'child_process',
      'util',
      'stream',
      'events',
      'http',
      'https',
      'net',
      'url'
    ],
    sourcemap: true,
    metafile: true
  };

  // 为每个入口点构建 CommonJS 和 ESM 版本
  for (const [name, entry] of Object.entries(entryPoints)) {
    console.log(`Building ${name}...`);
    
    // CommonJS
    await esbuild.build({
      ...baseConfig,
      entryPoints: [entry],
      outfile: `dist/${name}.js`,
      format: 'cjs'
    });

    // ESM
    await esbuild.build({
      ...baseConfig,
      entryPoints: [entry],
      outfile: `dist/${name}.mjs`,
      format: 'esm'
    });
  }

  console.log('Build completed successfully!');
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});