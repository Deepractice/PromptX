# @promptx/mcp-server

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

- [#388](https://github.com/Deepractice/PromptX/pull/388) [`b79494d`](https://github.com/Deepractice/PromptX/commit/b79494d3611f6dfad9740a7899a1f794ad53c349) Thanks [@deepracticexs](https://github.com/deepracticexs)! - feat: 实现 Engram 类型系统和两阶段召回策略

  - 添加 Engram 三种类型(PATTERN/LINK/ATOMIC)支持，用于区分不同记忆类型
    - PATTERN：框架性知识，优先展示
    - LINK：关系连接，次优先级
    - ATOMIC：具体细节，依赖时间
  - 实现 TwoPhaseRecallStrategy 类，整合粗召回和精排序两个阶段
    - 第一阶段：使用 Recall 类进行激活扩散获取候选集
    - 第二阶段：计算综合权重(类型 × 相关性 × 强度 × 时间)进行精排序
  - 修复未分类记忆问题，为旧数据自动设置 ATOMIC 类型
  - 更新 schema 分隔符从换行符改为'-'，提升输入体验
  - 增加类型配额限制(PATTERN:10, LINK:15, ATOMIC:25，总计 50)
  - 在 recall 结果中添加类型图标显示(🎯/🔗/💡)

- Updated dependencies [[`b79494d`](https://github.com/Deepractice/PromptX/commit/b79494d3611f6dfad9740a7899a1f794ad53c349), [`5c630bb`](https://github.com/Deepractice/PromptX/commit/5c630bb73e794990d15b67b527ed8d4ef0762a27), [`54be2ef`](https://github.com/Deepractice/PromptX/commit/54be2ef58d03ea387f3f9bf2e87f650f24cac411)]:
  - @promptx/core@1.20.0
  - @promptx/logger@1.20.0

## 1.19.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [[`54d6b6a`](https://github.com/Deepractice/PromptX/commit/54d6b6ac92e5971211b483fc412e82894fb85714)]:
  - @promptx/core@1.19.0
  - @promptx/logger@1.19.0

## 1.18.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [[`ad52333`](https://github.com/Deepractice/PromptX/commit/ad5233372ae4d4835a5f5626ebb5dd585077f597)]:
  - @promptx/core@1.18.0
  - @promptx/logger@1.18.0

## 1.17.3

### Patch Changes

- Updated dependencies [[`e409b52`](https://github.com/Deepractice/PromptX/commit/e409b522bf9694547bd18095e048374d72dde120)]:
  - @promptx/core@1.17.3
  - @promptx/logger@1.17.3

## 1.17.2

### Patch Changes

- Updated dependencies [[`f5891a6`](https://github.com/Deepractice/PromptX/commit/f5891a60d66dfaabf56ba12deb2ac7326d288025)]:
  - @promptx/core@1.17.2
  - @promptx/logger@1.17.2

## 1.17.1

### Patch Changes

- [`c7ed9a1`](https://github.com/Deepractice/PromptX/commit/c7ed9a113e0465e2955ad1d11ad511a2f327440d) Thanks [@deepracticexs](https://github.com/deepracticexs)! - refactor: 优化 Docker 发布流程

  - 将 Docker 发布集成到主发布工作流中
  - 修复 workflow_run 触发不稳定的问题
  - 确保 Docker 镜像在 npm 包发布成功后自动构建

- Updated dependencies [[`c7ed9a1`](https://github.com/Deepractice/PromptX/commit/c7ed9a113e0465e2955ad1d11ad511a2f327440d)]:
  - @promptx/core@1.17.1
  - @promptx/logger@1.17.1

## 1.17.0

### Patch Changes

- Updated dependencies []:
  - @promptx/core@1.17.0
  - @promptx/logger@1.17.0

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

- [#349](https://github.com/Deepractice/PromptX/pull/349) [`68b8304`](https://github.com/Deepractice/PromptX/commit/68b8304a5d5e7569f3534f6cfe52348c457b0ce9) Thanks [@deepracticexs](https://github.com/deepracticexs)! - 修复 MCP Server HTTP transport 多客户端并发问题

  ### 问题

  - MCP SDK 的 Server 实例不支持真正的多客户端并发
  - 当多个客户端（如 Claude 和 Trae）同时连接时，后续请求会超时或阻塞
  - 单个 Server 实例会导致请求 ID 冲突和状态混乱

  ### 解决方案

  - 为每个 session 创建独立的 Server 实例
  - 每个客户端拥有完全隔离的 Server + Transport 组合
  - Express 路由层根据 session ID 分发请求到对应的 Server

  ### 架构改进

  - 从「1 个 Server 对应多个 Transport」改为「每个 session 独立的 Server」
  - 实现了真正的并发隔离，不同客户端请求不会相互影响
  - 支持 session 级别的资源清理机制

  ### 技术细节

  - 新增 `getOrCreateServer` 方法管理 Server 实例池
  - 修改请求处理逻辑，确保每个 session 使用独立的 Server
  - 添加健康检查指标，显示活跃的 Server 和 Transport 数量

  Fixes #348

- Updated dependencies [[`57f430d`](https://github.com/Deepractice/PromptX/commit/57f430d2af2c904f74054e623169963be62783c5), [`eb7a2be`](https://github.com/Deepractice/PromptX/commit/eb7a2be1ef4fffed97a9dc20eaaacd9065fc0e01)]:
  - @promptx/core@1.16.0
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
  - @promptx/core@1.15.1
  - @promptx/logger@1.15.1

## 1.15.0

### Minor Changes

- [#344](https://github.com/Deepractice/PromptX/pull/344) [`16ee7ee`](https://github.com/Deepractice/PromptX/commit/16ee7eec70925629dd2aec47997f3db0eb70c74c) Thanks [@deepracticexs](https://github.com/deepracticexs)! - feat: implement Worker Pool architecture for tool execution isolation

  - Added Worker Pool pattern to execute all tools in isolated processes
  - Prevents long-running tools from blocking SSE heartbeat and main event loop
  - Implemented using workerpool library with 2-4 configurable worker processes
  - All tools now run in separate child processes for better stability
  - Fixes SSE heartbeat interruption issue (#341)

### Patch Changes

- Updated dependencies []:
  - @promptx/core@1.15.0
  - @promptx/logger@1.15.0

## 1.14.2

### Patch Changes

- [#339](https://github.com/Deepractice/PromptX/pull/339) [`94483a8`](https://github.com/Deepractice/PromptX/commit/94483a8426e726e76a7cb7700f53377ae29d9aec) Thanks [@deepracticexs](https://github.com/deepracticexs)! - Fix critical memory leak and remove all error recovery mechanisms

  - Remove recursive retry logic that caused activeRequests to grow infinitely
  - Delete ErrorRecoveryStrategy and all recovery mechanisms
  - Remove 'recoverable' field from MCPError
  - Delete shouldRetry() and retry counter
  - Remove recover() method from interface
  - Simplify error handling to fail-fast principle
  - Remove RECOVERABLE severity level
  - Fix issue #338 where recursive retries caused 17000+ pending requests

  This prevents hidden retry loops and makes error handling transparent.
  Recovery/retry logic should be handled by callers, not buried in the framework.

- Updated dependencies []:
  - @promptx/core@1.14.2
  - @promptx/logger@1.14.2

## 1.14.1

### Patch Changes

- [#334](https://github.com/Deepractice/PromptX/pull/334) [`abcff55`](https://github.com/Deepractice/PromptX/commit/abcff55b916b7db73e668023a964fba467cc8cb6) Thanks [@deepracticexs](https://github.com/deepracticexs)! - feat: 添加 /health 健康检查端点

  - 新增 GET /health 端点用于服务健康检查
  - 返回服务状态、版本、运行时间、会话数等监控信息
  - 支持部署和监控系统的健康检查需求
  - 修复 issue #331

- Updated dependencies [[`4a6ab6b`](https://github.com/Deepractice/PromptX/commit/4a6ab6b579101921ba29f2a551bb24c75f579de1)]:
  - @promptx/core@1.14.1
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

- Updated dependencies [[`cde78ed`](https://github.com/Deepractice/PromptX/commit/cde78ed4a1858df401596e8b95cae91d8c80ef7a)]:
  - @promptx/core@1.14.0
  - @promptx/logger@1.14.0

## 1.13.0

### Patch Changes

- Updated dependencies [[`d60e63c`](https://github.com/Deepractice/PromptX/commit/d60e63c06f74059ecdc5435a744c57c1bfe7f7d0)]:
  - @promptx/core@1.13.0
  - @promptx/logger@1.13.0

## 1.12.0

### Patch Changes

- Updated dependencies [[`2c503d8`](https://github.com/Deepractice/PromptX/commit/2c503d80bb09511ab94e24b015a5c21dea8d4d9b)]:
  - @promptx/logger@1.12.0
  - @promptx/core@1.12.0

## 1.11.0

### Minor Changes

- [`c3c9c45`](https://github.com/Deepractice/PromptX/commit/c3c9c451b9cdd5abaa5c1d51abe594ad14841354) Thanks [@deepracticexs](https://github.com/deepracticexs)! - # 🎯 README Redesign: Steve Jobs Philosophy Applied

  ## Major Changes

  ### README Revolution

  - **English-First Strategy**: Complete redesign with English as primary README for global expansion
  - **"Chat is All You Need"**: Core philosophy integrated throughout documentation
  - **Extreme Simplification**: Removed 418 lines of complex Q&A, focusing on user value
  - **User-Centric Design**: From technical specifications to product showcase

  ### @promptx/mcp-server - Major Release

  - **New Executable Package**: Added standalone bin script for direct npx execution
  - **Commander.js Integration**: Full CLI interface with proper options and help
  - **Multi-Transport Support**: Both STDIO and HTTP modes with configuration options
  - **English Localization**: All user-facing messages in English for international users
  - **Professional Logging**: Integration with @promptx/logger for consistent output

  ### @promptx/logger - Patch Update

  - **Dependency Updates**: Added pino-pretty for better development experience
  - **Package Configuration**: Updated files and build configuration

  ## Strategic Impact

  ### International Expansion

  - English README as primary entry point for global developers
  - Discord community integration for real-time international support
  - Removed region-specific elements (WeChat QR codes) from English version
  - Complete Deepractice ecosystem integration

  ### User Experience Revolution

  - Applied Steve Jobs' product philosophy: "Simplicity is the ultimate sophistication"
  - Natural conversation examples replace complex technical demonstrations
  - Nuwa meta-prompt technology prominently featured as breakthrough innovation
  - Installation process simplified to 2 clear methods

  ### Technical Improvements

  - MCP server now available as standalone executable package
  - Improved build configuration with proper bin entry points
  - Enhanced developer experience with better CLI tools
  - Consistent logging across all packages

  This redesign transforms PromptX from a technical tool documentation into a compelling product experience that embodies the principle: **Chat is All You Need**.

### Patch Changes

- Updated dependencies [[`c3c9c45`](https://github.com/Deepractice/PromptX/commit/c3c9c451b9cdd5abaa5c1d51abe594ad14841354)]:
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
