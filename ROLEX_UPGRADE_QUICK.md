# RoleX v2 升级到 1.1.0 - 快速指南

## 🎯 核心问题

RoleX 1.1.0 使用 SQLite 数据库存储，不再使用文件系统。需要重新初始化。

## ⚡ 快速升级步骤

### 1. 清理旧数据

```bash
# 删除旧的 RoleX 数据库（会清空所有 v2 角色）
rm -f ~/.rolex/rolex.db

# 或者完全重置（推荐）
rm -rf ~/.rolex
```

**⚠️ 警告**: 这会删除所有现有的 v2 角色。如需保留，请先备份：
```bash
cp -r ~/.rolex ~/.rolex.backup
```

### 2. 重启应用

重新启动 PromptX Desktop 应用。

应用会自动：
1. 创建新的 SQLite 数据库
2. 运行 `genesis()` 初始化世界
3. 创建 Nuwa 种子角色

### 3. 验证

打开角色窗口 → 切换到 "RoleX" 标签 → 应该看到 **nuwa** 角色

## 🔧 已完成的代码修改

所有必要的代码修改已完成：

1. ✅ **添加 bootstrap 配置** - 注册 Genesis 原型
2. ✅ **使用 Rolex.create()** - 替代 new Rolex()
3. ✅ **调用 genesis()** - 初始化世界
4. ✅ **数据库查询** - 使用 census.list 查询角色

## 📋 检查清单

- [ ] 删除旧数据库: `rm -f ~/.rolex/rolex.db`
- [ ] 重启 PromptX Desktop
- [ ] 打开角色窗口
- [ ] 切换到 "RoleX" 标签
- [ ] 确认看到 nuwa 角色

## 🐛 故障排除

### 问题: 仍然显示 0 个角色

**解决方案 1**: 完全重置
```bash
rm -rf ~/.rolex
# 重启应用
```

**解决方案 2**: 检查日志
```bash
tail -f ~/.promptx/logs/promptx-$(date +%Y-%m-%d).log | grep -i rolex
```

应该看到：
```
[RolexBridge] Running genesis...
[RolexBridge] RoleX initialized successfully
[RolexBridge] Found X V2 roles from database
```

### 问题: Genesis 失败

**可能原因**: Node.js 版本过低

**解决方案**: 确保 Node.js 22+ 或使用 Bun
```bash
node --version  # 应该 >= 22
```

## 📝 提交更改

```bash
git add packages/core/src/rolex/RolexBridge.js
git commit -m "feat(core): complete RoleX 1.1.0 migration with bootstrap config"
```

## 🎓 关键变化

| 项目 | 0.11.0 | 1.1.0 |
|------|--------|-------|
| 存储 | 文件系统 (`~/.rolex/roles/`) | SQLite 数据库 (`~/.rolex/rolex.db`) |
| 初始化 | `bootstrap()` | `genesis()` |
| 实例化 | `new Rolex(platform)` | `await Rolex.create(platform)` |
| Platform | `localPlatform(path)` | `localPlatform({ dataDir, bootstrap })` |
| 角色查询 | 文件系统扫描 | 数据库查询 (`census.list`) |

## ✨ 新功能

- **Genesis 系统**: 自动创建初始世界和 Nuwa 角色
- **Census 查询**: 统一的实体查询接口
- **数据库存储**: 更高效的数据管理
- **原型系统**: 支持角色模板和复用

## 📚 参考

- 详细升级指南: `ROLEX_UPGRADE_GUIDE.md`
- RoleX 源码分析: `RoleX-Analysis-Phase*.md`
- RoleX GitHub: https://github.com/Deepractice/RoleX
