---
"@promptx/core": patch
"@promptx/mcp-server": patch
---

feat: 实现Engram类型系统和两阶段召回策略

- 添加Engram三种类型(PATTERN/LINK/ATOMIC)支持，用于区分不同记忆类型
  - PATTERN：框架性知识，优先展示
  - LINK：关系连接，次优先级
  - ATOMIC：具体细节，依赖时间
- 实现TwoPhaseRecallStrategy类，整合粗召回和精排序两个阶段
  - 第一阶段：使用Recall类进行激活扩散获取候选集
  - 第二阶段：计算综合权重(类型×相关性×强度×时间)进行精排序
- 修复未分类记忆问题，为旧数据自动设置ATOMIC类型
- 更新schema分隔符从换行符改为'-'，提升输入体验
- 增加类型配额限制(PATTERN:10, LINK:15, ATOMIC:25，总计50)
- 在recall结果中添加类型图标显示(🎯/🔗/💡)