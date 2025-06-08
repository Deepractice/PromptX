# PromptX MCP Server 配置指南

本指南将帮助您在不同的AI IDE中配置PromptX MCP服务器。

## 📋 支持的AI IDE

- ✅ Claude Desktop
- ✅ VS Code / Cursor
- ✅ Zed Editor
- ✅ Continue.dev

## 🚀 Claude Desktop 配置

### macOS
编辑配置文件：`~/Library/Application Support/Claude/claude_desktop_config.json`

### Windows  
编辑配置文件：`%APPDATA%\Claude\claude_desktop_config.json`

### Linux
编辑配置文件：`~/.config/Claude/claude_desktop_config.json`

### 配置内容
```json
{
  "mcpServers": {
    "promptx": {
      "command": "npx",
      "args": ["promptx-mcp-server"],
      "description": "PromptX专业角色系统 - 7个AI专家角色"
    }
  }
}
```

## 💻 VS Code / Cursor 配置

### 用户设置 (settings.json)
在用户设置或工作区的 `.vscode/mcp.json` 文件中添加：

```json
{
  "mcp": {
    "servers": {
      "promptx": {
        "command": "npx",
        "args": ["promptx-mcp-server"],
        "description": "PromptX专业角色系统"
      }
    }
  }
}
```

## ⚡ Zed Editor 配置

在 Zed 的 `settings.json` 中添加：

```json
{
  "assistant": {
    "mcp_servers": {
      "promptx": {
        "command": "npx",
        "args": ["promptx-mcp-server"],
        "description": "PromptX专业角色系统"
      }
    }
  }
}
```

## 🔧 Continue.dev 配置

在 Continue.dev 配置文件中添加：

```json
{
  "mcp": {
    "servers": {
      "promptx": {
        "command": "npx",
        "args": ["promptx-mcp-server"],
        "description": "PromptX专业角色系统"
      }
    }
  }
}
```

## 🛠️ 安装验证

1. **确保已安装 PromptX**
   ```bash
   npm install -g dpml-prompt-local
   ```

2. **测试MCP服务器**
   ```bash
   npx promptx-mcp-server --help
   ```

3. **重启您的AI IDE** 以加载配置

## 🎯 可用功能

配置完成后，您可以在AI IDE中使用以下PromptX功能：

### 🔧 工具 (Tools)
- `execute_role` - 执行指定的PromptX角色
- `list_roles` - 列出所有可用角色

### 📋 资源 (Resources)  
- `role://角色名` - 获取角色详细信息

### 🎭 可用角色
- `assistant` - 智能助手
- `role-designer` - 角色设计师
- `product-manager` - 产品经理
- `java-backend-developer` - Java后端开发专家
- `promptx-fullstack-developer` - PromptX全栈开发专家
- `xiaohongshu-marketer` - 小红书营销专家
- `frontend-developer` - 前端开发专家

## 🐛 故障排除

### 服务器无法启动
1. 检查Node.js版本 (需要v16+)
2. 重新安装依赖：`npm install -g dpml-prompt-local`
3. 检查配置文件JSON语法

### Claude无法识别
1. 确认配置文件路径正确
2. 重启Claude Desktop
3. 检查Claude日志：`tail -f ~/Library/Logs/Claude/mcp*.log`

### VS Code无法连接
1. 确认MCP扩展已安装
2. 检查工作区配置文件
3. 重启VS Code

## 🔗 更多信息

- [PromptX GitHub](https://github.com/Deepractice/PromptX)
- [MCP官方文档](https://modelcontextprotocol.io)
- [问题反馈](https://github.com/Deepractice/PromptX/issues) 