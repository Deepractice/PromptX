---
"@promptx/mcp-server": major
"@promptx/core": minor
"@promptx/resource": minor
---

# ToolX YAML Support - 降低 AI 认知负担的重大改进

## 💡 核心变更

### ToolX YAML 格式支持 (BREAKING CHANGE)
- **问题解决**：Issue #404 - ToolX 嵌套 JSON 格式对 AI 认知负担过重
- **解决方案**：将 toolx 从嵌套 JSON 改为 YAML 格式支持
- **用户体验**：多行文本无需转义，特殊字符可直接使用
- **简化设计**：URL 格式从 `@tool://` 简化为 `tool://`（内部自动转换）

**BREAKING CHANGE**: toolx 现在只支持 YAML 格式输入，不再兼容原 JSON 格式

## 🛠️ 系统工具增强

### 专业工具创建
- **role-creator**: 为女娲角色创建的AI角色创建专用工具
- **tool-creator**: 为鲁班角色创建的工具开发专用工具
- **系统集成**: 在 toolx 中内置系统工具，无需发现即可使用

## 📚 文档与体验优化

### 改进的错误提示
- **YAML 解析错误**：提供具体的多行字符串格式指导
- **工具不存在**：友好的错误提示和建议
- **格式验证**：强化输入验证和错误消息

### 角色工作流优化
- **鲁班工具实现流程**：更新了工具开发的标准工作流
- **女娲角色创建流程**：完善了AI角色创建和修改的标准流程
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
