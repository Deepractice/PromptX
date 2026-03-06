# V2 Structure Tab Database Migration

## 问题
V2 角色详情页的"结构"标签页仍在从文件系统读取 identity 数据（`~/.rolex/roles/<id>/identity/*.feature`），但 RoleX 1.1.0 已将所有数据迁移到 SQLite 数据库。

## 解决方案

### 1. 后端改动

**文件**: `apps/desktop/src/main/windows/ResourceListWindow.ts`

添加新的 IPC handler `rolex:getIdentityNodes`：

```typescript
ipcMain.handle('rolex:getIdentityNodes', async (_evt, payload: { roleId: string }) => {
  try {
    const { RolexBridge } = require('@promptx/core')
    const bridge = RolexBridge.getInstance()
    const identityData = await bridge.identity(payload.roleId)
    return { success: true, data: identityData }
  } catch (error: any) {
    return { success: false, message: error?.message }
  }
})
```

这个 handler 调用 `RolexBridge.identity(roleId)`，它内部会：
1. 激活角色：`await this.rolex.activate(roleId)`
2. 获取身份投影：`return role.project()`
3. 返回包含 identity 节点的结构化数据

### 2. 前端改动

**文件**: `apps/desktop/src/view/pages/roles-window/components/RoleDetailPanel.tsx`

完全重写 `V2StructureTab` 组件：

#### 主要变化：

1. **数据加载**：
   - 旧：调用 `resources:listV2RoleFiles` 获取文件列表
   - 新：调用 `rolex:getIdentityNodes` 获取数据库节点

2. **数据结构**：
   - 旧：`files: string[]` (文件名数组)
   - 新：`nodes: any[]` (节点对象数组，包含 id, name, information)

3. **分类逻辑**：
   - 旧：根据文件名模式 (`.knowledge.`, `.voice.`, `.experience.`)
   - 新：根据节点的 name 或 id 包含的关键词

4. **内容查看**：
   - 旧：点击文件后调用 `resources:readV2RoleFile` 读取文件内容
   - 新：直接显示节点的 `information` 字段（Gherkin Feature 内容）

5. **编辑功能**：
   - 旧：支持编辑和保存（调用 `resources:saveV2RoleFile`）
   - 新：只读模式（数据库节点不支持 UI 直接编辑）

## 数据流

```
用户点击"结构"标签
  ↓
V2StructureTab 调用 rolex:getIdentityNodes
  ↓
IPC handler 调用 RolexBridge.identity(roleId)
  ↓
RolexBridge 调用 role.project()
  ↓
RoleX 从 SQLite 数据库查询 identity 节点
  ↓
返回节点数组 [{ id, name, information, ... }]
  ↓
前端按类别显示节点
  ↓
用户点击节点查看 Gherkin 内容
```

## RoleX 1.1.0 数据库架构

根据 RoleX 分析文档：

- **nodes 表**：存储所有节点
  - `id`: 节点唯一标识
  - `name`: 节点名称
  - `information`: Gherkin Feature 格式的内容
  - `prototype`: 原型引用

- **identity 节点**：角色的身份结构
  - persona: 人格特征
  - knowledge: 知识库
  - voice: 语音风格
  - experience: 经验记录

## 测试建议

1. 打开一个 V2 角色的详情页
2. 切换到"结构"标签
3. 验证显示了 4 个层级（persona, knowledge, voice, experience）
4. 点击展开每个层级，查看节点列表
5. 点击节点，查看 Gherkin Feature 内容
6. 确认内容是从数据库加载的（不是文件系统）

## 注意事项

1. **只读模式**：当前实现将所有节点设为只读。如果需要编辑功能，需要：
   - 添加新的 IPC handler 调用 RoleX API 更新节点
   - 在前端恢复编辑和保存逻辑

2. **节点分类**：当前使用简单的关键词匹配。如果 RoleX 提供了更明确的节点类型标识，应该使用那个。

3. **错误处理**：如果角色没有 identity 数据，会显示空列表。可以考虑添加更友好的提示。

## 相关文件

- `packages/core/src/rolex/RolexBridge.js` - identity() 方法
- `apps/desktop/src/main/windows/ResourceListWindow.ts` - IPC handlers
- `apps/desktop/src/view/pages/roles-window/components/RoleDetailPanel.tsx` - V2StructureTab

## 提交

Commit: d869209
Message: "fix(core): migrate V2 role Structure tab from filesystem to database"
