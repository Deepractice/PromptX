---
"@promptx/mcp-workspace": minor
"@promptx/mcp-server": minor
"@promptx/resource": minor
"@promptx/core": minor
"@promptx/desktop": minor
"@promptx/config": minor
---

## v2.3.0

### 新功能

- **飞书接入**：支持通过飞书机器人与 PromptX 交互，使用 WebSocket 长连接模式无需公网 IP，实现类似 OpenClaw 的多平台接入能力
- **工作区功能**：新增工作区侧边栏，支持项目文件浏览、拖拽文件到对话输入、文件读写管理
- **DeepSeek 预配置**：AgentX 配置新增 DeepSeek 预设，开箱即用
- **Windows Git 检测**：首页添加 Git 安装状态检测与引导提示
- **MCP Workspace 服务**：新增内置 MCP 工作区服务，支持文件操作和配置管理

### 优化

- **RoleX 全面优化**：修复组织操作相关的 bug，拆分 action 工具为 4 个领域工具以减少 LLM 调用失败
- **资源去重**：修复资源页面重复 key 警告，V2 角色正确覆盖 V1 同名角色
- **通知中心**：新增 v2.3.0 版本更新通知

### 修复

- 修复工作区文件夹自动展开导致的性能问题
- 修复 Windows 平台 Git 检测与路径问题
- 清理调试日志输出
