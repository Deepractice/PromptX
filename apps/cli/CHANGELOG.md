# @promptx/cli

## 1.17.3

### Patch Changes

- Updated dependencies [[`e409b52`](https://github.com/Deepractice/PromptX/commit/e409b522bf9694547bd18095e048374d72dde120)]:
  - @promptx/core@1.17.3
  - @promptx/mcp-server@1.17.3
  - @promptx/logger@1.17.3

## 1.17.2

### Patch Changes

- [#359](https://github.com/Deepractice/PromptX/pull/359) [`f5891a6`](https://github.com/Deepractice/PromptX/commit/f5891a60d66dfaabf56ba12deb2ac7326d288025) Thanks [@deepracticexs](https://github.com/deepracticexs)! - refactor: Replace Chinese log messages with English

  - Replace all Chinese console and logger messages with English equivalents
  - Improve international accessibility of the codebase
  - Prevent potential character encoding issues
  - Maintain same log levels and debugging context

- Updated dependencies [[`f5891a6`](https://github.com/Deepractice/PromptX/commit/f5891a60d66dfaabf56ba12deb2ac7326d288025)]:
  - @promptx/core@1.17.2
  - @promptx/mcp-server@1.17.2
  - @promptx/logger@1.17.2

## 1.17.1

### Patch Changes

- Updated dependencies [[`c7ed9a1`](https://github.com/Deepractice/PromptX/commit/c7ed9a113e0465e2955ad1d11ad511a2f327440d)]:
  - @promptx/core@1.17.1
  - @promptx/mcp-server@1.17.1
  - @promptx/logger@1.17.1

## 1.17.0

### Patch Changes

- Updated dependencies []:
  - @promptx/core@1.17.0
  - @promptx/logger@1.17.0
  - @promptx/mcp-server@1.17.0

## 1.16.0

### Minor Changes

- [#347](https://github.com/Deepractice/PromptX/pull/347) [`eb7a2be`](https://github.com/Deepractice/PromptX/commit/eb7a2be1ef4fffed97a9dc20eaaacd9065fc0e01) Thanks [@deepracticexs](https://github.com/deepracticexs)! - 重命名 Welcome 为 Discover，更准确地反映功能定位

  ### 主要更改

  #### @promptx/core

  - 将 `WelcomeCommand` 重命名为 `DiscoverCommand`
  - 将 `WelcomeHeaderArea` 重命名为 `DiscoverHeaderArea`
  - 将 `welcome` 文件夹重命名为 `discover`
  - 更新常量 `WELCOME` 为 `DISCOVER`
  - 更新状态 `welcome_completed` 为 `discover_completed`

  #### @promptx/mcp-server

  - 将 `welcomeTool` 重命名为 `discoverTool`
  - 更新工具描述，强调"探索 AI 潜能"的核心价值
  - 添加 `focus` 参数支持，允许按需筛选角色或工具
  - 更新 action 工具中的相关引用

  #### @promptx/cli

  - CLI 命令从 `welcome` 改为 `discover`
  - 更新帮助文档和示例

  #### @promptx/desktop

  - 更新 `PromptXResourceRepository` 中的相关引用

  ### 影响

  - **Breaking Change**: CLI 命令 `promptx welcome` 需要改为 `promptx discover`
  - MCP 工具名从 `promptx_welcome` 改为 `promptx_discover`
  - 所有文档和注释中的 Welcome 相关内容都已更新

### Patch Changes

- Updated dependencies [[`68b8304`](https://github.com/Deepractice/PromptX/commit/68b8304a5d5e7569f3534f6cfe52348c457b0ce9), [`57f430d`](https://github.com/Deepractice/PromptX/commit/57f430d2af2c904f74054e623169963be62783c5), [`eb7a2be`](https://github.com/Deepractice/PromptX/commit/eb7a2be1ef4fffed97a9dc20eaaacd9065fc0e01)]:
  - @promptx/mcp-server@1.16.0
  - @promptx/core@1.16.0
  - @promptx/logger@1.16.0

## 1.15.1

### Patch Changes

- Updated dependencies [[`7a80317`](https://github.com/Deepractice/PromptX/commit/7a80317ba1565a9d5ae8de8eab43cb8c37b73eb5)]:
  - @promptx/core@1.15.1
  - @promptx/mcp-server@1.15.1
  - @promptx/logger@1.15.1

## 1.15.0

### Patch Changes

- Updated dependencies [[`16ee7ee`](https://github.com/Deepractice/PromptX/commit/16ee7eec70925629dd2aec47997f3db0eb70c74c)]:
  - @promptx/mcp-server@1.15.0
  - @promptx/core@1.15.0
  - @promptx/logger@1.15.0

## 1.14.2

### Patch Changes

- Updated dependencies [[`94483a8`](https://github.com/Deepractice/PromptX/commit/94483a8426e726e76a7cb7700f53377ae29d9aec)]:
  - @promptx/mcp-server@1.14.2
  - @promptx/core@1.14.2
  - @promptx/logger@1.14.2

## 1.14.1

### Patch Changes

- Updated dependencies [[`4a6ab6b`](https://github.com/Deepractice/PromptX/commit/4a6ab6b579101921ba29f2a551bb24c75f579de1), [`abcff55`](https://github.com/Deepractice/PromptX/commit/abcff55b916b7db73e668023a964fba467cc8cb6)]:
  - @promptx/core@1.14.1
  - @promptx/mcp-server@1.14.1
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

- Updated dependencies [[`cde78ed`](https://github.com/Deepractice/PromptX/commit/cde78ed4a1858df401596e8b95cae91d8c80ef7a), [`801fc4e`](https://github.com/Deepractice/PromptX/commit/801fc4edb1d99cf079baeecbb52adf7d2a7e404e)]:
  - @promptx/core@1.14.0
  - @promptx/mcp-server@1.14.0
  - @promptx/logger@1.14.0

## 1.13.0

### Patch Changes

- Updated dependencies [[`d60e63c`](https://github.com/Deepractice/PromptX/commit/d60e63c06f74059ecdc5435a744c57c1bfe7f7d0)]:
  - @promptx/core@1.13.0
  - @promptx/mcp-server@1.13.0
  - @promptx/logger@1.13.0

## 1.12.0

### Patch Changes

- Updated dependencies [[`2c503d8`](https://github.com/Deepractice/PromptX/commit/2c503d80bb09511ab94e24b015a5c21dea8d4d9b)]:
  - @promptx/logger@1.12.0
  - @promptx/core@1.12.0
  - @promptx/mcp-server@1.12.0

## 1.11.0

### Patch Changes

- Updated dependencies [[`c3c9c45`](https://github.com/Deepractice/PromptX/commit/c3c9c451b9cdd5abaa5c1d51abe594ad14841354)]:
  - @promptx/mcp-server@1.11.0
  - @promptx/logger@1.11.0
  - @promptx/core@1.11.0

## 1.10.1

### Patch Changes

- Fix release workflow and prepare for beta release

  - Update changeset config to use unified versioning for all packages
  - Fix resource discovery and registry generation bugs
  - Update pnpm-lock.yaml for CI compatibility
  - Prepare for semantic versioning with beta releases
  - Fix npm publishing conflicts by using proper versioning strategy

- Updated dependencies []:
  - @promptx/core@1.10.1
  - @promptx/logger@1.10.1
  - @promptx/mcp-server@1.10.1
