# V2 角色树状列表和数据修复

## 改动概述

本次更新主要解决两个问题：
1. V2 角色列表改为树状结构，按组织分组显示
2. 修复 V2 角色详细页的数据显示问题（适配 RoleX 1.1.0 数据库架构）

## 文件改动

### 1. 新增文件

#### `apps/desktop/src/view/pages/roles-window/components/RoleTreeListPanel.tsx`
- 新的树状角色列表组件
- 支持按组织分组显示 V2 角色
- 显示组织章程、职位信息
- 可展开/折叠组织节点
- 独立角色单独分组显示
- V1 角色保持平面列表显示

**主要特性：**
- 组织节点显示：组织名称、章程、成员数量
- 角色节点显示：角色名称、职位标签、来源标签、描述
- 树状缩进和连接线视觉效果
- 支持搜索和筛选

### 2. 修改文件

#### `apps/desktop/src/view/pages/roles-window/index.tsx`
**改动：**
- 导入 `RoleTreeListPanel` 替代 `RoleListPanel`
- 添加 `organizations` 状态管理
- 修改 `loadRoles` 函数，增加组织目录数据加载：
  ```typescript
  // 加载组织目录信息
  const directoryResult = await window.electronAPI?.invoke("rolex:directory", {})
  // 更新角色的组织信息（org, position）
  // 设置组织列表
  ```
- 将组织数据传递给 `RoleTreeListPanel`

#### `apps/desktop/src/view/pages/roles-window/components/RoleDetailPanel.tsx`
**改动：**
- 修复 `V2GoalsTab` 组件，适配 RoleX 1.1.0 的 `focus()` 输出格式
- RoleX 1.1.0 的 `focus()` 返回文本格式而非结构化数据
- 改为直接显示原始文本输出（使用 `<pre>` 标签）

**修改前：**
```typescript
const current = data?.focus?.current  // 期望结构化数据
const otherGoals: any[] = data?.focus?.otherGoals || []
```

**修改后：**
```typescript
const focusText = data?.focus  // 直接使用文本输出
// 使用 <pre> 标签显示格式化文本
```

#### `apps/desktop/src/main/windows/ResourceListWindow.ts`
**改动：**
- 添加 `rolex:directory` IPC handler
- 调用 `RolexActionDispatcher.dispatch('directory', {})` 获取组织目录
- 返回解析后的 JSON 数据

```typescript
ipcMain.handle('rolex:directory', async (_evt) => {
  const dispatcher = new RolexActionDispatcher()
  const directoryResult = await dispatcher.dispatch('directory', {})
  const directory = typeof directoryResult === 'string'
    ? JSON.parse(directoryResult)
    : directoryResult
  return { success: true, data: directory }
})
```

#### `apps/desktop/src/i18n/locales/en.json`
**改动：**
- 添加 `roles.filters.independent`: "Independent Roles"

#### `apps/desktop/src/i18n/locales/zh-CN.json`
**改动：**
- 添加 `roles.filters.independent`: "独立角色"

## 数据结构

### RoleItem 扩展
```typescript
type RoleItem = {
  id: string
  name: string
  description?: string
  type: "role"
  source?: string
  version?: "v1" | "v2"
  org?: string        // 新增：所属组织
  position?: string   // 新增：在组织中的职位
}
```

### OrganizationNode
```typescript
type OrganizationNode = {
  name: string
  charter?: string
  roles: RoleItem[]
}
```

### Directory 结构（来自 RoleX）
```typescript
interface Directory {
  roles: Array<{
    name: string        // 角色ID
    org?: string        // 所属组织
    position?: string   // 职位
  }>
  organizations: Array<{
    name: string        // 组织名称
    charter?: string    // 组织章程
    members?: Array<{
      name: string      // 成员角色ID
      position: string  // 职位
    }>
  }>
}
```

## UI 效果

### V2 角色列表（树状结构）
```
┌─ 组织A (3)
│  ├─ 角色1 [CTO]
│  ├─ 角色2 [Engineer]
│  └─ 角色3 [Designer]
├─ 组织B (2)
│  ├─ 角色4 [Manager]
│  └─ 角色5 [Developer]
└─ 独立角色 (2)
   ├─ 角色6
   └─ 角色7
```

### V1 角色列表（平面列表）
```
- 角色A
- 角色B
- 角色C
```

## API 调用流程

### 加载角色列表
1. `window.electronAPI?.getGroupedResources()` - 获取基础角色数据
2. `window.electronAPI?.invoke("rolex:directory", {})` - 获取组织目录
3. 合并数据：将组织信息（org, position）添加到角色对象
4. 构建组织节点列表

### 加载角色详情
1. `window.electronAPI?.invoke("resources:getV2RoleData", { roleId })` - 获取角色详细数据
2. 返回：`{ identity, focus, directory }`
3. `focus` 是文本格式的当前目标输出
4. `directory` 包含组织结构信息

## 兼容性

- ✅ V1 角色：保持原有平面列表显示
- ✅ V2 角色（无组织）：显示在"独立角色"分组
- ✅ V2 角色（有组织）：显示在对应组织节点下
- ✅ 搜索和筛选：在所有模式下正常工作
- ✅ V2 功能禁用时：自动切换到 V1 模式

## 测试建议

1. **树状列表测试**
   - 创建多个组织和角色
   - 验证组织节点展开/折叠
   - 验证角色的组织和职位标签显示
   - 测试搜索功能

2. **数据显示测试**
   - 查看有目标的 V2 角色的 Goals 标签
   - 查看有组织的 V2 角色的 Organization 标签
   - 验证 Identity 文本正确显示

3. **边界情况测试**
   - 无组织的 V2 角色
   - 无目标的 V2 角色
   - 空组织
   - V1/V2 混合场景

## 后续优化建议

1. **Focus 数据解析**
   - 可以考虑在后端解析 focus 文本输出为结构化数据
   - 提取目标名称、计划、任务列表等信息
   - 提供更友好的 UI 展示

2. **组织管理功能**
   - 添加创建组织的 UI
   - 添加设立职位的 UI
   - 添加任命角色的 UI

3. **性能优化**
   - 大量角色时的虚拟滚动
   - 组织节点的懒加载
   - 缓存组织目录数据

4. **视觉优化**
   - 组织节点的图标和颜色主题
   - 更丰富的职位标签样式
   - 组织层级的视觉连接线
