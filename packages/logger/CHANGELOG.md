# @promptx/logger

## 1.24.1

## 1.24.0

## 1.23.4

## 1.23.3

## 1.23.2

## 1.23.1

## 1.23.0

### Patch Changes

- [#411](https://github.com/Deepractice/PromptX/pull/411) [`df8140b`](https://github.com/Deepractice/PromptX/commit/df8140ba9a4d6715ba21d9fe0c37d92ee8db5127) Thanks [@deepracticexs](https://github.com/deepracticexs)! - feat: 认知激活模式系统与 recall 工具增强

  ## 新增功能

  ### 认知激活模式 (Cognitive Activation Modes)

  - 实现三种认知激活模式:Creative(创造性探索)、Balanced(平衡模式)、Focused(聚焦检索)
  - 基于学术研究(ACT-R、探索-利用理论、双过程理论)设计参数体系
  - 支持通过 recall 工具的 mode 参数切换激活模式
  - 不同模式通过调节 firingThreshold、maxCycles、synapticDecay 等参数控制激活扩散行为

  ### Recall 工具增强

  - 严格限制 recall 必须使用记忆网络中实际存在的词汇
  - 优化工具提示词,强制执行"action 查看网络图 → 选择已存在的词 → recall"工作流
  - 添加明确的失败处理指导,禁止 AI 推测或抽象不存在的词

  ## 修复

  ### 状态锚定 bug 修复

  - 修复空 Mind 对象被错误锚定导致状态污染的问题
  - 添加系统级防御:仅当 recall 成功激活节点时才保存状态
  - 防止 AI 违规使用不存在词汇导致的状态损坏

  ### 其他修复

  - 修复 TwoPhaseRecallStrategy 错误使用 centerCue 导致激活失败的 bug
  - 改进 logger API 支持自然顺序参数 logger.info(msg, obj)
  - 添加详细的 mode 参数传递日志便于调试

  ## 技术细节

  认知模式参数对比:

  - Creative: firingThreshold=0.05, maxCycles=12, 广泛联想
  - Balanced: firingThreshold=0.1, maxCycles=8, 系统默认
  - Focused: firingThreshold=0.2, maxCycles=4, 精确检索

## 1.22.0

## 1.21.0

## 1.20.0

## 1.19.0

## 1.18.0

## 1.17.3

## 1.17.2

## 1.17.1

## 1.17.0

## 1.16.0

## 1.15.1

## 1.15.0

## 1.14.2

## 1.14.1

## 1.14.0

## 1.13.0

## 1.12.0

### Patch Changes

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

## 1.10.1

### Patch Changes

- Fix release workflow and prepare for beta release

  - Update changeset config to use unified versioning for all packages
  - Fix resource discovery and registry generation bugs
  - Update pnpm-lock.yaml for CI compatibility
  - Prepare for semantic versioning with beta releases
  - Fix npm publishing conflicts by using proper versioning strategy
