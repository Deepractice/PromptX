# @promptx/resource

## 1.15.0

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.15.0

## 1.14.2

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.14.2

## 1.14.1

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.14.1

## 1.14.0

### Patch Changes

- [#311](https://github.com/Deepractice/PromptX/pull/311) [`801fc4e`](https://github.com/Deepractice/PromptX/commit/801fc4edb1d99cf079baeecbb52adf7d2a7e404e) Thanks [@deepracticexs](https://github.com/deepracticexs)! - fix(Windows): Remove emoji from console output to fix Windows encoding issues

  - Remove all emoji characters from CLI command descriptions and help text
  - Remove emoji from console log messages across all TypeScript files
  - Fix Windows console emoji display issues reported in #310
  - Apply Occam's razor principle: simplify by removing complexity source
  - Maintain functionality while improving cross-platform compatibility

  This change ensures that Windows users no longer see garbled emoji characters in the console output when using the desktop application.

- Updated dependencies []:
  - @promptx/logger@1.14.0

## 1.13.0

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.13.0

## 1.12.0

### Minor Changes

- [`2c503d8`](https://github.com/Deepractice/PromptX/commit/2c503d80bb09511ab94e24b015a5c21dea8d4d9b) Thanks [@deepracticexs](https://github.com/deepracticexs)! - ## @promptx/resource

  ### 新功能

  - 添加 `promptx-log-viewer` 工具，用于查询和分析 PromptX 系统日志
    - 支持时间范围查询（相对时间如 "30m", "2h" 或绝对时间）
    - 支持日志级别过滤（trace, debug, info, warn, error, fatal）
    - 支持关键词、包名、文件名、进程 ID 等多维度过滤
    - 返回结果同时包含 UTC 时间和本地时间显示
    - 专为 AI 诊断系统问题设计，返回结构化 JSON 数据

  ### 改进

  - 修复 Luban 角色的工具创建路径文档，明确用户级工具存储在 `resource/tool/` 目录

  ## @promptx/logger

  ### 修复

  - 优化 Electron 环境下的日志处理，避免 worker thread 问题
  - 改进日志格式，确保与 promptx-log-viewer 工具的兼容性

  ## 其他改进

  ### 构建系统

  - 更新 Turbo 配置，添加 `resources/**` 和 `scripts/**` 到构建输入监控
  - 确保资源文件修改能正确触发重新构建，避免缓存问题

  ### Git Hooks

  - 修复 Windows Git Bash 环境下 lefthook commit-msg 钩子的兼容性问题
  - 简化 commitlint 命令，避免多行脚本解析错误

### Patch Changes

- Updated dependencies [[`2c503d8`](https://github.com/Deepractice/PromptX/commit/2c503d80bb09511ab94e24b015a5c21dea8d4d9b)]:
  - @promptx/logger@1.12.0

## 1.11.0

### Patch Changes

- Updated dependencies [[`c3c9c45`](https://github.com/Deepractice/PromptX/commit/c3c9c451b9cdd5abaa5c1d51abe594ad14841354)]:
  - @promptx/logger@1.11.0

## 1.10.1

### Patch Changes

- Fix release workflow and prepare for beta release

  - Update changeset config to use unified versioning for all packages
  - Fix resource discovery and registry generation bugs
  - Update pnpm-lock.yaml for CI compatibility
  - Prepare for semantic versioning with beta releases
  - Fix npm publishing conflicts by using proper versioning strategy
