---
"@promptx/mcp-server": patch
"@promptx/core": patch
---

优化recall工具描述和认知循环体验

- **recall.ts**: 精简工具描述，从1400+ tokens减少到约600 tokens，删除过度的使用教程和说教内容，遵循奥卡姆剃刀原则
- **recall多词支持**: 支持空格分隔的多个关键词同时激活，创建虚拟mind节点实现多中心激活
- **DMN模式**: 不传query参数时自动选择5个枢纽节点（连接度最高），模拟人脑默认网络
- **action优化**: 使用DMN模式的recall替代prime，统一认知激活路径

相关Issue: #410 #412 #413