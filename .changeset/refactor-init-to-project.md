---
"@promptx/core": minor
"@promptx/mcp-server": minor
"@promptx/cli": minor
---

## 重大重构：将 init 重命名为 project，建立统一的项目管理架构

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