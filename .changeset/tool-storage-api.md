---
"@promptx/core": minor
"@promptx/mcp-server": minor
"@promptx/resource": patch
---

feat: 为PromptX工具添加持久化存储API和增强的沙箱架构

### 核心功能

#### 🗄️ Tool Storage API - 工具持久化存储
- 新增 `api.storage` 接口，提供类似 localStorage 的持久化存储能力
- 每个工具独立的 storage.json 文件，自动隔离数据
- 支持自动JSON序列化/反序列化，处理复杂数据类型
- 10MB容量限制，确保性能
- 完全兼容 Web Storage API，零学习成本

#### 🏗️ 增强的工具沙箱架构
- 重构 ToolSandbox，提供更强大的API注入机制
- 新增 ToolAPI 统一管理所有工具API
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

#### filesystem工具重构
- 移除独立的manual文件，改为通过接口动态生成
- 优化文件操作性能
- 增强错误处理能力
- 单文件架构，更简洁的工具结构

### 角色更新

#### 鲁班角色优化
- 简化工具开发流程，MVP原则驱动
- 更清晰的知识体系组织
- 增强的工具文档注释指导
- 优化需求收集和实现流程

#### Sean角色精简
- 聚焦矛盾驱动决策
- 简化执行流程
- 更清晰的产品哲学

### 技术债务清理
- 删除 SandboxErrorManager（功能合并到ToolError）
- 删除 promptx-log-viewer 工具（功能集成到log模式）
- 清理过时的手册文件
- 简化工具接口定义

### 破坏性变更
- 工具现在必须使用 `api.importx()` 而不是直接的 `importx()`
- 工具手册不再是独立文件，而是通过 getMetadata() 动态生成
- 环境变量管理API变更：`api.environment.get/set` 替代旧的直接访问

### 迁移指南
旧版工具需要更新：
```javascript
// 旧版
const lodash = await importx('lodash');

// 新版
const { api } = this;
const lodash = await api.importx('lodash');
```

存储API使用：
```javascript
// 保存数据
await api.storage.setItem('config', { theme: 'dark' });

// 读取数据
const config = await api.storage.getItem('config');
```

这次更新为PromptX工具生态提供了更强大、更稳定的基础设施，显著提升了工具开发体验和运行时可靠性。