#!/bin/bash

# PromptX AI IDE 集成设置脚本
# 支持 Cursor, VS Code, Claude Desktop 等

set -e

echo "🚀 PromptX AI IDE 集成设置开始..."

# 检查环境
check_requirements() {
    echo "📋 检查环境要求..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm 未安装，请先安装 npm"
        exit 1
    fi
    
    echo "✅ 环境检查通过"
}

# 设置本地链接
setup_local_link() {
    echo "🔗 设置本地 npm 链接..."
    npm link
    echo "✅ npm link 完成"
}

# Cursor IDE 集成
setup_cursor() {
    echo "🎨 设置 Cursor IDE 集成..."
    
    if command -v cursor &> /dev/null; then
        echo "找到 Cursor CLI，使用命令行集成..."
        cursor --add-mcp '{
          "name": "promptx",
          "command": "npx",
          "args": ["dpml-prompt", "mcp"],
          "description": "PromptX专业角色系统"
        }'
        echo "✅ Cursor 集成完成"
    else
        echo "⚠️  Cursor CLI 未找到，请手动配置："
        echo "1. 打开 Cursor 设置"
        echo "2. 找到 MCP Servers 配置"
        echo "3. 复制 configs/cursor-mcp-config.json 的内容"
    fi
}

# VS Code 集成
setup_vscode() {
    echo "💻 设置 VS Code 集成..."
    
    if command -v code &> /dev/null; then
        echo "找到 VS Code CLI，使用命令行集成..."
        code --add-mcp '{
          "name": "promptx",
          "command": "npx",
          "args": ["dpml-prompt", "mcp"]
        }'
        echo "✅ VS Code 集成完成"
    else
        echo "⚠️  VS Code CLI 未找到"
    fi
    
    if command -v code-insiders &> /dev/null; then
        echo "找到 VS Code Insiders CLI..."
        code-insiders --add-mcp '{
          "name": "promptx",
          "command": "npx",
          "args": ["dpml-prompt", "mcp"]
        }'
        echo "✅ VS Code Insiders 集成完成"
    fi
}

# Claude Desktop 集成
setup_claude_desktop() {
    echo "🤖 设置 Claude Desktop 集成..."
    
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude-desktop-config.json"
    
    # 创建配置目录
    mkdir -p "$CLAUDE_CONFIG_DIR"
    
    # 检查现有配置
    if [[ -f "$CLAUDE_CONFIG_FILE" ]]; then
        echo "发现现有 Claude Desktop 配置，创建备份..."
        cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup.$(date +%Y%m%d-%H%M%S)"
    fi
    
    # 创建或更新配置
    cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "promptx": {
      "command": "npx",
      "args": ["-y", "dpml-prompt", "mcp"],
      "description": "PromptX AI角色系统",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF
    
    echo "✅ Claude Desktop 配置完成"
    echo "⚠️  请重启 Claude Desktop 应用以应用更改"
}

# 测试连接
test_mcp_connection() {
    echo "🧪 测试 MCP 连接..."
    
    # 测试基本命令
    if npx dpml-prompt hello > /dev/null 2>&1; then
        echo "✅ PromptX 基本功能正常"
    else
        echo "❌ PromptX 基本功能测试失败"
        return 1
    fi
    
    # 测试 MCP 服务器
    if timeout 10s npx dpml-prompt mcp < /dev/null > /dev/null 2>&1; then
        echo "✅ MCP 服务器启动正常"
    else
        echo "⚠️  MCP 服务器测试超时（正常，服务器在等待连接）"
    fi
}

# 创建使用示例
create_examples() {
    echo "📖 创建使用示例..."
    
    cat > "examples/cursor-usage-examples.md" << 'EOF'
# Cursor 中使用 PromptX 示例

## 基本使用

在 Cursor 中可以这样使用 PromptX：

```markdown
@promptx 请用 java-backend-developer 角色帮我设计一个用户管理系统的 API

要求：
- RESTful API 设计
- Spring Boot 实现
- JWT 认证
- 数据库设计
```

## 角色切换

```markdown
@promptx 现在切换到 product-manager 角色，为上面的用户管理系统写一份产品需求文档
```

## 资源查询

```markdown
@promptx 请读取 role-designer 角色的思维模式资源，我想了解如何设计新的AI角色
```

## 多步骤任务

```markdown
@promptx 我要开发一个电商网站，请按以下步骤执行：

1. 用 product-manager 角色分析需求
2. 用 java-backend-developer 角色设计后端架构  
3. 用 frontend-developer 角色设计前端界面
4. 用 xiaohongshu-marketer 角色制定推广策略
```
EOF

    echo "✅ 使用示例创建完成"
}

# 主流程
main() {
    echo "🎯 开始 PromptX AI IDE 集成设置"
    echo "当前目录: $(pwd)"
    echo "----------------------------------------"
    
    check_requirements
    setup_local_link
    
    echo "----------------------------------------"
    echo "请选择要集成的 IDE："
    echo "1) Cursor IDE"
    echo "2) VS Code"  
    echo "3) Claude Desktop"
    echo "4) 全部集成"
    echo "5) 仅测试连接"
    
    read -p "请输入选择 (1-5): " choice
    
    case $choice in
        1)
            setup_cursor
            ;;
        2)
            setup_vscode
            ;;
        3)
            setup_claude_desktop
            ;;
        4)
            setup_cursor
            setup_vscode
            setup_claude_desktop
            ;;
        5)
            ;;
        *)
            echo "无效选择，默认进行全部集成"
            setup_cursor
            setup_vscode
            setup_claude_desktop
            ;;
    esac
    
    echo "----------------------------------------"
    test_mcp_connection
    create_examples
    
    echo "----------------------------------------"
    echo "🎉 PromptX AI IDE 集成设置完成！"
    echo ""
    echo "📖 使用指南："
    echo "- 查看 docs/PromptX-AI-IDE-集成指南.md"
    echo "- 参考 examples/cursor-usage-examples.md"
    echo "- 配置文件在 configs/ 目录下"
    echo ""
    echo "🚀 现在可以在你的 AI IDE 中使用 PromptX 的 7 个专业角色了！"
}

# 执行主流程
main "$@" 