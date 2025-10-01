# @promptx/resource

## 1.23.2

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.23.2

## 1.23.1

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.23.1

## 1.23.0

### Patch Changes

- Updated dependencies [[`df8140b`](https://github.com/Deepractice/PromptX/commit/df8140ba9a4d6715ba21d9fe0c37d92ee8db5127)]:
  - @promptx/logger@1.23.0

## 1.22.0

### Minor Changes

- [#406](https://github.com/Deepractice/PromptX/pull/406) [`a6239a6`](https://github.com/Deepractice/PromptX/commit/a6239a69e91f4aa3bfcb66ad1e802fbc7749b54b) Thanks [@deepracticexs](https://github.com/deepracticexs)! - # ToolX YAML Support - 降低 AI 认知负担的重大改进

  ## 💡 核心变更

  ### ToolX YAML 格式支持 (BREAKING CHANGE)

  - **问题解决**：Issue #404 - ToolX 嵌套 JSON 格式对 AI 认知负担过重
  - **解决方案**：将 toolx 从嵌套 JSON 改为 YAML 格式支持
  - **用户体验**：多行文本无需转义，特殊字符可直接使用
  - **简化设计**：URL 格式从 `@tool://` 简化为 `tool://`（内部自动转换）

  **BREAKING CHANGE**: toolx 现在只支持 YAML 格式输入，不再兼容原 JSON 格式

  ## 🛠️ 系统工具增强

  ### 专业工具创建

  - **role-creator**: 为女娲角色创建的 AI 角色创建专用工具
  - **tool-creator**: 为鲁班角色创建的工具开发专用工具
  - **系统集成**: 在 toolx 中内置系统工具，无需发现即可使用

  ## 📚 文档与体验优化

  ### 改进的错误提示

  - **YAML 解析错误**：提供具体的多行字符串格式指导
  - **工具不存在**：友好的错误提示和建议
  - **格式验证**：强化输入验证和错误消息

  ### 角色工作流优化

  - **鲁班工具实现流程**：更新了工具开发的标准工作流
  - **女娲角色创建流程**：完善了 AI 角色创建和修改的标准流程
  - **删除过时思考文档**：移除了 `toolx-thinking.thought.md` 等过时文档

  ## 🔧 技术改进

  ### 语义渲染增强

  - **SemanticRenderer.js**：改进了语义渲染逻辑，支持更好的角色展示
  - **RoleArea.js**：优化了角色区域的处理逻辑
  - **ToolManualFormatter.js**：增强了工具手册的格式化能力

  ### 架构优化

  - **unique tools define**：重构了工具定义的唯一性管理
  - **规范名称标准化**：在所有 MCP 工具中统一了规范名称和调用说明

  ## 🎯 影响评估

  这次更新显著降低了 AI 使用 ToolX 的认知成本，符合奥卡姆剃刀原则和第一性原理。通过 YAML 格式，AI 可以更自然地表达多行内容和复杂配置，同时系统工具的内置化使得常用功能触手可及。

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.22.0

## 1.21.0

### Minor Changes

- [#401](https://github.com/Deepractice/PromptX/pull/401) [`108bb4a`](https://github.com/Deepractice/PromptX/commit/108bb4a333503352bb52f4993a35995001483db6) Thanks [@deepracticexs](https://github.com/deepracticexs)! - 重构角色系统架构，提升模块化和可维护性

  ## 主要变更

  ### 角色重构

  - **女娲(Nuwa)角色重构**：实现单一真相源原则，优化提示词结构

    - 删除冗余的执行文件，整合为精简的工作流文件
    - 新增结构化的知识体系文件，包含 DPML 规范、ISSUE 框架等
    - 重构思维模式文件，新增多个专业思考模式

  - **新增 Writer 角色**：专业文案写手角色
    - 完整的执行工作流
    - 12 个专业思维模式文件，涵盖反 AI 味、具象化、动态深度等
    - 强调真实性和读者共情的写作理念

  ### 认知系统优化

  - 统一术语规范：Consciousness → Consciousness（保持一致）
  - 优化认知层和意识层的实现
  - 改进 recall 工具的记忆网络提示

  ### 工具系统改进

  - 简化 toolx 工具的提示词，提高可读性
  - 优化 action 工具的角色激活流程
  - 改进工具使用指导和错误处理提示

  ## 影响范围

  - 角色创建和修改工作流更加清晰
  - AI 助手的专业能力显著提升
  - 系统整体一致性和可维护性改善

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.21.0

## 1.20.0

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.20.0

## 1.19.0

### Patch Changes

- [`198ea69`](https://github.com/Deepractice/PromptX/commit/198ea69066f153ac5f70c3c8cf34ddf50ffa69bd) Thanks [@deepracticexs](https://github.com/deepracticexs)! - 优化鲁班角色的工具返回体设计认知

  - 新增 AI 上下文感知 knowledge 模块，让鲁班理解工具返回会占用 AI 输入空间
  - 在工具实现流程中增加"返回体设计"关键步骤（Step 2.6）
  - 强调返回策略原则：小数据直接返回，中等数据返回摘要，大数据使用引用模式
  - 解决了 issue #380 中因返回数据过大导致 AI 输入超限的问题

- [#377](https://github.com/Deepractice/PromptX/pull/377) [`54d6b6a`](https://github.com/Deepractice/PromptX/commit/54d6b6ac92e5971211b483fc412e82894fb85714) Thanks [@deepracticexs](https://github.com/deepracticexs)! - feat: 工具测试能力增强 - ToolBridge 模式与 dry-run 支持

  ## 核心功能

  ### 🌉 ToolBridge - 外部依赖隔离层

  - 新增 `ToolBridge` 类，实现工具与外部依赖的解耦
  - 支持 real/mock 双模式实现，便于测试和开发
  - 通过 `api.bridge.execute()` 统一调用外部服务
  - 自动批量测试所有 Bridge 的 mock 实现

  ### 🧪 Dry-run 测试模式

  - 新增 `dryrun` 执行模式，无需真实凭证即可测试工具
  - 在 ToolCommand 和 MCP 层面完整支持 dry-run
  - 提供详细的 Bridge 测试报告（成功/失败统计）
  - 大幅降低工具开发和调试成本

  ### 🤖 Luban 角色能力增强

  - **技术调研思维**：编码前必须验证技术方案
  - **测试驱动开发**：dry-run 优先的开发流程
  - **完整测试工作流**：从 dry-run 到真实集成测试
  - **智能诊断修复**：自动分析错误并寻找解决方案

  ## 技术改进

  ### API 设计优化

  - 简化 Bridge API：`api.bridge.execute()` 而非 `api.executeBridge()`
  - 保持与 logger、environment 等服务一致的 API 风格
  - Bridge 实例按需加载（lazy loading）

  ### 向后兼容性

  - 完全兼容没有 Bridge 的现有工具
  - Bridge 功能是可选的，不影响传统工具执行
  - 默认执行模式保持不变

  ## 开发者体验提升

  ### 工具开发流程改进

  1. 先设计 mock 实现，再写真实逻辑
  2. 通过 dry-run 快速验证工具逻辑
  3. 无需等待用户提供凭证即可测试
  4. 错误诊断和修复循环自动化

  ### 测试成本降低

  - Dry-run 测试：几秒钟，零成本
  - 早期发现问题，避免生产环境故障
  - Mock 数据真实可靠，覆盖各种场景

  ## 文件变更摘要

  ### 新增文件

  - `packages/core/src/toolx/api/ToolBridge.js` - Bridge 核心实现
  - `packages/core/examples/tool-with-bridge.example.js` - 使用示例
  - `packages/resource/.../luban/execution/bridge-design.execution.md` - Bridge 设计规范
  - `packages/resource/.../luban/thought/dryrun-first.thought.md` - 测试思维
  - `packages/resource/.../luban/thought/research-first.thought.md` - 调研思维

  ### 主要修改

  - `ToolCommand.js` - 添加 dryrun 模式支持和输出格式
  - `ToolSandbox.js` - 实现 dryRun() 方法
  - `ToolAPI.js` - 添加 bridge getter 和工具实例管理
  - `toolx.ts` - MCP 层添加 dryrun 模式

  ## 影响范围

  - 工具开发者：获得更强大的测试和隔离能力
  - AI Agent：Luban 能够更可靠地创建和测试工具
  - 最终用户：工具质量提升，首次成功率更高

  ## 迁移指南

  现有工具无需修改。新工具可选择性使用 Bridge 模式：

  ```javascript
  // 定义 Bridge
  getBridges() {
    return {
      'service:operation': {
        real: async (args, api) => { /* 真实实现 */ },
        mock: async (args, api) => { /* Mock 实现 */ }
      }
    };
  }

  // 使用 Bridge
  async execute(params) {
    const result = await this.api.bridge.execute('service:operation', args);
  }
  ```

  ## 相关 Issue

  - Fixes #376 - Luban 缺少测试环境的问题

- Updated dependencies []:
  - @promptx/logger@1.19.0

## 1.18.0

### Patch Changes

- [#369](https://github.com/Deepractice/PromptX/pull/369) [`ad52333`](https://github.com/Deepractice/PromptX/commit/ad5233372ae4d4835a5f5626ebb5dd585077f597) Thanks [@deepracticexs](https://github.com/deepracticexs)! - feat: 为 PromptX 工具添加持久化存储 API 和增强的沙箱架构

  ### 核心功能

  #### 🗄️ Tool Storage API - 工具持久化存储

  - 新增 `api.storage` 接口，提供类似 localStorage 的持久化存储能力
  - 每个工具独立的 storage.json 文件，自动隔离数据
  - 支持自动 JSON 序列化/反序列化，处理复杂数据类型
  - 10MB 容量限制，确保性能
  - 完全兼容 Web Storage API，零学习成本

  #### 🏗️ 增强的工具沙箱架构

  - 重构 ToolSandbox，提供更强大的 API 注入机制
  - 新增 ToolAPI 统一管理所有工具 API
  - 优化 api.importx 智能模块加载，自动处理 CommonJS/ESM 差异
  - 改进 api.environment 环境变量管理
  - 增强 api.logger 日志记录能力

  #### 📚 工具手册系统

  - 新增 ToolManualFormatter 自动生成工具文档
  - 支持从工具元数据动态生成使用手册
  - 统一的手册格式，包含参数、环境变量、错误码等完整信息

  #### 🔍 日志查询系统

  - 新增 ToolLoggerQuery 提供强大的日志查询能力
  - 支持 tail、search、stats、errors 等多种查询操作
  - 结构化日志解析，便于问题排查

  #### ⚠️ 错误处理体系

  - 全新的分层错误体系：ValidationErrors、SystemErrors、DevelopmentErrors
  - ToolError 统一错误处理，提供详细的错误分类和解决方案
  - 业务错误自定义支持，更精准的错误提示

  ### 改进的工具

  #### filesystem 工具重构

  - 移除独立的 manual 文件，改为通过接口动态生成
  - 优化文件操作性能
  - 增强错误处理能力
  - 单文件架构，更简洁的工具结构

  ### 角色更新

  #### 鲁班角色优化

  - 简化工具开发流程，MVP 原则驱动
  - 更清晰的知识体系组织
  - 增强的工具文档注释指导
  - 优化需求收集和实现流程

  #### Sean 角色精简

  - 聚焦矛盾驱动决策
  - 简化执行流程
  - 更清晰的产品哲学

  ### 技术债务清理

  - 删除 SandboxErrorManager（功能合并到 ToolError）
  - 删除 promptx-log-viewer 工具（功能集成到 log 模式）
  - 清理过时的手册文件
  - 简化工具接口定义

  ### 破坏性变更

  - 工具现在必须使用 `api.importx()` 而不是直接的 `importx()`
  - 工具手册不再是独立文件，而是通过 getMetadata() 动态生成
  - 环境变量管理 API 变更：`api.environment.get/set` 替代旧的直接访问

  ### 迁移指南

  旧版工具需要更新：

  ```javascript
  // 旧版
  const lodash = await importx("lodash")

  // 新版
  const { api } = this
  const lodash = await api.importx("lodash")
  ```

  存储 API 使用：

  ```javascript
  // 保存数据
  await api.storage.setItem("config", { theme: "dark" })

  // 读取数据
  const config = await api.storage.getItem("config")
  ```

  这次更新为 PromptX 工具生态提供了更强大、更稳定的基础设施，显著提升了工具开发体验和运行时可靠性。

- Updated dependencies []:
  - @promptx/logger@1.18.0

## 1.17.3

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.17.3

## 1.17.2

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.17.2

## 1.17.1

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.17.1

## 1.17.0

### Patch Changes

- Updated dependencies []:
  - @promptx/logger@1.17.0

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

### Patch Changes

- Updated dependencies []:
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

- Updated dependencies []:
  - @promptx/logger@1.15.1

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
