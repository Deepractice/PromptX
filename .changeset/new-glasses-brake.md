---
"@promptx/mcp-server": patch
"@promptx/resource": patch
"@promptx/core": patch
"@promptx/desktop": patch
---

# v2.2.1 版本更新

## 🎉 RoleX V2 完整认知循环支持

### 核心操作
- **want** - 制定产品目标（如：发布新功能、优化用户体验）
- **plan** - 为目标制定执行计划（⚠️ 必须传入 id 参数）
- **todo** - 创建具体任务
- **finish** - 完成任务
- **achieve** - 达成目标，沉淀经验
- **focus** - 查看当前进行中的工作
- **abandon** - 放弃目标/任务

### 自我沉淀（学习循环）
- **reflect** - 反思遇到的问题，创建经验
- **realize** - 总结领悟的原则
- **master** - 沉淀为标准操作流程（SOP）
- **synthesize** - 向其他角色传授知识
- **forget** - 遗忘过时的知识

## 🔧 修复与改进

### RoleX V2 核心修复
- 修复 plan 操作未传递 id 参数导致 todo 操作失败的问题
- 修复 "No focused plan" 错误
- 更新 RolexBridge 和 RolexActionDispatcher 正确传递所有参数
- 添加关键警告：plan 操作必须传入 id 参数

### 大禹迁移功能修复
- 更新大禹迁移文档适配 RoleX 1.3.0 数据库存储模式
- 移除过时的 "born → activate → synthesize" 流程
- 更新为正确模式：synthesize 直接传入 targetRole 参数
- 添加职位命名规范："角色名+岗位"格式（如"产品经理岗位"）
- 说明 appoint 的 position 参数必须与 establish 的 name 完全一致

### 记忆工具优化
- remember/recall 工具检测到 V2 角色时提供清晰引导
- 引导 V2 角色使用 action 工具的认知循环操作
- 提供完整的示例代码和操作说明

### AgentX 用户体验
- 添加两个 V2 专属预设问题：
  - "激活大禹帮我把v1迁移到v2"
  - "查看我现在的组织架构"
- 预设问题仅在系统设置开启 V2 时显示
- 优化布局：V2 关闭时 2 列，V2 开启时 3 列

### 通知系统
- 添加 v2.2.1 版本更新通知
- 修复通知服务自动合并新通知的问题
- 新通知现在会自动出现在通知列表中

## 📝 文档更新

### MCP 工具描述
- 更新 action 工具描述，添加完整的 V2 学习循环示例
- 添加职位命名规范和组织操作示例
- 强调 plan 操作的 id 参数要求

### 大禹角色文档
- migration-workflow.execution.md - 更新迁移工作流
- rolex-api.knowledge.md - 更新 API 速查表
- 添加实际迁移经验和最佳实践

## 🌐 国际化
- 添加中英文通知文本
- 添加 AgentX 预设问题的中英文翻译

## ⚠️ 重要提示

### plan 操作关键要点
plan 操作如果不传入 id 参数，focused_plan_id 不会被设置，导致后续 todo 操作失败并报错 "No focused plan. Call plan first."

**错误示例：**
```json
{ "operation": "plan", "role": "_", "source": "..." }
```

**正确示例：**
```json
{ "operation": "plan", "role": "_", "source": "...", "id": "my-plan" }
```

### 职位命名规范
- establish 创建职位时，name 必须是"角色名+岗位"格式（如"产品经理岗位"）
- appoint 任命时，position 参数必须与 establish 的 name 完全一致
- 验证方式：用 directory 检查 members 列表，而不是只看命令返回值
