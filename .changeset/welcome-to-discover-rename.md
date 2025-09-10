---
"@promptx/core": minor
"@promptx/mcp-server": minor
"@promptx/cli": minor
"@promptx/desktop": patch
---

重命名 Welcome 为 Discover，更准确地反映功能定位

### 主要更改

#### @promptx/core
- 将 `WelcomeCommand` 重命名为 `DiscoverCommand`
- 将 `WelcomeHeaderArea` 重命名为 `DiscoverHeaderArea`
- 将 `welcome` 文件夹重命名为 `discover`
- 更新常量 `WELCOME` 为 `DISCOVER`
- 更新状态 `welcome_completed` 为 `discover_completed`

#### @promptx/mcp-server
- 将 `welcomeTool` 重命名为 `discoverTool`
- 更新工具描述，强调"探索AI潜能"的核心价值
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