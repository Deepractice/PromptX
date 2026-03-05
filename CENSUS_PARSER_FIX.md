# Census.list 文本解析器修复

## 问题描述

用户报告在角色页面看不到组织，尽管通过 `directory` 操作可以看到两个组织：
1. rolex (RoleX) - 系统组织
2. 火花堆栈人工智能有限公司 - 用户创建的组织

## 根本原因

RoleX 1.1.0 的 `census.list` 返回的是**文本格式**的输出，而不是 JSON 结构化数据。原代码期望的是 JSON 格式，导致解析失败。

### census.list 输出格式示例

```
rolex (RoleX)
  nuwa (女娲, nvwa) — individual-manager, organization-manager, position-manager

火花堆栈人工智能有限公司
  Node全栈工程师 — Node全栈工程师岗位
  测试工程师 — 测试工程师岗位
  AI系统架构师 — AI系统架构师岗位
  UI设计师 — UI设计师岗位
  产品经理 — 产品经理岗位
```

## 解决方案

### 1. 添加文本解析器

在 `RolexBridge.js` 中添加 `_parseCensusOutput()` 方法，将文本格式转换为结构化 JSON：

```javascript
_parseCensusOutput(text) {
  const result = {
    roles: [],
    organizations: []
  }

  // 解析逻辑：
  // 1. 识别组织行（无缩进）
  // 2. 识别角色行（有缩进，描述包含 manager 等关键词）
  // 3. 识别职位行（有缩进，描述是职位说明）

  return result
}
```

### 2. 区分角色和职位

**关键判断逻辑：**
- **角色**：描述包含多个逗号分隔的职位，或包含 "manager"、"individual"、"organization"、"position" 等关键词
- **职位**：描述是职位说明文本（如"Node全栈工程师岗位"）

### 3. 输出结构

```json
{
  "roles": [
    {
      "name": "nuwa",
      "org": "rolex (RoleX)",
      "position": "individual-manager"
    }
  ],
  "organizations": [
    {
      "name": "rolex (RoleX)",
      "members": [
        {
          "name": "nuwa",
          "position": "individual-manager"
        }
      ],
      "positions": []
    },
    {
      "name": "火花堆栈人工智能有限公司",
      "members": [],
      "positions": [
        {
          "name": "Node全栈工程师",
          "description": "Node全栈工程师岗位"
        },
        ...
      ]
    }
  ]
}
```

## 文件改动

### 1. `packages/core/src/rolex/RolexBridge.js`
- 修改 `directory()` 方法，调用 `_parseCensusOutput()` 解析文本
- 添加 `_parseCensusOutput()` 私有方法

### 2. `apps/desktop/src/main/windows/ResourceListWindow.ts`
- 移除 `rolex:directory` handler 中的 `JSON.parse()`
- 移除 `resources:getV2RoleData` handler 中的 `JSON.parse()`

### 3. `apps/desktop/src/view/pages/roles-window/index.tsx`
- 移除前端的 `JSON.parse()`

## 测试结果

### 解析前（错误）
```
角色列表包含职位定义：
- nuwa
- Node全栈工程师  ❌ 这是职位，不是角色
- 测试工程师      ❌ 这是职位，不是角色
...
```

### 解析后（正确）
```
角色列表：
- nuwa (rolex (RoleX) - individual-manager) ✅

组织列表：
- rolex (RoleX)
  成员: nuwa [individual-manager] ✅

- 火花堆栈人工智能有限公司
  职位: Node全栈工程师, 测试工程师, ... ✅
  成员: (空，因为还没有任命角色到职位)
```

## 为什么看不到"火花堆栈人工智能有限公司"组织？

**原因：该组织没有成员！**

虽然组织定义了 5 个职位，但还没有任命任何角色到这些职位。树状列表只显示**有成员的组织**。

## 如何让组织显示在列表中？

需要任命角色到职位：

```javascript
// 1. 创建一个新角色（或使用现有角色）
// 假设已有角色 "alice"

// 2. 任命角色到职位
{
  "operation": "require",
  "role": "nuwa",
  "orgName": "火花堆栈人工智能有限公司",
  "position": "Node全栈工程师",
  "individual": "alice"
}
```

任命后，`census.list` 输出会变成：

```
火花堆栈人工智能有限公司
  alice — Node全栈工程师
  Node全栈工程师 — Node全栈工程师岗位
  ...
```

此时解析器会识别：
- `alice` 是角色（因为描述是职位名称，不是职位说明）
- `Node全栈工程师` 是职位定义

## 下一步

1. **重启 PromptX Desktop**
2. **打开角色窗口**
3. **切换到 V2 Rolex 标签**
4. **应该能看到 "rolex (RoleX)" 组织，展开后看到 nuwa**
5. **任命角色到"火花堆栈人工智能有限公司"的职位**
6. **刷新后应该能看到该组织**

## 调试命令

### 查看解析后的目录数据
```javascript
window.electronAPI?.invoke("rolex:directory", {}).then(result => {
  console.log('Directory:', result.data)
  console.log('Organizations:', result.data.organizations)
  console.log('Roles:', result.data.roles)
})
```

### 查看原始 census.list 输出
通过 MCP action 工具：
```json
{
  "role": "nuwa",
  "operation": "directory"
}
```

## 注意事项

1. **职位 vs 角色**：census.list 中同时包含职位定义和角色任命，需要正确区分
2. **空组织**：没有成员的组织不会显示在树状列表中（这是设计行为）
3. **组织名称**：包含括号的组织名称（如 "rolex (RoleX)"）会被完整保留
4. **多职位角色**：如果角色担任多个职位，只显示第一个职位

## 已知限制

1. **解析启发式**：使用关键词判断是否为角色，可能在某些边缘情况下误判
2. **职位描述格式**：假设职位描述不包含逗号和 manager 等关键词
3. **文本格式依赖**：依赖 census.list 的固定文本格式，如果 RoleX 更新格式可能需要调整解析器

## 改进建议

如果 RoleX 未来提供结构化 API（返回 JSON），应该：
1. 优先使用结构化 API
2. 保留文本解析器作为后备方案
3. 添加版本检测逻辑
