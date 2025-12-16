# @promptx/cli

## 1.27.6

### Patch Changes

- Updated dependencies [[`9bd7f80`](https://github.com/Deepractice/PromptX/commit/9bd7f807884288693c49cfa0b0bbec1e2ec8d0f1)]:
  - @promptx/core@1.27.6
  - @promptx/mcp-server@1.27.6
  - @promptx/logger@1.27.6

## 1.27.5

### Patch Changes

- Updated dependencies [[`e09b76d`](https://github.com/Deepractice/PromptX/commit/e09b76dcaf3e3e8c57cb9bb9f12d4133b3e665f5)]:
  - @promptx/logger@1.27.5
  - @promptx/core@1.27.5
  - @promptx/mcp-server@1.27.5

## 1.27.4

### Patch Changes

- Updated dependencies []:
  - @promptx/core@1.27.4
  - @promptx/logger@1.27.4
  - @promptx/mcp-server@1.27.4

## 1.27.3

### Patch Changes

- Updated dependencies []:
  - @promptx/core@1.27.3
  - @promptx/logger@1.27.3
  - @promptx/mcp-server@1.27.3

## 1.27.2

### Patch Changes

- Updated dependencies []:
  - @promptx/core@1.27.2
  - @promptx/logger@1.27.2
  - @promptx/mcp-server@1.27.2

## 1.27.1

### Patch Changes

- Updated dependencies []:
  - @promptx/core@1.27.1
  - @promptx/mcp-server@1.27.1
  - @promptx/logger@1.27.1

## 1.27.0

### Patch Changes

- Updated dependencies []:
  - @promptx/mcp-server@1.27.0
  - @promptx/core@1.27.0
  - @promptx/logger@1.27.0

## 1.26.0

### Patch Changes

- Updated dependencies [[`f33c42b`](https://github.com/Deepractice/PromptX/commit/f33c42b3195ba264d77e21aecf8c9775cbe48eb6), [`395f07f`](https://github.com/Deepractice/PromptX/commit/395f07f9429b5417f1ec2a233fb5d8d692b74ff7)]:
  - @promptx/core@1.26.0
  - @promptx/mcp-server@1.26.0
  - @promptx/logger@1.26.0

## 1.25.2

### Patch Changes

- Updated dependencies [[`01b9cd7`](https://github.com/Deepractice/PromptX/commit/01b9cd78d9a60e38f347e117a5d96b7fa902653c)]:
  - @promptx/core@1.25.2
  - @promptx/mcp-server@1.25.2
  - @promptx/logger@1.25.2

## 1.25.1

### Patch Changes

- Updated dependencies [[`16c4575`](https://github.com/Deepractice/PromptX/commit/16c4575e61c054d0af6f3176f0ff2d82b3364621)]:
  - @promptx/mcp-server@1.25.1
  - @promptx/core@1.25.1
  - @promptx/logger@1.25.1

## 1.25.0

### Patch Changes

- Updated dependencies [[`be63d3c`](https://github.com/Deepractice/PromptX/commit/be63d3c1c93779f3b2201cfb4358e6f07bbdc61f), [`25468ba`](https://github.com/Deepractice/PromptX/commit/25468bae26bd052107bab3dce373e50e95f9d627)]:
  - @promptx/core@1.25.0
  - @promptx/mcp-server@1.25.0
  - @promptx/logger@1.25.0

## 1.24.1

### Patch Changes

- [#435](https://github.com/Deepractice/PromptX/pull/435) [`1bcb923`](https://github.com/Deepractice/PromptX/commit/1bcb923ccc48bc65e883f42c57f6e7a6ec91e1a8) Thanks [@deepracticexs](https://github.com/deepracticexs)! - fix: downgrade @npmcli/arborist to support Node 18.17+

  - Downgrade @npmcli/arborist from 9.1.4 to 8.0.1 to support Node 18.17+ instead of requiring Node 20.17+
  - Update engines.node to >=18.17.0 across all packages for consistency
  - Update @types/node to ^18.0.0 to match the supported Node version
  - Remove unused installPackage() method from PackageInstaller.js
  - Fix turbo.json by removing incorrect extends config

  This change removes the dependency on glob@11 and cacache@20 which required Node 20+, allowing users with Node 18.17+ to install and use PromptX without warnings.

  Fixes #387

- Updated dependencies [[`1bcb923`](https://github.com/Deepractice/PromptX/commit/1bcb923ccc48bc65e883f42c57f6e7a6ec91e1a8)]:
  - @promptx/core@1.24.1
  - @promptx/mcp-server@1.24.1
  - @promptx/logger@1.24.1

## 1.24.0

### Patch Changes

- Updated dependencies [[`92e3096`](https://github.com/Deepractice/PromptX/commit/92e309648d1d89ff124fd1a4de4a7bec8f368eb8), [`83054d9`](https://github.com/Deepractice/PromptX/commit/83054d9b3d911ae2ba20256b0ddb9299b738da0b), [`42c7c9e`](https://github.com/Deepractice/PromptX/commit/42c7c9e0e353ade237160e41e111d868d764d108), [`4bda583`](https://github.com/Deepractice/PromptX/commit/4bda5834ee4f9fb8eae134b77961dff30b22a26d)]:
  - @promptx/mcp-server@1.24.0
  - @promptx/core@1.24.0
  - @promptx/logger@1.24.0

## 1.23.4

### Patch Changes

- Updated dependencies []:
  - @promptx/core@1.23.4
  - @promptx/mcp-server@1.23.4
  - @promptx/logger@1.23.4

## 1.23.3

### Patch Changes

- Updated dependencies [[`c3387a1`](https://github.com/Deepractice/PromptX/commit/c3387a17a618f6725f46231973594270ac4c31d7)]:
  - @promptx/core@1.23.3
  - @promptx/mcp-server@1.23.3
  - @promptx/logger@1.23.3

## 1.23.2

### Patch Changes

- Updated dependencies []:
  - @promptx/core@1.23.2
  - @promptx/logger@1.23.2
  - @promptx/mcp-server@1.23.2

## 1.23.1

### Patch Changes

- Updated dependencies []:
  - @promptx/core@1.23.1
  - @promptx/logger@1.23.1
  - @promptx/mcp-server@1.23.1

## 1.23.0

### Patch Changes

- Updated dependencies [[`665b71a`](https://github.com/Deepractice/PromptX/commit/665b71a58425b56eb4bf7f636485ef79c9e5da6c), [`df8140b`](https://github.com/Deepractice/PromptX/commit/df8140ba9a4d6715ba21d9fe0c37d92ee8db5127), [`a90ad4a`](https://github.com/Deepractice/PromptX/commit/a90ad4a159e112388109dac632cbad0da694a2bf)]:
  - @promptx/core@1.23.0
  - @promptx/mcp-server@1.23.0
  - @promptx/logger@1.23.0

## 1.22.0

### Patch Changes

- Updated dependencies [[`3eb7471`](https://github.com/Deepractice/PromptX/commit/3eb747132bf8ad30112624372cffec5defcc3105), [`6410be3`](https://github.com/Deepractice/PromptX/commit/6410be33eb7452b540c9df18493c9798e404cb8d), [`a6239a6`](https://github.com/Deepractice/PromptX/commit/a6239a69e91f4aa3bfcb66ad1e802fbc7749b54b)]:
  - @promptx/mcp-server@1.22.0
  - @promptx/core@1.22.0
  - @promptx/logger@1.22.0

## 1.21.0

### Patch Changes

- Updated dependencies [[`108bb4a`](https://github.com/Deepractice/PromptX/commit/108bb4a333503352bb52f4993a35995001483db6)]:
  - @promptx/core@1.21.0
  - @promptx/mcp-server@1.21.0
  - @promptx/logger@1.21.0

## 1.20.0

### Minor Changes

- [#390](https://github.com/Deepractice/PromptX/pull/390) [`5c630bb`](https://github.com/Deepractice/PromptX/commit/5c630bb73e794990d15b67b527ed8d4ef0762a27) Thanks [@deepracticexs](https://github.com/deepracticexs)! - ## 重大重构：将 init 重命名为 project，建立统一的项目管理架构

  ### 🚨 破坏性变更

  - **MCP 工具**：`init` → `project`
  - **CLI 命令**：`promptx init` → `promptx project`
  - **API 变更**：`InitCommand` → `ProjectCommand`

  ### 🎯 主要改动

  1. **移除 ServerEnvironment**

     - 删除不必要的全局状态管理
     - 简化项目初始化流程，避免 "ServerEnvironment not initialized" 错误
     - MCP ID 现在直接从 process.pid 生成

  2. **建立独立的 project 模块**

     - 创建 `core/src/project/` 目录
     - 移动 ProjectManager、ProjectConfig、ProjectPathResolver 到新模块
     - 统一项目相关代码的组织结构

  3. **命名重构**
     - InitCommand → ProjectCommand
     - InitArea → ProjectArea
     - init.ts → project.ts (MCP 工具)

  ### ✨ 改进

  - **语义更准确**：`project` 更清楚地表示项目管理功能
  - **架构更清晰**：所有项目相关代码在一个模块下
  - **代码更简洁**：移除了不必要的 transport 参数和初始化依赖
  - **扩展性更好**：为未来添加 `project list`、`project switch` 等子命令做准备

  ### 🔄 迁移指南

  更新你的配置：

  ```json
  // Claude Desktop 配置
  {
    "mcpServers": {
      "promptx": {
        "command": "npx",
        "args": ["-y", "@promptx/mcp-server"]
      }
    }
  }
  ```

  使用新命令：

  ```bash
  # 旧命令
  promptx init /path/to/project

  # 新命令
  promptx project /path/to/project
  ```

  ### 📝 注意

  本次更新**不保留向后兼容**。请确保更新所有使用 `init` 命令的脚本和配置。

### Patch Changes

- Updated dependencies [[`b79494d`](https://github.com/Deepractice/PromptX/commit/b79494d3611f6dfad9740a7899a1f794ad53c349), [`5c630bb`](https://github.com/Deepractice/PromptX/commit/5c630bb73e794990d15b67b527ed8d4ef0762a27), [`54be2ef`](https://github.com/Deepractice/PromptX/commit/54be2ef58d03ea387f3f9bf2e87f650f24cac411)]:
  - @promptx/core@1.20.0
  - @promptx/mcp-server@1.20.0
  - @promptx/logger@1.20.0

## 1.19.0

### Patch Changes

- Updated dependencies [[`54d6b6a`](https://github.com/Deepractice/PromptX/commit/54d6b6ac92e5971211b483fc412e82894fb85714)]:
  - @promptx/core@1.19.0
  - @promptx/mcp-server@1.19.0
  - @promptx/logger@1.19.0

## 1.18.0

### Patch Changes

- Updated dependencies [[`ad52333`](https://github.com/Deepractice/PromptX/commit/ad5233372ae4d4835a5f5626ebb5dd585077f597)]:
  - @promptx/core@1.18.0
  - @promptx/mcp-server@1.18.0
  - @promptx/logger@1.18.0

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
