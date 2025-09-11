# @promptx/core

## 1.17.0

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.17.0
  - @promptx/resource@1.17.0

## 1.16.0

### Minor Changes

- [#352](https://github.com/Deepractice/PromptX/pull/352) [`57f430d`](https://github.com/Deepractice/PromptX/commit/57f430d2af2c904f74054e623169963be62783c5) Thanks [@deepracticexs](https://github.com/deepracticexs)! - # 🚀 实现依赖预装复用机制，解决工具启动缓慢问题

  ## 核心改进

  ### 新增 PreinstalledDependenciesManager

  - 实现智能依赖分析，区分预装和需要安装的依赖
  - 支持从@promptx/resource 包复用预装依赖，避免重复安装
  - 自动检测版本兼容性，使用 semver 标准进行版本匹配
  - 提供模块加载缓存机制，提升后续访问性能

  ### 优化 ToolSandbox 依赖管理

  - 集成 PreinstalledDependenciesManager，优先使用预装依赖
  - 只安装真正缺失的依赖，大幅减少安装时间
  - 保持向后兼容性，现有工具无需修改

  ### 预装核心依赖

  - @modelcontextprotocol/server-filesystem: 系统工具专用
  - glob: 文件搜索功能
  - semver: 版本兼容性检查
  - minimatch: 模式匹配支持

  ## 性能提升

  | 工具             | 优化前  | 优化后 | 提升倍数 |
  | ---------------- | ------- | ------ | -------- |
  | filesystem       | 9900ms  | 16ms   | 619x     |
  | es-module-tester | ~1500ms | 52ms   | 29x      |
  | excel-reader     | ~1500ms | 54ms   | 28x      |

  ## 架构改进

  ### 依赖复用不变式

  ```text
  ∀ tool ∈ Tools, ∀ dep ∈ dependencies(tool):
    if dep ∈ preinstalled_deps then
      load_time(dep) = O(1)
    else
      load_time(dep) = O(install_time)
  ```

  ### 版本兼容性保证

  - 使用标准 semver 库进行版本范围匹配
  - 支持^、~、>=等所有 npm 版本语法
  - 不兼容时自动回退到沙箱安装

  ## 向后兼容性

  - ✅ 所有现有工具无需修改即可受益
  - ✅ 失败时自动回退到原有安装机制
  - ✅ 沙箱隔离机制保持不变
  - ✅ 工具接口完全兼容

  这是一个无破坏性的性能优化，解决了 Issue #350 中用户反映的"30-60 秒等待时间不可接受"问题，将核心系统工具的启动时间从分钟级降低到毫秒级。

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

- Updated dependencies [[`57f430d`](https://github.com/Deepractice/PromptX/commit/57f430d2af2c904f74054e623169963be62783c5)]:
  - @promptx/resource@1.16.0
  - @promptx/logger@1.16.0

## 1.15.1

### Patch Changes

- [`7a80317`](https://github.com/Deepractice/PromptX/commit/7a80317ba1565a9d5ae8de8eab43cb8c37b73eb5) Thanks [@deepracticexs](https://github.com/deepracticexs)! - 修复多个包的关键问题

  ### @promptx/core

  - 修复 RegistryData 中的 null 引用错误，添加防御性编程检查
  - 在所有资源操作方法中过滤 null 值，防止运行时崩溃

  ### @promptx/mcp-server

  - 修复 package.json 路径错误，从 `../../package.json` 改为 `../package.json`
  - 解决 npx 执行时找不到 package.json 的问题

  ### @promptx/resource

  - 将 registry.json 从源码移到构建产物，避免每次构建产生 git 变更
  - registry.json 现在只生成到 dist 目录，不再存在于源码中

  ### .github/workflows

  - 修复 Docker workflow 无法自动触发的问题
  - 移除 workflow_run 的 branches 过滤器，因为 tag 推送不属于任何分支

- Updated dependencies [[`7a80317`](https://github.com/Deepractice/PromptX/commit/7a80317ba1565a9d5ae8de8eab43cb8c37b73eb5)]:
  - @promptx/resource@1.15.1
  - @promptx/logger@1.15.1

## 1.15.0

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.15.0
  - @promptx/resource@1.15.0

## 1.14.2

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.14.2
  - @promptx/resource@1.14.2

## 1.14.1

### Patch Changes

- [#333](https://github.com/Deepractice/PromptX/pull/333) [`4a6ab6b`](https://github.com/Deepractice/PromptX/commit/4a6ab6b579101921ba29f2a551bb24c75f579de1) Thanks [@deepracticexs](https://github.com/deepracticexs)! - 修复 ToolSandbox 传递依赖未自动安装问题

  - 将 PackageInstaller 从 pacote API 迁移到 @npmcli/arborist
  - Arborist 是 npm install 的核心引擎，能够自动处理所有传递依赖
  - 解决了工具开发者需要手动声明所有间接依赖的问题
  - 保持 API 接口不变，确保向后兼容

  修复 issue #332

- Updated dependencies []:
  - @promptx/logger@1.14.1
  - @promptx/resource@1.14.1

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

- Updated dependencies [[`801fc4e`](https://github.com/Deepractice/PromptX/commit/801fc4edb1d99cf079baeecbb52adf7d2a7e404e)]:
  - @promptx/resource@1.14.0
  - @promptx/logger@1.14.0

## 1.13.0

### Patch Changes

- [#304](https://github.com/Deepractice/PromptX/pull/304) [`d60e63c`](https://github.com/Deepractice/PromptX/commit/d60e63c06f74059ecdc5435a744c57c1bfe7f7d0) Thanks [@deepracticexs](https://github.com/deepracticexs)! - fix: resolve recall memory content bug for newborn role

  Fixed critical issue where newborn role (and other roles using prime) would show activated memory nodes during recall but no actual memory content was displayed.

  **Root Cause:**

  - `CognitionSystem.prime()` method was not async and didn't load engrams
  - `CognitionManager.prime()` had missing await keywords for async calls

  **Changes:**

  - Modified `CognitionSystem.prime()` to be async and load engrams properly
  - Fixed missing await calls in `CognitionManager.prime()` method
  - Added comprehensive debug logging for memory structure inspection
  - Enabled proper memory content display in recall for all roles

  **Impact:**

  - All roles now correctly display detailed memory content during recall
  - Improved debugging capabilities with enhanced logging
  - Better memory system reliability across different role activation paths

  **Testing:**

  - ✅ newborn role now shows complete memory content with recall
  - ✅ Memory network activation and content loading working properly
  - ✅ Debug logs provide clear visibility into memory loading process

- Updated dependencies []:
  - @promptx/logger@1.13.0
  - @promptx/resource@1.13.0

## 1.12.0

### Patch Changes

- Updated dependencies [[`2c503d8`](https://github.com/Deepractice/PromptX/commit/2c503d80bb09511ab94e24b015a5c21dea8d4d9b)]:
  - @promptx/resource@1.12.0
  - @promptx/logger@1.12.0

## 1.11.0

### Patch Changes

- Updated dependencies [[`c3c9c45`](https://github.com/Deepractice/PromptX/commit/c3c9c451b9cdd5abaa5c1d51abe594ad14841354)]:
  - @promptx/logger@1.11.0
  - @promptx/resource@1.11.0

## 1.10.1

### Patch Changes

- Fix release workflow and prepare for beta release

  - Update changeset config to use unified versioning for all packages
  - Fix resource discovery and registry generation bugs
  - Update pnpm-lock.yaml for CI compatibility
  - Prepare for semantic versioning with beta releases
  - Fix npm publishing conflicts by using proper versioning strategy

- Updated dependencies []:
  - @promptx/logger@1.10.1
  - @promptx/resource@1.10.1
