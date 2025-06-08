# PromptX MCP CLI客户端

PromptX MCP CLI客户端是一个命令行工具，用于与PromptX MCP服务器交互，执行AI角色任务。

## 🚀 快速开始

### 安装

```bash
# 本地开发模式
cd PromptX-集成role-designer
npm install
```

### 基本使用

```bash
# 使用Node.js运行
node src/mcp/cli/index.js --help

# 查看可用角色
node src/mcp/cli/index.js discover

# 执行角色任务
node src/mcp/cli/index.js execute assistant "你好，请介绍一下自己"

# 读取角色资源
node src/mcp/cli/index.js read "promptx://role/assistant"

# 检查服务器状态
node src/mcp/cli/index.js status
```

## 📋 命令参考

### 全局选项

- `-v, --verbose` - 启用详细输出模式
- `-c, --config <file>` - 指定配置文件路径
- `-s, --server <url>` - 指定MCP服务器URL
- `-t, --timeout <ms>` - 设置连接超时时间（毫秒）

### 发现角色 (discover/list)

发现所有可用的PromptX角色。

```bash
node src/mcp/cli/index.js discover [选项]

选项:
  -f, --format <type>   输出格式: pretty, json, table (默认: pretty)
```

**示例:**
```bash
# 美观格式输出
node src/mcp/cli/index.js discover

# JSON格式输出
node src/mcp/cli/index.js discover -f json

# 表格格式输出
node src/mcp/cli/index.js discover -f table
```

### 执行角色 (execute/run)

执行指定角色处理输入内容。

```bash
node src/mcp/cli/index.js execute <角色名> <输入内容> [选项]

参数:
  <角色名>      要执行的角色名称
  <输入内容>    要处理的输入内容

选项:
  -s, --stream   启用流式输出
```

**示例:**
```bash
# 基本执行
node src/mcp/cli/index.js execute assistant "请帮我分析这个问题"

# 流式输出
node src/mcp/cli/index.js execute assistant "写一篇关于AI的文章" --stream

# 使用产品经理角色
node src/mcp/cli/index.js execute product-manager "分析一个新产品的市场定位"
```

### 读取资源 (read/get)

读取指定的资源内容。

```bash
node src/mcp/cli/index.js read <URI> [选项]

参数:
  <URI>         资源URI (格式: promptx://type/name)

选项:
  -o, --output <file>   将输出保存到文件
```

**示例:**
```bash
# 读取角色文档
node src/mcp/cli/index.js read "promptx://role/assistant"

# 读取思维文件
node src/mcp/cli/index.js read "promptx://thought/assistant"

# 保存到文件
node src/mcp/cli/index.js read "promptx://role/assistant" -o assistant.md
```

### 服务器状态 (status)

检查MCP服务器连接状态。

```bash
node src/mcp/cli/index.js status
```

### 配置管理 (config)

显示或初始化配置。

```bash
node src/mcp/cli/index.js config [选项]

选项:
  --init   初始化配置文件
```

**示例:**
```bash
# 显示当前配置
node src/mcp/cli/index.js config

# 初始化配置文件
node src/mcp/cli/index.js config --init
```

## ⚙️ 配置

### 环境变量

- `MCP_SERVER_URL` - MCP服务器URL（默认: http://localhost:3000）
- `MCP_TIMEOUT` - 连接超时时间毫秒（默认: 5000）

### 配置文件

可以创建 `mcp-client.config.json` 文件来配置客户端：

```json
{
  "serverUrl": "http://localhost:3000",
  "timeout": 5000,
  "retries": 3,
  "verbose": false
}
```

## 🎯 使用场景

### 1. 开发调试

```bash
# 检查服务器状态
node src/mcp/cli/index.js status -v

# 查看所有角色
node src/mcp/cli/index.js discover -f table
```

### 2. 自动化脚本

```bash
#!/bin/bash
# 批量测试角色

roles=("assistant" "product-manager" "frontend-developer")

for role in "${roles[@]}"; do
  echo "Testing role: $role"
  node src/mcp/cli/index.js execute "$role" "测试输入" --format json
done
```

### 3. 内容生成

```bash
# 生成产品文档
node src/mcp/cli/index.js execute product-manager "为新的AI助手产品制定产品策略" -o product-strategy.md

# 生成技术文档
node src/mcp/cli/index.js execute frontend-developer "设计一个React组件架构" -o react-architecture.md
```

## 🔧 故障排除

### 常见问题

1. **连接失败**
   ```bash
   # 检查服务器状态
   node src/mcp/cli/index.js status -v
   
   # 使用自定义服务器URL
   node src/mcp/cli/index.js -s "http://localhost:3001" status
   ```

2. **角色未找到**
   ```bash
   # 查看可用角色
   node src/mcp/cli/index.js discover
   ```

3. **输出格式问题**
   ```bash
   # 使用详细模式查看更多信息
   node src/mcp/cli/index.js -v discover
   ```

### 调试模式

```bash
# 启用详细输出
node src/mcp/cli/index.js -v execute assistant "测试"

# 使用自定义配置
node src/mcp/cli/index.js -c ./custom-config.json discover
```

## 📝 API集成

CLI客户端也可以作为模块使用：

```javascript
const MCPClient = require('./src/mcp/cli/mcpClient');

async function example() {
  const client = new MCPClient({
    serverUrl: 'http://localhost:3000',
    verbose: true
  });
  
  await client.connect();
  const result = await client.discoverRoles();
  console.log(result.roles);
  await client.disconnect();
}
```

## 🤝 贡献

欢迎提交Issue和Pull Request来改进CLI客户端！ 