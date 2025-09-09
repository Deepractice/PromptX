---
"@promptx/mcp-server": minor
---

feat: 添加 /health 健康检查端点

- 新增 GET /health 端点用于服务健康检查
- 返回服务状态、版本、运行时间、会话数等监控信息
- 支持部署和监控系统的健康检查需求
- 修复 issue #331