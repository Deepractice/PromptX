# PromptX 项目架构分析

## 项目概述
PromptX 是一个基于 DPML (Deepractice Prompt Markup Language) 的 AI-First CLI 框架，用于构建智能 AI 代理系统。它提供了结构化提示词、记忆系统和执行框架。

## 核心架构层次

### 1. CLI 层 (入口)
- **主入口**: `src/bin/promptx.js`
  - 提供命令行接口
  - 支持 stdio 和 http 两种传输模式
  - 集成 MCP (Model Context Protocol) 服务器

### 2. MCP 服务层
- **MCPServerStdioCommand**: 处理标准输入输出模式的 MCP 服务
- **MCPServerHttpCommand**: 处理 HTTP 模式的 MCP 服务
- **工具定义**: `src/lib/mcp/definitions/` 包含各种 MCP 工具定义
  - promptx_init: 初始化项目
  - promptx_action: 角色激活
  - promptx_learn: 资源学习
  - promptx_remember/recall: 记忆存储与检索
  - promptx_tool: 工具执行
  - promptx_think: 思考模式
  - promptx_welcome: 欢迎界面

### 3. 核心模块架构

#### 3.1 Pouch 系统 (命令管理)
- **PouchCLI**: 交互式命令行界面管理器
- **PouchRegistry**: 命令注册表
- **PouchStateMachine**: 状态机管理
- **命令系统**:
  - ActionCommand: 角色激活
  - LearnCommand: 资源学习
  - RememberCommand/RecallCommand: 记忆管理
  - ToolCommand: 工具执行
  - ThinkCommand: 思考模式
  - InitCommand/WelcomeCommand: 初始化和欢迎

#### 3.2 Cognition 系统 (认知框架)
- **CognitionManager**: 认知系统核心管理器
  - 管理多个认知实例
  - 提供 remember、recall、think、prime 等核心方法
- **Memory 子系统**:
  - ShortTerm: 短期记忆
  - LongTerm: 长期记忆
  - Semantic: 语义记忆
  - Procedural: 程序性记忆
  - NetworkSemantic: 网络化语义记忆
- **Engram**: 记忆单元抽象
- **Mind 子系统**:
  - MindService: 思维服务
  - MindMap: 思维导图
  - Schema: 知识架构
  - Cue: 记忆线索
- **Thinking 子系统**:
  - BaseThinkingPattern: 思考模式基类
  - ReasoningPattern: 推理模式
  - ThoughtEntity: 思维实体
- **Elaboration**: 精细化处理
- **Computation**: 计算处理

#### 3.3 Resource 系统 (资源管理)
- **EnhancedResourceRegistry**: 增强资源注册表
  - 管理所有资源的注册、解析和元数据
  - 支持批量操作和合并
- **ProtocolResolver**: 协议解析器
  - 解析不同协议的资源引用
  - 支持 @role、@tool、@thought 等多种协议
- **Discovery 子系统**:
  - DiscoveryManager: 发现管理器
  - ProjectDiscovery: 项目资源发现
  - PackageDiscovery: 包资源发现
  - FilePatternDiscovery: 文件模式发现
- **协议实现** (`protocols/`):
  - RoleProtocol: 角色协议
  - ToolProtocol: 工具协议
  - ThoughtProtocol: 思维协议
  - ExecutionProtocol: 执行协议
  - KnowledgeProtocol: 知识协议
  - ManualProtocol: 手册协议
  - 等等...

#### 3.4 Tool 系统 (工具框架)
- **ToolSandbox**: 工具沙箱执行环境
  - 提供隔离的工具执行环境
  - 支持依赖管理和错误处理
- **SandboxIsolationManager**: 沙箱隔离管理
- **SandboxErrorManager**: 沙箱错误管理
- **ToolValidator**: 工具验证器
- **ToolInterface**: 工具接口定义

#### 3.5 DPML 系统 (标记语言)
- **DPMLContentParser**: DPML 内容解析器
- **SemanticRenderer**: 语义渲染器

### 4. 工具层
- **Utils**:
  - ProjectManager: 项目管理
  - DirectoryService: 目录服务
  - ProjectPathResolver: 路径解析
  - ServerEnvironment: 服务器环境
  - PromptTemplate: 提示词模板
  - logger: 日志系统

## 架构特点

1. **层次化设计**: 清晰的分层架构，从 CLI 到核心系统
2. **模块化**: 高度模块化，各系统职责明确
3. **协议驱动**: 基于协议的资源管理系统
4. **认知框架**: 完整的认知系统，包括记忆、思维、计算
5. **沙箱执行**: 安全的工具执行环境
6. **MCP 集成**: 完整支持 Model Context Protocol

## 关键依赖
- @modelcontextprotocol/sdk: MCP 协议支持
- commander: CLI 框架
- chevrotain/peggy: 解析器
- graphology: 图结构（用于认知网络）
- express: HTTP 服务器
- 其他工具库

## 项目规模
- 核心代码主要在 `src/lib/` 目录
- 包含完整的测试文件 (*.test.js)
- 支持多种运行模式和配置