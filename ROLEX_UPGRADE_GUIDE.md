# PromptX RoleX v2 升级到 1.1.0 指南

## 当前状态

- **RoleX 版本**: 1.1.0
- **问题**: v2 角色列表显示 0 个角色
- **原因**: RoleX 1.1.0 使用 SQLite 数据库存储，需要重新初始化

## 升级步骤

### 1. 备份现有数据（可选）

如果你有重要的 v2 角色数据，先备份：

```bash
# 备份旧的 RoleX 数据
cp -r ~/.rolex ~/.rolex.backup.$(date +%Y%m%d)
```

### 2. 清理旧数据

RoleX 1.1.0 使用全新的数据库存储，旧的文件系统数据不兼容。建议清理：

```bash
# 删除旧的 RoleX 数据（会删除所有 v2 角色）
rm -rf ~/.rolex

# 或者只删除数据库文件，保留 roles 目录作为参考
rm -f ~/.rolex/rolex.db
```

**注意**: 这会删除所有现有的 v2 角色数据。如果需要保留，请先备份。

### 3. 重新初始化 RoleX

RoleX 1.1.0 会在首次运行时自动调用 `genesis()` 创建初始世界。

当前代码已经包含了 genesis 调用（RolexBridge.js line 98）：

```javascript
await this.rolex.genesis()
```

### 4. 验证升级

重新启动 PromptX Desktop 应用，然后：

1. 打开角色窗口
2. 切换到 "RoleX" 标签
3. 应该能看到初始角色（如 nuwa）

### 5. 检查日志

查看日志确认初始化成功：

```bash
tail -f ~/.promptx/logs/promptx-$(date +%Y-%m-%d).log | grep -i rolex
```

应该看到类似的日志：

```
[RolexBridge] Initializing RoleX...
[RolexBridge] Creating platform...
[RolexBridge] Creating Rolex instance...
[RolexBridge] Running genesis...
[RolexBridge] RoleX initialized successfully
[RolexBridge] Census result: [...]
[RolexBridge] Found X V2 roles from database
```

## 已知问题和解决方案

### 问题 1: Census 返回空数组

**症状**: 日志显示 `[RolexBridge] Census result:` 后面是空的

**原因**:
1. genesis() 可能没有正确执行
2. 或者 census.list 返回格式不符合预期

**解决方案**:

检查 census.list 的返回格式。根据 RoleX 源码分析，census.list 应该返回 `CensusEntry[]` 数组：

```typescript
interface CensusEntry {
  id?: string;
  name: string;
  tag?: string;
}
```

当前代码（RolexBridge.js line 349-366）已经处理了这个格式。

### 问题 2: 数据库权限问题

**症状**: 初始化失败，提示数据库错误

**解决方案**:

```bash
# 确保目录权限正确
chmod 755 ~/.rolex
chmod 644 ~/.rolex/rolex.db
```

### 问题 3: Node.js 版本不兼容

**症状**: SQLite 相关错误

**要求**: Node.js 22+ 或 Bun

**解决方案**: 升级 Node.js 或使用 Bun

## 代码修改总结

已完成的修改（在 `packages/core/src/rolex/RolexBridge.js`）：

1. ✅ **localPlatform 配置** (line 91)
   ```javascript
   this.platform = localPlatform({ dataDir: this.rolexRoot })
   ```

2. ✅ **Rolex.create()** (line 94)
   ```javascript
   this.rolex = await Rolex.create(this.platform)
   ```

3. ✅ **genesis() 调用** (line 98)
   ```javascript
   await this.rolex.genesis()
   ```

4. ✅ **listV2Roles() 数据库查询** (line 339-410)
   - 使用 `rolex.direct('!census.list')` 查询
   - 降级方案使用 `platform.repository.runtime`

## 测试步骤

### 1. 重新构建

```bash
cd /e/Users/DF/Desktop/11111/PromptX
pnpm build:core
pnpm build:desktop
```

### 2. 启动应用

启动 PromptX Desktop 应用

### 3. 检查角色列表

1. 打开角色窗口
2. 切换到 "RoleX" 标签
3. 应该看到至少 1 个角色（nuwa）

### 4. 测试 census.list

在应用中激活 nuwa 角色，然后执行：

```javascript
// 通过 MCP 或直接调用
await rolex.direct('!census.list')
```

应该返回类似：

```json
[
  {
    "id": "nuwa",
    "name": "Nuwa",
    "tag": null
  }
]
```

## 如果仍然没有角色

### 调试步骤

1. **检查 genesis 是否执行**

查看日志中是否有 "Running genesis" 和 "RoleX initialized successfully"

2. **手动查询数据库**

```bash
# 如果有 sqlite3 命令
sqlite3 ~/.rolex/rolex.db "SELECT * FROM nodes WHERE name='individual';"
```

3. **检查 bootstrap 配置**

确认 localPlatform 配置中包含 bootstrap：

```javascript
this.platform = localPlatform({
  dataDir: this.rolexRoot,
  bootstrap: ['npm:@rolexjs/genesis']  // 添加这一行
})
```

4. **强制重新初始化**

```bash
# 删除数据库
rm -f ~/.rolex/rolex.db

# 重启应用，会重新运行 genesis
```

## 迁移现有角色（可选）

如果你有旧的 v2 角色需要迁移到 1.1.0：

### 方案 1: 手动重建

1. 导出旧角色的 Feature 内容
2. 使用 `!individual.born` 重新创建
3. 使用 `!individual.train` 添加技能

### 方案 2: 使用 ResourceX

1. 将旧角色打包为 ResourceX 资源
2. 使用 `!prototype.summon` 导入

## 提交更改

完成升级后，提交代码：

```bash
cd /e/Users/DF/Desktop/11111/PromptX
git add packages/core/src/rolex/RolexBridge.js
git commit -m "feat(core): complete RoleX 1.1.0 migration

- Use Rolex.create() instead of new Rolex()
- Add genesis() call for world initialization
- Update listV2Roles() to query from database via census.list
- Fix localPlatform configuration with dataDir object"
```

## 参考文档

- RoleX 1.1.0 源码分析: `RoleX-Analysis-Phase*.md`
- RoleX GitHub: https://github.com/Deepractice/RoleX
- Genesis 包: `@rolexjs/genesis`

## 需要帮助？

如果升级过程中遇到问题：

1. 检查日志文件: `~/.promptx/logs/promptx-*.log`
2. 查看 RoleX 数据目录: `~/.rolex/`
3. 确认 Node.js 版本: `node --version` (需要 22+)
