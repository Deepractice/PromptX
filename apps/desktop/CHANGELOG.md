# @promptx/desktop

## 1.14.2

### Patch Changes

- [#337](https://github.com/Deepractice/PromptX/pull/337) [`9385a49`](https://github.com/Deepractice/PromptX/commit/9385a49aba66540853a2fda6ddc9a168217534fa) Thanks [@deepracticexs](https://github.com/deepracticexs)! - Fix auto-update detection issue (#336)

  - Remove manual "Check for Updates" button from tray menu to avoid user confusion
  - Add comprehensive ASCII-only logging for auto-updater events
  - Simplify update manager to rely on automatic 1-hour update checks
  - Clean up unused dialog and icon loading code

  The manual update check button was ineffective due to update-electron-app's stateless design. When users selected "Later" on an update, the library wouldn't re-prompt for the same version. This change removes the confusing button and adds detailed logging to track update status transparently.

- Updated dependencies [[`94483a8`](https://github.com/Deepractice/PromptX/commit/94483a8426e726e76a7cb7700f53377ae29d9aec)]:
  - @promptx/mcp-server@1.14.2
  - @promptx/core@1.14.2

## 1.14.1

### Patch Changes

- Updated dependencies [[`4a6ab6b`](https://github.com/Deepractice/PromptX/commit/4a6ab6b579101921ba29f2a551bb24c75f579de1), [`abcff55`](https://github.com/Deepractice/PromptX/commit/abcff55b916b7db73e668023a964fba467cc8cb6)]:
  - @promptx/core@1.14.1
  - @promptx/mcp-server@1.14.1

## 1.14.0

### Minor Changes

- [`cde78ed`](https://github.com/Deepractice/PromptX/commit/cde78ed4a1858df401596e8b95cae91d8c80ef7a) Thanks [@deepracticexs](https://github.com/deepracticexs)! - # feat: implement importx unified module loading architecture

  实现 importx 统一模块加载架构，彻底解决 PromptX 工具开发中的模块导入复杂性，为开发者提供零认知负担的统一导入体验。

  ## 🚀 核心架构变更

  ### importx 统一导入架构

  - **移除复杂系统**：删除 ESModuleRequireSupport.js (276 行复杂逻辑)
  - **统一导入接口**：为所有工具提供统一的 `importx()` 函数
  - **自动类型检测**：importx 自动处理 CommonJS/ES Module/内置模块差异
  - **简化 ToolSandbox**：大幅重构，消除循环依赖和复杂 fallback 逻辑

  ### Electron 环境优化

  - **pnpm 超时修复**：解决 Electron 环境下 pnpm 安装超时问题
  - **utilityProcess 通信**：实现进程间可靠通信机制
  - **Worker 脚本**：专用的 electron-pnpm-worker-script.js
  - **依赖管理增强**：PnpmInstaller、SystemPnpmRunner、ElectronPnpmWorker

  ### 关键问题修复

  - **importx parentURL 修复**：使用工具沙箱的 package.json 作为模块解析基础
  - **文件边界临时禁用**：解决 ~/.promptx 访问限制问题
  - **filesystem 工具更新**：适配新的 importx 架构

  ## 📈 性能和稳定性提升

  - **依赖管理测试**：从 62.5% → 87.5% 通过率
  - **importx 架构测试**：100% 通过率
  - **沙箱环境测试**：100% 通过率
  - **axios, validator** 等 CommonJS 包：正常导入
  - **nanoid, fs-extra** 等混合包：正常导入

  ## 💡 开发者体验

  ### 认知负担归零

  - 只需学习一个 `importx()` 函数
  - 统一所有模块类型的导入语法
  - 自动处理版本兼容性问题

  ### 架构简化

  - 代码量减少：移除 276 行复杂逻辑
  - 维护性提升：统一架构易于理解和扩展
  - Electron 兼容：解决特殊环境问题

  ## 🔄 内部优化 (向下兼容)

  ### ToolSandbox 内部重构

  - 内部统一使用 `importx()` 进行模块导入，外部 API 保持不变
  - 自动处理 CommonJS/ES Module 兼容性
  - 删除了内部复杂的 ESModuleRequireSupport 类

  ### 工具开发建议

  - 新工具推荐使用 `importx()` 进行模块导入
  - 现有工具继续工作，无需强制迁移
  - `require()` 和 `loadModule()` 仍然支持

  ## 🛠️ 使用指南

  ### 推荐的导入方式

  ```javascript
  // 推荐方式 (统一、简单)
  const axios = await importx("axios")
  const chalk = await importx("chalk")
  const fs = await importx("fs")

  // 仍然支持的方式
  const axios = require("axios") // 对于 CommonJS
  const chalk = await loadModule("chalk") // 对于 ES Module
  ```

  ### 对于框架使用者

  - 现有 ToolSandbox API 完全兼容
  - 内部性能和稳定性自动提升
  - 无需代码修改

  ## 🎯 影响范围

  - **开发者**：统一的模块导入体验，显著降低学习成本
  - **系统架构**：简化的代码结构，提升维护性
  - **性能**：提升的依赖管理可靠性，更快的模块解析
  - **Electron 应用**：解决环境特殊性问题，提升稳定性

  这是 PromptX 工具生态的重要里程碑，实现了"零认知负担"的模块导入理念。

### Patch Changes

- [#314](https://github.com/Deepractice/PromptX/pull/314) [`c78d7e0`](https://github.com/Deepractice/PromptX/commit/c78d7e0fa960f05eb4018ee01d1e5d21cf0a950b) Thanks [@deepracticexs](https://github.com/deepracticexs)! - feat(desktop): add About dialog to tray menu

  - Add About dialog accessible from system tray menu
  - Display app version and basic information
  - Improve user experience with easy access to app details

- Updated dependencies [[`cde78ed`](https://github.com/Deepractice/PromptX/commit/cde78ed4a1858df401596e8b95cae91d8c80ef7a), [`801fc4e`](https://github.com/Deepractice/PromptX/commit/801fc4edb1d99cf079baeecbb52adf7d2a7e404e)]:
  - @promptx/core@1.14.0
  - @promptx/mcp-server@1.14.0

## 1.13.0

### Minor Changes

- [`b578dab`](https://github.com/Deepractice/PromptX/commit/b578dabd5c2a2caea214912f1ef1fcefd65d3790) Thanks [@deepracticexs](https://github.com/deepracticexs)! - feat: implement auto-updater mechanism for PromptX desktop app

  Added comprehensive auto-updater functionality using electron-updater with GitHub Releases integration.

  **Key Features:**

  - Automatic update checking on app startup (3 seconds delay)
  - Manual update checking via system tray menu
  - User-controlled download and installation process
  - Support for skipping specific versions
  - Development mode detection with appropriate messaging

  **User Experience:**

  - Non-intrusive background update checking
  - Clear dialogs with PromptX branding instead of system notifications
  - Three-option update flow: "Download Now", "Remind Me Later", "Skip This Version"
  - Automatic architecture detection (Intel/Apple Silicon/Universal on macOS)
  - Update status reflected in system tray menu

  **Technical Implementation:**

  - Integration with existing Clean Architecture pattern
  - UpdateManager class following SOLID principles
  - Proper error handling and logging throughout
  - GitHub Releases as update distribution channel
  - Support for multi-platform builds (macOS x64/arm64/universal, Windows setup/portable, Linux AppImage/deb/rpm)

  **Configuration Updates:**

  - Updated electron-builder.yml for multi-architecture builds
  - Fixed GitHub Actions workflow for proper artifact generation
  - Added metadata files (latest-mac.yml, latest.yml, latest-linux.yml) for update detection
  - Configured publish settings for GitHub provider

  **Security & Reliability:**

  - Disabled auto-download - requires explicit user consent
  - Version validation and checksum verification
  - Graceful fallback for network/server errors
  - Development mode safeguards

  This implements the high-priority feature request from issue #305, providing users with seamless update experience while maintaining full control over when updates are downloaded and installed.

### Patch Changes

- Updated dependencies [[`d60e63c`](https://github.com/Deepractice/PromptX/commit/d60e63c06f74059ecdc5435a744c57c1bfe7f7d0)]:
  - @promptx/core@1.13.0
  - @promptx/mcp-server@1.13.0

## 1.12.0

### Patch Changes

- Updated dependencies []:
  - @promptx/core@1.12.0
  - @promptx/mcp-server@1.12.0

## 1.11.0

### Patch Changes

- Updated dependencies [[`c3c9c45`](https://github.com/Deepractice/PromptX/commit/c3c9c451b9cdd5abaa5c1d51abe594ad14841354)]:
  - @promptx/mcp-server@1.11.0
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
  - @promptx/mcp-server@1.10.1

## 1.10.0

### Minor Changes

- [#292](https://github.com/Deepractice/PromptX/pull/292) [`f346df5`](https://github.com/Deepractice/PromptX/commit/f346df58b4e2a28432a9eed7bbfed552db10a9de) Thanks [@deepracticexs](https://github.com/deepracticexs)! - feat(desktop): Add resource management UI with GitHub-style design

  ### New Features

  - **Resource Management Interface**: New dedicated page to view and search all PromptX resources
  - **GitHub-style UI**: Clean, light-themed interface inspired by GitHub's design language
  - **Advanced Filtering**: Dual-layer filtering system for Type (Roles/Tools) and Source (System/User)
  - **Real-time Search**: Instant search across resource names, descriptions, and tags
  - **Resource Statistics**: Dashboard showing total resources breakdown by type and source

  ### Technical Improvements

  - **Enhanced Logging**: Consolidated logging system with file output to ~/.promptx/logs
  - **IPC Communication**: Fixed data structure issues in Electron IPC layer
  - **Renderer Process Logging**: Added dedicated logger for renderer process with main process integration
  - **Resource Loading**: Improved resource fetching from PromptX core with proper error handling

  ### UI/UX Enhancements

  - **Responsive Layout**: Properly structured layout with search bar and filter controls
  - **Visual Hierarchy**: Clear separation between search, filters, and resource listing
  - **Simplified Interaction**: Removed unnecessary buttons and click events for cleaner interface
  - **Better Organization**: Resources grouped by source (System/User) with clear visual indicators

  ### Bug Fixes

  - Fixed resource loading issue where data wasn't properly passed from main to renderer process
  - Resolved IPC handler duplicate registration errors
  - Fixed file path issues in development mode

### Patch Changes

- Updated dependencies []:
  - @promptx/cli@1.10.0

## 1.9.0

### Patch Changes

- Updated dependencies [[`50d6d2c`](https://github.com/Deepractice/PromptX/commit/50d6d2c6480e90d3bbc5ab98efa396cb68a865a1), [`3da84c6`](https://github.com/Deepractice/PromptX/commit/3da84c6fddc44fb5578421d320ee52e59f241157), [`2712aa4`](https://github.com/Deepractice/PromptX/commit/2712aa4b71e9752f77a3f5943006f99f904f157e)]:
  - @promptx/cli@1.9.0

## 1.8.0

### Patch Changes

- Updated dependencies [[`50d6d2c`](https://github.com/Deepractice/PromptX/commit/50d6d2c6480e90d3bbc5ab98efa396cb68a865a1), [`3da84c6`](https://github.com/Deepractice/PromptX/commit/3da84c6fddc44fb5578421d320ee52e59f241157), [`2712aa4`](https://github.com/Deepractice/PromptX/commit/2712aa4b71e9752f77a3f5943006f99f904f157e)]:
  - @promptx/cli@1.8.0
