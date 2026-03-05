# 角色组织架构 API 使用指南

## 概述

PromptX 集成了 RoleX 1.1.0，支持完整的组织架构管理功能。本文档介绍如何获取和管理角色的组织架构信息。

## 1. 获取组织目录（Directory）

### 方法：`directory()`

获取整个社会目录，包含所有角色和组织的信息。

```javascript
const { RolexActionDispatcher } = require('@promptx/core').rolex
const dispatcher = new RolexActionDispatcher()

// 获取完整的组织目录
const directoryResult = await dispatcher.dispatch('directory', {})

// directory 返回的是 JSON 字符串，需要解析
const directory = JSON.parse(directoryResult)

console.log(directory)
// 输出结构：
// {
//   roles: [
//     { name: "角色ID", org: "组织名称", position: "职位名称" },
//     ...
//   ],
//   organizations: [
//     { name: "组织名称", charter: "组织章程", members: [...] },
//     ...
//   ]
// }
```

### 从目录中查找特定角色的组织信息

```javascript
const directory = JSON.parse(directoryResult)

// 查找角色的组织信息
const roleId = "nuwa"
const roleEntry = directory.roles?.find(r => r.name === roleId)

if (roleEntry && roleEntry.org) {
  const orgName = roleEntry.org
  const position = roleEntry.position

  // 查找组织详情
  const org = directory.organizations?.find(o => o.name === orgName)

  console.log(`角色 ${roleId} 属于组织 ${orgName}`)
  console.log(`职位：${position}`)
  console.log(`组织章程：${org?.charter}`)
  console.log(`组织成员：`, org?.members)
} else {
  console.log(`角色 ${roleId} 未加入任何组织`)
}
```

## 2. 组织管理操作

### 2.1 创建组织（Synthesize）

```javascript
// 创建新组织
await dispatcher.dispatch('synthesize', {
  role: 'founder-role-id',  // 创建者角色ID
  name: 'MyOrganization',    // 组织名称
  charter: '组织章程内容'     // 组织章程
})
```

### 2.2 定义组织章程（Charter）

```javascript
// 为组织定义或更新章程
await dispatcher.dispatch('charter', {
  role: 'admin-role-id',
  orgName: 'MyOrganization',
  content: '更新后的组织章程内容'
})
```

### 2.3 解散组织（Dissolve）

```javascript
// 解散组织
await dispatcher.dispatch('dissolve', {
  role: 'admin-role-id',
  orgName: 'MyOrganization'
})
```

## 3. 职位管理操作

### 3.1 设立职位（Charge）

```javascript
// 在组织中设立新职位
await dispatcher.dispatch('charge', {
  role: 'admin-role-id',
  orgName: 'MyOrganization',
  position: 'Engineer',      // 职位名称
  procedure: '职位职责描述'   // 职位流程/职责
})
```

### 3.2 任命角色到职位（Require）

```javascript
// 任命角色到特定职位
await dispatcher.dispatch('require', {
  role: 'admin-role-id',
  orgName: 'MyOrganization',
  position: 'Engineer',
  individual: 'target-role-id'  // 被任命的角色ID
})
```

### 3.3 撤销职位（Abolish）

```javascript
// 撤销组织中的职位
await dispatcher.dispatch('abolish', {
  role: 'admin-role-id',
  orgName: 'MyOrganization',
  position: 'Engineer'
})
```

## 4. 在前端获取组织信息

### 4.1 通过 IPC 调用

```typescript
// 在 Electron 渲染进程中
const result = await window.electronAPI?.invoke('resources:getV2RoleData', {
  roleId: 'nuwa'
})

if (result?.success) {
  const { identity, focus, directory } = result

  // directory 已经是解析后的对象
  const roleEntry = directory?.roles?.find(r => r.name === 'nuwa')
  const orgName = roleEntry?.org
  const position = roleEntry?.position
  const org = orgName ? directory?.organizations?.find(o => o.name === orgName) : null

  console.log('组织信息：', {
    orgName,
    position,
    charter: org?.charter,
    members: org?.members
  })
}
```

### 4.2 使用 React Hook

