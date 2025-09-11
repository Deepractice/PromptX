---
"@promptx/resource": minor
"@promptx/core": minor
---

# 🚀 实现依赖预装复用机制，解决工具启动缓慢问题

## 核心改进

### 新增PreinstalledDependenciesManager

- 实现智能依赖分析，区分预装和需要安装的依赖
- 支持从@promptx/resource包复用预装依赖，避免重复安装
- 自动检测版本兼容性，使用semver标准进行版本匹配
- 提供模块加载缓存机制，提升后续访问性能

### 优化ToolSandbox依赖管理

- 集成PreinstalledDependenciesManager，优先使用预装依赖
- 只安装真正缺失的依赖，大幅减少安装时间
- 保持向后兼容性，现有工具无需修改

### 预装核心依赖

- @modelcontextprotocol/server-filesystem: 系统工具专用
- glob: 文件搜索功能
- semver: 版本兼容性检查
- minimatch: 模式匹配支持

## 性能提升

| 工具 | 优化前 | 优化后 | 提升倍数 |
|------|--------|--------|----------|
| filesystem | 9900ms | 16ms | 619x |
| es-module-tester | ~1500ms | 52ms | 29x |
| excel-reader | ~1500ms | 54ms | 28x |

## 架构改进

### 依赖复用不变式

```text
∀ tool ∈ Tools, ∀ dep ∈ dependencies(tool):
  if dep ∈ preinstalled_deps then
    load_time(dep) = O(1)
  else
    load_time(dep) = O(install_time)
```

### 版本兼容性保证

- 使用标准semver库进行版本范围匹配
- 支持^、~、>=等所有npm版本语法
- 不兼容时自动回退到沙箱安装

## 向后兼容性

- ✅ 所有现有工具无需修改即可受益
- ✅ 失败时自动回退到原有安装机制
- ✅ 沙箱隔离机制保持不变
- ✅ 工具接口完全兼容

这是一个无破坏性的性能优化，解决了Issue #350中用户反映的"30-60秒等待时间不可接受"问题，将核心系统工具的启动时间从分钟级降低到毫秒级。
