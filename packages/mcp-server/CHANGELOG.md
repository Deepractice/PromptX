# @promptx/mcp-server

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