```typescript
// 在 React 组件中使用
function MyComponent({ roleId }: { roleId: string }) {
  const [orgInfo, setOrgInfo] = useState(null)

  useEffect(() => {
    const loadOrgInfo = async () => {
      const result = await window.electronAPI?.invoke('resources:getV2RoleData', {
        roleId
      })

      if (result?.success && result.directory) {
        const roleEntry = result.directory.roles?.find(r => r.name === roleId)
        if (roleEntry?.org) {
          const org = result.directory.organizations?.find(
            o => o.name === roleEntry.org
          )
          setOrgInfo({
            orgName: roleEntry.org,
            position: roleEntry.position,
            org
          })
        }
      }
    }

    loadOrgInfo()
  }, [roleId])

  return (
    <div>
      {orgInfo ? (
        <>
          <p>组织：{orgInfo.orgName}</p>
          <p>职位：{orgInfo.position}</p>
          <p>章程：{orgInfo.org?.charter}</p>
        </>
      ) : (
        <p>未加入任何组织</p>
      )}
    </div>
  )
}
```

## 5. 完整示例：组织管理流程

```javascript
const { RolexActionDispatcher } = require('@promptx/core').rolex
const dispatcher = new RolexActionDispatcher()

async function organizationExample() {
  // 1. 创建组织
  await dispatcher.dispatch('synthesize', {
    role: 'founder',
    name: 'TechCorp',
    charter: '致力于技术创新的组织'
  })

  // 2. 设立职位
  await dispatcher.dispatch('charge', {
    role: 'founder',
    orgName: 'TechCorp',
    position: 'CTO',
    procedure: '负责技术战略和团队管理'
  })

  await dispatcher.dispatch('charge', {
    role: 'founder',
    orgName: 'TechCorp',
    position: 'Engineer',
    procedure: '负责产品开发和维护'
  })

  // 3. 任命角色到职位
  await dispatcher.dispatch('require', {
    role: 'founder',
    orgName: 'TechCorp',
    position: 'CTO',
    individual: 'alice'
  })

  await dispatcher.dispatch('require', {
    role: 'founder',
    orgName: 'TechCorp',
    position: 'Engineer',
    individual: 'bob'
  })

  // 4. 查看组织结构
  const directoryResult = await dispatcher.dispatch('directory', {})
  const directory = JSON.parse(directoryResult)

  const org = directory.organizations?.find(o => o.name === 'TechCorp')
  console.log('TechCorp 组织结构：', org)

  // 5. 查看特定角色的组织信息
  const aliceEntry = directory.roles?.find(r => r.name === 'alice')
  console.log('Alice 的组织信息：', {
    org: aliceEntry?.org,
    position: aliceEntry?.position
  })
}
```

## 6. 数据结构说明

### Directory 结构

```typescript
interface Directory {
  roles: Array<{
    name: string        // 角色ID
    org?: string        // 所属组织名称（可选）
    position?: string   // 在组织中的职位（可选）
  }>
  organizations: Array<{
    name: string        // 组织名称
    charter?: string    // 组织章程
    members?: Array<{   // 成员列表
      name: string      // 成员角色ID
      position: string  // 职位
    }>
  }>
}
```

## 7. 注意事项

1. **V2 角色专属**：组织架构功能仅适用于 RoleX V2 角色，V1 角色不支持
2. **权限管理**：某些操作（如解散组织、撤销职位）可能需要特定权限
3. **数据持久化**：组织信息存储在 RoleX SQLite 数据库中（`~/.rolex/rolex.db`）
4. **字符串格式**：`directory()` 返回的是 JSON 字符串，需要使用 `JSON.parse()` 解析

## 8. 相关文件

- **后端 API**：`packages/core/src/rolex/RolexBridge.js`
- **前端组件**：`apps/desktop/src/view/pages/roles-window/components/RoleDetailPanel.tsx`
- **IPC Handler**：`apps/desktop/src/main/windows/ResourceListWindow.ts` (line 984-1011)
- **MCP 工具**：`packages/mcp-server/src/tools/action.ts`

## 9. 相关操作列表

| 操作 | 方法 | 说明 |
|------|------|------|
| 获取目录 | `directory()` | 获取所有角色和组织信息 |
| 创建组织 | `synthesize(name, charter)` | 创建新组织 |
| 定义章程 | `charter(orgName, content)` | 定义或更新组织章程 |
| 解散组织 | `dissolve(orgName)` | 解散组织 |
| 设立职位 | `charge(orgName, position, procedure)` | 在组织中设立职位 |
| 任命角色 | `require(orgName, position, individual)` | 任命角色到职位 |
| 撤销职位 | `abolish(orgName, position)` | 撤销组织中的职位 |
