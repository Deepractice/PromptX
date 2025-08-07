# Final Test - Auto Version Management

## 测试完整流程

### 预期行为:
1. PR 创建 → auto-labeler 添加 changeset/minor (feat: 前缀)
2. PR 合并 → auto-changeset 创建 changeset 并更新版本
3. 版本更新推送 → npm-publisher 自动发布到 dev tag

### 修复内容:
- ✅ 使用 GH_PAT 解决权限问题
- ✅ 移除 [skip ci] 以触发后续工作流
- ✅ 简化标签体系，移除 publish/* 标签

测试时间: 2025-08-07