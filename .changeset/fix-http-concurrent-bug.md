---
"@promptx/mcp-server": patch
---

修复 MCP Server HTTP transport 多客户端并发问题

### 问题
- MCP SDK 的 Server 实例不支持真正的多客户端并发
- 当多个客户端（如 Claude 和 Trae）同时连接时，后续请求会超时或阻塞
- 单个 Server 实例会导致请求 ID 冲突和状态混乱

### 解决方案
- 为每个 session 创建独立的 Server 实例
- 每个客户端拥有完全隔离的 Server + Transport 组合
- Express 路由层根据 session ID 分发请求到对应的 Server

### 架构改进
- 从「1个 Server 对应多个 Transport」改为「每个 session 独立的 Server」
- 实现了真正的并发隔离，不同客户端请求不会相互影响
- 支持 session 级别的资源清理机制

### 技术细节
- 新增 `getOrCreateServer` 方法管理 Server 实例池
- 修改请求处理逻辑，确保每个 session 使用独立的 Server
- 添加健康检查指标，显示活跃的 Server 和 Transport 数量

Fixes #348